const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { sequelize, Reservation, Guest, Room, Billing, BillingItem, HousekeepingTask, OtaChannel } = require('../models');
const { getPagination, getPagingData } = require('../utils/pagination');
const inventorySync = require('../services/inventorySync');
const waNotifier = require('../services/whatsapp/hotelNotifier');
const { logAudit } = require('../utils/auditLogger');

// GET / - List reservations with filters and pagination
const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, check_in_date, check_out_date } = req.query;
    const { offset, limit: size } = getPagination(page, limit);

    const where = {};
    const { source, channel_id, room_id } = req.query;

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (channel_id) {
      where.channel_id = channel_id;
    }

    if (room_id) {
      where.room_id = room_id;
    }

    if (check_in_date && check_out_date) {
      // Overlap query: reservation overlaps with the given date range
      where[Op.and] = [
        { check_in_date: { [Op.lt]: dayjs(check_out_date).endOf('day').toDate() } },
        { check_out_date: { [Op.gt]: dayjs(check_in_date).startOf('day').toDate() } },
      ];
    } else if (check_in_date) {
      where.check_in_date = { [Op.gte]: dayjs(check_in_date).startOf('day').toDate() };
    } else if (check_out_date) {
      where.check_out_date = { [Op.lte]: dayjs(check_out_date).endOf('day').toDate() };
    }

    const result = await Reservation.findAndCountAll({
      where,
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing' },
        { model: OtaChannel, as: 'otaChannel', attributes: ['id', 'name', 'code'], required: false },
      ],
      limit: size,
      offset,
      order: [['created_at', 'DESC']],
    });

    const response = getPagingData(result, page, size);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// POST / - Create a new reservation (supports single room or group booking with rooms[] array)
