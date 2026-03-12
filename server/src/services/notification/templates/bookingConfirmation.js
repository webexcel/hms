function bookingConfirmationTemplate(data) {
  return {
    subject: `Booking Confirmed - ${data.reservationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmation</h2>
        <p>Dear ${data.guestName},</p>
        <p>Your reservation has been confirmed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Reservation #</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.reservationNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-in</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.checkIn}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-out</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.checkOut}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Room</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.roomNumber || 'TBA'}</td></tr>
          <tr><td style="padding: 8px;"><strong>Total</strong></td><td style="padding: 8px;">INR ${data.totalAmount}</td></tr>
        </table>
        <p>Thank you for choosing Udhayam International.</p>
      </div>
    `,
  };
}

module.exports = bookingConfirmationTemplate;
