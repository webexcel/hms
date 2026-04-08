const { getGstRateByItemType, calculateGst, getHsnCode } = require('./gst');

/**
 * Derive payment status from paid amount and grand total.
 * Single source of truth — used by recalculateBillingTotals and recordPayment.
 */
const derivePaymentStatus = (paidAmount, grandTotal) => {
  if (paidAmount >= grandTotal && grandTotal > 0) return 'paid';
  if (paidAmount > 0 && grandTotal > 0) return 'partial';
  if (paidAmount > 0 && grandTotal === 0) return 'paid';
  return 'unpaid';
};

/**
 * Single source of truth for billing total calculations.
 *
 * RULE: Never manually set subtotal/cgst/sgst/grand_total on a billing record.
 * Instead: create/update billing items, then call recalculateBillingTotals().
 *
 * @param {Object} billing - Sequelize Billing instance
 * @param {Object} BillingItem - Sequelize BillingItem model
 * @param {Object} [options]
 * @param {Object} [options.transaction] - Sequelize transaction
 * @param {Array}  [options.items] - Pre-fetched billing items (skips DB query if provided)
 * @param {number} [options.discountAmount] - Override discount amount (used at checkout)
 * @param {string} [options.discountNotes] - Discount reason/notes
 * @returns {Object} Updated billing instance
 */
const recalculateBillingTotals = async (billing, BillingItem, options = {}) => {
  const { transaction, items: prefetchedItems, discountAmount, discountNotes } = options;
  const queryOpts = transaction ? { transaction } : {};

  const items = prefetchedItems || await BillingItem.findAll({
    where: { billing_id: billing.id },
    ...queryOpts,
  });

  let subtotal = 0;
  for (const item of items) {
    subtotal += parseFloat(item.amount) || 0;
  }

  const discount = discountAmount != null
    ? Math.round(discountAmount * 100) / 100
    : Math.round(parseFloat(billing.discount_amount || 0) * 100) / 100;

  // Discount reduces taxable amount — GST is calculated on (subtotal - discount)
  // Distribute discount proportionally across items for correct per-slab GST
  const taxableSubtotal = Math.max(0, subtotal - discount);
  const discountRatio = subtotal > 0 ? taxableSubtotal / subtotal : 1;

  let totalGst = 0;
  for (const item of items) {
    const amt = parseFloat(item.amount) || 0;
    const taxableAmt = Math.round(amt * discountRatio * 100) / 100;
    const gstRate = getGstRateByItemType(item.item_type, taxableAmt);
    const gstResult = calculateGst(taxableAmt, gstRate);
    totalGst += gstResult.totalGst;
  }

  const cgst = Math.round(totalGst / 2 * 100) / 100;
  const sgst = Math.round(totalGst / 2 * 100) / 100;
  const grandTotal = Math.round((subtotal - discount + cgst + sgst) * 100) / 100;
  const paidAmount = parseFloat(billing.paid_amount) || 0;
  const balanceDue = Math.round((grandTotal - paidAmount) * 100) / 100;

  const updateData = {
    subtotal: Math.round(subtotal * 100) / 100,
    cgst_amount: cgst,
    sgst_amount: sgst,
    grand_total: grandTotal,
    balance_due: balanceDue,
    payment_status: derivePaymentStatus(paidAmount, grandTotal),
  };

  if (discountAmount != null) {
    updateData.discount_amount = discount;
  }
  if (discountNotes) {
    updateData.notes = discountNotes;
  }

  await billing.update(updateData, queryOpts);
  return billing;
};

/**
 * Create a billing record with zero totals.
 * Totals will be populated by recalculateBillingTotals after items are added.
 */
const createEmptyBilling = async (Billing, data, options = {}) => {
  const { transaction } = options;
  return Billing.create({
    reservation_id: data.reservation_id,
    guest_id: data.guest_id,
    invoice_number: data.invoice_number || 'INV-' + Date.now() + (data.reservation_id ? '-' + data.reservation_id : ''),
    subtotal: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    grand_total: 0,
    paid_amount: data.paid_amount || 0,
    balance_due: 0,
    payment_status: data.paid_amount > 0 ? 'partial' : 'unpaid',
  }, transaction ? { transaction } : {});
};

/**
 * Create standard billing items for a reservation (room charge + extra beds).
 * Call recalculateBillingTotals() after this.
 */
const createReservationBillingItems = async (BillingItem, billingId, reservation, room, options = {}) => {
  const { transaction } = options;
  const queryOpts = transaction ? { transaction } : {};
  const isHourly = reservation.booking_type === 'hourly';
  const nights = reservation.nights || 1;
  const items = [];

  // Room charge
  const roomQty = isHourly ? (reservation.expected_hours || 3) : nights;
  const roomUnitPrice = isHourly
    ? (parseFloat(reservation.hourly_rate) || 0)
    : (parseFloat(reservation.rate_per_night) || 0);
  const roomAmount = roomQty * roomUnitPrice;

  const roomDesc = isHourly
    ? `Room ${room?.room_number || ''} - ${roomQty} hrs @ ₹${roomUnitPrice}/hr`
    : `Room ${room?.room_number || ''} - ${nights} night(s) @ ₹${roomUnitPrice}/night`;

  items.push(await BillingItem.create({
    billing_id: billingId,
    item_type: 'room_charge',
    description: roomDesc,
    quantity: roomQty,
    unit_price: roomUnitPrice,
    amount: Math.round(roomAmount * 100) / 100,
    gst_rate: getGstRateByItemType('room_charge', roomAmount),
    hsn_code: getHsnCode('room_charge'),
    date: new Date(),
  }, queryOpts));

  // Extra bed charge
  const extraBeds = parseInt(reservation.extra_beds) || 0;
  const extraBedCharge = parseFloat(reservation.extra_bed_charge) || 0;
  if (!isHourly && extraBeds > 0 && extraBedCharge > 0) {
    const extraBedTotal = nights * extraBeds * extraBedCharge;
    items.push(await BillingItem.create({
      billing_id: billingId,
      item_type: 'service',
      description: `Extra Bed (${nights} night${nights > 1 ? 's' : ''} x ${extraBeds} bed${extraBeds > 1 ? 's' : ''} @ ₹${extraBedCharge}/night)`,
      quantity: extraBeds,
      unit_price: extraBedCharge * nights,
      amount: Math.round(extraBedTotal * 100) / 100,
      gst_rate: getGstRateByItemType('service', extraBedTotal),
      hsn_code: getHsnCode('room_charge'),
      date: new Date(),
    }, queryOpts));
  }

  return items;
};

module.exports = {
  derivePaymentStatus,
  recalculateBillingTotals,
  createEmptyBilling,
  createReservationBillingItems,
};
