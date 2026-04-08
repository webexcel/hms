const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LaundryOrder = sequelize.define('LaundryOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  order_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  reservation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  guest_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'collected', 'washing', 'ironing', 'ready', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  service_type: {
    type: DataTypes.ENUM('regular', 'express', 'dry_clean'),
    defaultValue: 'regular',
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  posted_to_room: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  collected_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  expected_delivery: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'laundry_orders',
  indexes: [
    { unique: true, fields: ['tenant_id', 'order_number'] },
  ],
});

module.exports = LaundryOrder;
