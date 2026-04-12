const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  listOrders,
  createOrder,
  updateOrder,
  postToRoom,
  payOrder,
  updatePaymentMethod,
  listMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../controllers/restaurantController');

// All routes require authentication
router.use(authenticate);

// Order routes
router.get('/orders', listOrders);
router.post('/orders', authorize('admin', 'manager', 'restaurant'), createOrder);
router.put('/orders/:id', authorize('admin', 'manager', 'restaurant'), updateOrder);
router.put('/orders/:id/status', authorize('admin', 'manager', 'restaurant'), updateOrder);
router.put('/orders/:id/post-to-room', authorize('admin', 'manager', 'restaurant'), postToRoom);
router.put('/orders/:id/pay', authorize('admin', 'manager', 'restaurant'), payOrder);
router.put('/orders/:id/payment-method', authorize('admin', 'manager', 'restaurant'), updatePaymentMethod);

// Menu routes
router.get('/menu', listMenu);
router.post('/menu', authorize('admin', 'manager', 'restaurant'), createMenuItem);
router.put('/menu/:id', authorize('admin', 'manager', 'restaurant'), updateMenuItem);
router.delete('/menu/:id', authorize('admin', 'manager', 'restaurant'), deleteMenuItem);

module.exports = router;
