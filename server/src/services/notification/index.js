const { sendEmail } = require('./emailService');
const bookingConfirmationTemplate = require('./templates/bookingConfirmation');
const cancellationNoticeTemplate = require('./templates/cancellationNotice');
const otaBookingAlertTemplate = require('./templates/otaBookingAlert');

const HOTEL_EMAIL = process.env.SMTP_FROM || 'frontdesk@hotel.com';

async function sendBookingConfirmation(data) {
  if (!data.guestEmail) return;

  const template = bookingConfirmationTemplate(data);
  await sendEmail({
    to: data.guestEmail,
    subject: template.subject,
    html: template.html,
  });
}

async function sendCancellationNotice(data) {
  const template = cancellationNoticeTemplate(data);
  await sendEmail({
    to: HOTEL_EMAIL,
    subject: template.subject,
    html: template.html,
  });
}

async function sendOtaBookingAlert(data) {
  const template = otaBookingAlertTemplate(data);
  await sendEmail({
    to: HOTEL_EMAIL,
    subject: template.subject,
    html: template.html,
  });
}

async function sendAlert({ subject, message }) {
  await sendEmail({
    to: HOTEL_EMAIL,
    subject: `[ALERT] ${subject}`,
    html: `<div style="font-family: Arial, sans-serif;"><h3 style="color: #dc2626;">${subject}</h3><p>${message}</p></div>`,
  });
}

module.exports = {
  sendBookingConfirmation,
  sendCancellationNotice,
  sendOtaBookingAlert,
  sendAlert,
};
