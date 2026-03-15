const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  key_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    comment: 'SHA-256 hash of the API key',
  },
  key_prefix: {
    type: DataTypes.STRING(8),
    allowNull: false,
    comment: 'First 8 chars of key for identification',
  },
  channel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['booking.create', 'booking.modify', 'booking.cancel'],
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rate_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
    comment: 'Max requests per 15 minutes',
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  request_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'api_keys',
});

module.exports = ApiKey;
