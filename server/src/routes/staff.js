const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  list,
  create,
  getById,
  update,
  listSchedules,
  createSchedule,
  updateSchedule
} = require('../controllers/staffController');

// All routes require authentication
router.use(authenticate);

// Schedule routes (must be before /:id to avoid matching "schedules" as an id)
router.get('/schedules', authorize('admin', 'manager', 'front_desk', 'housekeeping'), listSchedules);
router.post('/schedules', authorize('admin', 'manager'), createSchedule);
router.put('/schedules/:id', authorize('admin', 'manager'), updateSchedule);

// Staff routes
router.get('/', authorize('admin', 'manager', 'front_desk', 'housekeeping'), list);
router.post('/', authorize('admin', 'manager'), create);
router.get('/:id', authorize('admin', 'manager', 'front_desk', 'housekeeping'), getById);
router.put('/:id', authorize('admin', 'manager'), update);

module.exports = router;
