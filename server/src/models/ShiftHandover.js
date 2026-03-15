const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShiftHandover = sequelize.define('ShiftHandover', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  outgoing_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  incoming_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  shift_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  shift: {
    type: DataTypes.ENUM('morning', 'afternoon', 'night'),
    allowNull: false,
  },
  cash_in_hand: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  total_collections: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
  },
  pending_checkouts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tasks_pending: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'shift_handovers',
});

module.exports = ShiftHandover;
