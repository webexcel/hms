const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
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
    type: DataTypes.ENUM('starters', 'main_course', 'desserts', 'beverages', 'snacks', 'breakfast', 'soups'),
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  is_veg: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  hsn_code: {
    type: DataTypes.STRING(10),
    defaultValue: '996331',
  },
  gst_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 5.00,
  },
}, {
  tableName: 'menu_items',
});

module.exports = MenuItem;
