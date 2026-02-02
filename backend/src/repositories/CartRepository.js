import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';
import { cartItemIncludes } from '../utils/queryBuilders.js';

export class CartRepository extends BaseRepository {
  constructor() {
    super(prisma.cart);
  }

  /**
   * Finds a cart by session ID and tenant ID
   */
  async findBySessionId(sessionId, tenantId) {
    return await this.findFirst(
      { sessionId, tenantId },
      {
        include: {
          items: cartItemIncludes.withProduct,
        },
      }
    );
  }

  /**
   * Gets or creates a cart for a session
   */
  async getOrCreateCart(sessionId, tenantId) {
    let cart = await this.findBySessionId(sessionId, tenantId);

    if (!cart) {
      cart = await this.create({
        sessionId,
        tenantId,
      });
    }

    return cart;
  }

  /**
   * Gets a cart with all items
   */
  async getCartWithItems(sessionId, tenantId) {
    return await this.findFirst(
      { sessionId, tenantId },
      {
        include: {
          items: cartItemIncludes.withProduct,
        },
      }
    );
  }

  /**
   * Clears all items from a cart
   */
  async clearCartItems(cartId) {
    return await prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }
}

export class CartItemRepository extends BaseRepository {
  constructor() {
    super(prisma.cartItem);
  }

  /**
   * Finds a cart item by cart, product, and variant
   */
  async findByCartAndProduct(cartId, productId, variantId = null) {
    return await this.findFirst({
      cartId,
      productId,
      variantId: variantId || null,
    });
  }

  /**
   * Finds a cart item with product and variant details
   */
  async findByIdWithDetails(itemId) {
    return await this.findFirst(
      { id: itemId },
      {
        include: {
          product: true,
          variant: true,
        },
      }
    );
  }

  /**
   * Creates a new cart item
   */
  async createCartItem(cartId, productId, variantId, quantity, price) {
    return await this.create({
      cartId,
      productId,
      variantId: variantId || null,
      quantity,
      price,
    });
  }

  /**
   * Updates cart item quantity and price
   */
  async updateQuantity(itemId, quantity, price) {
    return await this.update(itemId, {
      quantity,
      price,
    });
  }

  /**
   * Deletes a cart item
   */
  async deleteCartItem(itemId) {
    return await this.delete(itemId);
  }

  /**
   * Finds a cart item by ID, session ID, and tenant ID
   */
  async findByCartWithSession(itemId, sessionId, tenantId) {
    return await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          sessionId,
          tenantId,
        },
      },
      include: {
        product: true,
        variant: true,
      },
    });
  }
}
