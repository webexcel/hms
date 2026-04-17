/*
 * Truncate all transactional data (reservations, billings, payments, guests,
 * housekeeping, restaurant, laundry, shift/expense registers, logs). Preserves
 * rooms, users, settings, rate_plans, packages, promotions, menu_items,
 * inventory_items, staff, ota_channels, api_keys, channel_rate_mappings.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { getTenantModels, closeAllConnections } = require('../src/config/connectionManager');

const TABLES = [
  'housekeeping_tasks', 'maintenance_requests',
  'restaurant_order_items', 'restaurant_orders',
  'laundry_order_items', 'laundry_orders',
  'billing_items', 'payments', 'billings', 'checkout_history',
  'reservations', 'guests',
  'inventory_transactions',
  'hr_handovers', 'gpay_transfers', 'bank_withdrawals',
  'expense_entries', 'expense_reports', 'shift_handovers',
  'audit_log', 'refresh_tokens',
  'channel_sync_logs', 'webhook_events', 'ota_reconciliations', 'room_type_inventory',
];

(async () => {
  const db = getTenantModels(process.env.PUBLIC_TENANT_DB || 'hotel_udhayam');
  await db.sequelize.authenticate();
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of TABLES) {
    try {
      await db.sequelize.query(`TRUNCATE TABLE \`${t}\``);
      console.log('  ✓', t);
    } catch (e) {
      console.log('  – skip', t, e.original?.code || e.message);
    }
  }
  await db.sequelize.query("UPDATE rooms SET status='available', cleanliness_status='clean'");
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  const [[c]] = await db.sequelize.query(`SELECT
    (SELECT COUNT(*) FROM reservations) rs, (SELECT COUNT(*) FROM guests) gs,
    (SELECT COUNT(*) FROM billings) bs, (SELECT COUNT(*) FROM payments) py,
    (SELECT COUNT(*) FROM rooms) rm, (SELECT COUNT(*) FROM users) us`);
  console.log('\n── State ──');
  console.log('Reservations:', c.rs, '| Guests:', c.gs, '| Billings:', c.bs, '| Payments:', c.py);
  console.log('Preserved — Rooms:', c.rm, '| Users:', c.us);
  await closeAllConnections();
})().catch(async e => { console.error(e); await closeAllConnections(); process.exit(1); });
