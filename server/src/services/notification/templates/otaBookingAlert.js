function otaBookingAlertTemplate(data) {
  return {
    subject: `New OTA Booking - ${data.reservationNumber} via ${data.channelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New OTA Booking Alert</h2>
        <p>A new booking has been received from <strong>${data.channelName}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Reservation #</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.reservationNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Guest</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.guestName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-in</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.checkIn}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-out</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.checkOut}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Room</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.roomNumber}</td></tr>
          <tr><td style="padding: 8px;"><strong>Amount</strong></td><td style="padding: 8px;">INR ${data.totalAmount}</td></tr>
        </table>
        <p>This booking has been automatically confirmed in the PMS.</p>
      </div>
    `,
  };
}

module.exports = otaBookingAlertTemplate;
