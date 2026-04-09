const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { getPagination, getPagingData } = require('../utils/pagination');
const waNotifier = require('../services/whatsapp/hotelNotifier');

const list = async (req, res, next) => {
  try {
    const { ShiftHandover, User } = req.db;
    const { page = 1, limit = 10 } = req.query;
    const { offset, limit: size } = getPagination(page, limit);

    const data = await ShiftHandover.findAndCountAll({
      include: [
        {
          model: User,
          as: 'outgoingUser',
          attributes: ['id', 'username', 'full_name', 'role'],
        },
        {
          model: User,
          as: 'incomingUser',
          attributes: ['id', 'username', 'full_name', 'role'],
        },
      ],
      limit: size,
      offset,
      order: [['created_at', 'DESC']],
    });

    const response = getPagingData(data, page, size);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { sequelize, ShiftHandover, User, Room, Reservation, Billing, Payment } = req.db;

    // Generate next FA sequence number
    const lastReport = await ShiftHandover.findOne({
      where: { report_number: { [Op.ne]: null } },
      order: [['report_number', 'DESC']],
      attributes: ['report_number'],
      raw: true,
    });
    let nextNum = 1;
    if (lastReport?.report_number) {
      const match = lastReport.report_number.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1]) + 1;
    }
    const reportNumber = `FA-${String(nextNum).padStart(4, '0')}`;

    const handover = await ShiftHandover.create({
      ...req.body,
      report_number: reportNumber,
      outgoing_user_id: req.user.id,
      status: 'pending',
    });

    const created = await ShiftHandover.findByPk(handover.id, {
      include: [
        {
          model: User,
          as: 'outgoingUser',
          attributes: ['id', 'username', 'full_name', 'role', 'phone'],
        },
        {
          model: User,
          as: 'incomingUser',
          attributes: ['id', 'username', 'full_name', 'role', 'phone'],
        },
      ],
    });

    // Gather real-time hotel stats for WhatsApp report
    const today = dayjs().format('YYYY-MM-DD');

    const [roomStats, pendingCheckins, pendingCheckouts, outstandingData] = await Promise.all([
      // Room occupancy
      Room.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      }),
      // Today's pending check-ins
      Reservation.count({
        where: {
          check_in_date: today,
          status: { [Op.in]: ['pending', 'confirmed'] },
        },
      }),
      // Today's pending check-outs
      Reservation.count({
        where: {
          check_out_date: today,
          status: 'checked_in',
        },
      }),
      // Outstanding bills
      Billing.findAll({
        where: { payment_status: { [Op.in]: ['unpaid', 'partial'] } },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('balance_due')), 'totalDue'],
        ],
        raw: true,
      }),
    ]);

    const totalRooms = roomStats.reduce((sum, r) => sum + parseInt(r.count), 0);
    const occupiedRooms = parseInt((roomStats.find(r => r.status === 'occupied') || {}).count || 0);
    const outstandingBills = parseInt(outstandingData[0]?.count || 0);
    const outstandingAmount = parseFloat(outstandingData[0]?.totalDue || 0).toFixed(2);

    // Parse tasks_pending JSON
    let tasksPending = created.tasks_pending || [];
    if (typeof tasksPending === 'string') {
      try { tasksPending = JSON.parse(tasksPending); } catch (e) { tasksPending = []; }
    }

    // Get management phone numbers (admin + manager users)
    const managers = await User.findAll({
      where: { role: { [Op.in]: ['admin', 'manager'] }, is_active: true },
      attributes: ['phone'],
      raw: true,
    });
    const managementPhones = managers.map(m => m.phone).filter(Boolean);

    const outgoingName = created.outgoingUser
      ? (created.outgoingUser.full_name || created.outgoingUser.username)
      : 'Unknown';
    const incomingName = created.incomingUser
      ? (created.incomingUser.full_name || created.incomingUser.username)
      : null;

    // Send WhatsApp shift handover report to management (fire-and-forget)
    waNotifier.notifyShiftHandover({
      managementPhones,
      outgoingStaffName: outgoingName,
      incomingStaffName: incomingName,
      shiftDate: dayjs(created.shift_date).format('DD MMM YYYY'),
      shift: created.shift,
      cashInHand: created.cash_in_hand,
      totalCollections: created.total_collections,
      pendingCheckouts,
      pendingCheckins,
      occupiedRooms,
      totalRooms,
      outstandingBills,
      outstandingAmount,
      tasksPending,
      notes: created.notes,
    }).catch(() => {});

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

