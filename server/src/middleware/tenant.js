const { getMasterTenant, getTenantModels } = require('../config/connectionManager');

/**
 * For login route: reads `tenant` slug from req.body, looks up in master DB,
 * sets req.tenant and req.db (tenant-scoped models).
 */
async function resolveTenantFromBody(req, res, next) {
  const { tenant } = req.body;
  if (!tenant) {
    return res.status(400).json({ error: 'Please select a hotel' });
  }
  try {
    const Tenant = getMasterTenant();
    const t = await Tenant.findOne({ where: { slug: tenant, is_active: true } });
    if (!t) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    req.tenant = t;
    req.db = getTenantModels(t.db_name);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * For authenticated routes: req.db is already set by auth middleware.
 * This is kept as a no-op for backward compatibility if referenced anywhere.
 */
function attachTenantFromToken(req, res, next) {
  next();
}

module.exports = { resolveTenantFromBody, attachTenantFromToken };
