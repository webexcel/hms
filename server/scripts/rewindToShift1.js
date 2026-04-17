/*
 * Rewind database to end of Day 1 Shift 1 (01.04.2026 17:00 IST).
 *
 *  - Deletes reservations whose actual_check_in is at/after the cutoff
 *    (plus their billings, billing_items, payments).
 *  - Reverts reservations whose actual_check_out is after the cutoff back
 *    to status=checked_in (clears actual_check_out, check_out_date set to
 *    inferred next-day, deletes payments added at the inferred checkout,
 *    updates billing paid_amount / balance_due / payment_status).
 *  - Restores room occupancy so the UI shows them in-house.
 *  - Removes guests that no longer have any reservation.
 *
 * Usage: node server/scripts/rewindToShift1.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Op } = require('sequelize');
const { getTenantModels, closeAllConnections } = require('../src/config/connectionManager');

const TENANT_DB = process.env.PUBLIC_TENANT_DB || 'hotel_udhayam';
const CUTOFF = '2026-04-01 17:00:00'; // end of Shift 1 (7 AM – 5 PM) IST

async function main() {
  const db = getTenantModels(TENANT_DB);
  await db.sequelize.authenticate();
  console.log(`Connected to ${TENANT_DB}. Cutoff: ${CUTOFF} IST`);

  // ─── 1. Delete future reservations ──────────────────────────────
  const toDelete = await db.Reservation.findAll({
    where: { actual_check_in: { [Op.gte]: CUTOFF } },
    attributes: ['id'],
  });
  const delIds = toDelete.map(r => r.id);
  console.log(`\nDeleting ${delIds.length} future reservations and their children…`);

  if (delIds.length) {
    const billings = await db.Billing.findAll({
      where: { reservation_id: delIds },
      attributes: ['id'],
    });
    const billIds = billings.map(b => b.id);

    if (billIds.length) {
      const p = await db.Payment.destroy({ where: { billing_id: billIds } });
      const bi = await db.BillingItem.destroy({ where: { billing_id: billIds } });
      const bs = await db.Billing.destroy({ where: { id: billIds } });
      console.log(`  Payments deleted     : ${p}`);
      console.log(`  Billing items deleted: ${bi}`);
      console.log(`  Billings deleted     : ${bs}`);
    }
    const rs = await db.Reservation.destroy({ where: { id: delIds } });
    console.log(`  Reservations deleted : ${rs}`);
  }

  // ─── 2. Revert post-cutoff checkouts ────────────────────────────
  const toRevert = await db.Reservation.findAll({
    where: {
      actual_check_out: { [Op.gt]: CUTOFF },
    },
  });
  console.log(`\nReverting ${toRevert.length} reservations whose checkout is after cutoff…`);

  let inferredPaymentsRemoved = 0;
  for (const res of toRevert) {
    const inferredOut = res.actual_check_out;
    const nextDay = new Date(`${res.check_in_date}T00:00:00`);
    nextDay.setDate(nextDay.getDate() + 1);
    const yyyy = nextDay.getFullYear();
    const mm = String(nextDay.getMonth() + 1).padStart(2, '0');
    const dd = String(nextDay.getDate()).padStart(2, '0');

    await res.update({
      status: 'checked_in',
      actual_check_out: null,
      check_out_date: `${yyyy}-${mm}-${dd}`,
    });

    // Drop the inferred "balance at inferred check-out" payment we added
    const billing = await db.Billing.findOne({ where: { reservation_id: res.id } });
    if (billing) {
      const removed = await db.Payment.destroy({
        where: {
          billing_id: billing.id,
          notes: 'Balance at inferred check-out (missed entry)',
        },
      });
      inferredPaymentsRemoved += removed;

      // Recompute paid / balance from remaining payments
      const remaining = await db.Payment.findAll({ where: { billing_id: billing.id } });
      const paid = remaining.reduce((sum, p) => sum + Number(p.amount), 0);
      const gt = Number(billing.grand_total);
      const balance = Math.max(gt - paid, 0);
      const status = balance <= 0.5 && paid > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
      await billing.update({
        paid_amount: paid,
        balance_due: balance,
        payment_status: status,
      });
    }

    // Room back to occupied
    const room = await db.Room.findByPk(res.room_id);
    if (room && room.status !== 'occupied') await room.update({ status: 'occupied' });
  }
  console.log(`  Inferred payments removed: ${inferredPaymentsRemoved}`);

  // ─── 3. Free rooms that no longer have an in-house guest ────────
  const occupiedRooms = await db.Room.findAll({ where: { status: 'occupied' } });
  let roomsFreed = 0;
  for (const room of occupiedRooms) {
    const inHouse = await db.Reservation.count({
      where: { room_id: room.id, status: 'checked_in' },
    });
    if (!inHouse) {
      await room.update({ status: 'available' });
      roomsFreed += 1;
    }
  }
  console.log(`\nFreed ${roomsFreed} rooms with no in-house guest`);

  // ─── 4. Remove orphan guests ────────────────────────────────────
  const [orphans] = await db.sequelize.query(`
    SELECT g.id FROM guests g
    LEFT JOIN reservations r ON r.guest_id = g.id
    WHERE r.id IS NULL
  `);
  if (orphans.length) {
    await db.Guest.destroy({ where: { id: orphans.map(o => o.id) } });
    console.log(`Deleted ${orphans.length} orphan guests`);
  }

  // ─── 5. Summary ─────────────────────────────────────────────────
  const [[c]] = await db.sequelize.query(`SELECT
    (SELECT COUNT(*) FROM reservations) rs,
    (SELECT COUNT(*) FROM reservations WHERE status='checked_in') ci,
    (SELECT COUNT(*) FROM reservations WHERE status='checked_out') co,
    (SELECT COUNT(*) FROM guests) gs,
    (SELECT COUNT(*) FROM billings) bs,
    (SELECT COUNT(*) FROM payments) py,
    (SELECT COUNT(*) FROM rooms WHERE status='occupied') occ
  `);
  console.log('\n── State after rewind ──');
  console.log(`Reservations : ${c.rs} (in-house: ${c.ci}, checked-out: ${c.co})`);
  console.log(`Guests       : ${c.gs}`);
  console.log(`Billings     : ${c.bs}`);
  console.log(`Payments     : ${c.py}`);
  console.log(`Occupied rms : ${c.occ}`);

  await closeAllConnections();
  console.log('\n✓ Rewound to end of Day 1 Shift 1.');
}

main().catch(async err => {
  console.error(err);
  try { await closeAllConnections(); } catch {}
  process.exit(1);
});
