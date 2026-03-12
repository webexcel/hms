const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Staff = sequelize.define('Staff', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  employee_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  department: {
    type: DataTypes.ENUM('front_office', 'housekeeping', 'restaurant', 'maintenance', 'management', 'security', 'accounts'),
    allowNull: false,
  },
  designation: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  date_of_joining: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  shift: {
    type: DataTypes.ENUM('morning', 'afternoon', 'night'),
    defaultValue: 'morning',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'on_leave'),
    defaultValue: 'active',
  },
}, {
  tableName: 'staff',
});

module.exports = Staff;
