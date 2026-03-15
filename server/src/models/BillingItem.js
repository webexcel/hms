const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BillingItem = sequelize.define('BillingItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  billing_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  item_type: {
    type: DataTypes.ENUM('room_charge', 'restaurant', 'laundry', 'minibar', 'service', 'tax', 'discount'),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1,
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  hsn_code: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  gst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'billing_items',
});

module.exports = BillingItem;
