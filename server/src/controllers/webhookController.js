/**
 * Handle inbound booking webhook from OTA.
 * Stores event and responds 200 immediately. Processing happens async via queue.
 */
const handleBooking = async (req, res, next) => {
  try {
    const result = await storeAndQueue(req, 'booking');
    res.status(200).json({ received: true, event_id: result.event_id });
  } catch (error) {
    if (error.duplicate) {
      return res.status(200).json({ received: true, duplicate: true });
    }
    next(error);
  }
};

const handleModification = async (req, res, next) => {
  try {
    const result = await storeAndQueue(req, 'modification');
    res.status(200).json({ received: true, event_id: result.event_id });
  } catch (error) {
    if (error.duplicate) {
      return res.status(200).json({ received: true, duplicate: true });
    }
    next(error);
  }
};

const handleCancellation = async (req, res, next) => {
  try {
    const result = await storeAndQueue(req, 'cancellation');
    res.status(200).json({ received: true, event_id: result.event_id });
  } catch (error) {
    if (error.duplicate) {
      return res.status(200).json({ received: true, duplicate: true });
    }
    next(error);
  }
};

/**
 * Store the webhook event and queue for async processing.
 */
async function storeAndQueue(req, eventType) {
  const { WebhookEvent } = req.db;
  const channel = req.channel;
  const payload = req.body;

  // Extract event ID from payload for idempotency
  const eventId = payload.event_id || payload.booking_id || payload.bookingId
    || payload.booking_ref || `${channel.code}_${Date.now()}`;

  // Idempotency check
  const existing = await WebhookEvent.findOne({
    where: { channel_id: channel.id, event_id: eventId },
  });

  if (existing) {
    if (existing.status === 'processed') {
      const err = new Error('Duplicate event');
      err.duplicate = true;
      throw err;
    }
    // If failed, allow reprocessing
    if (existing.status !== 'failed') {
      const err = new Error('Duplicate event');
      err.duplicate = true;
      throw err;
    }
  }

  const event = existing || await WebhookEvent.create({
    channel_id: channel.id,
    event_id: eventId,
    event_type: eventType,
    payload,
    status: 'received',
  });

  // Queue for async processing
  try {
    const { webhookProcessQueue } = require('../services/queue');
    await webhookProcessQueue.add(
      { webhookEventId: event.id, dbName: req.tenant.db_name },
      { jobId: `webhook-${event.id}`, priority: 1 }
    );
  } catch (err) {
    console.warn('Failed to queue webhook event, will be picked up by scheduler:', err.message);
  }

  return { event_id: eventId, webhook_event_id: event.id };
}

module.exports = {
  handleBooking,
  handleModification,
  handleCancellation,
};
