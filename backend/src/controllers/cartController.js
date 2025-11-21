const { PrismaClient } = require('@prisma/client');

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
          tenantId
        },
        include: {
          items: {
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
                      orderBy: { sortOrder: 'asc' },
                      take: 1,
                    },
                  },
                },
                variant: true,
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
      const { productId, variantId, quantity = 1 } = req.body;
      const tenantId = req.tenantId;

      // Validate product exists and is active
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          tenantId,
          status: 'ACTIVE'
        },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found or not available',
        });
      }

      // If variantId provided, validate variant
      let variant = null;
      if (variantId) {
        variant = await prisma.productVariant.findFirst({
          where: {
            id: variantId,
            productId,
            isActive: true
          },
        });

        if (!variant) {
          return res.status(404).json({
            success: false,
            message: 'Product variant not found or not available',
          });
        }
      }

      // Check stock (variant stock takes priority if variant selected)
      const availableStock = variant ? variant.stockQuantity : product.stockQuantity;
      if (availableStock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock available',
        });
      }

      // Determine price (variant price takes priority if available)
      const itemPrice = variant?.price ?? product.price;

      // Get or create cart
      let cart = await prisma.cart.findFirst({
        where: {
          sessionId,
          tenantId
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

      // Check if item already exists in cart (including variant)
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
        },
      });

      let cartItem;
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        // Check total stock
        if (availableStock < newQuantity) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient stock available',
          });
        }

        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            price: itemPrice,
          },
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
        });
      } else {
        cartItem = await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            variantId: variantId || null,
            quantity,
            price: itemPrice,
          },
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
            tenantId
          },
        },
        include: {
          product: true,
          variant: true,
        },
      });

      if (!cartItem) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found',
        });
      }

      // Check stock (variant stock takes priority if variant selected)
      const availableStock = cartItem.variant ? cartItem.variant.stockQuantity : cartItem.product.stockQuantity;
      if (availableStock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock available',
        });
      }

      // Determine price (variant price takes priority if available)
      const itemPrice = cartItem.variant?.price ?? cartItem.product.price;

      // Update quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
          price: itemPrice,
        },
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
            tenantId
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
          tenantId
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