const create = async (req, res, next) => {
  try {
    const {
      guest_id,
      room_id,
      room_type,
      check_in_date, check_out_date,
      check_in, check_out, // frontend aliases
      rate_per_night,
      first_name, last_name, email, phone,
      guests_count, send_confirmation, collect_advance, payment_mode, guest_name,
      rooms, // group booking: array of { room_id, rate_per_night, adults, children }
      ...rest
    } = req.body;

    // Resolve dates (accept both field name conventions)
    const resolvedCheckIn = check_in_date || check_in;
    const resolvedCheckOut = check_out_date || check_out;

    if (!resolvedCheckIn || !resolvedCheckOut) {
      return res.status(400).json({ message: 'Check-in and check-out dates are required' });
    }

    const checkIn = dayjs(resolvedCheckIn);
    const checkOut = dayjs(resolvedCheckOut);
    const nights = checkOut.diff(checkIn, 'day');

    if (nights <= 0) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Resolve guest: use guest_id if provided, otherwise create from form fields
    let resolvedGuestId = guest_id;
    if (!resolvedGuestId && first_name && phone) {
      const [guest] = await Guest.findOrCreate({
        where: { phone },
        defaults: {
          first_name,
          last_name: last_name || '',
          email: email || null,
          phone,
        },
      });
      resolvedGuestId = guest.id;
    }

    if (!resolvedGuestId) {
      return res.status(400).json({ message: 'Guest information is required (first name and phone)' });
    }

    // Parse guests_count if provided (e.g., "2_adults_1_child")
    let adults = rest.adults || 1;
    let children = rest.children || 0;
    if (guests_count) {
      const adultMatch = guests_count.match(/(\d+)_adult/);
      const childMatch = guests_count.match(/(\d+)_child/);
      if (adultMatch) adults = parseInt(adultMatch[1]);
      if (childMatch) children = parseInt(childMatch[1]);
    }

    // ===== GROUP BOOKING =====
    if (rooms && Array.isArray(rooms) && rooms.length > 1) {
      const groupId = 'GRP-' + Date.now();

      // Validate all rooms exist and are available
      for (const r of rooms) {
        const roomObj = await Room.findByPk(r.room_id);
        if (!roomObj) {
          return res.status(404).json({ message: `Room ID ${r.room_id} not found` });
        }
        const avail = await isRoomAvailable(r.room_id, resolvedCheckIn, resolvedCheckOut);
        if (!avail) {
          return res.status(400).json({ message: `Room ${roomObj.room_number} is already booked for the selected dates` });
        }
      }

      // Create all reservations in a transaction
      const createdReservations = await sequelize.transaction(async (t) => {
        const results = [];
        const baseTs = Date.now();
        for (let i = 0; i < rooms.length; i++) {
          const r = rooms[i];
          const roomObj = await Room.findByPk(r.room_id, { transaction: t });
          const finalRate = parseFloat(r.rate_per_night) || roomObj.base_rate || 0;
          const total_amount = nights * finalRate;
          const reservation_number = 'RES-' + (baseTs + i);

          // Advance is only on the primary (first) reservation
          const advancePaid = i === 0 ? (parseFloat(rest.advance_paid) || 0) : 0;

          const reservation = await Reservation.create({
            reservation_number,
            guest_id: resolvedGuestId,
            room_id: r.room_id,
            check_in_date: checkIn.toDate(),
            check_out_date: checkOut.toDate(),
            rate_per_night: finalRate,
            total_amount,
            nights,
            adults: r.adults || adults,
            children: r.children || children,
            advance_paid: advancePaid,
            source: rest.source,
            special_requests: rest.special_requests,
            status: rest.status || 'confirmed',
            meal_plan: rest.meal_plan || 'none',
            group_id: groupId,
            is_group_primary: i === 0,
          }, { transaction: t });

          // Mark room as reserved if check-in is today or earlier
          if (checkIn.isBefore(dayjs().endOf('day'))) {
            await roomObj.update({ status: 'reserved' }, { transaction: t });
          }

          results.push(reservation);
        }
        return results;
      });

      // Sync inventory for all
      createdReservations.forEach(r => inventorySync.handleInventoryChange(r.id).catch(() => {}));

      // Fetch full data
      const fullReservations = await Reservation.findAll({
        where: { group_id: groupId },
        include: [
          { model: Guest, as: 'guest' },
          { model: Room, as: 'room' },
        ],
        order: [['is_group_primary', 'DESC'], ['id', 'ASC']],
      });

      // WhatsApp confirmation for group (fire-and-forget)
      const primary = fullReservations[0];
      if (primary?.guest?.phone) {
        const roomNumbers = fullReservations.map(r => r.room?.room_number).join(', ');
        waNotifier.notifyBookingConfirmation({
          guestName: `${primary.guest.first_name} ${primary.guest.last_name}`,
          guestPhone: primary.guest.phone,
          reservationNumber: `${primary.reservation_number} (Group: ${rooms.length} rooms)`,
          checkIn: dayjs(primary.check_in_date).format('DD MMM YYYY'),
          checkOut: dayjs(primary.check_out_date).format('DD MMM YYYY'),
          roomType: `Rooms: ${roomNumbers}`,
          totalAmount: fullReservations.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0),
        }).catch(() => {});
      }

      return res.status(201).json({ group_id: groupId, reservations: fullReservations });
    }

    // ===== SINGLE ROOM BOOKING (existing flow) =====
    let resolvedRoomId = room_id;
    if (!resolvedRoomId && room_type) {
      const bookedRoomIds = (await Reservation.findAll({
        where: {
          status: { [Op.notIn]: ['cancelled', 'checked_out', 'no_show'] },
          [Op.and]: [
            { check_in_date: { [Op.lt]: checkOut.toDate() } },
            { check_out_date: { [Op.gt]: checkIn.toDate() } },
          ],
        },
        attributes: ['room_id'],
        raw: true,
      })).map(r => r.room_id);

      const availableRoom = await Room.findOne({
        where: {
          room_type,
          ...(bookedRoomIds.length > 0 ? { id: { [Op.notIn]: bookedRoomIds } } : {}),
        },
        order: [['room_number', 'ASC']],
      });

      if (!availableRoom) {
        return res.status(400).json({ message: `No available ${room_type} rooms for the selected dates` });
      }
      resolvedRoomId = availableRoom.id;
    }

    const room = await Room.findByPk(resolvedRoomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check for date conflicts
    const available = await isRoomAvailable(resolvedRoomId, resolvedCheckIn, resolvedCheckOut);
    if (!available) {
      return res.status(400).json({ message: 'Room is already booked for the selected dates' });
    }

    const finalRate = parseFloat(rate_per_night) || room.base_rate || 0;
    const total_amount = nights * finalRate;
    const reservation_number = 'RES-' + Date.now();

    const advancePaid = parseFloat(rest.advance_paid) || 0;

    const reservation = await Reservation.create({
      reservation_number,
      guest_id: resolvedGuestId,
      room_id: resolvedRoomId,
      check_in_date: checkIn.toDate(),
      check_out_date: checkOut.toDate(),
      rate_per_night: finalRate,
      total_amount,
      nights,
      adults,
      children,
      advance_paid: advancePaid,
      source: rest.source,
      special_requests: rest.special_requests,
      status: rest.status || 'confirmed',
      meal_plan: rest.meal_plan || 'none',
    });

    // Only mark room as reserved if check-in is today or earlier
    if (checkIn.isBefore(dayjs().endOf('day'))) {
      await room.update({ status: 'reserved' });
    }

    // Sync inventory after creation
    inventorySync.handleInventoryChange(reservation.id).catch(() => {});

    const created = await Reservation.findByPk(reservation.id, {
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
      ],
    });

    // WhatsApp booking confirmation (fire-and-forget)
    if (created.guest?.phone) {
      waNotifier.notifyBookingConfirmation({
        guestName: `${created.guest.first_name} ${created.guest.last_name}`,
        guestPhone: created.guest.phone,
        reservationNumber: created.reservation_number,
        checkIn: dayjs(created.check_in_date).format('DD MMM YYYY'),
        checkOut: dayjs(created.check_out_date).format('DD MMM YYYY'),
        roomType: room.room_type,
        totalAmount: total_amount,
      }).catch(() => {});
    }

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

// GET /:id - Get reservation by ID
const getById = async (req, res, next) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing' },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    next(error);
  }
};

