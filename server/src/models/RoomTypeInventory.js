const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoomTypeInventory = sequelize.define('RoomTypeInventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  room_type: {
    type: DataTypes.ENUM('standard', 'deluxe', 'suite', 'premium'),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  total_rooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  booked_rooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  available_rooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  blocked_rooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Rooms blocked for maintenance etc.',
  },
  last_synced_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'room_type_inventory',
  indexes: [
    {
      unique: true,
      fields: ['tenant_id', 'room_type', 'date'],
    },
  ],
});

module.exports = RoomTypeInventory;
