const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RestaurantOrder = sequelize.define('RestaurantOrder', {
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
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  guest_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  order_type: {
    type: DataTypes.ENUM('dine_in', 'room_service', 'takeaway'),
    defaultValue: 'dine_in',
  },
  status: {
    type: DataTypes.ENUM('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'),
    defaultValue: 'pending',
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
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'restaurant_orders',
  indexes: [
    { unique: true, fields: ['tenant_id', 'order_number'] },
  ],
});

module.exports = RestaurantOrder;
