import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BulkUploadService {
  /**
   * Parse and import categories and products from CSV
   */
  async importFromCSV(csvContent, tenantId) {
    const results = {
      categories: { created: 0, updated: 0, errors: [] },
      products: { created: 0, updated: 0, errors: [] },
      variants: { created: 0, updated: 0, errors: [] },
    };

    try {
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });

      console.log(`Parsed ${records.length} rows from CSV`);

      const categoryMap = new Map();
      await this.processCategories(records, tenantId, categoryMap, results);

      await this.processProductsWithVariants(records, tenantId, categoryMap, results);

      return results;
    } catch (error) {
      console.error('CSV import error:', error);
      throw new Error(`Failed to import CSV: ${error.message}`);
    }
  }

  /**
   * Process categories from CSV records
   */
  async processCategories(records, tenantId, categoryMap, results) {
    const uniqueCategories = new Set();
    
    for (const record of records) {
      const categoryPath = record['Category']?.trim();
      if (!categoryPath) continue;

      const parts = categoryPath.split('>').map(p => p.trim()).filter(Boolean);
      
      for (let i = 0; i < parts.length; i++) {
        const path = parts.slice(0, i + 1).join(' > ');
        uniqueCategories.add(path);
      }
    }

    console.log(`Found ${uniqueCategories.size} unique categories`);

    const sortedCategories = Array.from(uniqueCategories).sort((a, b) => {
      return a.split(' > ').length - b.split(' > ').length;
    });

    for (const categoryPath of sortedCategories) {
      try {
        const parts = categoryPath.split(' > ').map(p => p.trim());
        const categoryName = parts[parts.length - 1];
        const parentPath = parts.length > 1 ? parts.slice(0, -1).join(' > ') : null;

        const slug = this.generateSlug(categoryName);

        let parentId = null;
        if (parentPath && categoryMap.has(parentPath)) {
          parentId = categoryMap.get(parentPath).id;
        }

        const existing = await prisma.category.findFirst({
          where: {
            slug,
            tenantId,
            parentId: parentId || null,
          },
        });

        let category;
        if (existing) {
          category = await prisma.category.update({
            where: { id: existing.id },
            data: {
              name: categoryName,
              isActive: true,
            },
          });
          results.categories.updated++;
        } else {
          category = await prisma.category.create({
            data: {
              name: categoryName,
              slug,
              tenantId,
              parentId,
              isActive: true,
            },
          });
          results.categories.created++;
        }

        categoryMap.set(categoryPath, category);
        
        console.log(`Processed category: ${categoryPath} (${existing ? 'updated' : 'created'})`);
      } catch (error) {
        console.error(`Error processing category ${categoryPath}:`, error);
        results.categories.errors.push({
          category: categoryPath,
          error: error.message,
        });
      }
    }
  }

  /**
   * Process products with variants from CSV records
   * Groups rows by product name - multiple rows with same name become variants
   */
  async processProductsWithVariants(records, tenantId, categoryMap, results) {
    const productGroups = new Map();
    
    for (const record of records) {
      const productName = record['Product Name']?.trim();
      if (!productName) continue;
      
      if (!productGroups.has(productName)) {
        productGroups.set(productName, []);
      }
      productGroups.set(productName, [...productGroups.get(productName), record]);
    }

    for (const [productName, productRecords] of productGroups) {
      try {
        const baseRecord = productRecords[0];
        const categoryPath = baseRecord['Category']?.trim();
        const description = baseRecord['Product Description']?.trim() || '';
        const statusValue = baseRecord['Status']?.trim().toUpperCase() || 'ACTIVE';
        const isActive = statusValue === 'ACTIVE' || statusValue === 'TRUE';

        let categoryId = null;
        if (categoryPath && categoryMap.has(categoryPath)) {
          categoryId = categoryMap.get(categoryPath).id;
        }

        const slug = this.generateSlug(productName);

        const existing = await prisma.product.findFirst({
          where: {
            tenantId,
            slug,
          },
          include: {
            variants: true,
          },
        });

        
        const hasVariants = productRecords.some(r => r['Variant Options']?.trim());

        if (hasVariants) {
          await this.processProductWithVariants(
            productName,
            productRecords,
            categoryId,
            description,
            isActive,
            slug,
            tenantId,
            existing,
            results
          );
        } else {
          await this.processSimpleProduct(
            baseRecord,
            productName,
            categoryId,
            description,
            isActive,
            slug,
            tenantId,
            existing,
            results
          );
        }
      } catch (error) {
        console.error(`Error processing product ${productName}:`, error);
        results.products.errors.push({
          product: productName,
          error: error.message,
        });
      }
    }
  }

  /**
   * Process a simple product without variants
   */
  async processSimpleProduct(record, productName, categoryId, description, isActive, slug, tenantId, existing, results) {
    const price = parseFloat(record['Price']) || 0;
    const stock = parseInt(record['Stock']) || 0;
    const sku = record['SKU']?.trim() || '';
    const imageUrls = record['Image URLs']?.trim() || '';
    const attributesStr = record['Attributes']?.trim() || '';

    const images = this.parseImageUrls(imageUrls, productName);
    const attributes = this.parseAttributes(attributesStr, sku);

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          title: productName,
          description,
          price,
          stockQuantity: stock,
          isActive,
          categoryId,
          attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        },
      });

      await this.updateProductImages(existing.id, images, tenantId);
      results.products.updated++;
    } else {
      const product = await prisma.product.create({
        data: {
          title: productName,
          slug,
          description,
          price,
          stockQuantity: stock,
          isActive,
          tenantId,
          categoryId,
          attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        },
      });

      await this.createProductImages(product.id, images, tenantId);
      results.products.created++;
    }
  }

  /**
   * Process a product with variants
   */
  async processProductWithVariants(productName, records, categoryId, description, isActive, slug, tenantId, existing, results) {
    const baseRecord = records.find(r => !r['Variant Options']?.trim()) || records[0];
    const basePrice = parseFloat(baseRecord['Price']) || 0;
    const baseStock = parseInt(baseRecord['Stock']) || 0;
    const baseImageUrls = baseRecord['Image URLs']?.trim() || '';
    const baseAttributesStr = baseRecord['Attributes']?.trim() || '';

    const baseImages = this.parseImageUrls(baseImageUrls, productName);
    const baseAttributes = this.parseAttributes(baseAttributesStr, '');

    let product;
    
    if (existing) {
      product = await prisma.product.update({
        where: { id: existing.id },
        data: {
          title: productName,
          description,
          price: basePrice,
          stockQuantity: baseStock,
          isActive,
          categoryId,
          attributes: Object.keys(baseAttributes).length > 0 ? baseAttributes : undefined,
        },
      });

      await this.updateProductImages(product.id, baseImages, tenantId);
      results.products.updated++;
    } else {
      product = await prisma.product.create({
        data: {
          title: productName,
          slug,
          description,
          price: basePrice,
          stockQuantity: baseStock,
          isActive,
          tenantId,
          categoryId,
          attributes: Object.keys(baseAttributes).length > 0 ? baseAttributes : undefined,
        },
      });

      await this.createProductImages(product.id, baseImages, tenantId);
      results.products.created++;
    }

    const variantRecords = records.filter(r => r['Variant Options']?.trim());
    
    for (const variantRecord of variantRecords) {
      try {
        const variantOptionsStr = variantRecord['Variant Options']?.trim();
        if (!variantOptionsStr) continue;

        const options = {};
        variantOptionsStr.split('|').forEach(pair => {
          const [key, value] = pair.split(':').map(s => s.trim());
          if (key && value) {
            options[key] = value;
          }
        });

        const variantPrice = parseFloat(variantRecord['Price']);
        const variantStock = parseInt(variantRecord['Stock']) || 0;
        const variantSku = variantRecord['SKU']?.trim() || this.generateSKU();

        const existingVariant = existing?.variants.find(v => v.sku === variantSku);

        if (existingVariant) {
          await prisma.productVariant.update({
            where: { id: existingVariant.id },
            data: {
              options,
              price: variantPrice !== undefined && !isNaN(variantPrice) ? variantPrice : undefined,
              stockQuantity: variantStock,
              isActive: true,
            },
          });
          results.variants.updated++;
        } else {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: variantSku,
              options,
              price: variantPrice !== undefined && !isNaN(variantPrice) ? variantPrice : undefined,
              stockQuantity: variantStock,
              isActive: true,
            },
          });
          results.variants.created++;
        }
      } catch (error) {
        console.error(`Error processing variant for ${productName}:`, error);
        results.variants.errors = results.variants.errors || [];
        results.variants.errors.push({
          product: productName,
          variant: variantRecord['Variant Options'],
          error: error.message,
        });
      }
    }
  }

  /**
   * Parse image URLs from CSV string
   */
  parseImageUrls(imageUrls, productName) {
    return imageUrls
      .split('|')
      .map(url => url.trim())
      .filter(Boolean)
      .map((url, index) => {
        let filename;
        try {
          const urlObj = new URL(url);
          filename = urlObj.pathname.split('/').pop() || `image-${Date.now()}-${index}.jpg`;
        } catch {
          filename = `image-${Date.now()}-${index}.jpg`;
        }
        
        return {
          url,
          filename,
          altText: productName,
          sortOrder: index,
        };
      });
  }

  /**
   * Parse attributes from CSV string
   */
  parseAttributes(attributesStr, sku) {
    const attributes = {};
    if (attributesStr) {
      attributesStr.split('|').forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          attributes[key] = value;
        }
      });
    }
    
    if (sku) {
      attributes['SKU'] = sku;
    }
    
    return attributes;
  }

  /**
   * Create product images
   */
  async createProductImages(productId, images, tenantId) {
    if (images.length === 0) return;
    
    for (const img of images) {
      await prisma.productImage.create({
        data: {
          ...img,
          productId,
          tenantId,
        },
      });
    }
  }

  /**
   * Update product images
   */
  async updateProductImages(productId, images, tenantId) {
    if (images.length === 0) return;
    
    await prisma.productImage.deleteMany({
      where: { productId },
    });

    for (const img of images) {
      await prisma.productImage.create({
        data: {
          ...img,
          productId,
          tenantId,
        },
      });
    }
  }

  /**
   * Generate URL-friendly slug from text
   */
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  /**
   * Generate random SKU
   */
  generateSKU() {
    return 'SKU-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  /**
   * Generate sample CSV template
   */
  generateTemplate() {
    return `Category,Product Name,Variant Options,Product Description,Price,Stock,SKU,Status,Image URLs,Attributes
Electronics,,,,,,,,,
Electronics > Phones,,,,,,,,,
Electronics > Phones,iPhone 14 Pro,,Latest iPhone with A16 Bionic chip and Dynamic Island,999.99,50,IPHONE14PRO,ACTIVE,https://example.com/iphone.jpg,brand:Apple|warranty:1 year
Electronics > Phones,iPhone 14 Pro,storage:128GB|color:Black,,999.99,30,IPHONE14PRO-128-BLK,ACTIVE,,
Electronics > Phones,iPhone 14 Pro,storage:256GB|color:Black,,1099.99,25,IPHONE14PRO-256-BLK,ACTIVE,,
Electronics > Phones,iPhone 14 Pro,storage:512GB|color:Black,,1299.99,20,IPHONE14PRO-512-BLK,ACTIVE,,
Electronics > Laptops,,,,,,,,,
Electronics > Laptops,MacBook Pro 16,,Powerful laptop for professionals with M2 Pro chip,2499.99,30,MBP16,ACTIVE,https://example.com/mbp.jpg,brand:Apple|processor:M2 Pro
Home & Garden,,,,,,,,,
Home & Garden > Furniture,,,,,,,,,
Home & Garden > Furniture,Modern Sofa,,Comfortable 3-seater sofa with premium fabric,899.99,15,SOFA001,ACTIVE,https://example.com/sofa.jpg,material:Fabric|color:Gray|seats:3|dimensions:210x90x85cm
Fashion,,,,,,,,,
Fashion > Men,,,,,,,,,
Fashion > Men > Shirts,Classic T-Shirt,,100% organic cotton t-shirt,29.99,100,TSHIRT-BASE,ACTIVE,https://example.com/tshirt.jpg,material:100% Cotton|fit:Regular
Fashion > Men > Shirts,Classic T-Shirt,size:S|color:White,,29.99,50,TSHIRT-S-WHT,ACTIVE,,
Fashion > Men > Shirts,Classic T-Shirt,size:M|color:White,,29.99,100,TSHIRT-M-WHT,ACTIVE,,
Fashion > Men > Shirts,Classic T-Shirt,size:L|color:White,,29.99,75,TSHIRT-L-WHT,ACTIVE,,
Fashion > Men > Shirts,Classic T-Shirt,size:M|color:Black,,29.99,80,TSHIRT-M-BLK,ACTIVE,,`;
  }
}