// PUT /:id - Update reservation
const update = async (req, res, next) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Recalculate total if dates or rate changed
    const check_in_date = req.body.check_in_date || reservation.check_in_date;
    const check_out_date = req.body.check_out_date || reservation.check_out_date;
    const rate_per_night = req.body.rate_per_night || reservation.rate_per_night;
    const room_id = req.body.room_id || reservation.room_id;

    const checkIn = dayjs(check_in_date);
    const checkOut = dayjs(check_out_date);
    const nights = checkOut.diff(checkIn, 'day');

    if (nights <= 0) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Check availability if dates or room changed
    if (req.body.check_in_date || req.body.check_out_date || req.body.room_id) {
      const available = await isRoomAvailable(room_id, check_in_date, check_out_date, reservation.id);
      if (!available) {
        return res.status(400).json({ message: 'Room is already booked for the selected dates' });
      }
    }

    const total_amount = nights * rate_per_night;

    await reservation.update({
      ...req.body,
      nights,
      total_amount,
    });

    // Sync inventory after update
    inventorySync.handleInventoryChange(reservation.id).catch(() => {});

    const updated = await Reservation.findByPk(reservation.id, {
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
      ],
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// PUT /:id/check-in - Check in a guest
const checkIn = async (req, res, next) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [{ model: Room, as: 'room' }],
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (!['pending', 'confirmed'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Reservation cannot be checked in with current status' });
    }

    await reservation.update({
      status: 'checked_in',
      actual_check_in: dayjs().toDate(),
    });

    await reservation.room.update({ status: 'occupied' });

    const invoice_number = 'INV-' + Date.now();
    // Compute billing amounts from reservation
    const nights = reservation.nights || dayjs(reservation.check_out_date).diff(dayjs(reservation.check_in_date), 'day') || 1;
    const ratePerNight = parseFloat(reservation.rate_per_night) || 0;
    const subtotal = nights * ratePerNight;
    const gstRate = subtotal >= 7500 ? 0.18 : 0.12; // 18% for rooms >= 7500/night, else 12%
    const gstAmount = subtotal * gstRate;
    const cgst = Math.round(gstAmount / 2 * 100) / 100;
    const sgst = Math.round(gstAmount / 2 * 100) / 100;
    const grandTotal = Math.round((subtotal + cgst + sgst) * 100) / 100;
    const depositNow = parseFloat(req.body.deposit_amount) || 0;
    const advancePaid = (parseFloat(reservation.advance_paid) || 0) + depositNow;

    // Update reservation advance_paid if deposit collected at check-in
    if (depositNow > 0) {
      await reservation.update({ advance_paid: advancePaid });
    }

    // Only create billing if one doesn't already exist (OTA bookings may already have one)
    const existingBilling = await Billing.findOne({ where: { reservation_id: reservation.id } });
    if (!existingBilling) {
      await Billing.create({
        reservation_id: reservation.id,
        guest_id: reservation.guest_id,
        invoice_number,
        subtotal: Math.round(subtotal * 100) / 100,
        cgst_amount: cgst,
        sgst_amount: sgst,
        grand_total: grandTotal,
        paid_amount: advancePaid,
        balance_due: Math.round((grandTotal - advancePaid) * 100) / 100,
        payment_status: advancePaid >= grandTotal ? 'paid' : advancePaid > 0 ? 'partial' : 'unpaid',
      });
    } else if (parseFloat(existingBilling.subtotal) === 0) {
      // Billing exists but amounts are empty — populate them
      await existingBilling.update({
        subtotal: Math.round(subtotal * 100) / 100,
        cgst_amount: cgst,
        sgst_amount: sgst,
        grand_total: grandTotal,
        paid_amount: advancePaid,
        balance_due: Math.round((grandTotal - advancePaid) * 100) / 100,
        payment_status: advancePaid >= grandTotal ? 'paid' : advancePaid > 0 ? 'partial' : 'unpaid',
      });
    }

    // Sync inventory after check-in
    inventorySync.handleInventoryChange(reservation.id).catch(() => {});

    const updated = await Reservation.findByPk(reservation.id, {
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing' },
      ],
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// PUT /:id/check-out - Check out a guest
const checkOut = async (req, res, next) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [{ model: Room, as: 'room' }],
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status !== 'checked_in') {
      return res.status(400).json({ message: 'Reservation is not currently checked in' });
    }

    // Finalize billing
    const billing = await Billing.findOne({ where: { reservation_id: reservation.id } });
    if (billing) {
      const nights = reservation.nights || dayjs(reservation.check_out_date).diff(dayjs(reservation.check_in_date), 'day') || 1;
      const ratePerNight = parseFloat(reservation.rate_per_night) || 0;
      const subtotal = nights * ratePerNight;
      const gstRate = subtotal >= 7500 ? 0.18 : 0.12;
      const gstAmount = subtotal * gstRate;
      const cgst = Math.round(gstAmount / 2 * 100) / 100;
      const sgst = Math.round(gstAmount / 2 * 100) / 100;

      // Apply discount from checkout form
      let discountAmount = 0;
      const { discount_type, discount_value, discount_reason } = req.body;
      if (discount_value && Number(discount_value) > 0) {
        if (discount_type === 'percent') {
          discountAmount = Math.round((subtotal + cgst + sgst) * (Number(discount_value) / 100) * 100) / 100;
        } else {
          discountAmount = Math.round(Number(discount_value) * 100) / 100;
        }
      }

      const grandTotal = Math.round((subtotal + cgst + sgst - discountAmount) * 100) / 100;
      const advancePaid = parseFloat(billing.paid_amount) || parseFloat(reservation.advance_paid) || 0;

      await billing.update({
        subtotal: Math.round(subtotal * 100) / 100,
        cgst_amount: cgst,
        sgst_amount: sgst,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        paid_amount: advancePaid,
        balance_due: Math.round((grandTotal - advancePaid) * 100) / 100,
        notes: discount_reason ? `Discount: ${discount_reason}` : billing.notes,
      });
    }

    await reservation.update({
      status: 'checked_out',
      actual_check_out: dayjs().toDate(),
    });

    await reservation.room.update({ status: 'cleaning', cleanliness_status: 'dirty' });

    await HousekeepingTask.create({
      room_id: reservation.room_id,
      task_type: 'cleaning',
      status: 'pending',
      priority: 'high',
      notes: `Checkout cleaning for reservation ${reservation.reservation_number}`,
    });

    // Sync inventory after checkout
    inventorySync.handleInventoryChange(reservation.id).catch(() => {});

    const updated = await Reservation.findByPk(reservation.id, {
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing' },
      ],
    });

    // WhatsApp thank-you after checkout (fire-and-forget)
    if (updated.guest?.phone) {
      waNotifier.notifyThankYou({
        guestName: `${updated.guest.first_name} ${updated.guest.last_name}`,
        guestPhone: updated.guest.phone,
        reservationNumber: updated.reservation_number,
      }).catch(() => {});
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// PUT /:id/cancel - Cancel a reservation
const cancel = async (req, res, next) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [{ model: Room, as: 'room' }],
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (['checked_in', 'checked_out', 'cancelled'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Reservation cannot be cancelled with current status' });
    }

    await reservation.update({ status: 'cancelled' });
    await reservation.room.update({ status: 'available' });

    // Sync inventory after cancellation
    inventorySync.handleInventoryChange(reservation.id).catch(() => {});

    const updated = await Reservation.findByPk(reservation.id, {
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
      ],
    });

    // WhatsApp cancellation notice (fire-and-forget)
    if (updated.guest?.phone) {
      waNotifier.notifyCancellation({
        guestName: `${updated.guest.first_name} ${updated.guest.last_name}`,
        guestPhone: updated.guest.phone,
        reservationNumber: updated.reservation_number,
        checkIn: dayjs(updated.check_in_date).format('DD MMM YYYY'),
        checkOut: dayjs(updated.check_out_date).format('DD MMM YYYY'),
      }).catch(() => {});
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// GET /arrivals - Today's expected check-ins
const getArrivals = async (req, res, next) => {
  try {
    const todayEnd = dayjs().endOf('day').toDate();

    const arrivals = await Reservation.findAll({
      where: {
        check_in_date: { [Op.lte]: todayEnd },
        status: { [Op.in]: ['pending', 'confirmed'] },
      },
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
      ],
      order: [['check_in_date', 'ASC']],
    });

    res.json(arrivals);
  } catch (error) {
    next(error);
  }
};

// GET /departures - Today's expected check-outs
const getDepartures = async (req, res, next) => {
  try {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd = dayjs().endOf('day').toDate();

    const departures = await Reservation.findAll({
      where: {
        check_out_date: { [Op.lte]: todayEnd },
        status: 'checked_in',
      },
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing', include: [{ model: BillingItem, as: 'items' }] },
      ],
      order: [['check_out_date', 'ASC']],
    });

    // Compute restaurant charges from billing items
    const result = departures.map(d => {
      const plain = d.toJSON();
      const billingItems = plain.billing?.items || [];
      const restItems = billingItems.filter(i => i.item_type === 'restaurant');
      plain.restaurant_charges = restItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
      plain.restaurant_items = restItems.map(i => ({
        description: i.description,
        amount: parseFloat(i.amount) || 0,
        date: i.date,
      }));
      return plain;
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// GET /calendar - Room occupancy grid for a date range
const calendar = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'start_date and end_date are required' });
    }

    const start = dayjs(start_date).startOf('day').toDate();
    const end = dayjs(end_date).endOf('day').toDate();

    const reservations = await Reservation.findAll({
      where: {
        status: { [Op.notIn]: ['cancelled'] },
        [Op.or]: [
          { check_in_date: { [Op.between]: [start, end] } },
          { check_out_date: { [Op.between]: [start, end] } },
          {
            [Op.and]: [
              { check_in_date: { [Op.lte]: start } },
              { check_out_date: { [Op.gte]: end } },
            ],
          },
        ],
      },
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
      ],
      order: [['check_in_date', 'ASC']],
    });

    const rooms = await Room.findAll({ order: [['room_number', 'ASC']] });

    const calendarData = rooms.map((room) => {
      const roomReservations = reservations.filter(
        (r) => r.room_id === room.id
      );
      return {
        room,
        reservations: roomReservations,
      };
    });

    res.json({
      start_date,
      end_date,
      calendar: calendarData,
    });
  } catch (error) {
    next(error);
  }
};

