const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();

  return transport.sendMail({
    from: process.env.SMTP_FROM || '"Hotel PMS" <noreply@hotel.com>',
    to,
    subject,
    html,
    text,
  });
}

module.exports = { sendEmail };
