import { BaseRepository } from './BaseRepository.js';
import prisma from './BaseRepository.js';
import { cartItemIncludes } from '../utils/queryBuilders.js';

export class CartRepository extends BaseRepository {
  constructor() {
    super(prisma.cart);
  }

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

  async findByCartAndProduct(cartId, productId, variantId = null) {
    return await this.findFirst({
      cartId,
      productId,
      variantId: variantId || null,
    });
  }

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

  async createCartItem(cartId, productId, variantId, quantity, price) {
    return await this.create({
      cartId,
      productId,
      variantId: variantId || null,
      quantity,
      price,
    });
  }

  async updateQuantity(itemId, quantity, price) {
    return await this.update(itemId, {
      quantity,
      price,
    });
  }

  async deleteCartItem(itemId) {
    return await this.delete(itemId);
  }

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
