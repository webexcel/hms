const bookingHandler = require('../../bookingHandler');
const { WebhookEvent } = require('../../../models');

/**
 * Process OTA webhook events asynchronously.
 * Job data: { webhookEventId }
 */
module.exports = async function processWebhook(job) {
  const { webhookEventId } = job.data;

  const event = await WebhookEvent.findByPk(webhookEventId);
  if (!event) {
    throw new Error(`WebhookEvent ${webhookEventId} not found`);
  }

  if (event.status === 'processed' || event.status === 'duplicate') {
    return { skipped: true, reason: event.status };
  }

  await event.update({ status: 'processing' });

  try {
    let result;

    switch (event.event_type) {
      case 'booking':
        result = await bookingHandler.processOtaBooking(event);
        break;
      case 'modification':
        result = await bookingHandler.processOtaModification(event);
        break;
      case 'cancellation':
        result = await bookingHandler.processOtaCancellation(event);
        break;
      default:
        throw new Error(`Unknown event type: ${event.event_type}`);
    }

    await event.update({
      status: 'processed',
      processed_at: new Date(),
      reservation_id: result?.reservationId || null,
    });

    return result;
  } catch (err) {
    await event.update({
      status: 'failed',
      error_message: err.message,
      retry_count: (event.retry_count || 0) + 1,
    });
    throw err;
  }
};
