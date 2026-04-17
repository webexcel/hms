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
  indexes: [
    { unique: true, fields: ['key_hash'], name: 'api_keys_key_hash_unique' },
  ],
});

module.exports = ApiKey;
