const { getTenantModels } = require('../config/connectionManager');

/**
 * Middleware for public (unauthenticated) routes.
 * Resolves tenant database from PUBLIC_TENANT_DB env var and attaches models to req.db.
 */
const publicTenant = (req, res, next) => {
  const dbName = process.env.PUBLIC_TENANT_DB;
  if (!dbName) {
    return res.status(500).json({ message: 'Public tenant not configured' });
  }
  try {
    req.db = getTenantModels(dbName);
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Failed to resolve tenant database' });
  }
};

module.exports = publicTenant;
