const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StaffSchedule = sequelize.define('StaffSchedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  staff_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  shift: {
    type: DataTypes.ENUM('morning', 'afternoon', 'night'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'present', 'absent', 'leave'),
    defaultValue: 'scheduled',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'staff_schedules',
});

module.exports = StaffSchedule;
