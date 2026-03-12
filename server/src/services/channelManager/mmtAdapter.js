const BaseAdapter = require('./baseAdapter');
const { otaRequest } = require('./httpClient');

class MmtAdapter extends BaseAdapter {
  constructor() {
    super('mmt');
  }

  async pushAvailability(channel, inventory) {
    const payload = {
      hotel_id: channel.hotel_id_on_ota,
      inventory: inventory.map((item) => ({
        room_type_code: item.room_type,
        date: item.date,
        available: item.available_rooms,
      })),
    };

    return otaRequest({
      channel,
      method: 'POST',
      path: '/v1/inventory/update',
      data: payload,
      operation: 'push_availability',
    });
  }

  async pushRates(channel, rateData) {
    const payload = {
      hotel_id: channel.hotel_id_on_ota,
      room_type_code: rateData.ota_room_code,
      rate_plan_code: rateData.ota_rate_code,
      rates: {
        base_rate: rateData.base_rate,
        weekend_rate: rateData.weekend_rate,
        meal_plan: rateData.meal_plan,
        cancellation_policy: rateData.cancellation_policy,
      },
    };

    return otaRequest({
      channel,
      method: 'POST',
      path: '/v1/rates/update',
      data: payload,
      operation: 'push_rates',
    });
  }

  async confirmBooking(channel, bookingData) {
    return otaRequest({
      channel,
      method: 'POST',
      path: '/v1/booking/confirm',
      data: {
        hotel_id: channel.hotel_id_on_ota,
        booking_id: bookingData.ota_booking_id,
        confirmation_number: bookingData.pms_reservation_number,
        status: 'confirmed',
      },
      operation: 'booking_confirm',
    });
  }

  async cancelBooking(channel, cancellationData) {
    return otaRequest({
      channel,
      method: 'POST',
      path: '/v1/booking/cancel',
      data: {
        hotel_id: channel.hotel_id_on_ota,
        booking_id: cancellationData.ota_booking_id,
        reason: cancellationData.reason,
      },
      operation: 'booking_cancel',
    });
  }

  async modifyBooking(channel, modificationData) {
    return otaRequest({
      channel,
      method: 'POST',
      path: '/v1/booking/modify',
      data: {
        hotel_id: channel.hotel_id_on_ota,
        booking_id: modificationData.ota_booking_id,
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
        path: '/v1/ping',
        operation: 'test_connection',
      });
      return { success: true, message: 'Connection successful' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  parseBookingPayload(payload) {
    return {
      ota_booking_id: payload.booking_id || payload.bookingId,
      guest: {
        first_name: payload.guest?.first_name || payload.guest_name?.split(' ')[0],
        last_name: payload.guest?.last_name || payload.guest_name?.split(' ').slice(1).join(' ') || '',
        email: payload.guest?.email || payload.email,
        phone: payload.guest?.phone || payload.mobile,
      },
      room_type: payload.room_type || payload.room_category,
      check_in_date: payload.checkin || payload.check_in,
      check_out_date: payload.checkout || payload.check_out,
      adults: payload.adults || payload.no_of_adults || 1,
      children: payload.children || payload.no_of_children || 0,
      rate_per_night: parseFloat(payload.rate_per_night || payload.room_rate || 0),
      total_amount: parseFloat(payload.total_amount || payload.booking_amount || 0),
      payment_mode: payload.payment_mode || 'prepaid',
      special_requests: payload.special_requests || payload.remarks || '',
      cancellation_policy: payload.cancellation_policy || 'standard',
    };
  }

  parseCancellationPayload(payload) {
    return {
      ota_booking_id: payload.booking_id || payload.bookingId,
      reason: payload.reason || payload.cancellation_reason || 'Guest requested cancellation',
    };
  }

  parseModificationPayload(payload) {
    return {
      ota_booking_id: payload.booking_id || payload.bookingId,
      changes: {
        check_in_date: payload.new_checkin || payload.checkin,
        check_out_date: payload.new_checkout || payload.checkout,
        adults: payload.adults,
        children: payload.children,
        room_type: payload.room_type,
        special_requests: payload.special_requests,
      },
    };
  }
}

module.exports = MmtAdapter;
