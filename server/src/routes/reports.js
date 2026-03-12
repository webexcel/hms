const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin', 'manager', 'front_desk'));

router.get('/revenue', reportController.revenue);
router.get('/occupancy', reportController.occupancy);
router.get('/daily-summary', reportController.dailySummary);
router.get('/guest-stats', reportController.guestStats);
router.get('/guest-statistics', reportController.guestStats);

module.exports = router;
