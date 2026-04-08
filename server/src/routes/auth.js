const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, validatePassword } = require('../middleware/security');
const { resolveTenantFromBody } = require('../middleware/tenant');
const { validateBody } = require('../middleware/validate');
const { loginSchema } = require('../schemas/auth');

router.post('/login', loginLimiter, validateBody(loginSchema), resolveTenantFromBody, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/change-password', authenticate, validatePassword, authController.changePassword);

module.exports = router;
