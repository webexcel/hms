const express = require('express');
const router = express.Router();
const rateController = require('../controllers/rateController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Applicable rate lookup
router.get('/applicable', rateController.getApplicableRate);

// Rate Plans
router.get('/plans', rateController.listRatePlans);
router.post('/plans', authorize('admin', 'manager'), rateController.createRatePlan);
router.put('/plans/:id', authorize('admin', 'manager'), rateController.updateRatePlan);

// Packages
router.get('/packages', rateController.listPackages);
router.post('/packages', authorize('admin', 'manager'), rateController.createPackage);
router.put('/packages/:id', authorize('admin', 'manager'), rateController.updatePackage);

// Promotions
router.get('/promotions', rateController.listPromotions);
router.post('/promotions', authorize('admin', 'manager'), rateController.createPromotion);
router.put('/promotions/:id', authorize('admin', 'manager'), rateController.updatePromotion);
router.post('/promotions/validate', rateController.validatePromoCode);
router.put('/promotions/:id/apply', rateController.applyPromoCode);

module.exports = router;
