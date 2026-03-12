const { Op } = require('sequelize');
const { User } = require('../models');

const getAll = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['id', 'ASC']],
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { username, password, full_name, email, role } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ message: 'Username, password, and full name are required' });
    }

    const user = await User.create({
      username,
      password_hash: password,
      full_name,
      email: email || null,
      role: role || 'staff',
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { username, full_name, email, role, password } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (full_name) updates.full_name = full_name;
    if (email !== undefined) updates.email = email;
    if (role) updates.role = role;
    if (password) {
      const bcrypt = require('bcryptjs');
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    await user.update(updates);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const toggleActive = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ is_active: !user.is_active });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  create,
  update,
  toggleActive,
};