// Helper: check if a room is available for given dates (excluding a reservation by ID)
const isRoomAvailable = async (room_id, check_in_date, check_out_date, excludeReservationId = null) => {
  const checkIn = dayjs(check_in_date).startOf('day').toDate();
  const checkOut = dayjs(check_out_date).startOf('day').toDate();

  const where = {
    room_id,
    status: { [Op.notIn]: ['cancelled', 'checked_out', 'no_show'] },
    [Op.and]: [
      { check_in_date: { [Op.lt]: checkOut } },
      { check_out_date: { [Op.gt]: checkIn } },
    ],
  };

  if (excludeReservationId) {
    where.id = { [Op.ne]: excludeReservationId };
  }

  const conflicting = await Reservation.count({ where });
  return conflicting === 0;
};

// GET /availability - Check room availability for a date range
const checkAvailability = async (req, res, next) => {
  try {
    const { check_in, check_out, room_type } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({ message: 'check_in and check_out are required' });
    }

    const checkIn = dayjs(check_in).startOf('day').toDate();
    const checkOut = dayjs(check_out).startOf('day').toDate();

    if (dayjs(check_out).diff(dayjs(check_in), 'day') <= 0) {
      return res.status(400).json({ message: 'check_out must be after check_in' });
    }

    // Get all rooms, optionally filtered by type
    const roomWhere = {};
    if (room_type) roomWhere.room_type = room_type;

    const rooms = await Room.findAll({ where: roomWhere, order: [['room_number', 'ASC']] });

    // Find conflicting reservations
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

    const available = rooms.filter(room => !bookedRoomIds.has(room.id));
    const unavailable = rooms.filter(room => bookedRoomIds.has(room.id));

    res.json({
      check_in,
      check_out,
      total_rooms: rooms.length,
      available_count: available.length,
      available,
      unavailable_count: unavailable.length,
    });
  } catch (error) {
    next(error);
  }
};

