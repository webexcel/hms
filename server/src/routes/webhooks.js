const express = require('express');
const router = express.Router();
const { apiKeyAuth } = require('../middleware/apiKeyAuth');
const { verifyWebhookSignature } = require('../middleware/webhookSignature');
const webhookController = require('../controllers/webhookController');

// All webhook routes use API key auth (not JWT)
router.use(apiKeyAuth);
router.use(verifyWebhookSignature);

// POST /api/v1/webhooks/:channel/booking
router.post('/:channel/booking', webhookController.handleBooking);

// POST /api/v1/webhooks/:channel/modify
router.post('/:channel/modify', webhookController.handleModification);

// POST /api/v1/webhooks/:channel/cancel
router.post('/:channel/cancel', webhookController.handleCancellation);

module.exports = router;
