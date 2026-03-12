const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  old_values: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  new_values: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: 'user',
    comment: 'system, api, user, ota',
  },
  channel_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK to OtaChannel for OTA-originated actions',
  },
}, {
  tableName: 'audit_log',
  updatedAt: false,
});

module.exports = AuditLog;
