const { Op, fn, col } = require('sequelize');
const { Guest, Reservation, Room, Billing } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { search, vip_status, page, limit } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    if (vip_status) {
      where.vip_status = vip_status;
    }

    const { offset, limit: size } = paginate({ page, limit });

    const { count, rows } = await Guest.findAndCountAll({
      where,
      order: [['last_name', 'ASC'], ['first_name', 'ASC']],
      offset,
      limit: size,
    });

    res.json(paginatedResponse(rows, count, parseInt(page) || 1, size));
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const guest = await Guest.create(req.body);

    res.status(201).json(guest);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const guest = await Guest.findByPk(req.params.id, {
      include: [
        {
          model: Reservation,
          as: 'reservations',
          include: [{ model: Room, as: 'room' }],
        },
      ],
    });

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.json(guest);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const guest = await Guest.findByPk(req.params.id);

    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    await guest.update(req.body);

    res.json(guest);
  } catch (error) {
    next(error);
  }
};

// GET /stats - Guest statistics
const getStats = async (req, res, next) => {
  try {
    const totalGuests = await Guest.count();

    const inHouseGuests = await Guest.count({
      include: [{
        model: Reservation,
        as: 'reservations',
        where: { status: 'checked_in' },
        required: true,
      }],
    });

    const vipGuests = await Guest.count({ where: { vip_status: true } });

    const returningGuests = await Guest.count({
      include: [{
        model: Reservation,
        as: 'reservations',
        attributes: [],
      }],
      group: ['Guest.id'],
      having: fn('COUNT', col('reservations.id')),
    });

    const returningCount = returningGuests ? returningGuests.length : 0;

    res.json({
      total: totalGuests,
      in_house: inHouseGuests,
      vip: vipGuests,
      returning: returningCount,
    });
  } catch (error) {
    next(error);
  }
};

// GET /:id/stays - Guest stay history
const getStayHistory = async (req, res, next) => {
  try {
    const guest = await Guest.findByPk(req.params.id);
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    const stays = await Reservation.findAll({
      where: { guest_id: req.params.id },
      include: [
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing' },
      ],
      order: [['check_in_date', 'DESC']],
    });

    res.json(stays);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  create,
  getById,
  update,
  getStats,
  getStayHistory,
};
