const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const roomController = require('../controllers/roomController');

router.use(authenticate);

router.get('/', roomController.list);
router.get('/dashboard', roomController.dashboard);
router.get('/:id', roomController.getById);

router.post('/', authorize('admin', 'manager'), roomController.create);
router.put('/:id/status', roomController.updateStatus);
router.put('/:id', authorize('admin', 'manager'), roomController.update);

module.exports = router;
