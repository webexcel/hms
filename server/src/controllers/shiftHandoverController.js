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
          attributes: ['id', 'username', 'first_name', 'last_name', 'role'],
        },
        {
          model: User,
          as: 'incomingUser',
          attributes: ['id', 'username', 'first_name', 'last_name', 'role'],
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
    const handover = await ShiftHandover.create({
      ...req.body,
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
          attributes: ['id', 'username', 'first_name', 'last_name', 'role'],
        },
        {
          model: User,
          as: 'incomingUser',
          attributes: ['id', 'username', 'first_name', 'last_name', 'role'],
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
          attributes: ['id', 'username', 'first_name', 'last_name', 'role'],
        },
        {
          model: User,
          as: 'incomingUser',
          attributes: ['id', 'username', 'first_name', 'last_name', 'role'],
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
          attributes: ['id', 'username', 'first_name', 'last_name', 'role'],
        },
        {
          model: User,
          as: 'incomingUser',
          attributes: ['id', 'username', 'first_name', 'last_name', 'role'],
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
          attributes: ['id', 'username', 'first_name', 'last_name', 'role'],
        },
        {
          model: User,
          as: 'incomingUser',
          attributes: ['id', 'username', 'first_name', 'last_name', 'role'],
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

module.exports = {
  list,
  create,
  getPending,
  accept,
  reject,
  getById,
  getStats,
};
