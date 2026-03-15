const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const { User } = require('../models');
const { setTenantContext } = require('./tenant');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);

    // Set tenant context from JWT before any DB queries
    if (decoded.tenant_id) {
      setTenantContext(decoded.tenant_id);
      req.tenantId = decoded.tenant_id;
    }

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'email', 'full_name', 'role', 'is_active', 'tenant_id'],
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

const { authorize } = require('./rbac');

module.exports = { authenticate, authorize };
