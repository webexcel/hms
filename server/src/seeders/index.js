require('dotenv').config();
const { getMasterSequelize, getMasterTenant, getTenantModels } = require('../config/connectionManager');

async function seedTenant(tenantInfo, usersData, roomsData, menuData, settingsData) {
  const masterSeq = getMasterSequelize();

  // Create tenant database
  await masterSeq.query(`CREATE DATABASE IF NOT EXISTS \`${tenantInfo.db_name}\``);
  console.log(`Database ${tenantInfo.db_name} created.`);

  // Register tenant in master
  const Tenant = getMasterTenant();
  await Tenant.create(tenantInfo);

  // Get tenant models and sync
  const db = getTenantModels(tenantInfo.db_name);
  await db.sequelize.sync({ force: true });
  console.log(`Tables created for ${tenantInfo.name}.`);

  // Seed users
  await db.User.create(usersData[0]);
  if (usersData.length > 1) {
    await db.User.bulkCreate(usersData.slice(1), { individualHooks: true });
  }
  console.log(`  ${usersData.length} users seeded.`);

  // Seed rooms
  await db.Room.bulkCreate(roomsData);
  console.log(`  ${roomsData.length} rooms seeded.`);

  // Seed menu items
  if (menuData.length > 0) {
    await db.MenuItem.bulkCreate(menuData);
    console.log(`  ${menuData.length} menu items seeded.`);
  }

  // Seed settings
  if (settingsData.length > 0) {
    await db.HotelSetting.bulkCreate(settingsData);
    console.log(`  ${settingsData.length} settings seeded.`);
  }
}

