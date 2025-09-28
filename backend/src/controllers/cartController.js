const { PrismaClient } = require('@prisma/client');
const { auditLog } = require('../utils/auditLogger');

const prisma = new PrismaClient();

const cartController = {
  // Get cart by session ID
  async getCart(req, res) {
    try {
      const { sessionId } = req.params;
      const tenantId = req.tenantId;

      let cart = await prisma.cart.findFirst({
        where: {
          sessionId,
          tenantId,
          deletedAt: null,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { deletedAt: null },
                    orderBy: { sortOrder: 'asc' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            sessionId,
            tenantId,
          },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: {
                      where: { deletedAt: null },
                      orderBy: { sortOrder: 'asc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        });
      }

      const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      res.json({
        success: true,
        data: {
          ...cart,
          total,
        },
      });
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get cart',
        error: error.message,
      });
    }
  },

  // Add item to cart
  async addToCart(req, res) {
    try {
      const { sessionId } = req.params;
      const { productId, quantity = 1 } = req.body;
      const tenantId = req.tenantId;

      // Validate product exists and is active
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          tenantId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or not available',
        });
      }

      // Check stock
      if (product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock available',
        });
      }

      // Get or create cart
      let cart = await prisma.cart.findFirst({
        where: {
          sessionId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!cart) {
        cart = await prisma.cart.create({
          data: {
            sessionId,
            tenantId,
          },
        });
      }

      // Check if item already exists in cart
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
        },
      });

      let cartItem;
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        // Check total stock
        if (product.stockQuantity < newQuantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock available',
          });
        }

        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            price: product.price,
          },
          include: {
            product: {
              include: {
                images: {
                  where: { deletedAt: null },
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        });
      } else {
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
            price: product.price,
          },
          include: {
            product: {
              include: {
                images: {
                  where: { deletedAt: null },
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        });
      }

      res.json({
        success: true,
        data: cartItem,
        message: 'Item added to cart successfully',
      });
    } catch (error) {
      console.error('Add to cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
        error: error.message,
      });
    }
  },

  // Update cart item quantity
  async updateCartItem(req, res) {
    try {
      const { sessionId, itemId } = req.params;
      const { quantity } = req.body;
      const tenantId = req.tenantId;

      // Find cart item
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: {
            sessionId,
            tenantId,
            deletedAt: null,
          },
        },
        include: {
          product: true,
        },
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found',
        });
      }

      // Check stock
      if (cartItem.product.stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock available',
        });
      }

      // Update quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
          price: cartItem.product.price,
        },
        include: {
          product: {
            include: {
              images: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          },
        },
      });

      res.json({
        success: true,
        data: updatedItem,
        message: 'Cart item updated successfully',
      });
    } catch (error) {
      console.error('Update cart item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update cart item',
        error: error.message,
      });
    }
  },

  // Remove item from cart
  async removeFromCart(req, res) {
    try {
      const { sessionId, itemId } = req.params;
      const tenantId = req.tenantId;

      // Verify item belongs to the session's cart
      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cart: {
            sessionId,
            tenantId,
            deletedAt: null,
          },
        },
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found',
        });
      }

      await prisma.cartItem.delete({
        where: { id: itemId },
      });

      res.json({
        success: true,
        message: 'Item removed from cart successfully',
      });
    } catch (error) {
      console.error('Remove from cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from cart',
        error: error.message,
      });
    }
  },

  // Clear cart
  async clearCart(req, res) {
    try {
      const { sessionId } = req.params;
      const tenantId = req.tenantId;

      const cart = await prisma.cart.findFirst({
        where: {
          sessionId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found',
        });
      }

      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      res.json({
        success: true,
        message: 'Cart cleared successfully',
      });
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart',
        error: error.message,
      });
    }
  },
};

module.exports = cartController;