const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', inventoryController.getStats);
router.get('/low-stock', inventoryController.getLowStock);
router.get('/', inventoryController.list);
router.get('/:id', inventoryController.getById);

router.post('/', authorize('admin', 'manager'), inventoryController.create);
router.put('/:id', authorize('admin', 'manager'), inventoryController.update);
router.delete('/:id', authorize('admin', 'manager'), inventoryController.deleteItem);
router.post('/:id/adjust', authorize('admin', 'manager'), inventoryController.adjustStock);

module.exports = router;
