const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RestaurantOrderItem = sequelize.define('RestaurantOrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  menu_item_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  item_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  tableName: 'restaurant_order_items',
});

module.exports = RestaurantOrderItem;
