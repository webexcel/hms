const clsNamespace = require('../config/cls');

// For authenticated routes: reads tenant_id from JWT (set by auth middleware)
function attachTenantFromJWT(req, res, next) {
  const tenantId = req.user?.tenant_id;
  if (tenantId) {
    clsNamespace.set('tenantId', tenantId);
    req.tenantId = tenantId;
  }
  next();
}

// For login: reads tenant slug from request body
async function resolveTenantFromBody(req, res, next) {
  const { Tenant } = require('../models');
  const { tenant } = req.body;
  if (!tenant) {
    return res.status(400).json({ error: 'Please select a hotel' });
  }
  try {
    const t = await Tenant.findOne({ where: { slug: tenant, is_active: true } });
    if (!t) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    clsNamespace.set('tenantId', t.id);
    req.tenantId = t.id;
    req.tenant = t;
    next();
  } catch (err) {
    next(err);
  }
}

// Set CLS tenant context (used by auth middleware after JWT decode)
function setTenantContext(tenantId) {
  clsNamespace.set('tenantId', tenantId);
}

module.exports = { attachTenantFromJWT, resolveTenantFromBody, setTenantContext };
