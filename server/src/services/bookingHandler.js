const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { getAdapter } = require('./channelManager');
const inventorySync = require('./inventorySync');
const { logAudit } = require('../utils/auditLogger');
const waNotifier = require('./whatsapp/hotelNotifier');

/**
 * Process an inbound OTA booking from a webhook event.
 * @param {Object} db - Tenant models object
 * @param {Object} webhookEvent - The WebhookEvent instance
 */
async function processOtaBooking(db, webhookEvent) {
  const { sequelize, Reservation, Guest, Room, Payment, Billing, OtaChannel, AuditLog } = db;

  const channel = await OtaChannel.findByPk(webhookEvent.channel_id);
  if (!channel) throw new Error(`Channel ${webhookEvent.channel_id} not found`);

  const adapter = getAdapter(channel.code);
  const booking = adapter.parseBookingPayload(webhookEvent.payload);

  // Idempotency: check if reservation already exists for this OTA booking
  const existing = await Reservation.findOne({
    where: { ota_booking_id: booking.ota_booking_id, channel_id: channel.id },
  });
  if (existing) {
    await webhookEvent.update({ status: 'duplicate', reservation_id: existing.id });
    return { reservationId: existing.id, duplicate: true };
  }

  const transaction = await sequelize.transaction();

  try {
    // 1. Find or create guest
    let guest;
    if (booking.guest.phone) {
      [guest] = await Guest.findOrCreate({
        where: { phone: booking.guest.phone },
        defaults: {
          first_name: booking.guest.first_name,
          last_name: booking.guest.last_name,
          email: booking.guest.email,
          phone: booking.guest.phone,
        },
        transaction,
      });
    } else if (booking.guest.email) {
      [guest] = await Guest.findOrCreate({
        where: { email: booking.guest.email },
        defaults: {
          first_name: booking.guest.first_name,
          last_name: booking.guest.last_name,
          email: booking.guest.email,
          phone: booking.guest.phone || '',
        },
        transaction,
      });
    } else {
      guest = await Guest.create({
        first_name: booking.guest.first_name,
        last_name: booking.guest.last_name,
        email: booking.guest.email,
        phone: booking.guest.phone || '',
      }, { transaction });
    }

    // 2. Find available room of the requested type
    const checkIn = dayjs(booking.check_in_date).startOf('day').toDate();
    const checkOut = dayjs(booking.check_out_date).startOf('day').toDate();

    const bookedRoomIds = (await Reservation.findAll({
      where: {
        status: { [Op.notIn]: ['cancelled', 'checked_out', 'no_show'] },
        [Op.and]: [
          { check_in_date: { [Op.lt]: checkOut } },
          { check_out_date: { [Op.gt]: checkIn } },
        ],
      },
      attributes: ['room_id'],
      raw: true,
      transaction,
    })).map((r) => r.room_id);

    const roomWhere = {
      room_type: booking.room_type,
      ...(bookedRoomIds.length > 0 ? { id: { [Op.notIn]: bookedRoomIds } } : {}),
    };

    const room = await Room.findOne({
      where: roomWhere,
      order: [['room_number', 'ASC']],
      transaction,
    });

    if (!room) {
      throw new Error(`No available ${booking.room_type} room for ${booking.check_in_date} to ${booking.check_out_date}`);
    }

    // 3. Calculate commission
    const nights = dayjs(booking.check_out_date).diff(dayjs(booking.check_in_date), 'day');
    const totalAmount = booking.total_amount || (booking.rate_per_night * nights);
    const commissionAmount = parseFloat(
      (totalAmount * (parseFloat(channel.commission_percentage) / 100)).toFixed(2)
    );

    // 4. Create reservation
    const reservation = await Reservation.create({
      reservation_number: `RES-${Date.now()}`,
      guest_id: guest.id,
      room_id: room.id,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      adults: booking.adults,
      children: booking.children,
      rate_per_night: booking.rate_per_night,
      total_amount: totalAmount,
      nights,
      source: channel.code,
      special_requests: booking.special_requests,
      status: 'confirmed',
      ota_booking_id: booking.ota_booking_id,
      channel_id: channel.id,
      ota_commission: commissionAmount,
      cancellation_policy: booking.cancellation_policy,
    }, { transaction });

    // 5. Create billing record
    const billing = await Billing.create({
      reservation_id: reservation.id,
      guest_id: guest.id,
      invoice_number: `INV-${Date.now()}`,
      payment_status: booking.payment_mode === 'prepaid' ? 'paid' : 'unpaid',
    }, { transaction });

    // 6. Create payment if prepaid
    if (booking.payment_mode === 'prepaid') {
      await Payment.create({
        billing_id: billing.id,
        amount: totalAmount,
        payment_method: 'ota_collected',
        payment_date: new Date(),
        ota_transaction_id: booking.ota_booking_id,
        settlement_status: 'pending',
        notes: `Prepaid via ${channel.name}`,
      }, { transaction });
    }

    await transaction.commit();

    // 7. Post-commit: inventory sync, OTA confirmation, notifications, audit
    await inventorySync.handleInventoryChange(db, reservation.id);

    // Confirm to OTA (fire-and-forget)
    adapter.confirmBooking(channel, {
      ota_booking_id: booking.ota_booking_id,
      pms_reservation_number: reservation.reservation_number,
    }).catch((err) => console.error('OTA booking confirmation failed:', err.message));

    // WhatsApp: alert staff + confirm to guest
    waNotifier.notifyStaffOtaBooking({
      reservationNumber: reservation.reservation_number,
      guestName: `${guest.first_name} ${guest.last_name}`,
      channelName: channel.name,
      checkIn: booking.check_in_date,
      checkOut: booking.check_out_date,
      roomNumber: room.room_number,
      totalAmount: totalAmount,
    }).catch(() => {});

    if (guest.phone) {
      waNotifier.notifyBookingConfirmation({
        guestName: `${guest.first_name} ${guest.last_name}`,
        guestPhone: guest.phone,
        reservationNumber: reservation.reservation_number,
        checkIn: booking.check_in_date,
        checkOut: booking.check_out_date,
        roomType: booking.room_type,
        totalAmount: totalAmount,
      }).catch(() => {});
    }

    // Queue notification
    try {
      const { bookingNotificationQueue } = require('./queue');
      await bookingNotificationQueue.add({
        type: 'ota_booking_alert',
        reservationId: reservation.id,
        data: {
          reservationNumber: reservation.reservation_number,
          guestName: `${guest.first_name} ${guest.last_name}`,
          channelName: channel.name,
          checkIn: booking.check_in_date,
          checkOut: booking.check_out_date,
          roomNumber: room.room_number,
          totalAmount: totalAmount,
        },
      });
    } catch (e) {
      console.warn('Failed to queue booking notification:', e.message);
    }

    // Audit
    await logAudit(AuditLog, {
      action: 'create',
      entity_type: 'Reservation',
      entity_id: reservation.id,
      source: 'ota',
      channel_id: channel.id,
      new_values: {
        reservation_number: reservation.reservation_number,
        ota_booking_id: booking.ota_booking_id,
        channel: channel.code,
      },
    });

    return { reservationId: reservation.id, duplicate: false };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Process an OTA booking modification.
 * @param {Object} db - Tenant models object
 */
async function processOtaModification(db, webhookEvent) {
  const { Reservation, OtaChannel, AuditLog } = db;

  const channel = await OtaChannel.findByPk(webhookEvent.channel_id);
  if (!channel) throw new Error(`Channel ${webhookEvent.channel_id} not found`);

  const adapter = getAdapter(channel.code);
  const modification = adapter.parseModificationPayload(webhookEvent.payload);

  const reservation = await Reservation.findOne({
    where: { ota_booking_id: modification.ota_booking_id, channel_id: channel.id },
  });

  if (!reservation) {
    throw new Error(`Reservation not found for OTA booking ${modification.ota_booking_id}`);
  }

  const oldValues = reservation.toJSON();
  const updates = {};

  if (modification.changes.check_in_date) updates.check_in_date = modification.changes.check_in_date;
  if (modification.changes.check_out_date) updates.check_out_date = modification.changes.check_out_date;
  if (modification.changes.adults) updates.adults = modification.changes.adults;
  if (modification.changes.children) updates.children = modification.changes.children;
  if (modification.changes.special_requests) updates.special_requests = modification.changes.special_requests;

  // Recalculate nights and total if dates changed
  if (updates.check_in_date || updates.check_out_date) {
    const checkIn = dayjs(updates.check_in_date || reservation.check_in_date);
    const checkOut = dayjs(updates.check_out_date || reservation.check_out_date);
    updates.nights = checkOut.diff(checkIn, 'day');
    updates.total_amount = updates.nights * parseFloat(reservation.rate_per_night);
    updates.ota_commission = parseFloat(
      (updates.total_amount * (parseFloat(channel.commission_percentage) / 100)).toFixed(2)
    );
  }

  await reservation.update(updates);
  await inventorySync.handleInventoryChange(db, reservation.id);

  await logAudit(AuditLog, {
    action: 'update',
    entity_type: 'Reservation',
    entity_id: reservation.id,
    source: 'ota',
    channel_id: channel.id,
    old_values: oldValues,
    new_values: updates,
  });

  return { reservationId: reservation.id };
}

/**
 * Process an OTA booking cancellation.
 * @param {Object} db - Tenant models object
 */
async function processOtaCancellation(db, webhookEvent) {
  const { Reservation, Room, OtaChannel, AuditLog } = db;

  const channel = await OtaChannel.findByPk(webhookEvent.channel_id);
  if (!channel) throw new Error(`Channel ${webhookEvent.channel_id} not found`);

  const adapter = getAdapter(channel.code);
  const cancellation = adapter.parseCancellationPayload(webhookEvent.payload);

  const reservation = await Reservation.findOne({
    where: { ota_booking_id: cancellation.ota_booking_id, channel_id: channel.id },
    include: [{ model: Room, as: 'room' }],
  });

  if (!reservation) {
    throw new Error(`Reservation not found for OTA booking ${cancellation.ota_booking_id}`);
  }

  if (['checked_in', 'checked_out', 'cancelled'].includes(reservation.status)) {
    throw new Error(`Cannot cancel reservation in status: ${reservation.status}`);
  }

  await reservation.update({ status: 'cancelled' });

  if (reservation.room) {
    await reservation.room.update({ status: 'available' });
  }

  await inventorySync.handleInventoryChange(db, reservation.id);

  // Queue cancellation notification
  try {
    const { bookingNotificationQueue } = require('./queue');
    await bookingNotificationQueue.add({
      type: 'cancellation_notice',
      reservationId: reservation.id,
      data: {
        reservationNumber: reservation.reservation_number,
        channelName: channel.name,
        reason: cancellation.reason,
      },
    });
  } catch (e) {
    console.warn('Failed to queue cancellation notification:', e.message);
  }

  await logAudit(AuditLog, {
    action: 'cancel',
    entity_type: 'Reservation',
    entity_id: reservation.id,
    source: 'ota',
    channel_id: channel.id,
    new_values: { reason: cancellation.reason },
  });

  return { reservationId: reservation.id };
}

module.exports = {
  processOtaBooking,
  processOtaModification,
  processOtaCancellation,
};
