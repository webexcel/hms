require('dotenv').config();
const sequelize = require('../config/database');
const { Tenant, User, Room, MenuItem, HotelSetting } = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    await sequelize.sync({ force: true });
    console.log('Tables created.');

    // ========== TENANT 1: Hotel Udhayam International ==========
    const t1 = await Tenant.create({ name: 'Hotel Udhayam International', slug: 'udhayam' });
    const T1 = t1.id;

    await User.create({
      tenant_id: T1, username: 'admin', password_hash: 'admin123',
      email: 'admin@hotel.com', full_name: 'System Administrator', role: 'admin',
    });
    await User.bulkCreate([
      { tenant_id: T1, username: 'manager', password_hash: 'manager123', email: 'manager@hotel.com', full_name: 'Hotel Manager', role: 'manager' },
      { tenant_id: T1, username: 'frontdesk', password_hash: 'front123', email: 'frontdesk@hotel.com', full_name: 'Front Desk Staff', role: 'front_desk' },
      { tenant_id: T1, username: 'housekeeper', password_hash: 'house123', email: 'hk@hotel.com', full_name: 'Housekeeping Staff', role: 'housekeeping' },
      { tenant_id: T1, username: 'restaurant', password_hash: 'rest123', email: 'restaurant@hotel.com', full_name: 'Restaurant Staff', role: 'restaurant' },
    ], { individualHooks: true });
    console.log('Tenant 1 users seeded.');

    // 58 Rooms
    const rooms1 = [];
    let roomNum = 101;
    for (let i = 0; i < 10; i++) rooms1.push({ tenant_id: T1, room_number: String(roomNum++), floor: 1, room_type: 'standard', base_rate: 2500, hourly_rate: 800, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Bathroom'] });
    roomNum = 201;
    for (let i = 0; i < 10; i++) rooms1.push({ tenant_id: T1, room_number: String(roomNum++), floor: 2, room_type: 'standard', base_rate: 2500, hourly_rate: 800, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Bathroom'] });
    for (let i = 0; i < 5; i++) rooms1.push({ tenant_id: T1, room_number: String(roomNum++), floor: 2, room_type: 'deluxe', base_rate: 4500, hourly_rate: 1500, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom', 'Balcony'] });
    roomNum = 301;
    for (let i = 0; i < 5; i++) rooms1.push({ tenant_id: T1, room_number: String(roomNum++), floor: 3, room_type: 'standard', base_rate: 2500, hourly_rate: 800, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Bathroom'] });
    for (let i = 0; i < 10; i++) rooms1.push({ tenant_id: T1, room_number: String(roomNum++), floor: 3, room_type: 'deluxe', base_rate: 4500, hourly_rate: 1500, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom', 'Balcony'] });
    roomNum = 401;
    for (let i = 0; i < 5; i++) rooms1.push({ tenant_id: T1, room_number: String(roomNum++), floor: 4, room_type: 'deluxe', base_rate: 4500, hourly_rate: 1500, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom', 'Balcony'] });
    for (let i = 0; i < 10; i++) rooms1.push({ tenant_id: T1, room_number: String(roomNum++), floor: 4, room_type: 'suite', base_rate: 8000, hourly_rate: 2500, max_occupancy: 4, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Living Room', 'Bathroom', 'Balcony', 'Jacuzzi'] });
    roomNum = 501;
    for (let i = 0; i < 3; i++) rooms1.push({ tenant_id: T1, room_number: String(roomNum++), floor: 5, room_type: 'premium', base_rate: 15000, hourly_rate: 5000, max_occupancy: 4, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Living Room', 'Kitchen', 'Bathroom', 'Balcony', 'Jacuzzi', 'Butler Service'] });
    await Room.bulkCreate(rooms1);
    console.log(`${rooms1.length} rooms seeded for Tenant 1.`);

    await MenuItem.bulkCreate([
      { tenant_id: T1, name: 'Paneer Tikka', category: 'starters', price: 250, is_veg: true },
      { tenant_id: T1, name: 'Chicken 65', category: 'starters', price: 280, is_veg: false },
      { tenant_id: T1, name: 'Veg Spring Roll', category: 'starters', price: 180, is_veg: true },
      { tenant_id: T1, name: 'Fish Fry', category: 'starters', price: 320, is_veg: false },
      { tenant_id: T1, name: 'Tomato Soup', category: 'soups', price: 120, is_veg: true },
      { tenant_id: T1, name: 'Chicken Soup', category: 'soups', price: 150, is_veg: false },
      { tenant_id: T1, name: 'Butter Chicken', category: 'main_course', price: 350, is_veg: false },
      { tenant_id: T1, name: 'Paneer Butter Masala', category: 'main_course', price: 280, is_veg: true },
      { tenant_id: T1, name: 'Biryani (Veg)', category: 'main_course', price: 250, is_veg: true },
      { tenant_id: T1, name: 'Biryani (Chicken)', category: 'main_course', price: 320, is_veg: false },
      { tenant_id: T1, name: 'Dal Makhani', category: 'main_course', price: 220, is_veg: true },
      { tenant_id: T1, name: 'Fish Curry', category: 'main_course', price: 380, is_veg: false },
      { tenant_id: T1, name: 'Naan', category: 'main_course', price: 40, is_veg: true },
      { tenant_id: T1, name: 'Jeera Rice', category: 'main_course', price: 150, is_veg: true },
      { tenant_id: T1, name: 'Gulab Jamun', category: 'desserts', price: 120, is_veg: true },
      { tenant_id: T1, name: 'Ice Cream', category: 'desserts', price: 150, is_veg: true },
      { tenant_id: T1, name: 'Fresh Lime Soda', category: 'beverages', price: 80, is_veg: true },
      { tenant_id: T1, name: 'Masala Chai', category: 'beverages', price: 50, is_veg: true },
      { tenant_id: T1, name: 'Coffee', category: 'beverages', price: 80, is_veg: true },
      { tenant_id: T1, name: 'Lassi', category: 'beverages', price: 100, is_veg: true },
      { tenant_id: T1, name: 'Idli Sambar', category: 'breakfast', price: 120, is_veg: true },
      { tenant_id: T1, name: 'Dosa', category: 'breakfast', price: 100, is_veg: true },
      { tenant_id: T1, name: 'Poori Bhaji', category: 'breakfast', price: 130, is_veg: true },
      { tenant_id: T1, name: 'French Fries', category: 'snacks', price: 120, is_veg: true },
      { tenant_id: T1, name: 'Sandwich', category: 'snacks', price: 150, is_veg: true },
    ]);

    await HotelSetting.bulkCreate([
      { tenant_id: T1, key: 'hotel_name', value: 'Hotel Udhayam International', category: 'general' },
      { tenant_id: T1, key: 'hotel_address', value: '123 Main Street, Madurai', category: 'general' },
      { tenant_id: T1, key: 'hotel_phone', value: '+91 4522345678', category: 'general' },
      { tenant_id: T1, key: 'hotel_email', value: 'info@hoteludhayam.com', category: 'general' },
      { tenant_id: T1, key: 'hotel_gstin', value: '33XXXXX1234X1ZX', category: 'billing' },
      { tenant_id: T1, key: 'check_in_time', value: '14:00', category: 'operations' },
      { tenant_id: T1, key: 'check_out_time', value: '11:00', category: 'operations' },
      { tenant_id: T1, key: 'timezone', value: 'Asia/Kolkata', category: 'general' },
      { tenant_id: T1, key: 'currency', value: 'INR', category: 'billing' },
      { tenant_id: T1, key: 'currency_symbol', value: '₹', category: 'billing' },
      { tenant_id: T1, key: 'gst_enabled', value: 'true', category: 'billing' },
      { tenant_id: T1, key: 'cgst_rate', value: '6', category: 'billing' },
      { tenant_id: T1, key: 'sgst_rate', value: '6', category: 'billing' },
    ]);
    console.log('Tenant 1 fully seeded.');

    // ========== TENANT 2: Grand Palace Hotel ==========
    const t2 = await Tenant.create({ name: 'Grand Palace Hotel', slug: 'grandpalace' });
    const T2 = t2.id;

    await User.create({
      tenant_id: T2, username: 'admin', password_hash: 'admin123',
      email: 'admin@grandpalace.com', full_name: 'GP Administrator', role: 'admin',
    });
    await User.bulkCreate([
      { tenant_id: T2, username: 'manager', password_hash: 'manager123', email: 'mgr@grandpalace.com', full_name: 'Palace Manager', role: 'manager' },
      { tenant_id: T2, username: 'frontdesk', password_hash: 'front123', email: 'fd@grandpalace.com', full_name: 'Front Desk Agent', role: 'front_desk' },
    ], { individualHooks: true });
    console.log('Tenant 2 users seeded.');

    // 30 Rooms: higher-end pricing
    const rooms2 = [];
    roomNum = 101;
    for (let i = 0; i < 10; i++) rooms2.push({ tenant_id: T2, room_number: String(roomNum++), floor: 1, room_type: 'standard', base_rate: 3500, hourly_rate: 1200, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom'] });
    roomNum = 201;
    for (let i = 0; i < 10; i++) rooms2.push({ tenant_id: T2, room_number: String(roomNum++), floor: 2, room_type: 'deluxe', base_rate: 6000, hourly_rate: 2000, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom', 'Balcony', 'Room Service'] });
    roomNum = 301;
    for (let i = 0; i < 5; i++) rooms2.push({ tenant_id: T2, room_number: String(roomNum++), floor: 3, room_type: 'suite', base_rate: 12000, hourly_rate: 4000, max_occupancy: 4, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Living Room', 'Bathroom', 'Balcony', 'Jacuzzi', 'Butler Service'] });
    for (let i = 0; i < 5; i++) rooms2.push({ tenant_id: T2, room_number: String(roomNum++), floor: 3, room_type: 'premium', base_rate: 20000, hourly_rate: 6000, max_occupancy: 4, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Living Room', 'Kitchen', 'Bathroom', 'Balcony', 'Jacuzzi', 'Butler Service', 'Private Pool'] });
    await Room.bulkCreate(rooms2);
    console.log(`${rooms2.length} rooms seeded for Tenant 2.`);

    await MenuItem.bulkCreate([
      { tenant_id: T2, name: 'Bruschetta', category: 'starters', price: 350, is_veg: true },
      { tenant_id: T2, name: 'Prawn Cocktail', category: 'starters', price: 450, is_veg: false },
      { tenant_id: T2, name: 'Caesar Salad', category: 'starters', price: 320, is_veg: true },
      { tenant_id: T2, name: 'Mushroom Soup', category: 'soups', price: 250, is_veg: true },
      { tenant_id: T2, name: 'Lobster Bisque', category: 'soups', price: 400, is_veg: false },
      { tenant_id: T2, name: 'Grilled Salmon', category: 'main_course', price: 750, is_veg: false },
      { tenant_id: T2, name: 'Lamb Shank', category: 'main_course', price: 850, is_veg: false },
      { tenant_id: T2, name: 'Risotto', category: 'main_course', price: 550, is_veg: true },
      { tenant_id: T2, name: 'Pasta Carbonara', category: 'main_course', price: 480, is_veg: false },
      { tenant_id: T2, name: 'Paneer Lababdar', category: 'main_course', price: 420, is_veg: true },
      { tenant_id: T2, name: 'Tiramisu', category: 'desserts', price: 350, is_veg: true },
      { tenant_id: T2, name: 'Chocolate Fondant', category: 'desserts', price: 400, is_veg: true },
      { tenant_id: T2, name: 'Espresso', category: 'beverages', price: 150, is_veg: true },
      { tenant_id: T2, name: 'Cappuccino', category: 'beverages', price: 200, is_veg: true },
      { tenant_id: T2, name: 'Fresh Juice', category: 'beverages', price: 180, is_veg: true },
    ]);

    await HotelSetting.bulkCreate([
      { tenant_id: T2, key: 'hotel_name', value: 'Grand Palace Hotel', category: 'general' },
      { tenant_id: T2, key: 'hotel_address', value: '42 Palace Road, Chennai', category: 'general' },
      { tenant_id: T2, key: 'hotel_phone', value: '+91 4428901234', category: 'general' },
      { tenant_id: T2, key: 'hotel_email', value: 'info@grandpalace.com', category: 'general' },
      { tenant_id: T2, key: 'hotel_gstin', value: '33YYYYY5678Y2ZY', category: 'billing' },
      { tenant_id: T2, key: 'check_in_time', value: '15:00', category: 'operations' },
      { tenant_id: T2, key: 'check_out_time', value: '12:00', category: 'operations' },
      { tenant_id: T2, key: 'timezone', value: 'Asia/Kolkata', category: 'general' },
      { tenant_id: T2, key: 'currency', value: 'INR', category: 'billing' },
      { tenant_id: T2, key: 'currency_symbol', value: '₹', category: 'billing' },
      { tenant_id: T2, key: 'gst_enabled', value: 'true', category: 'billing' },
      { tenant_id: T2, key: 'cgst_rate', value: '9', category: 'billing' },
      { tenant_id: T2, key: 'sgst_rate', value: '9', category: 'billing' },
    ]);
    console.log('Tenant 2 fully seeded.');

    // ========== TENANT 3: Budget Inn Express ==========
    const t3 = await Tenant.create({ name: 'Budget Inn Express', slug: 'budgetinn' });
    const T3 = t3.id;

    await User.create({
      tenant_id: T3, username: 'admin', password_hash: 'admin123',
      email: 'admin@budgetinn.com', full_name: 'BI Administrator', role: 'admin',
    });
    await User.bulkCreate([
      { tenant_id: T3, username: 'frontdesk', password_hash: 'front123', email: 'fd@budgetinn.com', full_name: 'Reception Staff', role: 'front_desk' },
    ], { individualHooks: true });
    console.log('Tenant 3 users seeded.');

    // 20 Rooms: budget pricing
    const rooms3 = [];
    roomNum = 101;
    for (let i = 0; i < 15; i++) rooms3.push({ tenant_id: T3, room_number: String(roomNum++), floor: (roomNum <= 111 ? 1 : 2), room_type: 'standard', base_rate: 1200, hourly_rate: 400, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Bathroom'] });
    roomNum = 201;
    for (let i = 0; i < 5; i++) rooms3.push({ tenant_id: T3, room_number: String(roomNum++), floor: 2, room_type: 'deluxe', base_rate: 2000, hourly_rate: 700, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom'] });
    await Room.bulkCreate(rooms3);
    console.log(`${rooms3.length} rooms seeded for Tenant 3.`);

    await MenuItem.bulkCreate([
      { tenant_id: T3, name: 'Idli (2 pcs)', category: 'breakfast', price: 60, is_veg: true },
      { tenant_id: T3, name: 'Dosa', category: 'breakfast', price: 70, is_veg: true },
      { tenant_id: T3, name: 'Upma', category: 'breakfast', price: 50, is_veg: true },
      { tenant_id: T3, name: 'Veg Meals', category: 'main_course', price: 120, is_veg: true },
      { tenant_id: T3, name: 'Non-Veg Meals', category: 'main_course', price: 150, is_veg: false },
      { tenant_id: T3, name: 'Fried Rice', category: 'main_course', price: 130, is_veg: true },
      { tenant_id: T3, name: 'Chicken Fried Rice', category: 'main_course', price: 160, is_veg: false },
      { tenant_id: T3, name: 'Parotta', category: 'main_course', price: 30, is_veg: true },
      { tenant_id: T3, name: 'Chai', category: 'beverages', price: 20, is_veg: true },
      { tenant_id: T3, name: 'Coffee', category: 'beverages', price: 30, is_veg: true },
      { tenant_id: T3, name: 'Bottled Water', category: 'beverages', price: 20, is_veg: true },
    ]);

    await HotelSetting.bulkCreate([
      { tenant_id: T3, key: 'hotel_name', value: 'Budget Inn Express', category: 'general' },
      { tenant_id: T3, key: 'hotel_address', value: '78 Bus Stand Road, Trichy', category: 'general' },
      { tenant_id: T3, key: 'hotel_phone', value: '+91 4312567890', category: 'general' },
      { tenant_id: T3, key: 'hotel_email', value: 'info@budgetinn.com', category: 'general' },
      { tenant_id: T3, key: 'hotel_gstin', value: '33ZZZZZ9012Z3ZZ', category: 'billing' },
      { tenant_id: T3, key: 'check_in_time', value: '12:00', category: 'operations' },
      { tenant_id: T3, key: 'check_out_time', value: '10:00', category: 'operations' },
      { tenant_id: T3, key: 'timezone', value: 'Asia/Kolkata', category: 'general' },
      { tenant_id: T3, key: 'currency', value: 'INR', category: 'billing' },
      { tenant_id: T3, key: 'currency_symbol', value: '₹', category: 'billing' },
      { tenant_id: T3, key: 'gst_enabled', value: 'true', category: 'billing' },
      { tenant_id: T3, key: 'cgst_rate', value: '6', category: 'billing' },
      { tenant_id: T3, key: 'sgst_rate', value: '6', category: 'billing' },
    ]);
    console.log('Tenant 3 fully seeded.');

    console.log('\n=== Seeding completed successfully! ===');
    console.log('');
    console.log('Hotel Udhayam International (slug: udhayam)');
    console.log('  admin / admin123');
    console.log('');
    console.log('Grand Palace Hotel (slug: grandpalace)');
    console.log('  admin / admin123');
    console.log('');
    console.log('Budget Inn Express (slug: budgetinn)');
    console.log('  admin / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
