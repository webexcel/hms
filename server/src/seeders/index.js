require('dotenv').config();
const sequelize = require('../config/database');
const { User, Room, MenuItem, HotelSetting } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    await sequelize.sync({ force: true });
    console.log('Tables created.');

    // Admin user
    await User.create({
      username: 'admin',
      password_hash: 'admin123',
      email: 'admin@hotel.com',
      full_name: 'System Administrator',
      role: 'admin',
    });

    // Sample users
    await User.bulkCreate([
      { username: 'manager', password_hash: 'manager123', email: 'manager@hotel.com', full_name: 'Hotel Manager', role: 'manager' },
      { username: 'frontdesk', password_hash: 'front123', email: 'frontdesk@hotel.com', full_name: 'Front Desk Staff', role: 'front_desk' },
      { username: 'housekeeper', password_hash: 'house123', email: 'hk@hotel.com', full_name: 'Housekeeping Staff', role: 'housekeeping' },
      { username: 'restaurant', password_hash: 'rest123', email: 'restaurant@hotel.com', full_name: 'Restaurant Staff', role: 'restaurant' },
    ], { individualHooks: true });

    console.log('Users seeded.');

    // 58 Rooms: Standard 25, Deluxe 20, Suite 10, Premium 3
    const rooms = [];
    let roomNum = 101;

    // Floor 1: Standard (10)
    for (let i = 0; i < 10; i++) {
      rooms.push({ room_number: String(roomNum++), floor: 1, room_type: 'standard', base_rate: 2500, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Bathroom'] });
    }

    // Floor 2: Standard (10) + Deluxe (5)
    roomNum = 201;
    for (let i = 0; i < 10; i++) {
      rooms.push({ room_number: String(roomNum++), floor: 2, room_type: 'standard', base_rate: 2500, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Bathroom'] });
    }
    for (let i = 0; i < 5; i++) {
      rooms.push({ room_number: String(roomNum++), floor: 2, room_type: 'deluxe', base_rate: 4500, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom', 'Balcony'] });
    }

    // Floor 3: Standard (5) + Deluxe (10)
    roomNum = 301;
    for (let i = 0; i < 5; i++) {
      rooms.push({ room_number: String(roomNum++), floor: 3, room_type: 'standard', base_rate: 2500, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Bathroom'] });
    }
    for (let i = 0; i < 10; i++) {
      rooms.push({ room_number: String(roomNum++), floor: 3, room_type: 'deluxe', base_rate: 4500, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom', 'Balcony'] });
    }

    // Floor 4: Deluxe (5) + Suite (10)
    roomNum = 401;
    for (let i = 0; i < 5; i++) {
      rooms.push({ room_number: String(roomNum++), floor: 4, room_type: 'deluxe', base_rate: 4500, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom', 'Balcony'] });
    }
    for (let i = 0; i < 10; i++) {
      rooms.push({ room_number: String(roomNum++), floor: 4, room_type: 'suite', base_rate: 8000, max_occupancy: 4, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Living Room', 'Bathroom', 'Balcony', 'Jacuzzi'] });
    }

    // Floor 5: Premium (3)
    roomNum = 501;
    for (let i = 0; i < 3; i++) {
      rooms.push({ room_number: String(roomNum++), floor: 5, room_type: 'premium', base_rate: 15000, max_occupancy: 4, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Living Room', 'Kitchen', 'Bathroom', 'Balcony', 'Jacuzzi', 'Butler Service'] });
    }

    await Room.bulkCreate(rooms);
    console.log(`${rooms.length} rooms seeded.`);

    // Menu items
    await MenuItem.bulkCreate([
      { name: 'Paneer Tikka', category: 'starters', price: 250, is_veg: true },
      { name: 'Chicken 65', category: 'starters', price: 280, is_veg: false },
      { name: 'Veg Spring Roll', category: 'starters', price: 180, is_veg: true },
      { name: 'Fish Fry', category: 'starters', price: 320, is_veg: false },
      { name: 'Tomato Soup', category: 'soups', price: 120, is_veg: true },
      { name: 'Chicken Soup', category: 'soups', price: 150, is_veg: false },
      { name: 'Butter Chicken', category: 'main_course', price: 350, is_veg: false },
      { name: 'Paneer Butter Masala', category: 'main_course', price: 280, is_veg: true },
      { name: 'Biryani (Veg)', category: 'main_course', price: 250, is_veg: true },
      { name: 'Biryani (Chicken)', category: 'main_course', price: 320, is_veg: false },
      { name: 'Dal Makhani', category: 'main_course', price: 220, is_veg: true },
      { name: 'Fish Curry', category: 'main_course', price: 380, is_veg: false },
      { name: 'Naan', category: 'main_course', price: 40, is_veg: true },
      { name: 'Jeera Rice', category: 'main_course', price: 150, is_veg: true },
      { name: 'Gulab Jamun', category: 'desserts', price: 120, is_veg: true },
      { name: 'Ice Cream', category: 'desserts', price: 150, is_veg: true },
      { name: 'Kheer', category: 'desserts', price: 100, is_veg: true },
      { name: 'Fresh Lime Soda', category: 'beverages', price: 80, is_veg: true },
      { name: 'Masala Chai', category: 'beverages', price: 50, is_veg: true },
      { name: 'Coffee', category: 'beverages', price: 80, is_veg: true },
      { name: 'Lassi', category: 'beverages', price: 100, is_veg: true },
      { name: 'Fresh Juice', category: 'beverages', price: 120, is_veg: true },
      { name: 'Idli Sambar', category: 'breakfast', price: 120, is_veg: true },
      { name: 'Dosa', category: 'breakfast', price: 100, is_veg: true },
      { name: 'Poori Bhaji', category: 'breakfast', price: 130, is_veg: true },
      { name: 'Omelette', category: 'breakfast', price: 80, is_veg: false },
      { name: 'French Fries', category: 'snacks', price: 120, is_veg: true },
      { name: 'Sandwich', category: 'snacks', price: 150, is_veg: true },
    ]);
    console.log('Menu items seeded.');

    // Hotel settings
    await HotelSetting.bulkCreate([
      { key: 'hotel_name', value: 'Hotel Udhayam International', category: 'general' },
      { key: 'hotel_address', value: '123 Main Street, City', category: 'general' },
      { key: 'hotel_phone', value: '+91 1234567890', category: 'general' },
      { key: 'hotel_email', value: 'info@hoteludhayam.com', category: 'general' },
      { key: 'hotel_gstin', value: '33XXXXX1234X1ZX', category: 'billing' },
      { key: 'check_in_time', value: '14:00', category: 'operations' },
      { key: 'check_out_time', value: '11:00', category: 'operations' },
      { key: 'timezone', value: 'Asia/Kolkata', category: 'general' },
      { key: 'currency', value: 'INR', category: 'billing' },
      { key: 'currency_symbol', value: '₹', category: 'billing' },
      { key: 'gst_enabled', value: 'true', category: 'billing' },
      { key: 'cgst_rate', value: '6', category: 'billing' },
      { key: 'sgst_rate', value: '6', category: 'billing' },
    ]);
    console.log('Hotel settings seeded.');

    console.log('\nSeeding completed successfully!');
    console.log('Admin login: admin / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
