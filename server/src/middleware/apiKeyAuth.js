const { ApiKey, OtaChannel } = require('../models');
const { hashApiKey } = require('../utils/encryption');

/**
 * API Key authentication middleware for OTA webhook endpoints.
 * Reads X-API-Key header, validates against ApiKey table.
 */
async function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required. Provide X-API-Key header.' });
    }

    const keyHash = hashApiKey(apiKey);
    const keyRecord = await ApiKey.findOne({
      where: { key_hash: keyHash },
      include: [{ model: OtaChannel, as: 'channel' }],
    });

    if (!keyRecord) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (!keyRecord.is_active) {
      return res.status(403).json({ error: 'API key is deactivated' });
    }

    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return res.status(403).json({ error: 'API key has expired' });
    }

    if (!keyRecord.channel || !keyRecord.channel.is_active) {
      return res.status(403).json({ error: 'Channel is not active' });
    }

    // Update usage tracking (fire-and-forget)
    keyRecord.update({
      last_used_at: new Date(),
      request_count: keyRecord.request_count + 1,
    }).catch(() => {});

    // Attach to request
    req.apiKey = keyRecord;
    req.channel = keyRecord.channel;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if the API key has the required permission.
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({ error: 'API key not authenticated' });
    }

    const permissions = req.apiKey.permissions || [];
    if (!permissions.includes(permission) && !permissions.includes('*')) {
      return res.status(403).json({ error: `Permission '${permission}' required` });
    }

    next();
  };
}

module.exports = { apiKeyAuth, requirePermission };
