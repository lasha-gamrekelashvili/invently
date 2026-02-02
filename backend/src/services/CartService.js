import { CartRepository, CartItemRepository } from '../repositories/CartRepository.js';
import { ProductRepository, ProductVariantRepository } from '../repositories/ProductRepository.js';

export class CartService {
  constructor() {
    this.cartRepository = new CartRepository();
    this.cartItemRepository = new CartItemRepository();
    this.productRepository = new ProductRepository();
    this.variantRepository = new ProductVariantRepository();
  }

  /**
   * Calculates cart total from items
   */
  calculateCartTotal(cartItems) {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Validates product and variant availability for adding to cart
   */
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

  /**
   * Gets product info for cart display (includes deleted for order history)
   */
  async getProductForDisplay(productId, tenantId) {
    const product = await this.productRepository.findFirst(
      { id: productId, tenantId },
      {
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      }
    );

    if (!product) {
      return null;
    }

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

  /**
   * Checks stock availability
   */
  checkStockAvailability(product, variant, quantity) {
    const availableStock = variant ? variant.stockQuantity : product.stockQuantity;

    if (availableStock < quantity) {
      throw new Error('Insufficient stock available');
    }

    return true;
  }

  /**
   * Calculates item price (variant price takes priority)
   */
  calculateItemPrice(product, variant) {
    return variant?.price ?? product.price;
  }

  /**
   * Gets cart by session ID with availability status for each item
   */
  async getCart(sessionId, tenantId) {
    let cart = await this.cartRepository.getCartWithItems(sessionId, tenantId);

    if (!cart) {
      cart = await this.cartRepository.getOrCreateCart(sessionId, tenantId);
      cart.items = [];
    }

    const itemsWithAvailability = cart.items.map(item => {
      const product = item.product;
      const variant = item.variant;

      const isProductAvailable = product && product.isActive && !product.isDeleted;
      const availableStock = variant ? variant.stockQuantity : (product?.stockQuantity || 0);
      const hasEnoughStock = availableStock >= item.quantity;
      const isOutOfStock = availableStock === 0;
      const isAvailable = isProductAvailable && hasEnoughStock;

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

    const total = itemsWithAvailability
      .filter(item => item.isAvailable)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

    const unavailableCount = itemsWithAvailability.filter(item => !item.isAvailable).length;
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

  /**
   * Adds an item to cart
   */
  async addToCart(sessionId, productId, variantId, quantity, tenantId) {
    const { product, variant } = await this.validateProductForCart(productId, variantId, tenantId);
    this.checkStockAvailability(product, variant, quantity);

    const itemPrice = this.calculateItemPrice(product, variant);
    const cart = await this.cartRepository.getOrCreateCart(sessionId, tenantId);
    const existingItem = await this.cartItemRepository.findByCartAndProduct(cart.id, productId, variantId);

    let cartItem;
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      this.checkStockAvailability(product, variant, newQuantity);

      cartItem = await this.cartItemRepository.update(
        existingItem.id,
        { quantity: newQuantity, price: itemPrice },
        {
          include: {
            product: {
              include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
            },
            variant: true,
          },
        }
      );
    } else {
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
              include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
            },
            variant: true,
          },
        }
      );
    }

    return cartItem;
  }

  /**
   * Updates cart item quantity
   */
  async updateCartItem(sessionId, itemId, quantity, tenantId) {
    const cartItem = await this.cartItemRepository.findByCartWithSession(itemId, sessionId, tenantId);

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    const availableStock = cartItem.variant ? cartItem.variant.stockQuantity : cartItem.product.stockQuantity;
    if (availableStock < quantity) {
      throw new Error('Insufficient stock available');
    }

    const itemPrice = cartItem.variant?.price ?? cartItem.product.price;

    return await this.cartItemRepository.update(
      itemId,
      { quantity, price: itemPrice },
      {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
          },
          variant: true,
        },
      }
    );
  }

  /**
   * Removes an item from cart
   */
  async removeFromCart(sessionId, itemId, tenantId) {
    const cartItem = await this.cartItemRepository.findByCartWithSession(itemId, sessionId, tenantId);

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    return await this.cartItemRepository.delete(itemId);
  }

  /**
   * Clears all items from cart
   */
  async clearCart(sessionId, tenantId) {
    const cart = await this.cartRepository.findBySessionId(sessionId, tenantId);

    if (!cart) {
      throw new Error('Cart not found');
    }

    return await this.cartRepository.clearCartItems(cart.id);
  }
}
