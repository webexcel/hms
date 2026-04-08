const notificationService = require('../../notification');
const logger = require('../../../utils/logger');

/**
 * Process booking notification job.
 * Job data: { type, reservationId, data }
 */
module.exports = async function processBookingNotification(job) {
  const { type, reservationId, data } = job.data;

  switch (type) {
    case 'ota_booking_alert':
      await notificationService.sendOtaBookingAlert(data);
      break;
    case 'booking_confirmation':
      await notificationService.sendBookingConfirmation(data);
      break;
    case 'cancellation_notice':
      await notificationService.sendCancellationNotice(data);
      break;
    default:
      logger.warn(`Unknown notification type: ${type}`);
  }
};
