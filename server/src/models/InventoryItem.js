const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InventoryItem = sequelize.define('InventoryItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('housekeeping', 'kitchen', 'maintenance', 'office', 'amenities', 'linen', 'other'),
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true,
  },
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: 'pcs',
  },
  current_stock: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  min_stock_level: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  unit_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  supplier: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('in_stock', 'low_stock', 'out_of_stock'),
    defaultValue: 'in_stock',
  },
}, {
  tableName: 'inventory_items',
});

module.exports = InventoryItem;