const getPending = async (req, res, next) => {
  try {
    const { ShiftHandover, User } = req.db;
    const handovers = await ShiftHandover.findAll({
      where: {
        incoming_user_id: req.user.id,
        status: 'pending',
      },
      include: [
        {
          model: User,
          as: 'outgoingUser',
          attributes: ['id', 'username', 'full_name', 'role'],
        },
        {
          model: User,
          as: 'incomingUser',
          attributes: ['id', 'username', 'full_name', 'role'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(handovers);
  } catch (error) {
    next(error);
  }
};

const accept = async (req, res, next) => {
  try {
    const { ShiftHandover, User } = req.db;
    const { id } = req.params;

    const handover = await ShiftHandover.findByPk(id);

    if (!handover) {
      return res.status(404).json({ message: 'Shift handover not found' });
    }

    if (handover.status !== 'pending') {
      return res.status(400).json({ message: 'Shift handover is not pending' });
    }

    await handover.update({
      status: 'accepted',
      incoming_user_id: req.user.id,
    });

    const updated = await ShiftHandover.findByPk(id, {
      include: [
        {
          model: User,
          as: 'outgoingUser',
          attributes: ['id', 'username', 'full_name', 'role'],
        },
        {
          model: User,
          as: 'incomingUser',
          attributes: ['id', 'username', 'full_name', 'role'],
        },
      ],
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const reject = async (req, res, next) => {
  try {
    const { ShiftHandover, User } = req.db;
    const { id } = req.params;

    const handover = await ShiftHandover.findByPk(id);

    if (!handover) {
      return res.status(404).json({ message: 'Shift handover not found' });
    }

    if (handover.status !== 'pending') {
      return res.status(400).json({ message: 'Shift handover is not pending' });
    }

    await handover.update({ status: 'rejected' });

    const updated = await ShiftHandover.findByPk(id, {
      include: [
        {
          model: User,
          as: 'outgoingUser',
          attributes: ['id', 'username', 'full_name', 'role'],
        },
        {
          model: User,
          as: 'incomingUser',
          attributes: ['id', 'username', 'full_name', 'role'],
        },
      ],
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { ShiftHandover, User } = req.db;
    const handover = await ShiftHandover.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'outgoingUser',
          attributes: ['id', 'username', 'full_name', 'role'],
        },
        {
          model: User,
          as: 'incomingUser',
          attributes: ['id', 'username', 'full_name', 'role'],
        },
      ],
    });

    if (!handover) {
      return res.status(404).json({ message: 'Shift handover not found' });
    }

    res.json(handover);
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const { ShiftHandover } = req.db;
    const total = await ShiftHandover.count();
    const pending = await ShiftHandover.count({ where: { status: 'pending' } });
    const accepted = await ShiftHandover.count({ where: { status: 'accepted' } });
    const rejected = await ShiftHandover.count({ where: { status: 'rejected' } });

    res.json({ total, pending, accepted, rejected });
  } catch (error) {
    next(error);
  }
};

// POST /hr-handover — Record money given to HR
const createHrHandover = async (req, res, next) => {
  try {
    const { HrHandover } = req.db;
    const { amount, given_to, notes, shift_date, shift } = req.body;
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });
    if (!given_to) return res.status(400).json({ message: 'HR person name is required' });

    const record = await HrHandover.create({
      amount: parseFloat(amount),
      given_to,
      notes: notes || null,
      shift_date: shift_date || dayjs().format('YYYY-MM-DD'),
      shift: shift || null,
      created_by: req.user?.id || null,
    });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

// GET /hr-handover?date= — List HR handovers for a date
const listHrHandovers = async (req, res, next) => {
  try {
    const { HrHandover } = req.db;
    const { date } = req.query;
    const reportDate = date || dayjs().format('YYYY-MM-DD');
    const records = await HrHandover.findAll({
      where: { shift_date: reportDate },
      order: [['created_at', 'ASC']],
      raw: true,
    });
    const total = records.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    res.json({ records, total: Math.round(total * 100) / 100 });
  } catch (error) {
    next(error);
  }
};

// DELETE /hr-handover/:id
const deleteHrHandover = async (req, res, next) => {
  try {
    const { HrHandover } = req.db;
    const record = await HrHandover.findByPk(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    await record.destroy();
    res.json({ message: 'HR handover record deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /format-a/last-closing — Get the closing balance from the most recent saved handover
const getLastClosing = async (req, res, next) => {
  try {
    const { ShiftHandover } = req.db;
    const last = await ShiftHandover.findOne({
      where: { status: { [Op.in]: ['pending', 'accepted'] } },
      order: [['created_at', 'DESC']],
    });
    const closingBalance = last ? parseFloat(last.cash_in_hand) || 0 : 0;
    res.json({ closing_balance: closingBalance });
  } catch (error) {
    next(error);
  }
};

// GET /format-a — Auto-populated Format A shift handover report
const getFormatA = async (req, res, next) => {
  try {
    const { Room, Guest, Reservation, Payment, Billing, RestaurantOrder, ShiftHandover } = req.db;
    const { date } = req.query;
    const reportDate = date || dayjs().format('YYYY-MM-DD');
    const dayEnd = dayjs(reportDate).endOf('day').toDate();

    // Find last saved shift — use its timestamp as the start for this shift's data
    const lastHandover = await ShiftHandover.findOne({
      order: [['created_at', 'DESC']],
      raw: true,
    });
    const previousClosingBalance = lastHandover ? parseFloat(lastHandover.cash_in_hand) || 0 : 0;
    // Data start = last handover time OR start of today (whichever applies)
    const todayStart = dayjs(reportDate).startOf('day').toDate();
    let dayStart = todayStart;
    const lastHandoverTime = lastHandover?.created_at || lastHandover?.createdAt;
    if (lastHandover && lastHandoverTime) {
      const handoverTime = new Date(lastHandoverTime);
      // Only use handover time if it's today (same reportDate)
      if (dayjs(handoverTime).format('YYYY-MM-DD') === reportDate) {
        dayStart = handoverTime;
      }
    }

    // 1. Room-wise status with guest details
    const rooms = await Room.findAll({
      order: [['room_number', 'ASC']],
      raw: true,
    });

    // Get active reservations for today (checked_in or reserved for today)
    const activeReservations = await Reservation.findAll({
      where: {
        status: { [Op.in]: ['checked_in', 'confirmed', 'pending'] },
        check_in_date: { [Op.lte]: reportDate },
        check_out_date: { [Op.gte]: reportDate },
      },
      include: [
        { model: Guest, as: 'guest', attributes: ['id', 'first_name', 'last_name', 'phone'] },
      ],
    });

    // Map reservations by room_id
    const resByRoom = {};
    for (const r of activeReservations) {
      resByRoom[r.room_id] = r;
    }

    const roomList = rooms.map(room => {
      const res = resByRoom[room.id];
      return {
        room_number: room.room_number,
        floor: room.floor,
        room_type: room.room_type,
        status: room.status,
        guest_name: res?.guest ? `${res.guest.first_name} ${res.guest.last_name}`.trim() : null,
        guest_phone: res?.guest?.phone || null,
        check_in: res?.check_in_date || null,
        check_out: res?.check_out_date || null,
        rate_per_night: res ? parseFloat(res.rate_per_night) || 0 : null,
        advance_paid: res ? parseFloat(res.advance_paid) || 0 : null,
        reservation_status: res?.status || null,
        reservation_number: res?.reservation_number || null,
      };
    });

    // Room summary counts
    const roomSummary = {
      total: rooms.length,
      occupied: rooms.filter(r => r.status === 'occupied').length,
      available: rooms.filter(r => r.status === 'available').length,
      reserved: rooms.filter(r => r.status === 'reserved').length,
      maintenance: rooms.filter(r => r.status === 'maintenance').length,
      cleaning: rooms.filter(r => r.status === 'cleaning').length,
    };

    // 2. Today's check-ins
    const checkIns = await Reservation.findAll({
      where: {
        actual_check_in: { [Op.between]: [dayStart, dayEnd] },
      },
      include: [
        { model: Guest, as: 'guest', attributes: ['first_name', 'last_name', 'phone'] },
        { model: Room, as: 'room', attributes: ['room_number', 'room_type'] },
      ],
      order: [['actual_check_in', 'ASC']],
    });

    // 3. Today's check-outs
    const checkOuts = await Reservation.findAll({
      where: {
        actual_check_out: { [Op.between]: [dayStart, dayEnd] },
      },
      include: [
        { model: Guest, as: 'guest', attributes: ['first_name', 'last_name', 'phone'] },
        { model: Room, as: 'room', attributes: ['room_number', 'room_type'] },
      ],
      order: [['actual_check_out', 'ASC']],
    });

    // 4. All payments received today (detailed breakup)
    const payments = await Payment.findAll({
      where: {
        created_at: { [Op.between]: [dayStart, dayEnd] },
      },
      include: [
        {
          model: Billing, as: 'billing',
          attributes: ['id', 'invoice_number', 'reservation_id'],
          include: [
            { model: Guest, as: 'guest', attributes: ['first_name', 'last_name'] },
            { model: Reservation, as: 'reservation', attributes: ['room_id', 'reservation_number'],
              include: [{ model: Room, as: 'room', attributes: ['room_number'] }],
            },
          ],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    const paymentList = payments.map(p => ({
      id: p.id,
      time: dayjs(p.created_at).format('hh:mm A'),
      amount: parseFloat(p.amount) || 0,
      mode: p.payment_mode,
      reference: p.reference_number || null,
      guest_name: p.billing?.guest ? `${p.billing.guest.first_name} ${p.billing.guest.last_name}`.trim() : 'Walk-in',
      room_number: p.billing?.reservation?.room?.room_number || null,
      invoice_number: p.billing?.invoice_number || null,
      reservation_number: p.billing?.reservation?.reservation_number || null,
    }));

    // Payment summary by mode
    const paymentSummary = {
      cash: 0, card: 0, upi: 0, bank_transfer: 0, total: 0,
    };
    for (const p of paymentList) {
      const mode = p.mode || 'cash';
      if (paymentSummary[mode] !== undefined) paymentSummary[mode] += p.amount;
      paymentSummary.total += p.amount;
    }

    // 5. Advances collected today (from reservations created/updated today with advance)
    const advanceReservations = await Reservation.findAll({
      where: {
        advance_paid: { [Op.gt]: 0 },
        created_at: { [Op.between]: [dayStart, dayEnd] },
      },
      include: [
        { model: Guest, as: 'guest', attributes: ['first_name', 'last_name'] },
        { model: Room, as: 'room', attributes: ['room_number', 'room_type'] },
      ],
      order: [['created_at', 'ASC']],
    });

    const advances = advanceReservations.map(r => ({
      reservation_number: r.reservation_number,
      guest_name: r.guest ? `${r.guest.first_name} ${r.guest.last_name}`.trim() : 'Unknown',
      room_number: r.room?.room_number || null,
      room_type: r.room?.room_type || null,
      amount: parseFloat(r.advance_paid) || 0,
      check_in: r.check_in_date,
      check_out: r.check_out_date,
    }));

    const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);

    // 6. Outstanding bills
    const outstandingBills = await Billing.findAll({
      where: { payment_status: { [Op.in]: ['unpaid', 'partial'] }, balance_due: { [Op.gt]: 0 } },
      include: [
        { model: Guest, as: 'guest', attributes: ['first_name', 'last_name'] },
        { model: Reservation, as: 'reservation', attributes: ['reservation_number'],
          include: [{ model: Room, as: 'room', attributes: ['room_number'] }],
        },
      ],
      order: [['balance_due', 'DESC']],
    });

    const outstanding = outstandingBills.map(b => ({
      invoice_number: b.invoice_number,
      guest_name: b.guest ? `${b.guest.first_name} ${b.guest.last_name}`.trim() : 'Unknown',
      room_number: b.reservation?.room?.room_number || null,
      grand_total: parseFloat(b.grand_total) || 0,
      paid_amount: parseFloat(b.paid_amount) || 0,
      balance_due: parseFloat(b.balance_due) || 0,
      status: b.payment_status,
    }));

    const totalOutstanding = outstanding.reduce((sum, o) => sum + o.balance_due, 0);

    // 7. Restaurant orders today (room guests + walk-in customers)
    const restaurantOrders = await RestaurantOrder.findAll({
      where: {
        created_at: { [Op.between]: [dayStart, dayEnd] },
        status: { [Op.ne]: 'cancelled' },
      },
      raw: true,
    });

    const totalRestaurantBills = Math.round(restaurantOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) * 100) / 100;

    // 8. Checkout payments today (payments linked to checked-out reservations)
    const checkoutPayments = await Payment.findAll({
      where: {
        created_at: { [Op.between]: [dayStart, dayEnd] },
      },
      include: [{
        model: Billing, as: 'billing',
        required: true,
        attributes: ['reservation_id'],
        include: [{
          model: Reservation, as: 'reservation',
          required: true,
          attributes: ['status', 'actual_check_out'],
          where: {
            actual_check_out: { [Op.between]: [dayStart, dayEnd] },
          },
        }],
      }],
    });

    const totalCheckoutBalance = Math.round(checkoutPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) * 100) / 100;

    // 9. Refunds issued today
    const refundPayments = await Payment.findAll({
      where: {
        created_at: { [Op.between]: [dayStart, dayEnd] },
        payment_type: 'refund',
      },
      raw: true,
    });
    const totalRefunds = Math.round(refundPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) * 100) / 100;

    // 10. HR handovers today
    const { HrHandover } = req.db;
    const hrHandovers = await HrHandover.findAll({
      where: { shift_date: reportDate },
      order: [['created_at', 'ASC']],
      raw: true,
    });
    const totalHrHandover = Math.round(hrHandovers.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0) * 100) / 100;

    res.json({
      report_name: 'Format A - Shift Handover Report',
      report_date: reportDate,
      generated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      generated_by: req.user?.username || 'System',
      previous_closing_balance: previousClosingBalance,
      last_report_number: lastHandover?.report_number || null,

      room_summary: roomSummary,
      rooms: roomList,

      check_ins: checkIns.map(r => ({
        reservation_number: r.reservation_number,
        guest_name: r.guest ? `${r.guest.first_name} ${r.guest.last_name}`.trim() : 'Unknown',
        room_number: r.room?.room_number,
        room_type: r.room?.room_type,
        check_in_time: dayjs(r.actual_check_in).format('hh:mm A'),
        advance_paid: parseFloat(r.advance_paid) || 0,
      })),
      check_ins_count: checkIns.length,

      check_outs: checkOuts.map(r => ({
        reservation_number: r.reservation_number,
        guest_name: r.guest ? `${r.guest.first_name} ${r.guest.last_name}`.trim() : 'Unknown',
        room_number: r.room?.room_number,
        room_type: r.room?.room_type,
        check_out_time: dayjs(r.actual_check_out).format('hh:mm A'),
      })),
      check_outs_count: checkOuts.length,

      payments: paymentList,
      payment_summary: paymentSummary,

      advances,
      total_advances: totalAdvances,

      outstanding,
      total_outstanding: totalOutstanding,

      total_restaurant_bills: totalRestaurantBills,
      restaurant_orders_count: restaurantOrders.length,
      total_checkout_balance: totalCheckoutBalance,
      total_refunds: totalRefunds,
      total_hr_handover: totalHrHandover,
      hr_handovers: hrHandovers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  create,
  getPending,
  accept,
  reject,
  getById,
  getStats,
  getFormatA,
  createHrHandover,
  listHrHandovers,
  deleteHrHandover,
};
