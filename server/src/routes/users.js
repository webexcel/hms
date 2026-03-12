const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePassword } = require('../middleware/security');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', userController.getAll);
router.post('/', validatePassword, userController.create);
router.put('/:id', userController.update);
router.patch('/:id/toggle', userController.toggleActive);

module.exports = router;
