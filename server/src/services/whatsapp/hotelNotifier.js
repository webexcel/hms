const whatsapp = require('./index');
const templates = require('./templates/hotelMessages');
const logger = require('../../utils/logger');

const HOTEL_PHONE = process.env.HOTEL_WHATSAPP_NUMBER || '';

/**
 * Send booking confirmation to guest via WhatsApp.
 */
async function notifyBookingConfirmation({ guestName, guestPhone, reservationNumber, checkIn, checkOut, roomType, totalAmount }) {
  if (!guestPhone) return;
  try {
    const msg = templates.bookingConfirmation({
      guestName, reservationNumber, checkIn, checkOut, roomType,
      totalAmount, hotelPhone: HOTEL_PHONE,
    });
    await whatsapp.sendTextMessage(guestPhone, msg);
  } catch (err) {
    logger.error('WhatsApp booking confirmation failed:', err.message);
  }
}

/**
 * Send check-in reminder to guest (call this morning of check-in).
 */
async function notifyCheckInReminder({ guestName, guestPhone, reservationNumber, checkIn, roomNumber }) {
  if (!guestPhone) return;
  try {
    const msg = templates.checkInReminder({ guestName, reservationNumber, checkIn, roomNumber });
    await whatsapp.sendTextMessage(guestPhone, msg);
  } catch (err) {
    logger.error('WhatsApp check-in reminder failed:', err.message);
  }
}

/**
 * Send check-out reminder to guest (call morning of check-out).
 */
async function notifyCheckOutReminder({ guestName, guestPhone, reservationNumber, checkOut, roomNumber }) {
  if (!guestPhone) return;
  try {
    const msg = templates.checkOutReminder({ guestName, reservationNumber, checkOut, roomNumber });
    await whatsapp.sendTextMessage(guestPhone, msg);
  } catch (err) {
    logger.error('WhatsApp check-out reminder failed:', err.message);
  }
}

/**
 * Send payment receipt to guest.
 */
async function notifyPaymentReceipt({ guestName, guestPhone, invoiceNumber, amount, paymentMethod, balanceDue }) {
  if (!guestPhone) return;
  try {
    const msg = templates.paymentReceipt({ guestName, invoiceNumber, amount, paymentMethod, balanceDue });
    await whatsapp.sendTextMessage(guestPhone, msg);
  } catch (err) {
    logger.error('WhatsApp payment receipt failed:', err.message);
  }
}

/**
 * Send cancellation notice to guest.
 */
async function notifyCancellation({ guestName, guestPhone, reservationNumber, checkIn, checkOut, reason }) {
  if (!guestPhone) return;
  try {
    const msg = templates.cancellationNotice({ guestName, reservationNumber, checkIn, checkOut, reason });
    await whatsapp.sendTextMessage(guestPhone, msg);
  } catch (err) {
    logger.error('WhatsApp cancellation notice failed:', err.message);
  }
}

/**
 * Alert hotel staff about a new OTA booking.
 */
async function notifyStaffOtaBooking({ reservationNumber, guestName, channelName, checkIn, checkOut, roomNumber, totalAmount }) {
  if (!HOTEL_PHONE) return;
  try {
    const msg = templates.otaBookingStaffAlert({
      reservationNumber, guestName, channelName, checkIn, checkOut, roomNumber, totalAmount,
    });
    await whatsapp.sendTextMessage(HOTEL_PHONE, msg);
  } catch (err) {
    logger.error('WhatsApp staff OTA alert failed:', err.message);
  }
}

/**
 * Send thank-you message after checkout.
 */
async function notifyThankYou({ guestName, guestPhone, reservationNumber }) {
  if (!guestPhone) return;
  try {
    const msg = templates.thankYouAfterCheckout({ guestName, reservationNumber });
    await whatsapp.sendTextMessage(guestPhone, msg);
  } catch (err) {
    logger.error('WhatsApp thank-you failed:', err.message);
  }
}

/**
 * Alert housekeeping staff.
 */
async function notifyHousekeeping({ staffPhone, roomNumber, taskType, priority, notes }) {
  if (!staffPhone) return;
  try {
    const msg = templates.housekeepingAlert({ roomNumber, taskType, priority, notes });
    await whatsapp.sendTextMessage(staffPhone, msg);
  } catch (err) {
    logger.error('WhatsApp housekeeping alert failed:', err.message);
  }
}

/**
 * Send shift handover report to management WhatsApp.
 */
async function notifyShiftHandover({
  managementPhones, outgoingStaffName, incomingStaffName, shiftDate, shift,
  cashInHand, totalCollections, pendingCheckouts, pendingCheckins,
  occupiedRooms, totalRooms, outstandingBills, outstandingAmount,
  tasksPending, notes,
}) {
  const phones = managementPhones || (HOTEL_PHONE ? [HOTEL_PHONE] : []);
  if (phones.length === 0) return;
  try {
    const msg = templates.shiftHandoverReport({
      outgoingStaffName, incomingStaffName, shiftDate, shift,
      cashInHand, totalCollections, pendingCheckouts, pendingCheckins,
      occupiedRooms, totalRooms, outstandingBills, outstandingAmount,
      tasksPending, notes,
    });
    for (const phone of phones) {
      await whatsapp.sendTextMessage(phone, msg);
    }
  } catch (err) {
    logger.error('WhatsApp shift handover report failed:', err.message);
  }
}

module.exports = {
  notifyBookingConfirmation,
  notifyCheckInReminder,
  notifyCheckOutReminder,
  notifyPaymentReceipt,
  notifyCancellation,
  notifyStaffOtaBooking,
  notifyThankYou,
  notifyHousekeeping,
  notifyShiftHandover,
};
