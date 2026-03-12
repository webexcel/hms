function cancellationNoticeTemplate(data) {
  return {
    subject: `Booking Cancelled - ${data.reservationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Cancellation</h2>
        <p>Reservation <strong>${data.reservationNumber}</strong> has been cancelled.</p>
        ${data.channelName ? `<p>Source: ${data.channelName}</p>` : ''}
        ${data.reason ? `<p>Reason: ${data.reason}</p>` : ''}
        <p>Please review and take necessary action.</p>
      </div>
    `,
  };
}

module.exports = cancellationNoticeTemplate;
