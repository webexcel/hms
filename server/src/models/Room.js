const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  room_number: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  room_type: {
    type: DataTypes.ENUM('standard', 'deluxe', 'suite', 'premium'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'reserved', 'maintenance', 'cleaning'),
    defaultValue: 'available',
  },
  cleanliness_status: {
    type: DataTypes.ENUM('clean', 'dirty', 'in_progress', 'inspected', 'out_of_order'),
    defaultValue: 'clean',
  },
  base_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  max_occupancy: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  amenities: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'rooms',
});

module.exports = Room;
