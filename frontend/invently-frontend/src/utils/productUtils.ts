import type { Product } from '../types';

/**
 * Calculate the effective price range for a product
 * If product has variants, returns the min/max price range
 * If no variants, returns the base product price
 */
export const getProductPriceRange = (product: Product): { min: number; max: number; hasVariants: boolean } => {
  if (!product.variants || product.variants.length === 0) {
    return {
      min: product.price,
      max: product.price,
      hasVariants: false
    };
  }

  const activeVariants = product.variants.filter(variant => variant.isActive === true);
  
  if (activeVariants.length === 0) {
    return {
      min: product.price,
      max: product.price,
      hasVariants: true
    };
  }

  const prices = activeVariants.map(variant => variant.price ?? product.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    min: minPrice,
    max: maxPrice,
    hasVariants: true
  };
};

/**
 * Calculate the total stock quantity for a product
 * If product has variants, sums up all variant stock quantities
 * If no variants, returns the base product stock quantity
 */
export const getProductTotalStock = (product: Product): { total: number; hasVariants: boolean } => {
  if (!product.variants || product.variants.length === 0) {
    return {
      total: product.stockQuantity,
      hasVariants: false
    };
  }

  const activeVariants = product.variants.filter(variant => variant.isActive === true);
  const totalStock = activeVariants.reduce((sum, variant) => sum + variant.stockQuantity, 0);

  return {
    total: totalStock,
    hasVariants: true
  };
};

/**
 * Format price range display text
 */
export const formatPriceRange = (priceRange: { min: number; max: number; hasVariants: boolean }): string => {
  if (!priceRange.hasVariants) {
    return `$${priceRange.min.toFixed(2)}`;
  }

  if (priceRange.min === priceRange.max) {
    return `$${priceRange.min.toFixed(2)}`;
  }

  return `$${priceRange.min.toFixed(2)} - $${priceRange.max.toFixed(2)}`;
};

/**
 * Check if a product has any active variants
 */
export const hasActiveVariants = (product: Product): boolean => {
  return !!(product.variants && product.variants.length > 0 && 
         product.variants.some(variant => variant.isActive === true));
};

/**
 * Get variant summary for display (e.g., "3 variants", "2 sizes, 4 colors")
 */
export const getVariantSummary = (product: Product, t?: (key: string, params?: any) => string): string | null => {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  const activeVariants = product.variants.filter(variant => variant.isActive === true);
  
  if (activeVariants.length === 0) {
    return t ? t('products.variants.noActive') : 'No active variants';
  }

  if (activeVariants.length === 1) {
    return t ? t('products.variants.single') : '1 variant';
  }

  if (t) {
    const translated = t('products.variants.count', { count: activeVariants.length });
    console.log('Translation result:', translated, 'for key: products.variants.count with params:', { count: activeVariants.length });
    return translated;
  }

  return `${activeVariants.length} variants`;
};

/**
 * Get unique option keys from variants (e.g., ["size", "color"])
 */
export const getVariantOptionKeys = (product: Product): string[] => {
  if (!product.variants || product.variants.length === 0) {
    return [];
  }

  const activeVariants = product.variants.filter(variant => variant.isActive === true);
  const optionKeys = new Set<string>();

  activeVariants.forEach(variant => {
    Object.keys(variant.options).forEach(key => {
      optionKeys.add(key);
    });
  });

  return Array.from(optionKeys);
};
