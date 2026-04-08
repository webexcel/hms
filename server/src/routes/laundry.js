const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  postToRoom,
} = require('../controllers/laundryController');

// All routes require authentication
router.use(authenticate);

// Order routes
router.get('/orders', listOrders);
router.get('/orders/:id', getOrder);
router.post('/orders', authorize('admin', 'manager', 'front_desk', 'housekeeping'), createOrder);
router.put('/orders/:id', authorize('admin', 'manager', 'front_desk', 'housekeeping'), updateOrder);
router.put('/orders/:id/status', authorize('admin', 'manager', 'front_desk', 'housekeeping'), updateOrder);
router.put('/orders/:id/post-to-room', authorize('admin', 'manager', 'front_desk'), postToRoom);

module.exports = router;
