const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { HOTEL_INFO } = require('../config/constants');

// GET /hotel-info
const getHotelInfo = (req, res) => {
  res.json({
    name: HOTEL_INFO.TRADE_NAME,
    legal_name: HOTEL_INFO.LEGAL_NAME,
    address: `${HOTEL_INFO.ADDRESS}, ${HOTEL_INFO.CITY}, ${HOTEL_INFO.DISTRICT || ''}, ${HOTEL_INFO.STATE} ${HOTEL_INFO.PINCODE}`.replace(', ,', ','),
    city: HOTEL_INFO.CITY,
    district: HOTEL_INFO.DISTRICT,
    state: HOTEL_INFO.STATE,
    phone: HOTEL_INFO.PHONE,
    email: HOTEL_INFO.EMAIL,
    website: HOTEL_INFO.WEBSITE,
    check_in_time: '12:00',
    check_out_time: '12:00',
    amenities: [
      'Free Wi-Fi', 'Swimming Pool', 'Restaurant & Bar', 'Fitness Center',
      'Spa & Wellness', 'Conference Rooms', 'Valet Parking', '24/7 Room Service',
      'Concierge', 'Laundry Service', 'Airport Transfer', 'Business Center',
    ],
  });
};

// GET /rooms — room types grouped with rates, amenities, availability count
const listRoomTypes = async (req, res, next) => {
  try {
    const { Room } = req.db;
    const rooms = await Room.findAll({
      where: { status: { [Op.ne]: 'maintenance' } },
      order: [['base_rate', 'ASC']],
      raw: true,
    });

    // Group by room_type
    const grouped = {};
    for (const room of rooms) {
      const type = room.room_type;
      if (!grouped[type]) {
        grouped[type] = {
          type,
          name: formatRoomTypeName(type),
          min_rate: Infinity,
          max_rate: 0,
          max_occupancy: 0,
          total_rooms: 0,
          amenities: new Set(),
          description: room.description || '',
        };
      }
      const g = grouped[type];
      const rate = parseFloat(room.base_rate) || 0;
      if (rate < g.min_rate) g.min_rate = rate;
      if (rate > g.max_rate) g.max_rate = rate;
      if (room.max_occupancy > g.max_occupancy) g.max_occupancy = room.max_occupancy;
      g.total_rooms++;
      if (room.amenities) {
        try {
          const arr = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities;
          if (Array.isArray(arr)) arr.forEach(a => g.amenities.add(a));
        } catch {}
      }
    }

    const result = Object.values(grouped).map(g => ({
      ...g,
      amenities: [...g.amenities],
      min_rate: g.min_rate === Infinity ? 0 : g.min_rate,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// GET /rooms/:type — single room type detail
const getRoomTypeDetail = async (req, res, next) => {
  try {
    const { Room } = req.db;
    const { type } = req.params;
    const rooms = await Room.findAll({
      where: { room_type: type, status: { [Op.ne]: 'maintenance' } },
      order: [['base_rate', 'ASC']],
      raw: true,
    });

    if (rooms.length === 0) {
      return res.status(404).json({ message: 'Room type not found' });
    }

    const amenities = new Set();
    let minRate = Infinity, maxRate = 0, maxOccupancy = 0;
    for (const room of rooms) {
      const rate = parseFloat(room.base_rate) || 0;
      if (rate < minRate) minRate = rate;
      if (rate > maxRate) maxRate = rate;
      if (room.max_occupancy > maxOccupancy) maxOccupancy = room.max_occupancy;
      if (room.amenities) {
        try {
          const arr = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities;
          if (Array.isArray(arr)) arr.forEach(a => amenities.add(a));
        } catch {}
      }
    }

    res.json({
      type,
      name: formatRoomTypeName(type),
      description: rooms[0].description || '',
      min_rate: minRate === Infinity ? 0 : minRate,
      max_rate: maxRate,
      max_occupancy: maxOccupancy,
      total_rooms: rooms.length,
      amenities: [...amenities],
    });
  } catch (error) {
    next(error);
  }
};

// GET /availability?check_in=&check_out=&room_type=
const checkAvailability = async (req, res, next) => {
  try {
    const { Reservation, Room } = req.db;
    const { check_in, check_out, room_type } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({ message: 'check_in and check_out are required' });
    }

    const checkIn = dayjs(check_in).startOf('day').toDate();
    const checkOut = dayjs(check_out).startOf('day').toDate();

    if (dayjs(check_out).diff(dayjs(check_in), 'day') <= 0) {
      return res.status(400).json({ message: 'check_out must be after check_in' });
    }

    // Find all conflicting reservations
    const conflicting = await Reservation.findAll({
      where: {
        status: { [Op.notIn]: ['cancelled', 'checked_out', 'no_show'] },
        [Op.and]: [
          { check_in_date: { [Op.lt]: checkOut } },
          { check_out_date: { [Op.gt]: checkIn } },
        ],
      },
      attributes: ['room_id'],
      raw: true,
    });
    const bookedRoomIds = new Set(conflicting.map(r => r.room_id));

    // Get all rooms, optionally filtered
    const roomWhere = { status: { [Op.ne]: 'maintenance' } };
    if (room_type) roomWhere.room_type = room_type;

    const rooms = await Room.findAll({ where: roomWhere, raw: true });

    // Group availability by type
    const typeMap = {};
    for (const room of rooms) {
      const t = room.room_type;
      if (!typeMap[t]) {
        typeMap[t] = {
          type: t,
          name: formatRoomTypeName(t),
          total: 0,
          available: 0,
          min_rate: Infinity,
          max_occupancy: 0,
        };
      }
      typeMap[t].total++;
      if (!bookedRoomIds.has(room.id)) typeMap[t].available++;
      const rate = parseFloat(room.base_rate) || 0;
      if (rate < typeMap[t].min_rate) typeMap[t].min_rate = rate;
      if (room.max_occupancy > typeMap[t].max_occupancy) typeMap[t].max_occupancy = room.max_occupancy;
    }

    const nights = dayjs(check_out).diff(dayjs(check_in), 'day');

    res.json({
      check_in,
      check_out,
      nights,
      room_types: Object.values(typeMap).map(t => ({
        ...t,
        min_rate: t.min_rate === Infinity ? 0 : t.min_rate,
        total_for_stay: Math.round((t.min_rate === Infinity ? 0 : t.min_rate) * nights * 100) / 100,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// POST /booking — create a pending reservation from the website
const createBooking = async (req, res, next) => {
  try {
    const { Reservation, Guest, Room } = req.db;
    const {
      first_name, last_name, email, phone,
      room_type, check_in, check_out,
      adults, children, meal_plan, special_requests,
    } = req.body;

    // Validate required fields
    if (!first_name || !phone) {
      return res.status(400).json({ message: 'First name and phone are required' });
    }
    if (!room_type || !check_in || !check_out) {
      return res.status(400).json({ message: 'Room type, check-in and check-out dates are required' });
    }

    const checkInDate = dayjs(check_in);
    const checkOutDate = dayjs(check_out);
    const nights = checkOutDate.diff(checkInDate, 'day');

    if (checkInDate.isBefore(dayjs().startOf('day'))) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }
    if (nights <= 0) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    // Find or create guest
    const [guest] = await Guest.findOrCreate({
      where: { phone },
      defaults: {
        first_name,
        last_name: last_name || '',
        email: email || null,
        phone,
      },
    });

    // Find available room of requested type
    const bookedRoomIds = (await Reservation.findAll({
      where: {
        status: { [Op.notIn]: ['cancelled', 'checked_out', 'no_show'] },
        [Op.and]: [
          { check_in_date: { [Op.lt]: checkOutDate.toDate() } },
          { check_out_date: { [Op.gt]: checkInDate.toDate() } },
        ],
      },
      attributes: ['room_id'],
      raw: true,
    })).map(r => r.room_id);

    const availableRoom = await Room.findOne({
      where: {
        room_type,
        status: { [Op.ne]: 'maintenance' },
        ...(bookedRoomIds.length > 0 ? { id: { [Op.notIn]: bookedRoomIds } } : {}),
      },
      order: [['room_number', 'ASC']],
    });

    if (!availableRoom) {
      return res.status(400).json({ message: `No available ${room_type} rooms for the selected dates` });
    }

    const ratePerNight = parseFloat(availableRoom.base_rate) || 0;
    const totalAmount = Math.round(ratePerNight * nights * 100) / 100;

    const reservation = await Reservation.create({
      reservation_number: 'RES-' + Date.now(),
      guest_id: guest.id,
      room_id: availableRoom.id,
      check_in_date: checkInDate.format('YYYY-MM-DD'),
      check_out_date: checkOutDate.format('YYYY-MM-DD'),
      nights,
      adults: parseInt(adults) || 1,
      children: parseInt(children) || 0,
      rate_per_night: ratePerNight,
      total_amount: totalAmount,
      source: 'website',
      status: 'pending',
      meal_plan: ['breakfast', 'dinner', 'both'].includes(meal_plan) ? meal_plan : 'none',
      special_requests: special_requests || null,
    });

    res.status(201).json({
      success: true,
      booking_reference: reservation.reservation_number,
      details: {
        check_in: checkInDate.format('YYYY-MM-DD'),
        check_out: checkOutDate.format('YYYY-MM-DD'),
        nights,
        room_type: formatRoomTypeName(room_type),
        rate_per_night: ratePerNight,
        total_amount: totalAmount,
        guest_name: `${guest.first_name} ${guest.last_name}`.trim(),
        status: 'pending',
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /booking/:ref?email= — lookup booking by reference
const lookupBooking = async (req, res, next) => {
  try {
    const { Reservation, Guest, Room } = req.db;
    const { ref } = req.params;
    const { email, phone } = req.query;

    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required for booking lookup' });
    }

    const reservation = await Reservation.findOne({
      where: { reservation_number: ref },
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify guest identity
    const guestEmail = reservation.guest?.email?.toLowerCase();
    const guestPhone = reservation.guest?.phone;
    if (email && guestEmail !== email.toLowerCase()) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (phone && guestPhone !== phone) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      booking_reference: reservation.reservation_number,
      status: reservation.status,
      check_in: reservation.check_in_date,
      check_out: reservation.check_out_date,
      nights: reservation.nights,
      room_type: reservation.room ? formatRoomTypeName(reservation.room.room_type) : null,
      room_number: reservation.room?.room_number,
      guest_name: reservation.guest ? `${reservation.guest.first_name} ${reservation.guest.last_name}`.trim() : null,
      rate_per_night: parseFloat(reservation.rate_per_night) || 0,
      total_amount: parseFloat(reservation.total_amount) || 0,
      special_requests: reservation.special_requests,
    });
  } catch (error) {
    next(error);
  }
};

function formatRoomTypeName(type) {
  const names = {
    standard_single: 'Standard Single',
    standard_double: 'Standard Double',
    executive_single: 'Executive Single',
    executive_double: 'Executive Double',
    comfort_single: 'Comfort Single',
    comfort_double: 'Comfort Double',
    comfort_executive_double: 'Comfort Executive Double',
    comfort_executive_triple: 'Comfort Executive Triple',
    suite_triple: 'Suite Triple',
  };
  return names[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = {
  getHotelInfo,
  listRoomTypes,
  getRoomTypeDetail,
  checkAvailability,
  createBooking,
  lookupBooking,
};
