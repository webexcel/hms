const { Op } = require('sequelize');
const { paginate, paginatedResponse } = require('../utils/pagination');

const list = async (req, res, next) => {
  try {
    const { Room, Reservation, Guest } = req.db;
    const { floor, type, status, page, limit } = req.query;
    const where = {};

    if (floor) {
      where.floor = floor;
    }
    if (type) {
      where.room_type = type;
    }
    if (status) {
      where.status = status;
    }

    const { offset, limit: size } = paginate({ page, limit });

    const { count, rows } = await Room.findAndCountAll({
      where,
      order: [['room_number', 'ASC']],
      offset,
      limit: size,
    });

    const roomData = rows.map(r => r.toJSON());
    const occupiedIds = roomData.filter(r => r.status === 'occupied').map(r => r.id);
    if (occupiedIds.length) {
      const activeRes = await Reservation.findAll({
        where: { room_id: occupiedIds, status: 'checked_in' },
        include: [{ model: Guest, as: 'guest', attributes: ['first_name', 'last_name'] }],
        attributes: ['room_id'],
      });
      const guestMap = {};
      for (const r of activeRes) {
        if (r.guest) guestMap[r.room_id] = `${r.guest.first_name} ${r.guest.last_name || ''}`.trim();
      }
      for (const rm of roomData) {
        rm.guest_name = guestMap[rm.id] || null;
      }
    }

    res.json(paginatedResponse(roomData, count, parseInt(page) || 1, size));
  } catch (error) {
    next(error);
  }
};

const dashboard = async (req, res, next) => {
  try {
    const { Room } = req.db;
    const rooms = await Room.findAll();

    const byStatus = {};
    const byType = {};

    for (const room of rooms) {
      byStatus[room.status] = (byStatus[room.status] || 0) + 1;
      byType[room.room_type] = (byType[room.room_type] || 0) + 1;
    }

    res.json({
      total: rooms.length,
      byStatus,
      byType,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { Room } = req.db;
    const room = await Room.findByPk(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { Room } = req.db;
    const { status } = req.body;
    const room = await Room.findByPk(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await room.update({ status });

    res.json(room);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { Room } = req.db;
    const { room_number, floor, room_type, base_rate, single_rate, single_misc, double_rate, double_misc, triple_rate, triple_misc, hourly_rate, hourly_rates, extra_bed_charge, max_extra_beds, max_occupancy, amenities, description } = req.body;

    if (!room_number || !floor || !room_type || !base_rate) {
      return res.status(400).json({ message: 'room_number, floor, room_type, and base_rate are required' });
    }

    const existing = await Room.findOne({ where: { room_number } });
    if (existing) {
      return res.status(409).json({ message: `Room ${room_number} already exists` });
    }

    const room = await Room.create({
      room_number,
      floor: parseInt(floor),
      room_type,
      base_rate: parseFloat(base_rate),
      single_rate: single_rate ? parseFloat(single_rate) : null,
      single_misc: parseFloat(single_misc) || 0,
      double_rate: double_rate ? parseFloat(double_rate) : null,
      double_misc: parseFloat(double_misc) || 0,
      triple_rate: triple_rate ? parseFloat(triple_rate) : null,
      triple_misc: parseFloat(triple_misc) || 0,
      hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
      hourly_rates: hourly_rates || null,
      extra_bed_charge: extra_bed_charge ? parseFloat(extra_bed_charge) : null,
      max_extra_beds: max_extra_beds ? parseInt(max_extra_beds) : 0,
      max_occupancy: max_occupancy ? parseInt(max_occupancy) : 2,
      amenities: amenities || [],
      description: description || null,
    });

    res.status(201).json(room);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { Room } = req.db;
    const room = await Room.findByPk(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await room.update(req.body);

    res.json(room);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  dashboard,
  getById,
  create,
  updateStatus,
  update,
};
