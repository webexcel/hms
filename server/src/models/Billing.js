const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Billing = sequelize.define('Billing', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  invoice_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
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
  gst_bill_number: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'billings',
  indexes: [
    { unique: true, fields: ['tenant_id', 'invoice_number'] },
  ],
});

module.exports = Billing;
