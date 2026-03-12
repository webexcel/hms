const crypto = require('crypto');

/**
 * Verify webhook signature using HMAC-SHA256.
 * Expects X-Webhook-Signature header with the HMAC of the raw body.
 * Channel's webhook_secret is used as the HMAC key.
 */
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-webhook-signature'];

  // Signature verification is optional - some OTAs may not sign
  if (!signature) {
    return next();
  }

  if (!req.channel || !req.channel.webhook_secret) {
    return next();
  }

  const rawBody = req.rawBody;
  if (!rawBody) {
    return res.status(400).json({ error: 'Raw body not available for signature verification' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', req.channel.webhook_secret)
    .update(rawBody)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
}

module.exports = { verifyWebhookSignature };