async function seed() {
  try {
    // 1. Create databases using a raw connection (no specific DB)
    const { Sequelize } = require('sequelize');
    const rawSeq = new Sequelize('', process.env.DB_USER || 'root', process.env.DB_PASS || '', {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      logging: false,
    });
    await rawSeq.authenticate();
    console.log('Connected to MySQL server.');

    // Create master and tenant databases
    await rawSeq.query('CREATE DATABASE IF NOT EXISTS `hotel_master`');
    await rawSeq.query('CREATE DATABASE IF NOT EXISTS `hotel_udhayam`');
    await rawSeq.query('CREATE DATABASE IF NOT EXISTS `hotel_grandpalace`');
    await rawSeq.query('CREATE DATABASE IF NOT EXISTS `hotel_budgetinn`');
    await rawSeq.close();
    console.log('Databases created.');

    // 2. Setup master database
    const masterSeq = getMasterSequelize();
    await masterSeq.authenticate();
    const Tenant = getMasterTenant();
    await Tenant.sync({ force: true });
    console.log('Master database ready.\n');

    // ========== TENANT 1: Hotel Udhayam International ==========
    console.log('--- Seeding Hotel Udhayam International ---');
    const rooms1 = [];
    let rn = 101;
    for (let i = 0; i < 10; i++) rooms1.push({ room_number: String(rn++), floor: 1, room_type: 'standard', base_rate: 2500, hourly_rate: 800, hourly_rates: { '2': 500, '3': 800, '4': 1000, default: 400 }, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Bathroom'] });
    rn = 201;
    for (let i = 0; i < 10; i++) rooms1.push({ room_number: String(rn++), floor: 2, room_type: 'standard', base_rate: 2500, hourly_rate: 800, hourly_rates: { '2': 500, '3': 800, '4': 1000, default: 400 }, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Bathroom'] });
    for (let i = 0; i < 5; i++) rooms1.push({ room_number: String(rn++), floor: 2, room_type: 'deluxe', base_rate: 4500, hourly_rate: 1500, hourly_rates: { '2': 1000, '3': 1500, '4': 2000, default: 800 }, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom', 'Balcony'] });
    rn = 301;
    for (let i = 0; i < 5; i++) rooms1.push({ room_number: String(rn++), floor: 3, room_type: 'standard', base_rate: 2500, hourly_rate: 800, hourly_rates: { '2': 500, '3': 800, '4': 1000, default: 400 }, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Bathroom'] });
    for (let i = 0; i < 10; i++) rooms1.push({ room_number: String(rn++), floor: 3, room_type: 'deluxe', base_rate: 4500, hourly_rate: 1500, hourly_rates: { '2': 1000, '3': 1500, '4': 2000, default: 800 }, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom', 'Balcony'] });
    rn = 401;
    for (let i = 0; i < 5; i++) rooms1.push({ room_number: String(rn++), floor: 4, room_type: 'deluxe', base_rate: 4500, hourly_rate: 1500, hourly_rates: { '2': 1000, '3': 1500, '4': 2000, default: 800 }, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom', 'Balcony'] });
    for (let i = 0; i < 10; i++) rooms1.push({ room_number: String(rn++), floor: 4, room_type: 'suite', base_rate: 8000, hourly_rate: 2500, hourly_rates: { '2': 1800, '3': 2500, '4': 3200, default: 1200 }, max_occupancy: 4, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Living Room', 'Bathroom', 'Balcony', 'Jacuzzi'] });
    rn = 501;
    for (let i = 0; i < 3; i++) rooms1.push({ room_number: String(rn++), floor: 5, room_type: 'premium', base_rate: 15000, hourly_rate: 5000, hourly_rates: { '2': 3500, '3': 5000, '4': 6500, default: 2500 }, max_occupancy: 4, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Living Room', 'Kitchen', 'Bathroom', 'Balcony', 'Jacuzzi', 'Butler Service'] });

    await seedTenant(
      { name: 'Hotel Udhayam International', slug: 'udhayam', db_name: 'hotel_udhayam' },
      [
        { username: 'admin', password_hash: 'admin123', email: 'admin@hotel.com', full_name: 'System Administrator', role: 'admin' },
        { username: 'manager', password_hash: 'manager123', email: 'manager@hotel.com', full_name: 'Hotel Manager', role: 'manager' },
        { username: 'frontdesk', password_hash: 'front123', email: 'frontdesk@hotel.com', full_name: 'Front Desk Staff', role: 'front_desk' },
        { username: 'housekeeper', password_hash: 'house123', email: 'hk@hotel.com', full_name: 'Housekeeping Staff', role: 'housekeeping' },
        { username: 'restaurant', password_hash: 'rest123', email: 'restaurant@hotel.com', full_name: 'Restaurant Staff', role: 'restaurant' },
      ],
      rooms1,
      [
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
        { name: 'Fresh Lime Soda', category: 'beverages', price: 80, is_veg: true },
        { name: 'Masala Chai', category: 'beverages', price: 50, is_veg: true },
        { name: 'Coffee', category: 'beverages', price: 80, is_veg: true },
        { name: 'Lassi', category: 'beverages', price: 100, is_veg: true },
        { name: 'Idli Sambar', category: 'breakfast', price: 120, is_veg: true },
        { name: 'Dosa', category: 'breakfast', price: 100, is_veg: true },
        { name: 'Poori Bhaji', category: 'breakfast', price: 130, is_veg: true },
        { name: 'French Fries', category: 'snacks', price: 120, is_veg: true },
        { name: 'Sandwich', category: 'snacks', price: 150, is_veg: true },
      ],
      [
        { key: 'hotel_name', value: 'Hotel Udhayam International', category: 'general' },
        { key: 'hotel_address', value: '123 Main Street, Madurai', category: 'general' },
        { key: 'hotel_phone', value: '+91 4522345678', category: 'general' },
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
      ]
    );
    console.log('✓ Hotel Udhayam International seeded.\n');

    // ========== TENANT 2: Grand Palace Hotel ==========
    console.log('--- Seeding Grand Palace Hotel ---');
    const rooms2 = [];
    rn = 101;
    for (let i = 0; i < 10; i++) rooms2.push({ room_number: String(rn++), floor: 1, room_type: 'standard', base_rate: 3500, hourly_rate: 1200, hourly_rates: { '2': 800, '3': 1200, '4': 1500, default: 600 }, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom'] });
    rn = 201;
    for (let i = 0; i < 10; i++) rooms2.push({ room_number: String(rn++), floor: 2, room_type: 'deluxe', base_rate: 6000, hourly_rate: 2000, hourly_rates: { '2': 1400, '3': 2000, '4': 2600, default: 1000 }, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom', 'Balcony', 'Room Service'] });
    rn = 301;
    for (let i = 0; i < 5; i++) rooms2.push({ room_number: String(rn++), floor: 3, room_type: 'suite', base_rate: 12000, hourly_rate: 4000, hourly_rates: { '2': 2800, '3': 4000, '4': 5000, default: 2000 }, max_occupancy: 4, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Living Room', 'Bathroom', 'Balcony', 'Jacuzzi', 'Butler Service'] });
    for (let i = 0; i < 5; i++) rooms2.push({ room_number: String(rn++), floor: 3, room_type: 'premium', base_rate: 20000, hourly_rate: 6000, hourly_rates: { '2': 4000, '3': 6000, '4': 8000, default: 3000 }, max_occupancy: 4, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Living Room', 'Kitchen', 'Bathroom', 'Balcony', 'Jacuzzi', 'Butler Service', 'Private Pool'] });

    await seedTenant(
      { name: 'Grand Palace Hotel', slug: 'grandpalace', db_name: 'hotel_grandpalace' },
      [
        { username: 'admin', password_hash: 'admin123', email: 'admin@grandpalace.com', full_name: 'GP Administrator', role: 'admin' },
        { username: 'manager', password_hash: 'manager123', email: 'mgr@grandpalace.com', full_name: 'Palace Manager', role: 'manager' },
        { username: 'frontdesk', password_hash: 'front123', email: 'fd@grandpalace.com', full_name: 'Front Desk Agent', role: 'front_desk' },
      ],
      rooms2,
      [
        { name: 'Bruschetta', category: 'starters', price: 350, is_veg: true },
        { name: 'Prawn Cocktail', category: 'starters', price: 450, is_veg: false },
        { name: 'Caesar Salad', category: 'starters', price: 320, is_veg: true },
        { name: 'Mushroom Soup', category: 'soups', price: 250, is_veg: true },
        { name: 'Lobster Bisque', category: 'soups', price: 400, is_veg: false },
        { name: 'Grilled Salmon', category: 'main_course', price: 750, is_veg: false },
        { name: 'Lamb Shank', category: 'main_course', price: 850, is_veg: false },
        { name: 'Risotto', category: 'main_course', price: 550, is_veg: true },
        { name: 'Pasta Carbonara', category: 'main_course', price: 480, is_veg: false },
        { name: 'Paneer Lababdar', category: 'main_course', price: 420, is_veg: true },
        { name: 'Tiramisu', category: 'desserts', price: 350, is_veg: true },
        { name: 'Chocolate Fondant', category: 'desserts', price: 400, is_veg: true },
        { name: 'Espresso', category: 'beverages', price: 150, is_veg: true },
        { name: 'Cappuccino', category: 'beverages', price: 200, is_veg: true },
        { name: 'Fresh Juice', category: 'beverages', price: 180, is_veg: true },
      ],
      [
        { key: 'hotel_name', value: 'Grand Palace Hotel', category: 'general' },
        { key: 'hotel_address', value: '42 Palace Road, Chennai', category: 'general' },
        { key: 'hotel_phone', value: '+91 4428901234', category: 'general' },
        { key: 'hotel_email', value: 'info@grandpalace.com', category: 'general' },
        { key: 'hotel_gstin', value: '33YYYYY5678Y2ZY', category: 'billing' },
        { key: 'check_in_time', value: '15:00', category: 'operations' },
        { key: 'check_out_time', value: '12:00', category: 'operations' },
        { key: 'timezone', value: 'Asia/Kolkata', category: 'general' },
        { key: 'currency', value: 'INR', category: 'billing' },
        { key: 'currency_symbol', value: '₹', category: 'billing' },
        { key: 'gst_enabled', value: 'true', category: 'billing' },
        { key: 'cgst_rate', value: '9', category: 'billing' },
        { key: 'sgst_rate', value: '9', category: 'billing' },
      ]
    );
    console.log('✓ Grand Palace Hotel seeded.\n');

    // ========== TENANT 3: Budget Inn Express ==========
    console.log('--- Seeding Budget Inn Express ---');
    const rooms3 = [];
    rn = 101;
    for (let i = 0; i < 15; i++) rooms3.push({ room_number: String(rn++), floor: rn <= 111 ? 1 : 2, room_type: 'standard', base_rate: 1200, hourly_rate: 400, hourly_rates: { '2': 250, '3': 400, '4': 500, default: 200 }, max_occupancy: 2, amenities: ['AC', 'TV', 'WiFi', 'Bathroom'] });
    rn = 201;
    for (let i = 0; i < 5; i++) rooms3.push({ room_number: String(rn++), floor: 2, room_type: 'deluxe', base_rate: 2000, hourly_rate: 700, hourly_rates: { '2': 500, '3': 700, '4': 900, default: 350 }, max_occupancy: 3, amenities: ['AC', 'TV', 'WiFi', 'Minibar', 'Bathroom'] });

    await seedTenant(
      { name: 'Budget Inn Express', slug: 'budgetinn', db_name: 'hotel_budgetinn' },
      [
        { username: 'admin', password_hash: 'admin123', email: 'admin@budgetinn.com', full_name: 'BI Administrator', role: 'admin' },
        { username: 'frontdesk', password_hash: 'front123', email: 'fd@budgetinn.com', full_name: 'Reception Staff', role: 'front_desk' },
      ],
      rooms3,
      [
        { name: 'Idli (2 pcs)', category: 'breakfast', price: 60, is_veg: true },
        { name: 'Dosa', category: 'breakfast', price: 70, is_veg: true },
        { name: 'Upma', category: 'breakfast', price: 50, is_veg: true },
        { name: 'Veg Meals', category: 'main_course', price: 120, is_veg: true },
        { name: 'Non-Veg Meals', category: 'main_course', price: 150, is_veg: false },
        { name: 'Fried Rice', category: 'main_course', price: 130, is_veg: true },
        { name: 'Chicken Fried Rice', category: 'main_course', price: 160, is_veg: false },
        { name: 'Parotta', category: 'main_course', price: 30, is_veg: true },
        { name: 'Chai', category: 'beverages', price: 20, is_veg: true },
        { name: 'Coffee', category: 'beverages', price: 30, is_veg: true },
        { name: 'Bottled Water', category: 'beverages', price: 20, is_veg: true },
      ],
      [
        { key: 'hotel_name', value: 'Budget Inn Express', category: 'general' },
        { key: 'hotel_address', value: '78 Bus Stand Road, Trichy', category: 'general' },
        { key: 'hotel_phone', value: '+91 4312567890', category: 'general' },
        { key: 'hotel_email', value: 'info@budgetinn.com', category: 'general' },
        { key: 'hotel_gstin', value: '33ZZZZZ9012Z3ZZ', category: 'billing' },
        { key: 'check_in_time', value: '12:00', category: 'operations' },
        { key: 'check_out_time', value: '10:00', category: 'operations' },
        { key: 'timezone', value: 'Asia/Kolkata', category: 'general' },
        { key: 'currency', value: 'INR', category: 'billing' },
        { key: 'currency_symbol', value: '₹', category: 'billing' },
        { key: 'gst_enabled', value: 'true', category: 'billing' },
        { key: 'cgst_rate', value: '6', category: 'billing' },
        { key: 'sgst_rate', value: '6', category: 'billing' },
      ]
    );
    console.log('✓ Budget Inn Express seeded.\n');

    console.log('=== Seeding completed successfully! ===');
    console.log('');
    console.log('Hotel Udhayam International (slug: udhayam, db: hotel_udhayam)');
    console.log('  admin / admin123');
    console.log('');
    console.log('Grand Palace Hotel (slug: grandpalace, db: hotel_grandpalace)');
    console.log('  admin / admin123');
    console.log('');
    console.log('Budget Inn Express (slug: budgetinn, db: hotel_budgetinn)');
    console.log('  admin / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
