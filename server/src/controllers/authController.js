const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtSecret, jwtRefreshSecret, jwtExpiresIn, jwtRefreshExpiresIn, saltRounds } = require('../config/auth');
const { getTenantModels } = require('../config/connectionManager');

function generateAccessToken(user, tenantDb, tenantSlug) {
  return jwt.sign(
    { id: user.id, role: user.role, tenant_db: tenantDb, tenant_slug: tenantSlug },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
}

function generateRefreshToken(user, tenantDb) {
  return jwt.sign(
    { id: user.id, tenant_db: tenantDb },
    jwtRefreshSecret,
    { expiresIn: jwtRefreshExpiresIn }
  );
}

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // req.db and req.tenant are set by resolveTenantFromBody middleware
    const { User, RefreshToken } = req.db;

    const user = await User.findOne({ where: { username } });
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tenantDb = req.tenant.db_name;
    const tenantSlug = req.tenant.slug;

    const accessToken = generateAccessToken(user, tenantDb, tenantSlug);
    const refreshToken = generateRefreshToken(user, tenantDb);

    // Clean up expired tokens for this user
    await RefreshToken.destroy({
      where: { user_id: user.id, expires_at: { [require('sequelize').Op.lt]: new Date() } },
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({ user_id: user.id, token: refreshToken, expires_at: expiresAt });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken, user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, jwtRefreshSecret);
    if (!decoded.tenant_db) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const models = getTenantModels(decoded.tenant_db);
    const { User, RefreshToken } = models;

    const stored = await RefreshToken.findOne({
      where: { token: refreshToken, user_id: decoded.id },
    });

    if (!stored || stored.expires_at < new Date()) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Rotate refresh token
    await stored.destroy();
    const newRefreshToken = generateRefreshToken(user, decoded.tenant_db);
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
    await RefreshToken.create({ user_id: user.id, token: newRefreshToken, expires_at: newExpiresAt });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // We need tenant_slug for access token - look it up from master
    const { getMasterTenant } = require('../config/connectionManager');
    const Tenant = getMasterTenant();
    const tenant = await Tenant.findOne({ where: { db_name: decoded.tenant_db } });
    const tenantSlug = tenant ? tenant.slug : '';

    const accessToken = generateAccessToken(user, decoded.tenant_db, tenantSlug);
    res.json({ accessToken, user: user.toJSON() });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, jwtRefreshSecret);
        if (decoded.tenant_db) {
          const models = getTenantModels(decoded.tenant_db);
          await models.RefreshToken.destroy({ where: { token: refreshToken } });
        }
      } catch (e) {
        // Token invalid/expired, just clear cookie
      }
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await req.db.User.findByPk(req.user.id);

    const valid = await user.validatePassword(currentPassword);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password_hash = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
