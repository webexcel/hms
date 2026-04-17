const { Op, fn, col, literal } = require('sequelize');

const revenue = async (req, res, next) => {
  try {
    const { Payment } = req.db;
    const { start_date, end_date, group_by = 'day' } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'start_date and end_date are required' });
    }

    const where = {
      payment_date: {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      },
    };

    let dateGrouping;
    if (group_by === 'month') {
      dateGrouping = fn('DATE_FORMAT', col('payment_date'), '%Y-%m');
    } else {
      dateGrouping = fn('DATE', col('payment_date'));
    }

    const revenueData = await Payment.findAll({
      attributes: [
        [dateGrouping, 'date'],
        [fn('SUM', literal("CASE WHEN payment_type='refund' THEN -amount ELSE amount END")), 'total_revenue'],
        [fn('COUNT', col('id')), 'transaction_count'],
      ],
      where,
      group: [dateGrouping],
      order: [[dateGrouping, 'ASC']],
      raw: true,
    });

    const payments = await Payment.sum('amount', { where: { ...where, payment_type: 'payment' } }) || 0;
    const refunds = await Payment.sum('amount', { where: { ...where, payment_type: 'refund' } }) || 0;
    const totalRevenue = payments - refunds;

    res.json({
      data: revenueData,
      total_revenue: totalRevenue || 0,
      start_date,
      end_date,
      group_by,
    });
  } catch (error) {
    next(error);
  }
};

const occupancy = async (req, res, next) => {
  try {
    const { Reservation, Room } = req.db;
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'start_date and end_date are required' });
    }

    const totalRooms = await Room.count();

    const occupancyData = await Reservation.findAll({
      attributes: [
        [fn('DATE', col('check_in_date')), 'date'],
        [fn('COUNT', col('id')), 'occupied_rooms'],
      ],
      where: {
        check_in_date: {
          [Op.between]: [new Date(start_date), new Date(end_date)],
        },
        status: {
          [Op.in]: ['checked_in', 'confirmed'],
        },
      },
      group: [fn('DATE', col('check_in_date'))],
      order: [[fn('DATE', col('check_in_date')), 'ASC']],
      raw: true,
    });

    const dataWithRate = occupancyData.map((item) => ({
      ...item,
      total_rooms: totalRooms,
      occupancy_rate: totalRooms > 0
        ? Math.round((item.occupied_rooms / totalRooms) * 100 * 100) / 100
        : 0,
    }));

    res.json({
      data: dataWithRate,
      total_rooms: totalRooms,
      start_date,
      end_date,
    });
  } catch (error) {
    next(error);
  }
};

const dailySummary = async (req, res, next) => {
  try {
    const { Reservation, Payment, Room } = req.db;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRange = {
      [Op.gte]: today,
      [Op.lt]: tomorrow,
    };

    const checkIns = await Reservation.count({
      where: {
        check_in_date: todayRange,
        status: { [Op.in]: ['confirmed', 'checked_in'] },
      },
    });

    const checkOuts = await Reservation.count({
      where: {
        check_out_date: todayRange,
        status: { [Op.in]: ['checked_out', 'checked_in'] },
      },
    });

    const todayPayments = await Payment.sum('amount', {
      where: {
        payment_date: todayRange,
        payment_type: 'payment',
      },
    }) || 0;
    const todayRefunds = await Payment.sum('amount', {
      where: {
        payment_date: todayRange,
        payment_type: 'refund',
      },
    }) || 0;
    const todayRevenue = todayPayments - todayRefunds;

    const totalRooms = await Room.count();
    const occupiedRooms = await Reservation.count({
      where: {
        check_in_date: { [Op.lte]: today },
        check_out_date: { [Op.gte]: today },
        status: { [Op.in]: ['checked_in', 'confirmed'] },
      },
    });

    const occupancyRate = totalRooms > 0
      ? Math.round((occupiedRooms / totalRooms) * 100 * 100) / 100
      : 0;

    res.json({
      date: today.toISOString().split('T')[0],
      check_ins: checkIns,
      check_outs: checkOuts,
      revenue: todayRevenue || 0,
      total_rooms: totalRooms,
      occupied_rooms: occupiedRooms,
      available_rooms: totalRooms - occupiedRooms,
      occupancy_rate: occupancyRate,
    });
  } catch (error) {
    next(error);
  }
};

