const express = require('express');
const router = express.Router();
const { apiKeyAuth, resolveWebhookTenant } = require('../middleware/apiKeyAuth');
const { verifyWebhookSignature } = require('../middleware/webhookSignature');
const webhookController = require('../controllers/webhookController');

// All webhook routes: resolve tenant first, then API key auth
router.use('/:tenantSlug', resolveWebhookTenant);
router.use(apiKeyAuth);
router.use(verifyWebhookSignature);

// POST /api/v1/webhooks/:tenantSlug/:channel/booking
router.post('/:tenantSlug/:channel/booking', webhookController.handleBooking);

// POST /api/v1/webhooks/:tenantSlug/:channel/modify
router.post('/:tenantSlug/:channel/modify', webhookController.handleModification);

// POST /api/v1/webhooks/:tenantSlug/:channel/cancel
router.post('/:tenantSlug/:channel/cancel', webhookController.handleCancellation);

module.exports = router;
