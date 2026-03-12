/**
 * Base adapter interface for OTA channel integrations.
 * All OTA adapters must extend this class and implement every method.
 */
class BaseAdapter {
  constructor(channelCode) {
    this.channelCode = channelCode;
  }

  /**
   * Push room availability to the OTA.
   * @param {Object} channel - OtaChannel model instance
   * @param {Array} inventory - Array of { room_type, date, available_rooms }
   */
  async pushAvailability(channel, inventory) {
    throw new Error('pushAvailability() not implemented');
  }

  /**
   * Push rate plan to the OTA.
   * @param {Object} channel - OtaChannel model instance
   * @param {Object} rateData - { ota_room_code, ota_rate_code, base_rate, weekend_rate, ... }
   */
  async pushRates(channel, rateData) {
    throw new Error('pushRates() not implemented');
  }

  /**
   * Confirm a booking to the OTA.
   * @param {Object} channel - OtaChannel model instance
   * @param {Object} bookingData - { ota_booking_id, pms_reservation_number, status }
   */
  async confirmBooking(channel, bookingData) {
    throw new Error('confirmBooking() not implemented');
  }

  /**
   * Notify the OTA of a cancellation.
   * @param {Object} channel - OtaChannel model instance
   * @param {Object} cancellationData - { ota_booking_id, reason }
   */
  async cancelBooking(channel, cancellationData) {
    throw new Error('cancelBooking() not implemented');
  }

  /**
   * Notify the OTA of a modification.
   * @param {Object} channel - OtaChannel model instance
   * @param {Object} modificationData
   */
  async modifyBooking(channel, modificationData) {
    throw new Error('modifyBooking() not implemented');
  }

  /**
   * Test the connection to the OTA API.
   * @param {Object} channel - OtaChannel model instance
   * @returns {{ success: boolean, message: string }}
   */
  async testConnection(channel) {
    throw new Error('testConnection() not implemented');
  }

  /**
   * Parse an inbound booking payload into a normalized format.
   * @param {Object} payload - Raw OTA webhook payload
   * @returns {Object} Normalized booking data
   */
  parseBookingPayload(payload) {
    throw new Error('parseBookingPayload() not implemented');
  }

  /**
   * Parse an inbound cancellation payload.
   * @param {Object} payload
   * @returns {Object} { ota_booking_id, reason }
   */
  parseCancellationPayload(payload) {
    throw new Error('parseCancellationPayload() not implemented');
  }

  /**
   * Parse an inbound modification payload.
   * @param {Object} payload
   * @returns {Object} Normalized modification data
   */
  parseModificationPayload(payload) {
    throw new Error('parseModificationPayload() not implemented');
  }
}

module.exports = BaseAdapter;