const guestStats = async (req, res, next) => {
  try {
    const { Guest, Reservation } = req.db;
    const totalGuests = await Guest.count();

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newGuestsThisMonth = await Guest.count({
      where: {
        created_at: { [Op.gte]: firstDayOfMonth },
      },
    });

    const vipCount = await Guest.count({
      where: {
        vip_status: true,
      },
    });

    const topGuests = await Guest.findAll({
      attributes: [
        'id',
        'first_name',
        'last_name',
        'email',
        [fn('COUNT', col('reservations.id')), 'total_stays'],
      ],
      include: [
        {
          model: Reservation,
          as: 'reservations',
          attributes: [],
        },
      ],
      group: ['Guest.id'],
      order: [[literal('total_stays'), 'DESC']],
      limit: 10,
      subQuery: false,
    });

    res.json({
      total_guests: totalGuests,
      new_guests_this_month: newGuestsThisMonth,
      vip_count: vipCount,
      top_guests: topGuests,
    });
  } catch (error) {
    next(error);
  }
};

// POST /checkout-history/insert — Insert a checkout into the standalone history table (called at checkout time)
const insertCheckoutHistory = async (req, res, next) => {
  try {
    const { CheckoutHistory, Reservation, Guest, Room, Billing, BillingItem, Payment } = req.db;
    const { reservation_id } = req.body;

    if (!reservation_id) return res.status(400).json({ message: 'reservation_id is required' });

    // Check if already exists
    const existing = await CheckoutHistory.findOne({ where: { reservation_id, is_deleted: false } });
    if (existing) return res.json({ message: 'Already in checkout history', id: existing.id });

    const r = await Reservation.findByPk(reservation_id, {
      include: [
        { model: Guest, as: 'guest', attributes: ['first_name', 'last_name', 'phone'] },
        { model: Room, as: 'room', attributes: ['room_number', 'room_type'] },
        { model: Billing, as: 'billing', include: [{ model: Payment, as: 'payments' }] },
      ],
    });
    if (!r) return res.status(404).json({ message: 'Reservation not found' });

    const b = r.billing;
    const payments = b?.payments || [];
    const totalPaid = payments.filter(p => p.payment_type !== 'refund').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const totalRefunded = payments.filter(p => p.payment_type === 'refund').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

    const record = await CheckoutHistory.create({
      reservation_number: r.reservation_number,
      gst_bill_number: b?.gst_bill_number || null,
      invoice_number: b?.invoice_number || null,
      guest_name: r.guest ? `${r.guest.first_name} ${r.guest.last_name}`.trim() : 'Unknown',
      guest_phone: r.guest?.phone || null,
      room_number: r.room?.room_number || null,
      room_type: r.room?.room_type || null,
      check_in: r.check_in_date,
      check_out: r.check_out_date,
      actual_check_in: r.actual_check_in,
      actual_check_out: r.actual_check_out,
      nights: r.nights || 0,
      rate_per_night: parseFloat(r.rate_per_night) || 0,
      source: r.source,
      meal_plan: r.meal_plan,
      subtotal: parseFloat(b?.subtotal) || 0,
      cgst: parseFloat(b?.cgst_amount) || 0,
      sgst: parseFloat(b?.sgst_amount) || 0,
      igst: parseFloat(b?.igst_amount) || 0,
      total_gst: Math.round(((parseFloat(b?.cgst_amount) || 0) + (parseFloat(b?.sgst_amount) || 0) + (parseFloat(b?.igst_amount) || 0)) * 100) / 100,
      discount: parseFloat(b?.discount_amount) || 0,
      grand_total: parseFloat(b?.grand_total) || 0,
      paid_amount: Math.round(totalPaid * 100) / 100,
      refunded_amount: Math.round(totalRefunded * 100) / 100,
      net_paid: Math.round((totalPaid - totalRefunded) * 100) / 100,
      cash_paid: Math.round(payments.filter(p => p.payment_method === 'cash' && p.payment_type !== 'refund').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) * 100) / 100,
      card_paid: Math.round(payments.filter(p => p.payment_method === 'card' && p.payment_type !== 'refund').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) * 100) / 100,
      upi_paid: Math.round(payments.filter(p => p.payment_method === 'upi' && p.payment_type !== 'refund').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) * 100) / 100,
      payment_status: b?.payment_status || 'unknown',
      reservation_id: r.id,
      billing_id: b?.id || null,
      created_by: req.user?.id || null,
    });

    res.status(201).json({ message: 'Added to checkout history', id: record.id });
  } catch (error) {
    next(error);
  }
};

