const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RatePlan = sequelize.define('RatePlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  room_type: {
    type: DataTypes.ENUM('standard', 'deluxe', 'suite', 'premium'),
    allowNull: false,
  },
  season: {
    type: DataTypes.ENUM('regular', 'peak', 'off_peak', 'festive'),
    defaultValue: 'regular',
  },
  base_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  weekend_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  meal_plan: {
    type: DataTypes.ENUM('ep', 'cp', 'map', 'ap'),
    defaultValue: 'ep',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  valid_from: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  valid_to: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  is_ota_visible: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this rate plan is pushed to OTAs',
  },
  cancellation_policy: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'rate_plans',
});

module.exports = RatePlan;
