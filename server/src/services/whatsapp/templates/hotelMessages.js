/**
 * Pre-built message templates for hotel operations.
 * These use plain text messages (no Meta template approval needed for testing).
 * For production, create matching templates in Meta Business Manager and use sendTemplateMessage().
 */

function bookingConfirmation({ guestName, reservationNumber, checkIn, checkOut, roomType, totalAmount, hotelPhone }) {
  return `🏨 *Booking Confirmed*

Dear ${guestName},

Your reservation at *Udhayam International* is confirmed!

📋 *Reservation:* ${reservationNumber}
📅 *Check-in:* ${checkIn}
📅 *Check-out:* ${checkOut}
🛏️ *Room Type:* ${roomType}
💰 *Total:* ₹${totalAmount}

⏰ Check-in time: 2:00 PM
⏰ Check-out time: 11:00 AM

For any queries, call: ${hotelPhone || 'Front Desk'}

Thank you for choosing Udhayam International! 🙏`;
}

function checkInReminder({ guestName, reservationNumber, checkIn, roomNumber }) {
  return `🔔 *Check-in Reminder*

Dear ${guestName},

Your check-in at *Udhayam International* is today!

📋 *Reservation:* ${reservationNumber}
📅 *Date:* ${checkIn}
${roomNumber ? `🚪 *Room:* ${roomNumber}` : ''}

⏰ Check-in time: 2:00 PM onwards

We look forward to welcoming you! 🙏`;
}

function checkOutReminder({ guestName, reservationNumber, checkOut, roomNumber }) {
  return `🔔 *Check-out Reminder*

Dear ${guestName},

This is a reminder that your check-out from *Udhayam International* is today.

📋 *Reservation:* ${reservationNumber}
🚪 *Room:* ${roomNumber || 'N/A'}
📅 *Date:* ${checkOut}
⏰ *Check-out by:* 11:00 AM

Please visit the front desk to settle your bill. Thank you for your stay! 🙏`;
}

function paymentReceipt({ guestName, invoiceNumber, amount, paymentMethod, balanceDue }) {
  return `💳 *Payment Received*

Dear ${guestName},

Payment received at *Udhayam International*.

🧾 *Invoice:* ${invoiceNumber}
💰 *Amount Paid:* ₹${amount}
💳 *Method:* ${paymentMethod}
${balanceDue > 0 ? `⚠️ *Balance Due:* ₹${balanceDue}` : '✅ *Fully Paid*'}

Thank you! 🙏`;
}

function cancellationNotice({ guestName, reservationNumber, checkIn, checkOut, reason }) {
  return `❌ *Booking Cancelled*

Dear ${guestName},

Your reservation at *Udhayam International* has been cancelled.

📋 *Reservation:* ${reservationNumber}
📅 *Was:* ${checkIn} to ${checkOut}
${reason ? `📝 *Reason:* ${reason}` : ''}

If this was a mistake, please contact us immediately.

Thank you. 🙏`;
}

function otaBookingStaffAlert({ reservationNumber, guestName, channelName, checkIn, checkOut, roomNumber, totalAmount }) {
  return `🔔 *New OTA Booking*

A booking was received from *${channelName}*

📋 *Reservation:* ${reservationNumber}
👤 *Guest:* ${guestName}
📅 *Check-in:* ${checkIn}
📅 *Check-out:* ${checkOut}
🚪 *Room:* ${roomNumber}
💰 *Amount:* ₹${totalAmount}

Booking auto-confirmed in PMS.`;
}

function thankYouAfterCheckout({ guestName, reservationNumber }) {
  return `🙏 *Thank You for Staying with Us!*

Dear ${guestName},

We hope you enjoyed your stay at *Udhayam International*.

📋 *Reservation:* ${reservationNumber}

We'd love to have you back! For future bookings, contact us directly for the best rates.

⭐ If you had a great experience, please leave us a review on Google.

Warm regards,
*Udhayam International* 🏨`;
}

function housekeepingAlert({ roomNumber, taskType, priority, notes }) {
  return `🧹 *Housekeeping Task*

🚪 *Room:* ${roomNumber}
📋 *Task:* ${taskType}
⚡ *Priority:* ${priority}
${notes ? `📝 *Notes:* ${notes}` : ''}

Please attend to this at the earliest.`;
}

function shiftHandoverReport({
  outgoingStaffName, incomingStaffName, shiftDate, shift,
  cashInHand, totalCollections, pendingCheckouts, pendingCheckins,
  occupiedRooms, totalRooms, outstandingBills, outstandingAmount,
  tasksPending, notes,
}) {
  const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const shiftLabel = shift ? shift.charAt(0).toUpperCase() + shift.slice(1) : 'N/A';

  let msg = `📋 *Shift Handover Report*
━━━━━━━━━━━━━━━━━━━

👤 *Outgoing:* ${outgoingStaffName}
👤 *Incoming:* ${incomingStaffName || 'Awaiting acceptance'}
📅 *Date:* ${shiftDate}
⏰ *Shift:* ${shiftLabel}

💰 *Financial Summary*
├ Cash in Hand: ₹${cashInHand || 0}
├ Total Collections: ₹${totalCollections || 0}
├ Outstanding Bills: ${outstandingBills || 0} (₹${outstandingAmount || 0})

🏨 *Occupancy*
├ Occupied: ${occupiedRooms}/${totalRooms} rooms (${occupancyPct}%)
├ Pending Check-ins: ${pendingCheckins || 0}
├ Pending Check-outs: ${pendingCheckouts || 0}`;

  if (tasksPending && tasksPending.length > 0) {
    msg += `\n\n📝 *Pending Tasks (${tasksPending.length})*`;
    tasksPending.slice(0, 5).forEach((task, i) => {
      const label = typeof task === 'string' ? task : (task.description || task.title || JSON.stringify(task));
      msg += `\n${i + 1}. ${label}`;
    });
    if (tasksPending.length > 5) {
      msg += `\n   ...and ${tasksPending.length - 5} more`;
    }
  }

  if (notes) {
    msg += `\n\n🗒️ *Notes:* ${notes}`;
  }

  msg += `\n\n━━━━━━━━━━━━━━━━━━━
_Udhayam International PMS_`;

  return msg;
}

module.exports = {
  bookingConfirmation,
  checkInReminder,
  checkOutReminder,
  paymentReceipt,
  cancellationNotice,
  otaBookingStaffAlert,
  thankYouAfterCheckout,
  housekeepingAlert,
  shiftHandoverReport,
};