// GET /group/:groupId - Get all reservations in a group
const getGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const reservations = await Reservation.findAll({
      where: { group_id: groupId },
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing' },
      ],
      order: [['is_group_primary', 'DESC'], ['id', 'ASC']],
    });

    if (reservations.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({ group_id: groupId, count: reservations.length, reservations });
  } catch (error) {
    next(error);
  }
};

// PUT /group/:groupId/check-in - Check in all rooms in a group
const groupCheckIn = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const reservations = await Reservation.findAll({
      where: { group_id: groupId, status: { [Op.in]: ['pending', 'confirmed'] } },
      include: [{ model: Room, as: 'room' }],
    });

    if (reservations.length === 0) {
      return res.status(400).json({ message: 'No reservations available for check-in in this group' });
    }

    await sequelize.transaction(async (t) => {
      for (const reservation of reservations) {
        await reservation.update({
          status: 'checked_in',
          actual_check_in: dayjs().toDate(),
        }, { transaction: t });

        await reservation.room.update({ status: 'occupied' }, { transaction: t });

        const nights = reservation.nights || dayjs(reservation.check_out_date).diff(dayjs(reservation.check_in_date), 'day') || 1;
        const ratePerNight = parseFloat(reservation.rate_per_night) || 0;
        const subtotal = nights * ratePerNight;
        const gstRate = subtotal >= 7500 ? 0.18 : 0.12;
        const gstAmount = subtotal * gstRate;
        const cgst = Math.round(gstAmount / 2 * 100) / 100;
        const sgst = Math.round(gstAmount / 2 * 100) / 100;
        const grandTotal = Math.round((subtotal + cgst + sgst) * 100) / 100;
        const advancePaid = parseFloat(reservation.advance_paid) || 0;

        const existingBilling = await Billing.findOne({ where: { reservation_id: reservation.id }, transaction: t });
        if (!existingBilling) {
          await Billing.create({
            reservation_id: reservation.id,
            guest_id: reservation.guest_id,
            invoice_number: 'INV-' + Date.now() + '-' + reservation.id,
            subtotal: Math.round(subtotal * 100) / 100,
            cgst_amount: cgst,
            sgst_amount: sgst,
            grand_total: grandTotal,
            paid_amount: advancePaid,
            balance_due: Math.round((grandTotal - advancePaid) * 100) / 100,
            payment_status: advancePaid >= grandTotal ? 'paid' : advancePaid > 0 ? 'partial' : 'unpaid',
          }, { transaction: t });
        }
      }
    });

    // Sync inventory
    reservations.forEach(r => inventorySync.handleInventoryChange(r.id).catch(() => {}));

    const updated = await Reservation.findAll({
      where: { group_id: groupId },
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing' },
      ],
      order: [['is_group_primary', 'DESC'], ['id', 'ASC']],
    });

    res.json({ group_id: groupId, checked_in: reservations.length, reservations: updated });
  } catch (error) {
    next(error);
  }
};

