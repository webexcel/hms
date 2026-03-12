const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Billing = sequelize.define('Billing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  invoice_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  reservation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  guest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  cgst_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  sgst_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  igst_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  grand_total: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  payment_status: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid', 'refunded'),
    defaultValue: 'unpaid',
  },
  paid_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  balance_due: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'billings',
});

module.exports = Billing;
