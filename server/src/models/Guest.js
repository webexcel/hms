const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Guest = sequelize.define('Guest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  id_proof_type: {
    type: DataTypes.ENUM('aadhaar', 'passport', 'driving_license', 'voter_id', 'pan'),
    allowNull: true,
  },
  id_proof_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  gstin: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  company_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  vip_status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  total_stays: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'guests',
});

module.exports = Guest;
