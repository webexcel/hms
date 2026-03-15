const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  listTasks,
  createTask,
  updateTask,
  dashboard,
  createMaintenance,
  updateMaintenance,
  listMaintenance
} = require('../controllers/housekeepingController');

// All routes require authentication
router.use(authenticate);

// Task routes
router.get('/tasks', listTasks);
router.get('/dashboard', dashboard);
router.post('/tasks', authorize('admin', 'manager', 'front_desk', 'housekeeping'), createTask);
router.put('/tasks/:id', authorize('admin', 'manager', 'front_desk', 'housekeeping'), updateTask);
router.put('/tasks/:id/status', authorize('admin', 'manager', 'front_desk', 'housekeeping'), updateTask);

// Maintenance routes
router.get('/maintenance', listMaintenance);
router.post('/maintenance', authorize('admin', 'manager', 'front_desk', 'housekeeping'), createMaintenance);
router.put('/maintenance/:id', authorize('admin', 'manager', 'front_desk', 'housekeeping'), updateMaintenance);

module.exports = router;
