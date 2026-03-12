const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', settingsController.getAll);
router.put('/', authorize('admin', 'manager'), settingsController.update);

module.exports = router;
