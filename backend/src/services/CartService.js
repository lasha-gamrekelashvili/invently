import { CartRepository, CartItemRepository } from '../repositories/CartRepository.js';
import { ProductRepository, ProductVariantRepository } from '../repositories/ProductRepository.js';

export class CartService {
  constructor() {
    this.cartRepository = new CartRepository();
    this.cartItemRepository = new CartItemRepository();
    this.productRepository = new ProductRepository();
    this.variantRepository = new ProductVariantRepository();
  }

  // Calculate cart total
  calculateCartTotal(cartItems) {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  // Validate product and variant availability (for adding to cart - only active, non-deleted products)
  async validateProductForCart(productId, variantId, tenantId) {
    const product = await this.productRepository.findFirst({
      id: productId,
      tenantId,
      isActive: true,
      isDeleted: false,
    });

    if (!product) {
      throw new Error('Product not found or not available');
    }

    let variant = null;
    if (variantId) {
      variant = await this.variantRepository.findFirst({
        id: variantId,
        productId,
        isActive: true,
      });

      if (!variant) {
        throw new Error('Product variant not found or not available');
      }
    }

    return { product, variant };
  }

  // Get product info for cart display (includes deleted products for order history)
  async getProductForDisplay(productId, tenantId) {
    const product = await this.productRepository.findFirst(
      { id: productId, tenantId },
      {
        include: {
          images: {
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      }
    );

    if (!product) {
      return null;
    }

    // Add availability status for display
    return {
      ...product,
      isAvailable: product.isActive && !product.isDeleted,
      unavailableReason: product.isDeleted 
        ? 'This product is no longer available' 
        : !product.isActive 
          ? 'This product is currently unavailable' 
          : null,
    };
  }

  // Check stock availability
  checkStockAvailability(product, variant, quantity) {
    const availableStock = variant ? variant.stockQuantity : product.stockQuantity;

    if (availableStock < quantity) {
      throw new Error('Insufficient stock available');
    }

    return true;
  }

  // Calculate item price (variant price takes priority)
  calculateItemPrice(product, variant) {
    return variant?.price ?? product.price;
  }

  // Get cart by session ID (create if doesn't exist)
  // Includes product availability status for deleted/inactive products and stock info
  async getCart(sessionId, tenantId) {
    let cart = await this.cartRepository.getCartWithItems(sessionId, tenantId);

    if (!cart) {
      cart = await this.cartRepository.getOrCreateCart(sessionId, tenantId);
      cart.items = [];
    }

    // Add availability and stock status to each item
    const itemsWithAvailability = cart.items.map(item => {
      const product = item.product;
      const variant = item.variant;
      
      // Check product availability (deleted/inactive)
      const isProductAvailable = product && product.isActive && !product.isDeleted;
      
      // Check stock availability
      const availableStock = variant ? variant.stockQuantity : (product?.stockQuantity || 0);
      const hasEnoughStock = availableStock >= item.quantity;
      const isOutOfStock = availableStock === 0;
      
      // Item is only available if product exists, is active, not deleted, AND has stock
      const isAvailable = isProductAvailable && hasEnoughStock;
      
      // Determine the reason for unavailability (prioritize product issues over stock)
      let unavailableReason = null;
      if (!product) {
        unavailableReason = 'Product no longer exists';
      } else if (product.isDeleted) {
        unavailableReason = 'This product is no longer available';
      } else if (!product.isActive) {
        unavailableReason = 'This product is currently unavailable';
      } else if (isOutOfStock) {
        unavailableReason = 'Out of stock';
      } else if (!hasEnoughStock) {
        unavailableReason = `Only ${availableStock} available (you have ${item.quantity} in cart)`;
      }
      
      return {
        ...item,
        isAvailable,
        unavailableReason,
        availableStock,
        hasEnoughStock,
        isOutOfStock,
      };
    });

    // Only count available items in total
    const total = itemsWithAvailability
      .filter(item => item.isAvailable)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Count of unavailable items for warning display
    const unavailableCount = itemsWithAvailability.filter(item => !item.isAvailable).length;
    
    // Count of items with stock issues specifically
    const stockIssueCount = itemsWithAvailability.filter(item => 
      item.isAvailable === false && (item.isOutOfStock || !item.hasEnoughStock)
    ).length;

    return {
      ...cart,
      items: itemsWithAvailability,
      total,
      hasUnavailableItems: unavailableCount > 0,
      unavailableCount,
      hasStockIssues: stockIssueCount > 0,
      stockIssueCount,
    };
  }

  // Add item to cart
  async addToCart(sessionId, productId, variantId, quantity, tenantId) {
    // Validate product and variant
    const { product, variant } = await this.validateProductForCart(productId, variantId, tenantId);

    // Check stock availability
    this.checkStockAvailability(product, variant, quantity);

    // Get item price
    const itemPrice = this.calculateItemPrice(product, variant);

    // Get or create cart
    const cart = await this.cartRepository.getOrCreateCart(sessionId, tenantId);

    // Check if item already exists in cart
    const existingItem = await this.cartItemRepository.findByCartAndProduct(cart.id, productId, variantId);

    let cartItem;
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      // Check total stock
      this.checkStockAvailability(product, variant, newQuantity);

      // Update with full details in single query
      cartItem = await this.cartItemRepository.update(
        existingItem.id,
        {
          quantity: newQuantity,
          price: itemPrice,
        },
        {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
              },
            },
            variant: true,
          },
        }
      );
    } else {
      // Create with full details in single query
      cartItem = await this.cartItemRepository.create(
        {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
          price: itemPrice,
        },
        {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
              },
            },
            variant: true,
          },
        }
      );
    }

    return cartItem;
  }

  // Update cart item quantity
  async updateCartItem(sessionId, itemId, quantity, tenantId) {
    // Find cart item with all details in single query
    const cartItem = await this.cartItemRepository.findByCartWithSession(itemId, sessionId, tenantId);

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    // Check stock availability
    const availableStock = cartItem.variant ? cartItem.variant.stockQuantity : cartItem.product.stockQuantity;
    if (availableStock < quantity) {
      throw new Error('Insufficient stock available');
    }

    // Determine price
    const itemPrice = cartItem.variant?.price ?? cartItem.product.price;

    // Update with full details in single query
    return await this.cartItemRepository.update(
      itemId,
      {
        quantity,
        price: itemPrice,
      },
      {
        include: {
          product: {
            include: {
              images: {
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          },
          variant: true,
        },
      }
    );
  }

  // Remove item from cart
  async removeFromCart(sessionId, itemId, tenantId) {
    // Verify item belongs to the session's cart
    const cartItem = await this.cartItemRepository.findByCartWithSession(itemId, sessionId, tenantId);

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    return await this.cartItemRepository.delete(itemId);
  }

  // Clear cart
  async clearCart(sessionId, tenantId) {
    const cart = await this.cartRepository.findBySessionId(sessionId, tenantId);

    if (!cart) {
      throw new Error('Cart not found');
    }

    return await this.cartRepository.clearCartItems(cart.id);
  }
}
