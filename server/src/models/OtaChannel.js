const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OtaChannel = sequelize.define('OtaChannel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  api_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  api_credentials: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'AES-256-GCM encrypted JSON with API key/secret',
  },
  hotel_id_on_ota: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Property ID as registered on the OTA',
  },
  webhook_secret: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  commission_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  sync_config: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      push_availability: true,
      push_rates: true,
      accept_bookings: true,
      inventory_days_ahead: 30,
    },
  },
  last_sync_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'ota_channels',
});

module.exports = OtaChannel;
