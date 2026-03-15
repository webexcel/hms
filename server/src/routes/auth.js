const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, validatePassword } = require('../middleware/security');
const { resolveTenantFromBody } = require('../middleware/tenant');

router.post('/login', loginLimiter, resolveTenantFromBody, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/change-password', authenticate, validatePassword, authController.changePassword);

module.exports = router;
