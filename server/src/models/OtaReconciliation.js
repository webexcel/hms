const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OtaReconciliation = sequelize.define('OtaReconciliation', {
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
  period_start: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  period_end: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  total_bookings: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_revenue: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  total_commission: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  net_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  ota_payout_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    comment: 'Amount reported by OTA',
  },
  discrepancy_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'generated', 'matched', 'discrepancy', 'resolved'),
    defaultValue: 'draft',
  },
  cancellations: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  generated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'ota_reconciliations',
});

module.exports = OtaReconciliation;
