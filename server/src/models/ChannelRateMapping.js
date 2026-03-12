const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChannelRateMapping = sequelize.define('ChannelRateMapping', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  channel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rate_plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ota_room_code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Room type code on the OTA',
  },
  ota_rate_code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Rate plan code on the OTA',
  },
  markup_type: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    defaultValue: 'percentage',
  },
  markup_value: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'channel_rate_mappings',
  indexes: [
    {
      unique: true,
      fields: ['channel_id', 'rate_plan_id'],
    },
  ],
});

module.exports = ChannelRateMapping;
