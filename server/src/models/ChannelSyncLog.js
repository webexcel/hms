const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChannelSyncLog = sequelize.define('ChannelSyncLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  channel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  direction: {
    type: DataTypes.ENUM('inbound', 'outbound'),
    allowNull: false,
  },
  operation: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'e.g. push_availability, push_rates, booking_create',
  },
  endpoint: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  request_payload: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  response_payload: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'timeout', 'pending'),
    defaultValue: 'pending',
  },
  status_code: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  duration_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  correlation_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'channel_sync_logs',
  updatedAt: false,
});

module.exports = ChannelSyncLog;
