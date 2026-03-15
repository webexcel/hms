const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HousekeepingTask = sequelize.define('HousekeepingTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  task_type: {
    type: DataTypes.ENUM('cleaning', 'deep_cleaning', 'turnover', 'inspection', 'amenity_restock'),
    defaultValue: 'cleaning',
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'verified'),
    defaultValue: 'pending',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'housekeeping_tasks',
});

module.exports = HousekeepingTask;
