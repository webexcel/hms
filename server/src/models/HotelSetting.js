const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HotelSetting = sequelize.define('HotelSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  key: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'general',
  },
}, {
  tableName: 'hotel_settings',
  indexes: [
    { unique: true, fields: ['tenant_id', 'key'] },
  ],
});

module.exports = HotelSetting;
