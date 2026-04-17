/*
 * Import Hotel Format A (cashier register) from reference/HOTEL.xlsx.
 *
 * What it does (in order):
 *   1. Truncates all transactional tables (guests, reservations, billings,
 *      billing_items, payments, checkout_history, housekeeping, restaurant,
 *      laundry, inventory_transactions, shift/expense/hr tables, audit_log,
 *      refresh_tokens, OTA sync tables, room_type_inventory).
 *   2. Preserves: rooms, users, hotel_settings, rate_plans, packages,
 *      promotions, menu_items, inventory_items, staff, ota_channels, api_keys,
 *      channel_rate_mappings (i.e. configuration).
 *   3. Parses Format A shift-by-shift and inserts guests, reservations,
 *      billings, billing_items, payments. When the guest's paid amount is
 *      less than (room + extra_bed + rst + gst), the shortfall is recorded
 *      as an OM discount on the reservation (and as a discount billing_item).
 *
 * Usage: node server/scripts/importHotelFormatA.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const path = require('path');
const XLSX = require('xlsx');
const { getTenantModels, closeAllConnections } = require('../src/config/connectionManager');

const TENANT_DB = process.env.PUBLIC_TENANT_DB || 'hotel_udhayam';
const EXCEL_PATH = path.resolve(__dirname, '../../reference/HOTEL.xlsx');

const TABLES_TO_TRUNCATE = [
  'housekeeping_tasks',
  'maintenance_requests',
  'restaurant_order_items',
  'restaurant_orders',
  'laundry_order_items',
  'laundry_orders',
  'billing_items',
  'payments',
  'billings',
  'checkout_history',
  'reservations',
  'guests',
  'inventory_transactions',
  'hr_handovers',
  'gpay_transfers',
  'bank_withdrawals',
  'expense_entries',
  'expense_reports',
  'shift_handovers',
  'audit_log',
  'refresh_tokens',
  'channel_sync_logs',
  'webhook_events',
  'ota_reconciliations',
  'room_type_inventory',
];

// ─── Parsing helpers ────────────────────────────────────────────────

function parseDate(val) {
  if (val == null || val === '') return null;
  if (typeof val === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(epoch.getTime() + val * 86400000);
  }
  const s = String(val).trim();
  let m = s.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
  if (m) {
    const [, d, mo, y] = m;
    return new Date(`${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`);
  }
  m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T00:00:00`);
  return null;
}

function parseTime(val) {
  if (val == null || val === '') return { h: 14, m: 0 };
  const s = String(val).trim().toUpperCase().replace(/\s+/g, '');
  const m = s.match(/^(\d{1,2})[:.]?(\d{0,2})[:.]?(\d{0,2}):?(AM|PM)?$/);
  if (!m) return { h: 14, m: 0 };
  let h = parseInt(m[1], 10);
  let min = parseInt(m[2] || '0', 10);
  const ap = m[4];
  if (isNaN(h)) return { h: 14, m: 0 };
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return { h, m: isNaN(min) ? 0 : min };
}

function combineDateTime(d, hm) {
  if (!d) return null;
  const out = new Date(d);
  out.setHours(hm.h, hm.m, 0, 0);
  return out;
}

function parseAmount(val) {
  if (val == null || val === '') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).toLowerCase().trim();
  if (!s || s === 'nil' || s === 'pending' || s.startsWith('do not')) return 0;
  // "1000+4000" → 5000 ; "2900" → 2900
  const parts = s.match(/\d+(?:\.\d+)?/g);
  if (!parts) return 0;
  return parts.reduce((a, b) => a + parseFloat(b), 0);
}

function parsePaymentMethod(val) {
  if (!val) return null;
  const s = String(val).toLowerCase();
  if (/gpay|upi|phonepe|paytm/.test(s)) return 'upi';
  if (/cash/.test(s)) return 'cash';
  if (/\bcc\b|card|credit|debit/.test(s)) return 'card';
  if (/sbi|bank|transfer/.test(s)) return 'bank_transfer';
  return null;
}

function parseDateTimeCell(val) {
  if (!val) return null;
  const s = String(val).trim();
  const m = s.match(/(\d{1,2})[:.]?(\d{0,2})[:.]?(\d{0,2})\s*:?(AM|PM)?\s+(\d{1,2})[.\/-](\d{1,2})[.\/-]?(\d{2,4})/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2] || '0', 10);
  const ap = (m[4] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  const d = m[5].padStart(2, '0');
  const mo = m[6].padStart(2, '0');
  let y = m[7];
  if (y.length === 2) y = '20' + y;
  return new Date(`${y}-${mo}-${d}T${String(h).padStart(2, '0')}:${String(min || 0).padStart(2, '0')}:00`);
}

function cleanName(n) {
  return String(n || '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
}

function splitName(full) {
  const clean = cleanName(full);
  if (!clean) return { first_name: 'Unknown', last_name: null };
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return { first_name: parts[0].slice(0, 50), last_name: null };
  return {
    first_name: parts[0].slice(0, 50),
    last_name: parts.slice(1).join(' ').slice(0, 50),
  };
}

function fmtDate(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function detectSource(remarks, guestName) {
  const s = `${remarks || ''} ${guestName || ''}`.toLowerCase();
  if (/mmt|mmy|makemytrip/.test(s)) return 'makemytrip';
  if (/goibibo|gobibo|gobibibo/.test(s)) return 'goibibo';
  if (/yatra/.test(s)) return 'yatra';
  if (/booking ?mania/.test(s)) return 'booking_mania';
  if (/agoda/.test(s)) return 'agoda';
  return 'direct';
}

// ─── Sheet → shifts → bookings ─────────────────────────────────────

function extractShifts(rows) {
  const shifts = [];
  let i = 0;
  while (i < rows.length) {
    const r = rows[i];
    const isHotelHeader = r && r.some(c => typeof c === 'string' && c.includes('HOTEL UDHYAM'));
    if (!isHotelHeader) { i += 1; continue; }

    const header = {};
    for (let j = i; j < Math.min(i + 10, rows.length); j++) {
      const rr = rows[j];
      if (!rr) continue;
      rr.forEach((cell, idx) => {
        if (cell == null) return;
        const s = String(cell).trim();
        if (/DUTY CASHIER/i.test(s) && rr[idx + 1]) header.cashier = String(rr[idx + 1]).trim();
        if (/^DATE\s*:?$/i.test(s)) header.date = parseDate(rr[idx + 1]);
        if (/^TIME\s*:?$/i.test(s)) header.time = String(rr[idx + 1] || '').trim();
      });
    }

    // Find "SL NO" header row
    let hIdx = -1;
    for (let j = i; j < Math.min(i + 15, rows.length); j++) {
      if (rows[j] && String(rows[j][0] || '').trim() === 'SL NO') { hIdx = j; break; }
    }
    if (hIdx < 0) { i += 1; continue; }
    const headerRow = rows[hIdx];
    const hasPaymentType = headerRow.some(c => c && /payment\s*type/i.test(String(c)));

    const dataRows = [];
    for (let j = hIdx + 1; j < rows.length; j++) {
      const rr = rows[j];
      if (rr && rr.some(c => typeof c === 'string' && c.includes('HOTEL UDHYAM'))) break;
      if (rr) dataRows.push(rr);
    }
    const shiftTime = (header.time || '').toUpperCase();
    const shiftKey = /7AM|MORN/.test(shiftTime) ? 'shift_1' : 'shift_2';
    shifts.push({ ...header, shiftKey, hasPaymentType, dataRows });
    i = hIdx + 1;
  }
  return shifts;
}

function extractBookings(shift) {
  const bookings = [];
  for (const r of shift.dataRows) {
    if (typeof r[0] !== 'number') continue;
    if (r[1] == null || r[2] == null) continue;
    const b = { shift };
    let idx = 0;
    b.sl = r[idx++];
    b.roomNo = String(r[idx++]).trim();
    b.guestName = r[idx++];
    b.checkInTime = r[idx++];
    b.checkInDate = parseDate(r[idx++]);
    b.advanceRaw = r[idx++];
    if (shift.hasPaymentType) { b.paymentTypeAdv = r[idx++]; }
    b.roomTariff = parseAmount(r[idx++]);
    b.rstBill = parseAmount(r[idx++]);
    b.extraBed = parseAmount(r[idx++]);
    b.gst = parseAmount(r[idx++]);
    b.totalAmount = parseAmount(r[idx++]);
    b.netAfterAdv = parseAmount(r[idx++]);
    b.paymentMethodCheckout = r[idx++];
    b.checkOutCell = r[idx++];
    b.remarks = r[idx++];
    b.advance = parseAmount(b.advanceRaw);
    if (!b.checkInDate) continue;
    bookings.push(b);
  }
  return bookings;
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log(`Reading ${EXCEL_PATH} …`);
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const shifts = extractShifts(rows);
  console.log(`Found ${shifts.length} shift sections`);

  const allBookings = [];
  for (const sh of shifts) allBookings.push(...extractBookings(sh));
  console.log(`Parsed ${allBookings.length} booking rows`);

  // Group by (guest_name + room_no + check_in_date) → reservation
  const groups = new Map();
  for (const b of allBookings) {
    const k = [cleanName(b.guestName).toLowerCase(), b.roomNo, fmtDate(b.checkInDate)].join('|');
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(b);
  }
  console.log(`Grouped into ${groups.size} reservations`);

  const db = getTenantModels(TENANT_DB);
  await db.sequelize.authenticate();
  console.log(`Connected to ${TENANT_DB}`);

  console.log('\n── Truncating transactional tables ──');
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of TABLES_TO_TRUNCATE) {
    try {
      await db.sequelize.query(`TRUNCATE TABLE \`${t}\``);
      console.log(`  ✓ ${t}`);
    } catch (e) {
      console.log(`  – skip ${t} (${e.original ? e.original.code : e.message})`);
    }
  }
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  const rooms = await db.Room.findAll();
  const roomMap = new Map(rooms.map(r => [String(r.room_number), r]));
  console.log(`\nLoaded ${rooms.length} rooms`);

  const adminUser = await db.User.findOne({ where: { role: 'admin' } });
  const createdBy = adminUser ? adminUser.id : null;

  const guestCache = new Map();
  const missingRooms = new Set();
  let resSeq = 1, invSeq = 1;
  let guestsCreated = 0, resCreated = 0, billingsCreated = 0, paymentsCreated = 0;

  // Sort groups by check-in date for chronological insertion
  const sortedGroups = [...groups.entries()].sort(([, a], [, b]) => {
    const ad = a[0].checkInDate || new Date();
    const bd = b[0].checkInDate || new Date();
    return ad - bd;
  });

  console.log('\n── Inserting data ──');
  for (const [key, rowsInGroup] of sortedGroups) {
    const primary = rowsInGroup[0];
    const checkoutRow = rowsInGroup.find(b => b.checkOutCell) || null;

    const room = roomMap.get(primary.roomNo);
    if (!room) {
      missingRooms.add(primary.roomNo);
      continue;
    }

    const nameKey = cleanName(primary.guestName).toLowerCase();
    if (!nameKey) continue;

    let guest = guestCache.get(nameKey);
    if (!guest) {
      const { first_name, last_name } = splitName(primary.guestName);
      guest = await db.Guest.create({
        first_name, last_name,
        phone: '0000000000',
        notes: 'Imported from Format A cashier register',
      });
      guestCache.set(nameKey, guest);
      guestsCreated += 1;
    }

    const citHM = parseTime(primary.checkInTime);
    const actualCheckIn = combineDateTime(primary.checkInDate, citHM);
    const actualCheckOut = checkoutRow ? parseDateTimeCell(checkoutRow.checkOutCell) : null;

    const checkInDate = primary.checkInDate;
    let checkOutDate;
    if (actualCheckOut) checkOutDate = new Date(actualCheckOut);
    else {
      checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 1);
    }

    // Aggregate amounts across all rows of this group
    let roomTariff = 0, rstBill = 0, extraBed = 0, gst = 0, totalAmount = 0, netAfterAdv = 0, advance = 0;
    let paymentMethod = null;
    const remarks = [];
    for (const b of rowsInGroup) {
      roomTariff = Math.max(roomTariff, b.roomTariff || 0);
      rstBill += (b.rstBill || 0);
      extraBed = Math.max(extraBed, b.extraBed || 0);
      gst = Math.max(gst, b.gst || 0);
      totalAmount = Math.max(totalAmount, b.totalAmount || 0);
      netAfterAdv = Math.max(netAfterAdv, b.netAfterAdv || 0);
      advance = Math.max(advance, b.advance || 0);
      const pm = parsePaymentMethod(b.paymentMethodCheckout) || parsePaymentMethod(b.paymentTypeAdv);
      if (pm) paymentMethod = pm;
      if (b.remarks) remarks.push(String(b.remarks));
    }

    // OM discount: gap between (tariff + extra + rst + gst) and recorded Total Amount
    const expected = roomTariff + rstBill + extraBed + gst;
    let discount = 0;
    if (totalAmount > 0 && expected > totalAmount + 0.5) discount = +(expected - totalAmount).toFixed(2);
    const grandTotal = totalAmount > 0 ? totalAmount : (expected > 0 ? expected : (roomTariff || room.base_rate));

    const nights = Math.max(1, Math.round((checkOutDate - checkInDate) / 86400000));
    const status = checkoutRow ? 'checked_out' : 'checked_in';
    const source = detectSource(remarks.join(' '), primary.guestName);

    const reservation = await db.Reservation.create({
      reservation_number: `R${String(resSeq++).padStart(6, '0')}`,
      guest_id: guest.id,
      room_id: room.id,
      check_in_date: fmtDate(checkInDate),
      check_out_date: fmtDate(checkOutDate),
      actual_check_in: actualCheckIn,
      actual_check_out: actualCheckOut,
      status,
      adults: 1,
      children: 0,
      nights,
      source,
      rate_per_night: roomTariff || room.base_rate || 2500,
      total_amount: grandTotal,
      advance_paid: advance,
      created_by: createdBy,
      extra_beds: extraBed > 0 ? 1 : 0,
      extra_bed_charge: extraBed > 0 ? extraBed : 0,
      discount_type: discount > 0 ? 'amount' : null,
      discount_value: discount > 0 ? discount : null,
      discount_reason: discount > 0 ? 'OM discount (Format A register)' : null,
      special_requests: remarks.join(' | ').slice(0, 1000) || null,
    });
    resCreated += 1;

    const totalPaid = advance + netAfterAdv;
    const balance = Math.max(grandTotal - totalPaid, 0);
    const payStatus = balance <= 0.5 && totalPaid > 0 ? 'paid'
      : totalPaid > 0 ? 'partial'
      : 'unpaid';

    const cgst = +(gst / 2).toFixed(2);
    const sgst = +(gst - cgst).toFixed(2);
    const subtotal = roomTariff + extraBed + rstBill;

    const billing = await db.Billing.create({
      invoice_number: `INV${String(invSeq++).padStart(6, '0')}`,
      reservation_id: reservation.id,
      guest_id: guest.id,
      subtotal,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: 0,
      discount_amount: discount,
      grand_total: grandTotal,
      paid_amount: totalPaid,
      balance_due: balance,
      payment_status: payStatus,
      due_date: fmtDate(checkOutDate),
      notes: remarks.join(' | ').slice(0, 1000) || null,
    });
    billingsCreated += 1;

    const ciDate = fmtDate(checkInDate);
    const billItems = [];
    if (roomTariff > 0) billItems.push({
      billing_id: billing.id, item_type: 'room_charge',
      description: `Room ${room.room_number} tariff (${nights} night${nights > 1 ? 's' : ''})`,
      quantity: 1, unit_price: roomTariff, amount: roomTariff,
      hsn_code: '996311', gst_rate: 12, date: ciDate,
    });
    if (extraBed > 0) billItems.push({
      billing_id: billing.id, item_type: 'service',
      description: 'Extra bed',
      quantity: 1, unit_price: extraBed, amount: extraBed,
      hsn_code: '996311', gst_rate: 12, date: ciDate,
    });
    if (rstBill > 0) billItems.push({
      billing_id: billing.id, item_type: 'restaurant',
      description: 'Restaurant charges',
      quantity: 1, unit_price: rstBill, amount: rstBill,
      hsn_code: '996331', gst_rate: 5, date: ciDate,
    });
    if (discount > 0) billItems.push({
      billing_id: billing.id, item_type: 'discount',
      description: 'OM discount',
      quantity: 1, unit_price: -discount, amount: -discount, date: ciDate,
    });
    if (billItems.length) await db.BillingItem.bulkCreate(billItems);

    // Payments
    if (advance > 0) {
      await db.Payment.create({
        billing_id: billing.id,
        amount: advance,
        payment_type: 'payment',
        payment_method: parsePaymentMethod(primary.paymentTypeAdv) || paymentMethod || 'cash',
        payment_date: actualCheckIn || checkInDate,
        notes: 'Advance on check-in',
        received_by: createdBy,
      });
      paymentsCreated += 1;
    }
    if (netAfterAdv > 0) {
      await db.Payment.create({
        billing_id: billing.id,
        amount: netAfterAdv,
        payment_type: 'payment',
        payment_method: paymentMethod || 'cash',
        payment_date: actualCheckOut || checkOutDate,
        notes: 'Balance on check-out',
        received_by: createdBy,
      });
      paymentsCreated += 1;
    }

    // Room status → occupied for in-house guests
    if (status === 'checked_in' && room.status !== 'occupied') {
      await room.update({ status: 'occupied' });
    }
  }

  // ── Infer missed checkouts ──
  // The cashier sometimes forgot to write a check-out row. Rule: if a room has
  // a later reservation, the earlier one must have already checked out before
  // the next guest arrived. For the latest open booking in each room, if its
  // check-in is before the last date recorded in the register, assume a
  // standard one-night stay ending at 11:00 AM.
  console.log('\n── Inferring missed checkouts ──');
  // Use the second-most-recent check-in date to avoid typo outliers in the
  // source (e.g. "31.04.2026" rolls forward to May 1). Then keep as in-house
  // any guest who checked in on the very last register day — they haven't
  // physically checked out yet when the register ended.
  const [distinctDates] = await db.sequelize.query(
    'SELECT DISTINCT check_in_date AS d FROM reservations ORDER BY check_in_date DESC LIMIT 2'
  );
  const lastLegitDateStr = distinctDates.length >= 2 ? distinctDates[1].d : (distinctDates[0] && distinctDates[0].d);
  const lastLegitDate = lastLegitDateStr ? new Date(`${lastLegitDateStr}T00:00:00`) : null;
  const keepOpenCutoff = lastLegitDate ? new Date(lastLegitDate) : null;
  if (keepOpenCutoff) keepOpenCutoff.setDate(keepOpenCutoff.getDate() - 1); // guests on last day or day-before stay in-house
  const checkoutHour = 11;
  let inferredCheckouts = 0;
  let billingsClosed = 0;
  let implicitPayments = 0;

  for (const room of rooms) {
    const resList = await db.Reservation.findAll({
      where: { room_id: room.id },
      order: [['check_in_date', 'ASC'], ['actual_check_in', 'ASC'], ['id', 'ASC']],
    });
    for (let i = 0; i < resList.length; i++) {
      const curr = resList[i];
      if (curr.status !== 'checked_in') continue;

      const next = resList[i + 1];
      let inferredOut;
      if (next) {
        inferredOut = next.actual_check_in || new Date(`${next.check_in_date}T${String(checkoutHour).padStart(2, '0')}:00:00`);
      } else {
        const ciDate = new Date(`${curr.check_in_date}T00:00:00`);
        const oneDayLater = new Date(ciDate);
        oneDayLater.setDate(oneDayLater.getDate() + 1);
        oneDayLater.setHours(checkoutHour, 0, 0, 0);
        if (!keepOpenCutoff || ciDate > keepOpenCutoff) continue;
        inferredOut = oneDayLater;
      }

      await curr.update({
        status: 'checked_out',
        actual_check_out: inferredOut,
        check_out_date: fmtDate(inferredOut),
      });
      inferredCheckouts += 1;

      const billing = await db.Billing.findOne({ where: { reservation_id: curr.id } });
      if (billing) {
        const gt = Number(billing.grand_total) || 0;
        const paid = Number(billing.paid_amount) || 0;
        const balance = Math.max(gt - paid, 0);
        if (balance > 0.5) {
          await db.Payment.create({
            billing_id: billing.id,
            amount: balance,
            payment_type: 'payment',
            payment_method: 'cash',
            payment_date: inferredOut,
            notes: 'Balance at inferred check-out (missed entry)',
            received_by: createdBy,
          });
          implicitPayments += 1;
        }
        await billing.update({
          paid_amount: gt,
          balance_due: 0,
          payment_status: 'paid',
        });
        billingsClosed += 1;
      }

      // Free the room if no one else is in it now
      const stillOccupied = resList.some(r =>
        r.id !== curr.id && r.status === 'checked_in'
      );
      if (!stillOccupied && room.status === 'occupied') {
        await room.update({ status: 'available' });
      }
    }
  }
  console.log(`  Reservations closed    : ${inferredCheckouts}`);
  console.log(`  Billings marked paid   : ${billingsClosed}`);
  console.log(`  Balance payments added : ${implicitPayments}`);

  console.log('\n── Summary ──');
  console.log(`Guests created      : ${guestsCreated}`);
  console.log(`Reservations created: ${resCreated}`);
  console.log(`Billings created    : ${billingsCreated}`);
  console.log(`Payments created    : ${paymentsCreated + implicitPayments}`);
  if (missingRooms.size) {
    console.log(`\n⚠ Skipped reservations for rooms not in DB: ${[...missingRooms].sort((a, b) => Number(a) - Number(b)).join(', ')}`);
    console.log('  (Create these rooms in Room Settings, then re-run if needed.)');
  }

  await closeAllConnections();
  console.log('\n✓ Done.');
}

main().catch(async (err) => {
  console.error('\n✗ Import failed:', err);
  try { await closeAllConnections(); } catch {}
  process.exit(1);
});
