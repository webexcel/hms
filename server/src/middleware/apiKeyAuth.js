const { getMasterTenant, getTenantModels } = require('../config/connectionManager');
const { hashApiKey } = require('../utils/encryption');

/**
 * Resolve tenant from webhook URL parameter or X-Tenant-Slug header.
 * Must run before apiKeyAuth.
 */
async function resolveWebhookTenant(req, res, next) {
  try {
    const slug = req.params.tenantSlug || req.headers['x-tenant-slug'];
    if (!slug) {
      return res.status(400).json({ error: 'Tenant identifier required' });
    }

    const Tenant = getMasterTenant();
    const tenant = await Tenant.findOne({ where: { slug, is_active: true } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    req.db = getTenantModels(tenant.db_name);
    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * API Key authentication middleware for OTA webhook endpoints.
 * Reads X-API-Key header, validates against ApiKey table.
 * Requires req.db to be set (by resolveWebhookTenant).
 */
async function apiKeyAuth(req, res, next) {
  try {
    const { ApiKey, OtaChannel } = req.db;
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

module.exports = { apiKeyAuth, requirePermission, resolveWebhookTenant };