// PUT /group/:groupId/check-out - Check out all rooms in a group
const groupCheckOut = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { discount_type, discount_value, discount_reason, send_invoice } = req.body;

    const reservations = await Reservation.findAll({
      where: { group_id: groupId, status: 'checked_in' },
      include: [{ model: Room, as: 'room' }],
    });

    if (reservations.length === 0) {
      return res.status(400).json({ message: 'No checked-in reservations in this group' });
    }

    await sequelize.transaction(async (t) => {
      for (const reservation of reservations) {
        // Finalize billing
        const billing = await Billing.findOne({ where: { reservation_id: reservation.id }, transaction: t });
        if (billing) {
          const nights = reservation.nights || dayjs(reservation.check_out_date).diff(dayjs(reservation.check_in_date), 'day') || 1;
          const ratePerNight = parseFloat(reservation.rate_per_night) || 0;
          const subtotal = nights * ratePerNight;
          const gstRate = subtotal >= 7500 ? 0.18 : 0.12;
          const gstAmount = subtotal * gstRate;
          const cgst = Math.round(gstAmount / 2 * 100) / 100;
          const sgst = Math.round(gstAmount / 2 * 100) / 100;
          const grandTotal = Math.round((subtotal + cgst + sgst) * 100) / 100;
          const advancePaid = parseFloat(billing.paid_amount) || parseFloat(reservation.advance_paid) || 0;

          await billing.update({
            subtotal: Math.round(subtotal * 100) / 100,
            cgst_amount: cgst,
            sgst_amount: sgst,
            grand_total: grandTotal,
            paid_amount: advancePaid,
            balance_due: Math.round((grandTotal - advancePaid) * 100) / 100,
          }, { transaction: t });
        }

        await reservation.update({
          status: 'checked_out',
          actual_check_out: dayjs().toDate(),
        }, { transaction: t });

        await reservation.room.update({ status: 'cleaning', cleanliness_status: 'dirty' }, { transaction: t });

        await HousekeepingTask.create({
          room_id: reservation.room_id,
          task_type: 'cleaning',
          status: 'pending',
          priority: 'high',
          notes: `Checkout cleaning for group ${groupId}, reservation ${reservation.reservation_number}`,
        }, { transaction: t });
      }
    });

    // Sync inventory
    reservations.forEach(r => inventorySync.handleInventoryChange(r.id).catch(() => {}));

    const updated = await Reservation.findAll({
      where: { group_id: groupId },
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing' },
      ],
      order: [['is_group_primary', 'DESC'], ['id', 'ASC']],
    });

    // WhatsApp thank-you (fire-and-forget)
    const primary = updated.find(r => r.is_group_primary) || updated[0];
    if (primary?.guest?.phone) {
      waNotifier.notifyThankYou({
        guestName: `${primary.guest.first_name} ${primary.guest.last_name}`,
        guestPhone: primary.guest.phone,
        reservationNumber: `${primary.reservation_number} (Group: ${reservations.length} rooms)`,
      }).catch(() => {});
    }

    res.json({ group_id: groupId, checked_out: reservations.length, reservations: updated });
  } catch (error) {
    next(error);
  }
};