// GET /checkout-history — Read from standalone table
const checkoutHistory = async (req, res, next) => {
  try {
    const { CheckoutHistory } = req.db;
    const { from, to, page = 1, limit = 50 } = req.query;
    const dayjs = require('dayjs');

    const where = { is_deleted: false };
    if (from || to) {
      where.actual_check_out = {};
      if (from) where.actual_check_out[Op.gte] = dayjs(from).startOf('day').toDate();
      if (to) where.actual_check_out[Op.lte] = dayjs(to).endOf('day').toDate();
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await CheckoutHistory.findAndCountAll({
      where,
      order: [['actual_check_out', 'DESC']],
      limit: parseInt(limit),
      offset,
      raw: true,
    });

    const data = rows.map(r => ({
      id: r.id,
      ...r,
      subtotal: parseFloat(r.subtotal) || 0,
      cgst: parseFloat(r.cgst) || 0,
      sgst: parseFloat(r.sgst) || 0,
      igst: parseFloat(r.igst) || 0,
      total_gst: parseFloat(r.total_gst) || 0,
      discount: parseFloat(r.discount) || 0,
      grand_total: parseFloat(r.grand_total) || 0,
      paid_amount: parseFloat(r.paid_amount) || 0,
      refunded_amount: parseFloat(r.refunded_amount) || 0,
      net_paid: parseFloat(r.net_paid) || 0,
      cash_paid: parseFloat(r.cash_paid) || 0,
      card_paid: parseFloat(r.card_paid) || 0,
      upi_paid: parseFloat(r.upi_paid) || 0,
    }));

    const summary = {
      total_checkouts: count,
      total_subtotal: Math.round(data.reduce((s, d) => s + d.subtotal, 0) * 100) / 100,
      total_gst: Math.round(data.reduce((s, d) => s + d.total_gst, 0) * 100) / 100,
      total_discount: Math.round(data.reduce((s, d) => s + d.discount, 0) * 100) / 100,
      total_grand: Math.round(data.reduce((s, d) => s + d.grand_total, 0) * 100) / 100,
      total_paid: Math.round(data.reduce((s, d) => s + d.paid_amount, 0) * 100) / 100,
      total_refunded: Math.round(data.reduce((s, d) => s + d.refunded_amount, 0) * 100) / 100,
      total_cash: Math.round(data.reduce((s, d) => s + d.cash_paid, 0) * 100) / 100,
      total_card: Math.round(data.reduce((s, d) => s + d.card_paid, 0) * 100) / 100,
      total_upi: Math.round(data.reduce((s, d) => s + d.upi_paid, 0) * 100) / 100,
    };

    res.json({
      data,
      summary,
      pagination: { total: count, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// POST /generate-bill-numbers — Assign sequential bill numbers to selected checkout history records
const generateBillNumbers = async (req, res, next) => {
  try {
    const { CheckoutHistory } = req.db;
    const { ids } = req.body;
    const billing_ids = ids || req.body.billing_ids; // support both field names

    if (!billing_ids || !Array.isArray(billing_ids) || billing_ids.length === 0) {
      return res.status(400).json({ message: 'Please select at least one checkout' });
    }

    // Check if any already have bill numbers
    const existing = await CheckoutHistory.findAll({
      where: { id: { [Op.in]: billing_ids }, bill_number: { [Op.ne]: null } },
      attributes: ['id', 'bill_number'],
      raw: true,
    });
    if (existing.length > 0) {
      return res.status(400).json({
        message: `${existing.length} item(s) already have bill numbers: ${existing.map(e => e.bill_number).join(', ')}`,
      });
    }

    // Get the last bill number to continue the sequence
    const lastBill = await CheckoutHistory.findOne({
      where: { bill_number: { [Op.regexp]: '^BILL-[0-9]+$' } },
      order: [['bill_number', 'DESC']],
      attributes: ['bill_number'],
      raw: true,
    });

    let nextNum = 1;
    if (lastBill?.bill_number) {
      const match = lastBill.bill_number.match(/^BILL-(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }

    // Assign in order of checkout date
    const records = await CheckoutHistory.findAll({
      where: { id: { [Op.in]: billing_ids } },
      order: [['actual_check_out', 'ASC']],
    });

    const generated = [];
    for (const record of records) {
      const billNumber = `BILL-${String(nextNum).padStart(4, '0')}`;
      await record.update({ bill_number: billNumber });
      generated.push({ id: record.id, bill_number: billNumber });
      nextNum++;
    }

    // Fetch updated records for print
    const printData = await CheckoutHistory.findAll({
      where: { id: { [Op.in]: billing_ids } },
      order: [['bill_number', 'ASC']],
      raw: true,
    });

    const pd = printData.map(d => ({ ...d, subtotal: parseFloat(d.subtotal) || 0, cgst: parseFloat(d.cgst) || 0, sgst: parseFloat(d.sgst) || 0, igst: parseFloat(d.igst) || 0, total_gst: parseFloat(d.total_gst) || 0, discount: parseFloat(d.discount) || 0, grand_total: parseFloat(d.grand_total) || 0 }));

    const totals = {
      subtotal: Math.round(pd.reduce((s, d) => s + d.subtotal, 0) * 100) / 100,
      cgst: Math.round(pd.reduce((s, d) => s + d.cgst, 0) * 100) / 100,
      sgst: Math.round(pd.reduce((s, d) => s + d.sgst, 0) * 100) / 100,
      total_gst: Math.round(pd.reduce((s, d) => s + d.total_gst, 0) * 100) / 100,
      discount: Math.round(pd.reduce((s, d) => s + d.discount, 0) * 100) / 100,
      grand_total: Math.round(pd.reduce((s, d) => s + d.grand_total, 0) * 100) / 100,
    };

    res.json({
      message: `Bill numbers generated: ${generated[0].bill_number} to ${generated[generated.length - 1].bill_number}`,
      generated,
      print_data: pd,
      totals,
    });
  } catch (error) {
    next(error);
  }
};

// POST /reset-bill-sequence — Clear bill numbers except permanent ones
const resetBillSequence = async (req, res, next) => {
  try {
    const { CheckoutHistory } = req.db;
    const where = { bill_number: { [Op.ne]: null }, is_permanent: { [Op.ne]: true } };
    const count = await CheckoutHistory.count({ where });
    await CheckoutHistory.update({ bill_number: null }, { where });
    const permanentCount = await CheckoutHistory.count({ where: { is_permanent: true, bill_number: { [Op.ne]: null } } });
    res.json({ message: `${count} bill number(s) cleared. ${permanentCount} permanent bill(s) kept.` });
  } catch (error) {
    next(error);
  }
};

// POST /checkout-history/:id/toggle-permanent — Lock/unlock a bill number
const togglePermanent = async (req, res, next) => {
  try {
    const { CheckoutHistory } = req.db;
    const record = await CheckoutHistory.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (!record.bill_number) return res.status(400).json({ message: 'No bill number to lock' });
    await record.update({ is_permanent: !record.is_permanent });
    res.json({ is_permanent: !record.is_permanent, message: record.is_permanent ? 'Bill unlocked' : 'Bill locked permanently' });
  } catch (error) {
    next(error);
  }
};

// DELETE /checkout-history/:id — Soft delete a checkout record
const deleteCheckoutRecord = async (req, res, next) => {
  try {
    const { CheckoutHistory } = req.db;
    const record = await CheckoutHistory.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.bill_number) {
      return res.status(400).json({ message: 'Cannot delete a record with a generated bill number' });
    }
    await record.update({ is_deleted: true });
    res.json({ message: 'Record removed from checkout history' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  revenue,
  occupancy,
  dailySummary,
  guestStats,
  insertCheckoutHistory,
  checkoutHistory,
  generateBillNumbers,
  resetBillSequence,
  togglePermanent,
  deleteCheckoutRecord,
};
