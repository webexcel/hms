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
        [fn('SUM', col('amount')), 'total_revenue'],
        [fn('COUNT', col('id')), 'transaction_count'],
      ],
      where,
      group: [dateGrouping],
      order: [[dateGrouping, 'ASC']],
      raw: true,
    });

    const totalRevenue = await Payment.sum('amount', { where });

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

    const todayRevenue = await Payment.sum('amount', {
      where: {
        payment_date: todayRange,
      },
    });

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

module.exports = {
  revenue,
  occupancy,
  dailySummary,
  guestStats,
};
