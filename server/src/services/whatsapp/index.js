const axios = require('axios');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';

function isEnabled() {
  return !!(process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}

function getConfig() {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ID || '',
  };
}

/**
 * Send a WhatsApp text message.
 */
async function sendTextMessage(to, text) {
  if (!isEnabled()) {
    console.warn('WhatsApp not configured, skipping message to', to);
    return null;
  }

  const phone = formatPhone(to);
  const config = getConfig();

  try {
    const { data } = await axios.post(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`WhatsApp message sent to ${phone}, id: ${data.messages?.[0]?.id}`);
    return data;
  } catch (err) {
    console.error('WhatsApp send failed:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Send a WhatsApp template message (pre-approved by Meta).
 */
async function sendTemplateMessage(to, templateName, languageCode, components = []) {
  if (!isEnabled()) {
    console.warn('WhatsApp not configured, skipping template to', to);
    return null;
  }

  const phone = formatPhone(to);
  const config = getConfig();

  try {
    const { data } = await axios.post(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode || 'en' },
          components,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`WhatsApp template '${templateName}' sent to ${phone}`);
    return data;
  } catch (err) {
    console.error('WhatsApp template send failed:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Send a document (PDF invoice etc.) via WhatsApp.
 */
async function sendDocument(to, documentUrl, filename, caption) {
  if (!isEnabled()) return null;

  const phone = formatPhone(to);
  const config = getConfig();

  try {
    const { data } = await axios.post(
      `${WHATSAPP_API_URL}/${config.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'document',
        document: {
          link: documentUrl,
          filename: filename || 'document.pdf',
          caption: caption || '',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`WhatsApp document sent to ${phone}`);
    return data;
  } catch (err) {
    console.error('WhatsApp document send failed:', err.response?.data || err.message);
    throw err;
  }
}

/**
 * Format phone number to international format (India default).
 * Accepts: 9876543210, +919876543210, 919876543210
 */
function formatPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/[\s\-\(\)]/g, '');
  // Remove leading +
  if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);
  // Add country code if missing (India = 91)
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

module.exports = {
  isEnabled,
  sendTextMessage,
  sendTemplateMessage,
  sendDocument,
  formatPhone,
};