// PUT /group/:groupId/cancel - Cancel all non-checked-in reservations in a group
const groupCancel = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const reservations = await Reservation.findAll({
      where: {
        group_id: groupId,
        status: { [Op.in]: ['pending', 'confirmed'] },
      },
      include: [{ model: Room, as: 'room' }],
    });

    if (reservations.length === 0) {
      return res.status(400).json({ message: 'No cancellable reservations in this group' });
    }

    await sequelize.transaction(async (t) => {
      for (const reservation of reservations) {
        await reservation.update({ status: 'cancelled' }, { transaction: t });
        await reservation.room.update({ status: 'available' }, { transaction: t });
      }
    });

    reservations.forEach(r => inventorySync.handleInventoryChange(r.id).catch(() => {}));

    const updated = await Reservation.findAll({
      where: { group_id: groupId },
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
      ],
      order: [['is_group_primary', 'DESC'], ['id', 'ASC']],
    });

    // WhatsApp cancellation (fire-and-forget)
    const primary = updated.find(r => r.is_group_primary) || updated[0];
    if (primary?.guest?.phone) {
      waNotifier.notifyCancellation({
        guestName: `${primary.guest.first_name} ${primary.guest.last_name}`,
        guestPhone: primary.guest.phone,
        reservationNumber: `${primary.reservation_number} (Group: ${reservations.length} rooms)`,
        checkIn: dayjs(primary.check_in_date).format('DD MMM YYYY'),
        checkOut: dayjs(primary.check_out_date).format('DD MMM YYYY'),
      }).catch(() => {});
    }

    res.json({ group_id: groupId, cancelled: reservations.length, reservations: updated });
  } catch (error) {
    next(error);
  }
};

