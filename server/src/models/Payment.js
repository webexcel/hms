const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  billing_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'upi', 'bank_transfer', 'ota_collected'),
    allowNull: false,
  },
  transaction_ref: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  received_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ota_transaction_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  settlement_status: {
    type: DataTypes.ENUM('na', 'pending', 'settled', 'disputed'),
    defaultValue: 'na',
  },
  settlement_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'payments',
});

module.exports = Payment;
