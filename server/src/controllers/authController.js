const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, RefreshToken } = require('../models');
const { jwtSecret, jwtRefreshSecret, jwtExpiresIn, jwtRefreshExpiresIn, saltRounds } = require('../config/auth');

function generateAccessToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: jwtExpiresIn });
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id }, jwtRefreshSecret, { expiresIn: jwtRefreshExpiresIn });
}

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

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
    const newRefreshToken = generateRefreshToken(user);
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
    await RefreshToken.create({ user_id: user.id, token: newRefreshToken, expires_at: newExpiresAt });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const accessToken = generateAccessToken(user);
    res.json({ accessToken, user: user.toJSON() });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await RefreshToken.destroy({ where: { token: refreshToken } });
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
    const user = await User.findByPk(req.user.id);

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
