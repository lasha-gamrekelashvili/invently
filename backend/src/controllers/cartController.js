import { CartService } from '../services/CartService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

const cartService = new CartService();

const cartController = {
  // Get cart by session ID
  async getCart(req, res) {
    try {
      const { sessionId } = req.params;
      const tenantId = req.tenantId;

      const cart = await cartService.getCart(sessionId, tenantId);

      res.json(ApiResponse.success(cart));
    } catch (error) {
      console.error('Get cart error:', error);
      res.status(500).json(ApiResponse.error('Failed to get cart', error.message));
    }
  },

  // Add item to cart
  async addToCart(req, res) {
    try {
      const { sessionId } = req.params;
      const { productId, variantId, quantity = 1 } = req.body;
      const tenantId = req.tenantId;

      const cartItem = await cartService.addToCart(sessionId, productId, variantId, quantity, tenantId);

      res.json(ApiResponse.success(cartItem, 'Item added to cart successfully'));
    } catch (error) {
      if (error.message === 'Product not found or not available') {
        return res.status(404).json(ApiResponse.error(error.message));
      }
      if (error.message === 'Product variant not found or not available') {
        return res.status(404).json(ApiResponse.error(error.message));
      }
      if (error.message === 'Insufficient stock available') {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      console.error('Add to cart error:', error);
      res.status(500).json(ApiResponse.error('Failed to add item to cart', error.message));
    }
  },

  // Update cart item quantity
  async updateCartItem(req, res) {
    try {
      const { sessionId, itemId } = req.params;
      const { quantity } = req.body;
      const tenantId = req.tenantId;

      const updatedItem = await cartService.updateCartItem(sessionId, itemId, quantity, tenantId);

      res.json(ApiResponse.success(updatedItem, 'Cart item updated successfully'));
    } catch (error) {
      if (error.message === 'Cart item not found') {
        return res.status(404).json(ApiResponse.notFound('Cart item'));
      }
      if (error.message === 'Insufficient stock available') {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      console.error('Update cart item error:', error);
      res.status(500).json(ApiResponse.error('Failed to update cart item', error.message));
    }
  },

  // Remove item from cart
  async removeFromCart(req, res) {
    try {
      const { sessionId, itemId } = req.params;
      const tenantId = req.tenantId;

      await cartService.removeFromCart(sessionId, itemId, tenantId);

      res.json(ApiResponse.deleted('Item removed from cart successfully'));
    } catch (error) {
      if (error.message === 'Cart item not found') {
        return res.status(404).json(ApiResponse.notFound('Cart item'));
      }
      console.error('Remove from cart error:', error);
      res.status(500).json(ApiResponse.error('Failed to remove item from cart', error.message));
    }
  },

  // Clear cart
  async clearCart(req, res) {
    try {
      const { sessionId } = req.params;
      const tenantId = req.tenantId;

      await cartService.clearCart(sessionId, tenantId);

      res.json(ApiResponse.deleted('Cart cleared successfully'));
    } catch (error) {
      if (error.message === 'Cart not found') {
        return res.status(404).json(ApiResponse.notFound('Cart'));
      }
      console.error('Clear cart error:', error);
      res.status(500).json(ApiResponse.error('Failed to clear cart', error.message));
    }
  },
};

export default cartController;
