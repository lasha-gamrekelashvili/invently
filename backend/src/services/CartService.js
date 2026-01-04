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

  // Validate product and variant availability
  async validateProductForCart(productId, variantId, tenantId) {
    const product = await this.productRepository.findFirst({
      id: productId,
      tenantId,
      status: 'ACTIVE',
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
  async getCart(sessionId, tenantId) {
    let cart = await this.cartRepository.getCartWithItems(sessionId, tenantId);

    if (!cart) {
      cart = await this.cartRepository.getOrCreateCart(sessionId, tenantId);
      cart.items = [];
    }

    const total = this.calculateCartTotal(cart.items);

    return {
      ...cart,
      total,
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
