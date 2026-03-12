const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WebhookEvent = sequelize.define('WebhookEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  channel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  event_id: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'OTA-provided event/transaction ID for idempotency',
  },
  event_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'booking, modification, cancellation',
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('received', 'processing', 'processed', 'failed', 'duplicate'),
    defaultValue: 'received',
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  reservation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Linked reservation after processing',
  },
}, {
  tableName: 'webhook_events',
  indexes: [
    {
      unique: true,
      fields: ['channel_id', 'event_id'],
    },
  ],
});

module.exports = WebhookEvent;
