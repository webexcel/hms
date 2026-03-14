const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  reservation_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  guest_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  check_in_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  check_out_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  actual_check_in: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  actual_check_out: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('enquiry', 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
    defaultValue: 'pending',
  },
  adults: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  children: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  nights: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING(30),
    defaultValue: 'direct',
  },
  rate_per_night: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  advance_paid: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  special_requests: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ota_booking_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Booking reference from OTA',
  },
  channel_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'FK to OtaChannel - null means direct booking',
  },
  ota_commission: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Commission amount for this booking',
  },
  cancellation_policy: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g. non_refundable, free_cancellation',
  },
  booking_type: {
    type: DataTypes.ENUM('nightly', 'hourly'),
    defaultValue: 'nightly',
    comment: 'nightly = standard stay, hourly = short stay (2-8 hours)',
  },
  expected_hours: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: 'Booked duration in hours for hourly bookings',
  },
  hourly_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null,
    comment: 'Rate per hour for hourly bookings',
  },
  expected_checkout_time: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment: 'Computed: actual_check_in + expected_hours (for hourly bookings)',
  },
  meal_plan: {
    type: DataTypes.ENUM('none', 'breakfast', 'dinner', 'both'),
    defaultValue: 'none',
    comment: 'Complimentary meal plan: none, breakfast, dinner, or both',
  },
  group_id: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: null,
    comment: 'Links multiple reservations in a group booking',
  },
  is_group_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'True for the lead room in a group booking',
  },
}, {
  tableName: 'reservations',
});

module.exports = Reservation;
