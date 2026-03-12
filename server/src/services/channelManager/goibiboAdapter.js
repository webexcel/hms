const BaseAdapter = require('./baseAdapter');
const { otaRequest } = require('./httpClient');

/**
 * Goibibo adapter. Same parent company as MMT, so API structure is very similar.
 */
class GoibiboAdapter extends BaseAdapter {
  constructor() {
    super('goibibo');
  }

  async pushAvailability(channel, inventory) {
    const payload = {
      property_id: channel.hotel_id_on_ota,
      availability: inventory.map((item) => ({
        room_code: item.room_type,
        date: item.date,
        count: item.available_rooms,
      })),
    };

    return otaRequest({
      channel,
      method: 'POST',
      path: '/api/v2/inventory/bulk-update',
      data: payload,
      operation: 'push_availability',
    });
  }

  async pushRates(channel, rateData) {
    const payload = {
      property_id: channel.hotel_id_on_ota,
      room_code: rateData.ota_room_code,
      rate_plan_code: rateData.ota_rate_code,
      base_rate: rateData.base_rate,
      weekend_rate: rateData.weekend_rate,
      meal_plan: rateData.meal_plan,
      cancellation_policy: rateData.cancellation_policy,
    };

    return otaRequest({
      channel,
      method: 'POST',
      path: '/api/v2/rates/update',
      data: payload,
      operation: 'push_rates',
    });
  }

  async confirmBooking(channel, bookingData) {
    return otaRequest({
      channel,
      method: 'POST',
      path: '/api/v2/booking/confirm',
      data: {
        property_id: channel.hotel_id_on_ota,
        booking_ref: bookingData.ota_booking_id,
        hotel_confirmation: bookingData.pms_reservation_number,
      },
      operation: 'booking_confirm',
    });
  }

  async cancelBooking(channel, cancellationData) {
    return otaRequest({
      channel,
      method: 'POST',
      path: '/api/v2/booking/cancel',
      data: {
        property_id: channel.hotel_id_on_ota,
        booking_ref: cancellationData.ota_booking_id,
        reason: cancellationData.reason,
      },
      operation: 'booking_cancel',
    });
  }

  async modifyBooking(channel, modificationData) {
    return otaRequest({
      channel,
      method: 'POST',
      path: '/api/v2/booking/modify',
      data: {
        property_id: channel.hotel_id_on_ota,
        booking_ref: modificationData.ota_booking_id,
        ...modificationData.changes,
      },
      operation: 'booking_modify',
    });
  }

  async testConnection(channel) {
    try {
      await otaRequest({
        channel,
        method: 'GET',
        path: '/api/v2/health',
        operation: 'test_connection',
      });
      return { success: true, message: 'Connection successful' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  parseBookingPayload(payload) {
    return {
      ota_booking_id: payload.booking_ref || payload.booking_id,
      guest: {
        first_name: payload.guest_first_name || payload.guest?.first_name,
        last_name: payload.guest_last_name || payload.guest?.last_name || '',
        email: payload.guest_email || payload.guest?.email,
        phone: payload.guest_mobile || payload.guest?.phone,
      },
      room_type: payload.room_code || payload.room_type,
      check_in_date: payload.check_in || payload.checkin_date,
      check_out_date: payload.check_out || payload.checkout_date,
      adults: payload.adults || 1,
      children: payload.children || 0,
      rate_per_night: parseFloat(payload.per_night_rate || payload.rate || 0),
      total_amount: parseFloat(payload.total || payload.booking_amount || 0),
      payment_mode: payload.payment_type || 'prepaid',
      special_requests: payload.special_requests || '',
      cancellation_policy: payload.cancellation_type || 'standard',
    };
  }

  parseCancellationPayload(payload) {
    return {
      ota_booking_id: payload.booking_ref || payload.booking_id,
      reason: payload.reason || 'Guest cancellation',
    };
  }

  parseModificationPayload(payload) {
    return {
      ota_booking_id: payload.booking_ref || payload.booking_id,
      changes: {
        check_in_date: payload.new_check_in || payload.check_in,
        check_out_date: payload.new_check_out || payload.check_out,
        adults: payload.adults,
        children: payload.children,
        room_type: payload.room_code,
        special_requests: payload.special_requests,
      },
    };
  }
}

module.exports = GoibiboAdapter;
