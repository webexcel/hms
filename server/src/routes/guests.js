const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const guestController = require('../controllers/guestController');

router.use(authenticate);

router.get('/stats', guestController.getStats);
router.get('/', guestController.list);
router.get('/:id', guestController.getById);
router.get('/:id/stays', guestController.getStayHistory);

router.post('/', authorize('admin', 'manager', 'front_desk'), guestController.create);
router.put('/:id', authorize('admin', 'manager', 'front_desk'), guestController.update);

module.exports = router;
