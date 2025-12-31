import { OrderService } from '../services/OrderService.js';
import { ApiResponse } from '../utils/responseFormatter.js';

const orderService = new OrderService();

const orderController = {
  // Create order from cart (checkout)
  async createOrder(req, res) {
    try {
      const {
        sessionId,
        customerEmail,
        customerName,
        shippingAddress,
        billingAddress,
        notes,
      } = req.body;
      const tenantId = req.tenantId;

      const order = await orderService.createOrder(
        { sessionId, customerEmail, customerName, shippingAddress, billingAddress, notes },
        tenantId
      );

      res.status(201).json(ApiResponse.created(order, 'Order created successfully'));
    } catch (error) {
      if (error.message === 'Cart is empty or not found') {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      if (error.message.startsWith('Insufficient stock for')) {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      console.error('Create order error:', error);
      res.status(500).json(ApiResponse.error('Failed to create order', error.message));
    }
  },

  // Get orders (admin)
  async getOrders(req, res) {
    try {
      const tenantId = req.tenantId;
      const { page = 1, limit = 10, status, search, dateFilter, startDate, endDate } = req.query;

      const result = await orderService.getOrders(
        tenantId,
        { status, search, dateFilter, startDate, endDate },
        parseInt(page),
        parseInt(limit)
      );

      res.json(ApiResponse.success(result.orders, null));
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json(ApiResponse.error('Failed to get orders', error.message));
    }
  },

  // Get single order
  async getOrder(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const order = await orderService.getOrder(id, tenantId);

      res.json(ApiResponse.success(order));
    } catch (error) {
      if (error.message === 'Order not found') {
        return res.status(404).json(ApiResponse.notFound('Order'));
      }
      console.error('Get order error:', error);
      res.status(500).json(ApiResponse.error('Failed to get order', error.message));
    }
  },

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const tenantId = req.tenantId;

      const updatedOrder = await orderService.updateOrderStatus(id, status, tenantId);

      res.json(ApiResponse.updated(updatedOrder, 'Order status updated successfully'));
    } catch (error) {
      if (error.message === 'Invalid order status') {
        return res.status(400).json(ApiResponse.error(error.message));
      }
      if (error.message === 'Order not found') {
        return res.status(404).json(ApiResponse.notFound('Order'));
      }
      console.error('Update order status error:', error);
      res.status(500).json(ApiResponse.error('Failed to update order status', error.message));
    }
  },

  // Get order statistics for dashboard
  async getOrderStats(req, res) {
    try {
      const tenantId = req.tenantId;

      const stats = await orderService.getOrderStats(tenantId);

      res.json(ApiResponse.success(stats));
    } catch (error) {
      console.error('Get order stats error:', error);
      res.status(500).json(ApiResponse.error('Failed to get order statistics', error.message));
    }
  },
};

export default orderController;
