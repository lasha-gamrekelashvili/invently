import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BulkUploadService {
  /**
   * Parse and import categories and products from CSV
   * CSV Format:
   * Category,Product Name,Variant Options,Product Description,Price,Stock,SKU,Status,Image URLs,Attributes
   * 
   * Examples:
   * Electronics,,,,,,,,, (Category only)
   * Electronics > Phones,,,,,,,,, (Subcategory)
   * Electronics > Phones,iPhone 14,,Best phone,999.99,50,IPHONE14,ACTIVE,url1.jpg,brand:Apple
   * Electronics > Phones,iPhone 14,storage:128GB|color:Black,,999.99,30,IPHONE14-128-BLK,ACTIVE,,
   */
  async importFromCSV(csvContent, tenantId) {
    const results = {
      categories: { created: 0, updated: 0, errors: [] },
      products: { created: 0, updated: 0, errors: [] },
      variants: { created: 0, updated: 0, errors: [] },
    };

    try {
      // Parse CSV
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Handle BOM in UTF-8 files
      });

      console.log(`Parsed ${records.length} rows from CSV`);

      // First pass: Create all categories
      const categoryMap = new Map(); // slug -> category
      await this.processCategories(records, tenantId, categoryMap, results);

      // Second pass: Create all products with variants
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
    
    // Collect all unique category paths
    for (const record of records) {
      const categoryPath = record['Category']?.trim();
      if (!categoryPath) continue;

      // Split by > to get hierarchy (e.g., "Electronics > Phones > Samsung")
      const parts = categoryPath.split('>').map(p => p.trim()).filter(Boolean);
      
      // Add each level to unique categories
      for (let i = 0; i < parts.length; i++) {
        const path = parts.slice(0, i + 1).join(' > ');
        uniqueCategories.add(path);
      }
    }

    console.log(`Found ${uniqueCategories.size} unique categories`);

    // Sort categories by depth (parents first)
    const sortedCategories = Array.from(uniqueCategories).sort((a, b) => {
      return a.split(' > ').length - b.split(' > ').length;
    });

    // Create categories in order
    for (const categoryPath of sortedCategories) {
      try {
        const parts = categoryPath.split(' > ').map(p => p.trim());
        const categoryName = parts[parts.length - 1];
        const parentPath = parts.length > 1 ? parts.slice(0, -1).join(' > ') : null;

        // Generate slug
        const slug = this.generateSlug(categoryName);

        // Find parent category if exists
        let parentId = null;
        if (parentPath && categoryMap.has(parentPath)) {
          parentId = categoryMap.get(parentPath).id;
        }

        // Check if category already exists
        const existing = await prisma.category.findFirst({
          where: {
            slug,
            tenantId,
            parentId: parentId || null,
          },
        });

        let category;
        if (existing) {
          // Update existing
          category = await prisma.category.update({
            where: { id: existing.id },
            data: {
              name: categoryName,
              isActive: true,
            },
          });
          results.categories.updated++;
        } else {
          // Create new
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

        // Store in map for later reference
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
    // Group records by product name
    const productGroups = new Map();
    
    for (const record of records) {
      const productName = record['Product Name']?.trim();
      if (!productName) continue; // Skip category-only rows
      
      if (!productGroups.has(productName)) {
        productGroups.set(productName, []);
      }
      productGroups.set(productName, [...productGroups.get(productName), record]);
    }

    // Process each product group
    for (const [productName, productRecords] of productGroups) {
      try {
        // Get base product info from first record
        const baseRecord = productRecords[0];
        const categoryPath = baseRecord['Category']?.trim();
        const description = baseRecord['Product Description']?.trim() || '';
        const status = (baseRecord['Status']?.trim().toUpperCase() || 'ACTIVE');

        // Find category
        let categoryId = null;
        if (categoryPath && categoryMap.has(categoryPath)) {
          categoryId = categoryMap.get(categoryPath).id;
        }

        // Generate slug
        const slug = this.generateSlug(productName);

        // Check if product exists
        const existing = await prisma.product.findFirst({
          where: {
            tenantId,
            slug,
          },
          include: {
            variants: true,
          },
        });

        let product;
        
        // Check if this is a product with variants (multiple rows with same name)
        const hasVariants = productRecords.some(r => r['Variant Options']?.trim());

        if (hasVariants) {
          // Product with variants
          await this.processProductWithVariants(
            productName,
            productRecords,
            categoryId,
            description,
            status,
            slug,
            tenantId,
            existing,
            results
          );
        } else {
          // Simple product without variants (use first record)
          await this.processSimpleProduct(
            baseRecord,
            productName,
            categoryId,
            description,
            status,
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
  async processSimpleProduct(record, productName, categoryId, description, status, slug, tenantId, existing, results) {
    const price = parseFloat(record['Price']) || 0;
    const stock = parseInt(record['Stock']) || 0;
    const sku = record['SKU']?.trim() || '';
    const imageUrls = record['Image URLs']?.trim() || '';
    const attributesStr = record['Attributes']?.trim() || '';

    // Parse image URLs
    const images = this.parseImageUrls(imageUrls, productName);

    // Parse attributes
    const attributes = this.parseAttributes(attributesStr, sku);

    if (existing) {
      // Update existing product
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          title: productName,
          description,
          price,
          stockQuantity: stock,
          status,
          categoryId,
          attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        },
      });

      // Update images
      await this.updateProductImages(existing.id, images, tenantId);
      results.products.updated++;
    } else {
      // Create new product
      const product = await prisma.product.create({
        data: {
          title: productName,
          slug,
          description,
          price,
          stockQuantity: stock,
          status,
          tenantId,
          categoryId,
          attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        },
      });

      // Create images
      await this.createProductImages(product.id, images, tenantId);
      results.products.created++;
    }
  }

  /**
   * Process a product with variants
   */
  async processProductWithVariants(productName, records, categoryId, description, status, slug, tenantId, existing, results) {
    // Get base price from record without variant options (or first record)
    const baseRecord = records.find(r => !r['Variant Options']?.trim()) || records[0];
    const basePrice = parseFloat(baseRecord['Price']) || 0;
    const baseStock = parseInt(baseRecord['Stock']) || 0;
    const baseImageUrls = baseRecord['Image URLs']?.trim() || '';
    const baseAttributesStr = baseRecord['Attributes']?.trim() || '';

    // Parse base images and attributes
    const baseImages = this.parseImageUrls(baseImageUrls, productName);
    const baseAttributes = this.parseAttributes(baseAttributesStr, '');

    let product;
    
    if (existing) {
      // Update existing product
      product = await prisma.product.update({
        where: { id: existing.id },
        data: {
          title: productName,
          description,
          price: basePrice,
          stockQuantity: baseStock,
          status,
          categoryId,
          attributes: Object.keys(baseAttributes).length > 0 ? baseAttributes : undefined,
        },
      });

      // Update base images
      await this.updateProductImages(product.id, baseImages, tenantId);
      results.products.updated++;
    } else {
      // Create new product
      product = await prisma.product.create({
        data: {
          title: productName,
          slug,
          description,
          price: basePrice,
          stockQuantity: baseStock,
          status,
          tenantId,
          categoryId,
          attributes: Object.keys(baseAttributes).length > 0 ? baseAttributes : undefined,
        },
      });

      // Create base images
      await this.createProductImages(product.id, baseImages, tenantId);
      results.products.created++;
    }

    // Process variants
    const variantRecords = records.filter(r => r['Variant Options']?.trim());
    
    for (const variantRecord of variantRecords) {
      try {
        const variantOptionsStr = variantRecord['Variant Options']?.trim();
        if (!variantOptionsStr) continue;

        // Parse variant options (format: key1:value1|key2:value2)
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

        // Check if variant exists (by SKU)
        const existingVariant = existing?.variants.find(v => v.sku === variantSku);

        if (existingVariant) {
          // Update existing variant
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
          // Create new variant
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
    
    // Delete old images
    await prisma.productImage.deleteMany({
      where: { productId },
    });

    // Create new images
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
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
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

