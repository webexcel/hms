const { Op } = require('sequelize');
const { HotelSetting } = require('../models');

const getAll = async (req, res, next) => {
  try {
    const settings = await HotelSetting.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']],
    });

    const grouped = settings.reduce((acc, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ message: 'settings must be an array of {key, value}' });
    }

    const updatePromises = settings.map(async ({ key, value, category }) => {
      const existing = await HotelSetting.findOne({ where: { key } });
      if (existing) {
        return existing.update({ value, category: category || existing.category });
      }
      return HotelSetting.create({ key, value, category: category || 'general' });
    });

    await Promise.all(updatePromises);

    const updatedSettings = await HotelSetting.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']],
    });

    const grouped = updatedSettings.reduce((acc, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  update,
};