// PUT /:id/room-transfer - Transfer a checked-in guest to a different room
const roomTransfer = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { new_room_id, reason, adjust_rate } = req.body;

    if (!new_room_id) {
      await t.rollback();
      return res.status(400).json({ message: 'New room is required' });
    }

    const reservation = await Reservation.findByPk(req.params.id, {
      include: [
        { model: Room, as: 'room' },
        { model: Guest, as: 'guest' },
        { model: Billing, as: 'billing' },
      ],
      transaction: t,
    });

    if (!reservation) {
      await t.rollback();
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status !== 'checked_in') {
      await t.rollback();
      return res.status(400).json({ message: 'Room transfer is only allowed for checked-in reservations' });
    }

    const oldRoom = reservation.room;
    const newRoom = await Room.findByPk(new_room_id, { transaction: t });

    if (!newRoom) {
      await t.rollback();
      return res.status(404).json({ message: 'New room not found' });
    }

    if (newRoom.id === oldRoom.id) {
      await t.rollback();
      return res.status(400).json({ message: 'New room must be different from current room' });
    }

    // Check new room is available (not occupied by another guest)
    if (!['available', 'reserved', 'cleaning'].includes(newRoom.status)) {
      await t.rollback();
      return res.status(400).json({ message: `Room ${newRoom.room_number} is currently ${newRoom.status} and cannot be assigned` });
    }

    // Check no other checked-in reservation occupies the new room
    const conflicting = await Reservation.findOne({
      where: {
        room_id: new_room_id,
        status: 'checked_in',
        id: { [Op.ne]: reservation.id },
      },
      transaction: t,
    });
    if (conflicting) {
      await t.rollback();
      return res.status(400).json({ message: `Room ${newRoom.room_number} is occupied by reservation ${conflicting.reservation_number}` });
    }

    const oldRoomNumber = oldRoom.room_number;
    const oldRoomId = oldRoom.id;
    const oldRate = parseFloat(reservation.rate_per_night);

    // 1. Free the old room → send to cleaning
    await oldRoom.update({ status: 'cleaning', cleanliness_status: 'dirty' }, { transaction: t });

    // Create housekeeping task for old room
    await HousekeepingTask.create({
      room_id: oldRoom.id,
      task_type: 'cleaning',
      status: 'pending',
      priority: 'high',
      notes: `Room transfer cleaning – guest moved to room ${newRoom.room_number}. Reservation: ${reservation.reservation_number}`,
    }, { transaction: t });

    // 2. Assign new room → mark occupied
    await newRoom.update({ status: 'occupied' }, { transaction: t });

    // 3. Update reservation with new room
    const updateData = { room_id: newRoom.id };

    // Optionally adjust rate to new room's base rate
    if (adjust_rate) {
      updateData.rate_per_night = newRoom.base_rate;
    }

    await reservation.update(updateData, { transaction: t });

    // 4. Recalculate billing if rate changed
    const newRate = adjust_rate ? parseFloat(newRoom.base_rate) : oldRate;
    if (adjust_rate && reservation.billing) {
      const nights = reservation.nights || dayjs(reservation.check_out_date).diff(dayjs(reservation.check_in_date), 'day') || 1;
      const subtotal = nights * newRate;
      const gstRate = subtotal >= 7500 ? 0.18 : 0.12;
      const gstAmount = subtotal * gstRate;
      const cgst = Math.round(gstAmount / 2 * 100) / 100;
      const sgst = Math.round(gstAmount / 2 * 100) / 100;
      const grandTotal = Math.round((subtotal + cgst + sgst - parseFloat(reservation.billing.discount_amount || 0)) * 100) / 100;
      const paidAmount = parseFloat(reservation.billing.paid_amount) || 0;

      await reservation.billing.update({
        subtotal: Math.round(subtotal * 100) / 100,
        cgst_amount: cgst,
        sgst_amount: sgst,
        grand_total: grandTotal,
        balance_due: Math.round((grandTotal - paidAmount) * 100) / 100,
      }, { transaction: t });
    }

    // 5. Add billing item to record the transfer
    if (reservation.billing) {
      await BillingItem.create({
        billing_id: reservation.billing.id,
        item_type: 'service',
        description: `Room transfer: ${oldRoomNumber} → ${newRoom.room_number}${reason ? ` (${reason})` : ''}`,
        quantity: 1,
        unit_price: 0,
        amount: 0,
        gst_rate: 0,
        date: dayjs().format('YYYY-MM-DD'),
      }, { transaction: t });
    }

    // 6. Audit log
    await logAudit({
      action: 'room_transfer',
      entity_type: 'Reservation',
      entity_id: reservation.id,
      user_id: req.user?.id,
      ip_address: req.ip,
      old_values: { room_id: oldRoomId, room_number: oldRoomNumber, rate_per_night: oldRate },
      new_values: { room_id: newRoom.id, room_number: newRoom.room_number, rate_per_night: newRate, reason: reason || null },
    });

    await t.commit();

    // Sync inventory (fire-and-forget)
    inventorySync.handleInventoryChange(reservation.id).catch(() => {});

    const updated = await Reservation.findByPk(reservation.id, {
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing' },
      ],
    });

    res.json({
      message: `Guest transferred from room ${oldRoomNumber} to room ${updated.room.room_number}`,
      reservation: updated,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = {
  list,
  create,
  getById,
  update,
  checkIn,
  checkOut,
  cancel,
  roomTransfer,
  getArrivals,
  getDepartures,
  calendar,
  checkAvailability,
  getGroup,
  groupCheckIn,
  groupCheckOut,
  groupCancel,
};
