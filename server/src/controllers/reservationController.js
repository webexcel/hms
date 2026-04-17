const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { getPagination, getPagingData } = require('../utils/pagination');
const { recalculateBillingTotals, createEmptyBilling, createReservationBillingItems } = require('../utils/billingUtils');
// OTA inventory sync disabled — not using channel manager currently
// const inventorySync = require('../services/inventorySync');
const inventorySync = { handleInventoryChange: () => Promise.resolve() };
const waNotifier = require('../services/whatsapp/hotelNotifier');
const { logAudit } = require('../utils/auditLogger');

// Resolve tiered hourly rate from room's hourly_rates JSON
// hourly_rates format: { "1": 500, "2": 800, "3": 1000, "default": 400 }
// For hours with a specific tier, use that price as total for those hours.
// For hours beyond defined tiers, use (tier price + default * extra hours).
function resolveHourlyRate(room, hours, overrideRate) {
  if (overrideRate && parseFloat(overrideRate) > 0) return parseFloat(overrideRate);

  const rates = room.hourly_rates;
  if (rates && typeof rates === 'object') {
    const tierRate = rates[String(hours)];
    if (tierRate !== undefined) return parseFloat(tierRate);
    // Find highest defined tier <= hours, then add default rate for extra hours
    const tiers = Object.keys(rates).filter(k => k !== 'default').map(Number).sort((a, b) => a - b);
    const defaultPerHour = parseFloat(rates.default) || parseFloat(room.hourly_rate) || Math.round(room.base_rate * 0.35);
    if (tiers.length > 0) {
      const bestTier = tiers.filter(t => t <= hours).pop();
      if (bestTier) {
        return parseFloat(rates[String(bestTier)]) + (hours - bestTier) * defaultPerHour;
      }
    }
    return hours * defaultPerHour;
  }
  // Fallback to legacy flat rate
  return hours * (parseFloat(room.hourly_rate) || Math.round(room.base_rate * 0.35) || 0);
}

// GET / - List reservations with filters and pagination
const list = async (req, res, next) => {
  try {
    const { Reservation, Guest, Room, Billing, BillingItem, OtaChannel } = req.db;
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
        { model: Billing, as: 'billing', include: [{ model: BillingItem, as: 'items' }] },
        { model: OtaChannel, as: 'otaChannel', attributes: ['id', 'name', 'code'], required: false },
      ],
      limit: size,
      offset,
      order: [['created_at', 'DESC']],
    });

    // Compute restaurant charges from billing items
    const data = result.rows.map(r => {
      const plain = r.toJSON();
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

    const response = getPagingData({ count: result.count, rows: data }, page, size);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// POST / - Create a new reservation (supports single room or group booking with rooms[] array)
const create = async (req, res, next) => {
  try {
    const { sequelize, Reservation, Guest, Room, Billing, BillingItem } = req.db;
    const {
      guest_id,
      room_id,
      room_type,
      check_in_date, check_out_date,
      check_in, check_out, // frontend aliases
      rate_per_night,
      booking_type: rawBookingType,
      expected_hours: rawExpectedHours,
      hourly_rate: rawHourlyRate,
      first_name, last_name, email, phone,
      id_proof_type, id_proof_number,
      guests_count, send_confirmation, collect_advance, payment_mode, guest_name,
      rooms, // group booking: array of { room_id, rate_per_night, adults, children }
      discount_type: rawDiscountType, discount_value: rawDiscountValue, discount_reason: rawDiscountReason,
      ...rest
    } = req.body;

    const bookingType = rawBookingType || 'nightly';
    const isHourly = bookingType === 'hourly';

    // Resolve dates (accept both field name conventions)
    const resolvedCheckIn = check_in_date || check_in;
    const resolvedCheckOut = check_out_date || check_out;

    if (!resolvedCheckIn) {
      return res.status(400).json({ message: 'Check-in date is required' });
    }

    // For hourly bookings, check_out = check_in (same day)
    const checkIn = dayjs(resolvedCheckIn);
    const checkOut = isHourly ? dayjs(resolvedCheckIn) : dayjs(resolvedCheckOut);
    const nights = isHourly ? 0 : checkOut.diff(checkIn, 'day');

    // Past-date bookings temporarily allowed (backfill from Format A register).

    if (!isHourly && !resolvedCheckOut) {
      return res.status(400).json({ message: 'Check-out date is required' });
    }

    if (!isHourly && nights <= 0) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Validate hourly booking
    const expectedHours = isHourly ? parseInt(rawExpectedHours) || 0 : null;
    if (isHourly) {
      if (expectedHours < 2 || expectedHours > 24) {
        return res.status(400).json({ message: 'Short stay duration must be between 2 and 24 hours' });
      }
    }

    // Resolve guest: use guest_id if provided, otherwise create from form fields
    let resolvedGuestId = guest_id;
    if (!resolvedGuestId && first_name && phone) {
      const [guest, created] = await Guest.findOrCreate({
        where: { phone },
        defaults: {
          first_name,
          last_name: last_name || '',
          email: email || null,
          phone,
          id_proof_type: id_proof_type || null,
          id_proof_number: id_proof_number || null,
        },
      });
      // Update ID proof if provided and guest already existed
      if (!created && id_proof_type && id_proof_number) {
        await guest.update({ id_proof_type, id_proof_number });
      }
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
        const avail = await isRoomAvailable(Reservation, r.room_id, resolvedCheckIn, resolvedCheckOut);
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
          const grpExtraBeds = parseInt(r.extra_beds || rest.extra_beds) || 0;
          const grpExtraBedCharge = grpExtraBeds > 0 ? (parseFloat(roomObj.extra_bed_charge) || 0) : 0;
          const total_amount = nights * (finalRate + grpExtraBeds * grpExtraBedCharge);
          const reservation_number = 'RES-' + (baseTs + i);

          // Advance is only on the primary (first) reservation
          const advancePaid = i === 0 ? (parseFloat(rest.advance_paid) || 0) : 0;

          // Hourly group support
          let finalHourlyRate = null;
          let groupTotal = total_amount;
          if (isHourly) {
            groupTotal = resolveHourlyRate(roomObj, expectedHours, r.hourly_rate);
            finalHourlyRate = Math.round((groupTotal / expectedHours) * 100) / 100;
          }

          const reservation = await Reservation.create({
            reservation_number,
            guest_id: resolvedGuestId,
            room_id: r.room_id,
            check_in_date: checkIn.toDate(),
            check_out_date: checkOut.toDate(),
            rate_per_night: isHourly ? 0 : finalRate,
            total_amount: isHourly ? groupTotal : total_amount,
            nights: isHourly ? 0 : nights,
            adults: r.adults || adults,
            children: r.children || children,
            advance_paid: advancePaid,
            source: rest.source,
            special_requests: rest.special_requests,
            status: rest.status || 'confirmed',
            meal_plan: isHourly ? 'none' : (rest.meal_plan || 'none'),
            booking_type: bookingType,
            expected_hours: expectedHours,
            hourly_rate: finalHourlyRate,
            extra_beds: grpExtraBeds,
            extra_bed_charge: grpExtraBedCharge,
            group_id: groupId,
            is_group_primary: i === 0,
            ...(rawDiscountValue && Number(rawDiscountValue) > 0 ? {
              discount_type: rawDiscountType === 'percentage' ? 'percentage' : 'amount',
              discount_value: Number(rawDiscountValue),
              discount_reason: rawDiscountReason || null,
            } : {}),
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
      createdReservations.forEach(r => inventorySync.handleInventoryChange(req.db, r.id).catch(() => {}));

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
    const available = await isRoomAvailable(Reservation, resolvedRoomId, resolvedCheckIn, resolvedCheckOut);
    if (!available) {
      return res.status(400).json({ message: 'Room is already booked for the selected dates' });
    }

    // Extra bed handling
    const extraBeds = parseInt(rest.extra_beds) || 0;
    const extraBedCharge = extraBeds > 0 ? (parseFloat(room.extra_bed_charge) || 0) : 0;

    let finalRate, total_amount, finalHourlyRate;
    if (isHourly) {
      total_amount = resolveHourlyRate(room, expectedHours, rawHourlyRate);
      finalHourlyRate = Math.round((total_amount / expectedHours) * 100) / 100;
      finalRate = 0; // rate_per_night not applicable
    } else {
      // Auto-select rate based on adults count if explicit rate not given
      if (rate_per_night) {
        finalRate = parseFloat(rate_per_night);
      } else {
        const adultsCount = parseInt(rest.adults) || 1;
        if (adultsCount === 1 && room.single_rate) finalRate = parseFloat(room.single_rate);
        else if (adultsCount === 2 && room.double_rate) finalRate = parseFloat(room.double_rate);
        else if (adultsCount >= 3 && room.triple_rate) finalRate = parseFloat(room.triple_rate);
        else finalRate = parseFloat(room.double_rate || room.triple_rate || room.single_rate || room.base_rate) || 0;
      }
      total_amount = nights * (finalRate + extraBeds * extraBedCharge);
      finalHourlyRate = null;
    }
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
      meal_plan: isHourly ? 'none' : (rest.meal_plan || 'none'),
      booking_type: bookingType,
      expected_hours: expectedHours,
      hourly_rate: finalHourlyRate,
      extra_beds: extraBeds,
      extra_bed_charge: extraBedCharge,
      ...(rawDiscountValue && Number(rawDiscountValue) > 0 ? {
        discount_type: rawDiscountType === 'percentage' ? 'percentage' : 'amount',
        discount_value: Number(rawDiscountValue),
        discount_reason: rawDiscountReason || null,
      } : {}),
    });

    // Only mark room as reserved if check-in is today or earlier
    if (checkIn.isBefore(dayjs().endOf('day'))) {
      await room.update({ status: 'reserved' });
    }

    // Create billing + advance payment record if advance paid at booking
    if (advancePaid > 0) {
      try {
        const Billing = req.db.Billing;
        const Payment = req.db.Payment;
        const newBilling = await createEmptyBilling(Billing, {
          reservation_id: reservation.id,
          guest_id: resolvedGuestId,
          invoice_number: 'INV-' + Date.now(),
          paid_amount: advancePaid,
        });
        await Payment.create({
          billing_id: newBilling.id,
          amount: advancePaid,
          payment_method: payment_mode || 'cash',
          payment_type: 'payment',
          notes: 'Advance / Deposit',
        });
      } catch (e) {
        console.warn('Failed to log advance payment at reservation creation', e?.message);
      }
    }

    // Sync inventory after creation
    inventorySync.handleInventoryChange(req.db, reservation.id).catch(() => {});

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
    const { Reservation, Guest, Room, Billing, BillingItem } = req.db;
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing', include: [{ model: BillingItem, as: 'items' }] },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const plain = reservation.toJSON();
    const billingItems = plain.billing?.items || [];
    const restItems = billingItems.filter(i => i.item_type === 'restaurant');
    plain.restaurant_charges = restItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
    plain.restaurant_items = restItems.map(i => ({
      description: i.description,
      amount: parseFloat(i.amount) || 0,
      date: i.date,
    }));

    res.json(plain);
  } catch (error) {
    next(error);
  }
};

// PUT /:id - Update reservation
const update = async (req, res, next) => {
  try {
    const { Reservation, Guest, Room } = req.db;
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    const isHourlyRes = (req.body.booking_type || reservation.booking_type) === 'hourly';

    // Recalculate total if dates or rate changed
    const check_in_date = req.body.check_in_date || reservation.check_in_date;
    const check_out_date = req.body.check_out_date || reservation.check_out_date;
    const rate_per_night = req.body.rate_per_night || reservation.rate_per_night;
    const room_id = req.body.room_id || reservation.room_id;

    const checkIn = dayjs(check_in_date);
    const checkOut = isHourlyRes ? dayjs(check_in_date) : dayjs(check_out_date);
    const nights = isHourlyRes ? 0 : checkOut.diff(checkIn, 'day');

    if (!isHourlyRes && nights <= 0) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Check availability if dates or room changed
    if (req.body.check_in_date || req.body.check_out_date || req.body.room_id) {
      const available = await isRoomAvailable(Reservation, room_id, check_in_date, check_out_date, reservation.id);
      if (!available) {
        return res.status(400).json({ message: 'Room is already booked for the selected dates' });
      }
    }

    let total_amount;
    if (isHourlyRes) {
      const hours = parseInt(req.body.expected_hours) || reservation.expected_hours || 3;
      const { Room } = req.db;
      const roomForRate = await Room.findByPk(room_id);
      total_amount = resolveHourlyRate(roomForRate, hours, req.body.hourly_rate);
    } else {
      const updExtraBeds = parseInt(req.body.extra_beds ?? reservation.extra_beds) || 0;
      const updExtraBedCharge = parseFloat(req.body.extra_bed_charge ?? reservation.extra_bed_charge) || 0;
      total_amount = nights * (rate_per_night + updExtraBeds * updExtraBedCharge);
    }

    await reservation.update({
      ...req.body,
      nights,
      total_amount,
    });

    // Sync inventory after update
    inventorySync.handleInventoryChange(req.db, reservation.id).catch(() => {});

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
    const { Reservation, Guest, Room, Billing, BillingItem } = req.db;
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [{ model: Room, as: 'room' }, { model: Guest, as: 'guest' }],
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (!['pending', 'confirmed'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Reservation cannot be checked in with current status' });
    }

    // Update guest ID proof if provided in request
    const { id_proof_type, id_proof_number } = req.body;
    if (id_proof_type && id_proof_number && reservation.guest) {
      await reservation.guest.update({ id_proof_type, id_proof_number });
    }

    // Block check-in if guest has no ID proof
    const guest = reservation.guest;
    const hasIdProof = (id_proof_type && id_proof_number) || (guest?.id_proof_type && guest?.id_proof_number);
    if (!hasIdProof) {
      return res.status(400).json({ message: 'ID proof is required for check-in. Please provide ID type and number.' });
    }

    // Block check-in if room is dirty or being cleaned
    const roomCleanStatus = reservation.room?.cleanliness_status;
    if (roomCleanStatus && !['clean', 'inspected'].includes(roomCleanStatus)) {
      const statusLabel = roomCleanStatus === 'dirty' ? 'dirty' : roomCleanStatus === 'in_progress' ? 'being cleaned' : roomCleanStatus === 'awaiting_verification' ? 'awaiting verification' : roomCleanStatus === 'out_of_order' ? 'out of order' : roomCleanStatus;
      return res.status(400).json({ message: `Room ${reservation.room.room_number} is ${statusLabel}. Please clean the room before check-in.` });
    }

    const now = dayjs();
    const isHourlyRes = reservation.booking_type === 'hourly';
    const expectedCheckoutTime = isHourlyRes
      ? now.add(reservation.expected_hours || 3, 'hour').toDate()
      : null;

    await reservation.update({
      status: 'checked_in',
      actual_check_in: now.toDate(),
      ...(isHourlyRes ? { expected_checkout_time: expectedCheckoutTime } : {}),
    });

    await reservation.room.update({ status: 'occupied' });

    const depositNow = parseFloat(req.body.deposit_amount) || 0;
    const advancePaid = (parseFloat(reservation.advance_paid) || 0) + depositNow;

    // Update reservation advance_paid if deposit collected at check-in
    if (depositNow > 0) {
      await reservation.update({ advance_paid: advancePaid });
    }

    // Only create billing if one doesn't already exist (OTA bookings may already have one)
    const existingBilling = await Billing.findOne({ where: { reservation_id: reservation.id } });
    if (!existingBilling) {
      const newBilling = await createEmptyBilling(Billing, {
        reservation_id: reservation.id,
        guest_id: reservation.guest_id,
        invoice_number: 'INV-' + Date.now(),
        paid_amount: advancePaid,
      });
      // Record advance as a payment so it appears in payment history
      if (advancePaid > 0) {
        const Payment = req.db.Payment;
        await Payment.create({
          billing_id: newBilling.id,
          amount: advancePaid,
          payment_method: req.body.payment_mode || 'cash',
          payment_type: 'payment',
          notes: 'Advance / Deposit',
        });
      }
      await createReservationBillingItems(BillingItem, newBilling.id, reservation, reservation.room);
      // Apply booking-time discount if present — capped to misc charges only
      const bookingDiscountOpts = {};
      if (reservation.discount_value && Number(reservation.discount_value) > 0) {
        const allItems = await BillingItem.findAll({ where: { billing_id: newBilling.id } });
        let miscTotal = 0;
        for (const item of allItems) {
          if (item.item_type === 'service' && item.description && item.description.toLowerCase().includes('misc')) {
            miscTotal += parseFloat(item.amount) || 0;
          }
        }
        if (miscTotal > 0) {
          let discAmt;
          if (reservation.discount_type === 'percentage') {
            discAmt = Math.round(miscTotal * (Number(reservation.discount_value) / 100) * 100) / 100;
          } else {
            discAmt = Math.round(Number(reservation.discount_value) * 100) / 100;
          }
          // Cap at misc total
          if (discAmt > miscTotal) discAmt = miscTotal;
          bookingDiscountOpts.discountAmount = discAmt;
          bookingDiscountOpts.discountNotes = `OM Discount: ${reservation.discount_reason || (reservation.discount_type === 'percentage' ? reservation.discount_value + '%' : '₹' + reservation.discount_value)}`;
          bookingDiscountOpts.items = allItems;
        }
      }
      await recalculateBillingTotals(newBilling, BillingItem, bookingDiscountOpts);
    } else if (parseFloat(existingBilling.subtotal) === 0) {
      // Billing exists but amounts are empty (e.g. OTA) — populate items and recalculate
      const Payment = req.db.Payment;
      const existingPaidAmount = parseFloat(existingBilling.paid_amount) || 0;
      // Only record advance payment if not already recorded (prevent duplicates)
      if (advancePaid > 0 && advancePaid > existingPaidAmount) {
        const delta = advancePaid - existingPaidAmount;
        await existingBilling.update({ paid_amount: advancePaid });
        await Payment.create({
          billing_id: existingBilling.id,
          amount: delta,
          payment_method: req.body.payment_mode || 'cash',
          payment_type: 'payment',
          notes: 'Advance / Deposit',
        });
      }
      const existingRoomItem = await BillingItem.findOne({ where: { billing_id: existingBilling.id, item_type: 'room_charge' } });
      if (!existingRoomItem) {
        await createReservationBillingItems(BillingItem, existingBilling.id, reservation, reservation.room);
      }
      await recalculateBillingTotals(existingBilling, BillingItem);
    }

    // Sync inventory after check-in
    inventorySync.handleInventoryChange(req.db, reservation.id).catch(() => {});

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
    const { Reservation, Guest, Room, Billing, BillingItem, HousekeepingTask } = req.db;
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
      // Add overstay billing item for hourly bookings
      if (reservation.booking_type === 'hourly' && reservation.actual_check_in) {
        const hourlyRate = parseFloat(reservation.hourly_rate) || 0;
        const bookedHours = reservation.expected_hours || 3;
        const actualHours = Math.ceil(dayjs().diff(dayjs(reservation.actual_check_in), 'hour', true));
        if (actualHours > bookedHours) {
          const overstayHours = actualHours - bookedHours;
          const overstayCharge = overstayHours * hourlyRate;
          await BillingItem.findOrCreate({
            where: { billing_id: billing.id, item_type: 'room_charge', description: { [Op.like]: 'Overstay%' } },
            defaults: {
              billing_id: billing.id,
              item_type: 'room_charge',
              description: `Overstay charge (${overstayHours} hr × ₹${hourlyRate}/hr)`,
              unit_price: hourlyRate,
              amount: overstayCharge,
              quantity: overstayHours,
              date: new Date(),
            },
          });
        }
      }

      // Recalculate totals (discount is now managed from Billing section, not checkout)
      await recalculateBillingTotals(billing, BillingItem);
    }

    await reservation.update({
      status: 'checked_out',
      actual_check_out: dayjs().toDate(),
    });

    // Only change room status if no other active reservation exists on this room
    const otherActive = await Reservation.count({
      where: {
        room_id: reservation.room_id,
        id: { [Op.ne]: reservation.id },
        status: 'checked_in',
      },
    });
    if (otherActive === 0) {
      await reservation.room.update({ status: 'cleaning', cleanliness_status: 'dirty' });
    }

    await HousekeepingTask.create({
      room_id: reservation.room_id,
      task_type: 'cleaning',
      status: 'pending',
      priority: 'high',
      notes: `Checkout cleaning for reservation ${reservation.reservation_number}`,
    });

    // Sync inventory after checkout
    inventorySync.handleInventoryChange(req.db, reservation.id).catch(() => {});

    const updated = await Reservation.findByPk(reservation.id, {
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing' },
      ],
    });

    // Insert into standalone checkout_history table
    try {
      const { CheckoutHistory, Payment: PaymentModel } = req.db;
      const b = updated.billing;
      const payments = b ? await PaymentModel.findAll({ where: { billing_id: b.id }, raw: true }) : [];
      const totalPaid = payments.filter(p => p.payment_type !== 'refund').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
      const totalRefunded = payments.filter(p => p.payment_type === 'refund').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
      const byMethod = (method) => Math.round(payments.filter(p => p.payment_method === method && p.payment_type !== 'refund').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) * 100) / 100;

      await CheckoutHistory.findOrCreate({
        where: { reservation_id: updated.id },
        defaults: {
          reservation_number: updated.reservation_number,
          gst_bill_number: b?.gst_bill_number || null,
          invoice_number: b?.invoice_number || null,
          guest_name: updated.guest ? `${updated.guest.first_name} ${updated.guest.last_name}`.trim() : 'Unknown',
          guest_phone: updated.guest?.phone || null,
          room_number: updated.room?.room_number || null,
          room_type: updated.room?.room_type || null,
          check_in: updated.check_in_date,
          check_out: updated.check_out_date,
          actual_check_in: updated.actual_check_in,
          actual_check_out: updated.actual_check_out,
          nights: updated.nights || 0,
          rate_per_night: parseFloat(updated.rate_per_night) || 0,
          source: updated.source,
          meal_plan: updated.meal_plan,
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
          cash_paid: byMethod('cash'),
          card_paid: byMethod('card'),
          upi_paid: byMethod('upi'),
          payment_status: b?.payment_status || 'unknown',
          reservation_id: updated.id,
          billing_id: b?.id || null,
          created_by: req.user?.id || null,
        },
      });
    } catch (e) { /* non-critical — don't block checkout */ }

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

// Cancellation refund rules
const REFUND_RULES = [
  { minHours: 72, refundPercent: 100, label: '72+ hours before check-in — Full refund' },
  { minHours: 48, refundPercent: 75,  label: '48–72 hours before check-in — 75% refund' },
  { minHours: 24, refundPercent: 50,  label: '24–48 hours before check-in — 50% refund' },
  { minHours: 0,  refundPercent: 0,   label: 'Less than 24 hours — No refund' },
];

function getRefundRule(checkInDate) {
  const hoursUntilCheckIn = dayjs(checkInDate).startOf('day').diff(dayjs(), 'hour', true);
  for (const rule of REFUND_RULES) {
    if (hoursUntilCheckIn >= rule.minHours) return { ...rule, hoursUntilCheckIn: Math.max(0, Math.floor(hoursUntilCheckIn)) };
  }
  return { ...REFUND_RULES[REFUND_RULES.length - 1], hoursUntilCheckIn: Math.max(0, Math.floor(hoursUntilCheckIn)) };
}

// GET /:id/refund-preview - Preview refund amount before cancellation
const refundPreview = async (req, res, next) => {
  try {
    const { Reservation, Room } = req.db;
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [{ model: Room, as: 'room' }],
    });
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    const advancePaid = parseFloat(reservation.advance_paid) || 0;
    const rule = getRefundRule(reservation.check_in_date);
    const refundAmount = Math.round(advancePaid * (rule.refundPercent / 100) * 100) / 100;
    const deduction = Math.round((advancePaid - refundAmount) * 100) / 100;

    res.json({
      advance_paid: advancePaid,
      hours_until_checkin: rule.hoursUntilCheckIn,
      refund_percent: rule.refundPercent,
      refund_amount: refundAmount,
      deduction,
      rule_label: rule.label,
      rules: REFUND_RULES,
      can_override: ['admin', 'manager'].includes(req.user.role),
    });
  } catch (error) {
    next(error);
  }
};

// PUT /:id/cancel - Cancel a reservation
const cancel = async (req, res, next) => {
  try {
    const { Reservation, Guest, Room, Billing, Payment } = req.db;
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
    await reservation.room.update({ status: 'available', cleanliness_status: 'clean' });

    // Handle refund based on cancellation rules
    const advancePaid = parseFloat(reservation.advance_paid) || 0;
    let refundAmount = 0;
    let refundPercent = 0;
    let ruleLabel = '';
    let overridden = false;
    if (advancePaid > 0) {
      const rule = getRefundRule(reservation.check_in_date);
      refundPercent = rule.refundPercent;
      ruleLabel = rule.label;
      refundAmount = Math.round(advancePaid * (refundPercent / 100) * 100) / 100;

      // OM (admin/manager) can override refund amount
      if (req.body.override_refund_amount !== undefined && ['admin', 'manager'].includes(req.user.role)) {
        const overrideAmount = parseFloat(req.body.override_refund_amount);
        if (isNaN(overrideAmount) || overrideAmount < 0 || overrideAmount > advancePaid) {
          return res.status(400).json({ message: `Override refund must be between ₹0 and ₹${advancePaid}` });
        }
        refundAmount = Math.round(overrideAmount * 100) / 100;
        refundPercent = advancePaid > 0 ? Math.round((refundAmount / advancePaid) * 100) : 0;
        ruleLabel = `Manager override — ₹${refundAmount} refund (original policy: ${rule.label})`;
        overridden = true;
      }

      const deduction = Math.round((advancePaid - refundAmount) * 100) / 100;

      const billing = await Billing.findOne({ where: { reservation_id: reservation.id } });
      if (billing) {
        const noteText = refundAmount > 0
          ? `Cancelled. Refund: ₹${refundAmount} (${refundPercent}%). Deduction: ₹${deduction}.`
          : `Cancelled. No refund (${ruleLabel}).`;
        await billing.update({
          payment_status: refundAmount > 0 ? 'refunded' : 'paid',
          balance_due: 0,
          notes: `${noteText} ${billing.notes || ''}`.trim(),
        });
        if (refundAmount > 0) {
          await Payment.create({
            billing_id: billing.id,
            amount: refundAmount,
            payment_type: 'refund',
            payment_method: req.body.refund_method || 'cash',
            transaction_ref: req.body.refund_reference || null,
            payment_date: new Date(),
            notes: `Refund (${refundPercent}%) for cancelled reservation ${reservation.reservation_number}. ${ruleLabel}`,
          });
          // Update billing's paid_amount to reflect net after refund
          const newPaid = Math.max(0, (parseFloat(billing.paid_amount) || 0) - refundAmount);
          await billing.update({ paid_amount: newPaid });
        }
      }
    }

    // Sync inventory after cancellation
    inventorySync.handleInventoryChange(req.db, reservation.id).catch(() => {});

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

    const result = updated.toJSON();
    result.refund_amount = refundAmount;
    result.refund_percent = refundPercent;
    result.refund_rule = ruleLabel;
    result.refund_overridden = overridden;
    result.advance_paid_amount = advancePaid;
    result.deduction = Math.round((advancePaid - refundAmount) * 100) / 100;
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// GET /arrivals - Today's expected check-ins
const getArrivals = async (req, res, next) => {
  try {
    const { Reservation, Guest, Room } = req.db;
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
    const { Reservation, Guest, Room, Billing, BillingItem } = req.db;
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
    const { Reservation, Guest, Room } = req.db;
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
const isRoomAvailable = async (Reservation, room_id, check_in_date, check_out_date, excludeReservationId = null) => {
  const checkIn = dayjs(check_in_date).startOf('day').toDate();
  // For same-day (hourly) bookings, extend checkOut to end of day so the overlap query works
  const isSameDay = dayjs(check_in_date).isSame(dayjs(check_out_date), 'day');
  const checkOut = isSameDay
    ? dayjs(check_out_date).endOf('day').toDate()
    : dayjs(check_out_date).startOf('day').toDate();

  const today = dayjs().startOf('day').toDate();

  const where = {
    room_id,
    [Op.and]: [
      // Must overlap the requested date range
      { check_in_date: { [Op.lt]: checkOut } },
      { check_out_date: { [Op.gt]: checkIn } },
      // Only count active reservations (not cancelled/checked_out/no_show)
      { status: { [Op.notIn]: ['cancelled', 'checked_out', 'no_show'] } },
      // Exclude stale reservations: pending/confirmed whose check-out date has passed
      {
        [Op.not]: {
          [Op.and]: [
            { status: { [Op.in]: ['pending', 'confirmed'] } },
            { check_out_date: { [Op.lte]: today } },
          ],
        },
      },
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
    const { Reservation, Room } = req.db;
    const { check_in, check_out, room_type } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({ message: 'check_in and check_out are required' });
    }

    const checkIn = dayjs(check_in).startOf('day').toDate();
    const isSameDay = dayjs(check_out).diff(dayjs(check_in), 'day') === 0;
    const checkOut = isSameDay ? dayjs(check_out).endOf('day').toDate() : dayjs(check_out).startOf('day').toDate();

    if (dayjs(check_out).diff(dayjs(check_in), 'day') < 0) {
      return res.status(400).json({ message: 'check_out must not be before check_in' });
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
    const { Reservation, Guest, Room, Billing } = req.db;
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
    const { sequelize, Reservation, Guest, Room, Billing, BillingItem } = req.db;
    const { groupId } = req.params;
    const reservations = await Reservation.findAll({
      where: { group_id: groupId, status: { [Op.in]: ['pending', 'confirmed'] } },
      include: [{ model: Room, as: 'room' }, { model: Guest, as: 'guest' }],
    });

    if (reservations.length === 0) {
      return res.status(400).json({ message: 'No reservations available for check-in in this group' });
    }

    // Check ID proof for primary guest
    const primary = reservations.find(r => r.is_group_primary) || reservations[0];
    const { id_proof_type, id_proof_number } = req.body;
    if (id_proof_type && id_proof_number && primary.guest) {
      await primary.guest.update({ id_proof_type, id_proof_number });
    }
    const hasIdProof = (id_proof_type && id_proof_number) || (primary.guest?.id_proof_type && primary.guest?.id_proof_number);
    if (!hasIdProof) {
      return res.status(400).json({ message: 'ID proof is required for check-in. Please provide ID type and number.' });
    }

    await sequelize.transaction(async (t) => {
      for (const reservation of reservations) {
        await reservation.update({
          status: 'checked_in',
          actual_check_in: dayjs().toDate(),
        }, { transaction: t });

        await reservation.room.update({ status: 'occupied' }, { transaction: t });

        const advancePaid = parseFloat(reservation.advance_paid) || 0;
        const existingBilling = await Billing.findOne({ where: { reservation_id: reservation.id }, transaction: t });
        if (!existingBilling) {
          const newBilling = await createEmptyBilling(Billing, {
            reservation_id: reservation.id,
            guest_id: reservation.guest_id,
            invoice_number: 'INV-' + Date.now() + '-' + reservation.id,
            paid_amount: advancePaid,
          }, { transaction: t });
          await createReservationBillingItems(BillingItem, newBilling.id, reservation, reservation.room, { transaction: t });
          await recalculateBillingTotals(newBilling, BillingItem, { transaction: t });
        }
      }
    });

    // Sync inventory
    reservations.forEach(r => inventorySync.handleInventoryChange(req.db, r.id).catch(() => {}));

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
    const { sequelize, Reservation, Guest, Room, Billing, BillingItem, HousekeepingTask } = req.db;
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
        // Finalize billing from billing items
        const billing = await Billing.findOne({ where: { reservation_id: reservation.id }, transaction: t });
        if (billing) {
          await recalculateBillingTotals(billing, BillingItem, { transaction: t });
        }

        await reservation.update({
          status: 'checked_out',
          actual_check_out: dayjs().toDate(),
        }, { transaction: t });

        // Only change room status if no other active reservation exists on this room
        const otherActive = await Reservation.count({
          where: {
            room_id: reservation.room_id,
            id: { [Op.ne]: reservation.id },
            status: 'checked_in',
          },
          transaction: t,
        });
        if (otherActive === 0) {
          await reservation.room.update({ status: 'cleaning', cleanliness_status: 'dirty' }, { transaction: t });
        }

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
    reservations.forEach(r => inventorySync.handleInventoryChange(req.db, r.id).catch(() => {}));

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
    const { sequelize, Reservation, Guest, Room } = req.db;
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
        await reservation.room.update({ status: 'available', cleanliness_status: 'clean' }, { transaction: t });
      }
    });

    reservations.forEach(r => inventorySync.handleInventoryChange(req.db, r.id).catch(() => {}));

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
  const { sequelize, Reservation, Guest, Room, Billing, BillingItem, HousekeepingTask } = req.db;
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
      const trNights = reservation.nights || dayjs(reservation.check_out_date).diff(dayjs(reservation.check_in_date), 'day') || 1;
      const trExtraBeds = parseInt(reservation.extra_beds) || 0;
      const trExtraBedCharge = parseFloat(reservation.extra_bed_charge) || 0;
      updateData.rate_per_night = newRoom.base_rate;
      updateData.total_amount = trNights * (parseFloat(newRoom.base_rate) + trExtraBeds * trExtraBedCharge);
    }

    await reservation.update(updateData, { transaction: t });

    // 4. Add transfer audit item + recalculate billing
    const newRate = adjust_rate ? parseFloat(newRoom.base_rate) : oldRate;
    if (reservation.billing) {
      // Record the transfer as a billing item (zero-cost audit trail)
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

      // Update room charge billing item if rate adjusted
      if (adjust_rate) {
        const nights = reservation.nights || dayjs(reservation.check_out_date).diff(dayjs(reservation.check_in_date), 'day') || 1;
        const roomSubtotal = nights * newRate;
        const roomChargeItem = await BillingItem.findOne({
          where: { billing_id: reservation.billing.id, item_type: 'room_charge' },
          transaction: t,
        });
        if (roomChargeItem) {
          await roomChargeItem.update({
            description: `Room ${newRoom.room_number} - ${nights} night(s) @ ₹${newRate}/night`,
            unit_price: newRate,
            amount: Math.round(roomSubtotal * 100) / 100,
          }, { transaction: t });
        }

        // Recalculate billing totals from all items
        await recalculateBillingTotals(reservation.billing, BillingItem, { transaction: t });
      }
    }

    // 6. Audit log
    await logAudit(req.db.AuditLog, {
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
    inventorySync.handleInventoryChange(req.db, reservation.id).catch(() => {});

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

// PUT /:id/convert-to-nightly - Convert hourly booking to nightly stay
const convertToNightly = async (req, res, next) => {
  try {
    const { Reservation, Room, Guest, Billing, BillingItem } = req.db;
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [{ model: Room, as: 'room' }, { model: Guest, as: 'guest' }],
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    if (reservation.booking_type !== 'hourly') {
      return res.status(400).json({ message: 'Only hourly bookings can be converted' });
    }
    if (reservation.status !== 'checked_in') {
      return res.status(400).json({ message: 'Reservation must be checked in to convert' });
    }

    const { check_out_date, rate_per_night } = req.body;
    if (!check_out_date) {
      return res.status(400).json({ message: 'Check-out date is required' });
    }

    const checkIn = dayjs(reservation.check_in_date);
    const checkOut = dayjs(check_out_date);
    const nights = checkOut.diff(checkIn, 'day');
    if (nights <= 0) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    const finalRate = parseFloat(rate_per_night) || reservation.room.base_rate || 0;
    const totalAmount = nights * finalRate;

    await reservation.update({
      booking_type: 'nightly',
      check_out_date: checkOut.toDate(),
      rate_per_night: finalRate,
      total_amount: totalAmount,
      nights,
      expected_hours: null,
      hourly_rate: null,
      expected_checkout_time: null,
    });

    // Update billing: replace hourly room charge with nightly
    const billing = await Billing.findOne({ where: { reservation_id: reservation.id } });
    if (billing) {
      await BillingItem.destroy({
        where: { billing_id: billing.id, item_type: 'room_charge' },
      });
      const { getGstRateByItemType, getHsnCode } = require('../utils/gst');
      await BillingItem.create({
        billing_id: billing.id,
        item_type: 'room_charge',
        description: `Room ${reservation.room.room_number} - ${nights} night(s) @ ₹${finalRate}/night`,
        quantity: nights,
        unit_price: finalRate,
        amount: Math.round(totalAmount * 100) / 100,
        gst_rate: getGstRateByItemType('room_charge', totalAmount),
        hsn_code: getHsnCode('room_charge'),
        date: new Date(),
      });
      await recalculateBillingTotals(billing, BillingItem);
    }

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

// ─── PDF Helpers ───

const PDFDocument = require('pdfkit');

function pdfHeader(doc, title) {
  const { HOTEL_INFO, HOTEL_DEFAULTS } = require('../config/constants');
  doc.fontSize(20).font('Helvetica-Bold').text(HOTEL_INFO.TRADE_NAME, { align: 'center' });
  doc.fontSize(9).font('Helvetica').text(
    `${HOTEL_INFO.ADDRESS}, ${HOTEL_INFO.CITY} - ${HOTEL_INFO.PINCODE} | ${HOTEL_INFO.PHONE}`,
    { align: 'center' }
  );
  doc.text(`GSTIN: ${HOTEL_INFO.GSTIN} | Email: ${HOTEL_INFO.EMAIL}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1.5).stroke();
  doc.moveDown(0.3);
  doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(0.5);
}

function pdfRow(doc, label, value, x, y, labelW) {
  const lw = labelW || 130;
  doc.font('Helvetica-Bold').fontSize(9).text(label, x, y, { width: lw });
  doc.font('Helvetica').fontSize(9).text(value || '—', x + lw, y, { width: 350 });
}

function pdfSectionTitle(doc, title) {
  const y = doc.y;
  doc.rect(50, y, 495, 18).fill('#f0f4ff');
  doc.fill('#1e3a5f').font('Helvetica-Bold').fontSize(10).text(title, 56, y + 4);
  doc.fill('#000');
  doc.y = y + 24;
}

// GET /:id/check-in-summary - Check-in registration card PDF
const checkInSummaryPdf = async (req, res, next) => {
  try {
    const { Reservation, Guest, Room, Billing } = req.db;
    const { HOTEL_DEFAULTS } = require('../config/constants');
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing' },
      ],
    });

    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    const guest = reservation.guest || {};
    const room = reservation.room || {};
    const isHourly = reservation.booking_type === 'hourly';
    const nights = reservation.nights || 1;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=checkin-${reservation.reservation_number}.pdf`);
    doc.pipe(res);

    pdfHeader(doc, 'GUEST REGISTRATION CARD');

    // Reservation info line
    doc.fontSize(9).font('Helvetica');
    doc.text(`Reservation #: ${reservation.reservation_number}`, 50, doc.y, { continued: true });
    doc.text(`Date: ${dayjs().format('DD/MM/YYYY  HH:mm')}`, { align: 'right' });
    doc.moveDown(0.8);

    // Guest Details
    pdfSectionTitle(doc, 'Guest Details');
    let y = doc.y;
    pdfRow(doc, 'Guest Name:', `${guest.first_name || ''} ${guest.last_name || ''}`, 50, y);
    y += 16;
    pdfRow(doc, 'Phone:', guest.phone || '', 50, y);
    pdfRow(doc, 'Email:', guest.email || '', 300, y, 60);
    y += 16;
    pdfRow(doc, 'ID Proof:', `${(guest.id_proof_type || '').toUpperCase()} — ${guest.id_proof_number || ''}`, 50, y);
    y += 16;
    if (guest.address || guest.city) {
      pdfRow(doc, 'Address:', [guest.address, guest.city, guest.state, guest.pincode].filter(Boolean).join(', '), 50, y);
      y += 16;
    }
    if (guest.company_name) {
      pdfRow(doc, 'Company:', guest.company_name, 50, y);
      y += 16;
    }
    if (guest.gstin) {
      pdfRow(doc, 'GSTIN:', guest.gstin, 50, y);
      y += 16;
    }
    doc.y = y + 6;

    // Room & Stay Details
    pdfSectionTitle(doc, 'Room & Stay Details');
    y = doc.y;
    pdfRow(doc, 'Room Number:', `${room.room_number || ''}`, 50, y);
    pdfRow(doc, 'Room Type:', `${(room.room_type || '').charAt(0).toUpperCase() + (room.room_type || '').slice(1)}`, 300, y, 80);
    y += 16;
    pdfRow(doc, 'Floor:', `${room.floor || ''}`, 50, y);
    pdfRow(doc, 'Occupancy:', `${reservation.adults || 1} Adult(s)${reservation.children ? `, ${reservation.children} Child(ren)` : ''}`, 300, y, 80);
    y += 16;

    if (isHourly) {
      pdfRow(doc, 'Booking Type:', 'Short Stay (Hourly)', 50, y);
      pdfRow(doc, 'Duration:', `${reservation.expected_hours || '-'} hours`, 300, y, 80);
      y += 16;
      pdfRow(doc, 'Check-in:', dayjs(reservation.actual_check_in || reservation.check_in_date).format('DD/MM/YYYY HH:mm'), 50, y);
      pdfRow(doc, 'Rate:', `Rs. ${parseFloat(reservation.hourly_rate || 0).toFixed(2)}/hr`, 300, y, 80);
    } else {
      pdfRow(doc, 'Check-in:', dayjs(reservation.check_in_date).format('DD/MM/YYYY') + `  (${HOTEL_DEFAULTS.CHECK_IN_TIME})`, 50, y);
      pdfRow(doc, 'Nights:', `${nights}`, 300, y, 80);
      y += 16;
      pdfRow(doc, 'Check-out:', dayjs(reservation.check_out_date).format('DD/MM/YYYY') + `  (${HOTEL_DEFAULTS.CHECK_OUT_TIME})`, 50, y);
      pdfRow(doc, 'Rate/Night:', `Rs. ${parseFloat(reservation.rate_per_night || 0).toFixed(2)}`, 300, y, 80);
    }
    y += 16;

    if (reservation.meal_plan && reservation.meal_plan !== 'none') {
      const mealLabel = reservation.meal_plan === 'both' ? 'Breakfast + Dinner' : reservation.meal_plan === 'breakfast' ? 'Breakfast' : 'Dinner';
      pdfRow(doc, 'Meal Plan:', mealLabel, 50, y);
      y += 16;
    }
    doc.y = y + 6;

    // Financial Summary
    pdfSectionTitle(doc, 'Financial Summary');
    y = doc.y;
    const billing = reservation.billing;
    const totalEst = isHourly
      ? (reservation.expected_hours || 0) * parseFloat(reservation.hourly_rate || 0)
      : nights * parseFloat(reservation.rate_per_night || 0);
    const gstEst = Math.round(totalEst * 0.12 * 100) / 100;
    const grandEst = billing ? parseFloat(billing.grand_total || 0) : totalEst + gstEst;
    const advance = parseFloat(reservation.advance_paid || 0);

    pdfRow(doc, 'Room Charges:', `Rs. ${totalEst.toFixed(2)}`, 50, y);
    y += 16;
    pdfRow(doc, 'Est. GST (12%):', `Rs. ${gstEst.toFixed(2)}`, 50, y);
    y += 16;
    pdfRow(doc, 'Est. Total:', `Rs. ${grandEst.toFixed(2)}`, 50, y);
    y += 16;
    pdfRow(doc, 'Advance Paid:', `Rs. ${advance.toFixed(2)}`, 50, y);
    y += 16;
    const balEst = grandEst - advance;
    doc.font('Helvetica-Bold').fontSize(10);
    pdfRow(doc, 'Balance (Est.):', `Rs. ${balEst.toFixed(2)}`, 50, y);
    y += 16;

    if (reservation.special_requests) {
      doc.y = y + 6;
      pdfSectionTitle(doc, 'Special Requests');
      doc.font('Helvetica').fontSize(9).text(reservation.special_requests, 56, doc.y, { width: 480 });
    }

    // Terms & Signature
    doc.y = Math.max(doc.y + 20, 580);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(8).fillColor('#555');
    doc.text('1. Check-out time is ' + HOTEL_DEFAULTS.CHECK_OUT_TIME + '. Late checkout charges may apply.', 50);
    doc.text('2. The hotel is not responsible for valuables not deposited in the safety locker.');
    doc.text('3. Guests are requested to settle all bills at the time of checkout.');
    doc.text('4. Government-issued photo ID is mandatory for all guests.');
    doc.moveDown(1.5);
    doc.fillColor('#000');

    // Signature lines
    const sigY = doc.y;
    doc.moveTo(50, sigY + 30).lineTo(220, sigY + 30).stroke();
    doc.fontSize(9).text('Guest Signature', 50, sigY + 34);
    doc.moveTo(340, sigY + 30).lineTo(545, sigY + 30).stroke();
    doc.text('Front Desk', 340, sigY + 34);

    doc.end();
  } catch (error) {
    next(error);
  }
};

// GET /:id/check-out-summary - Check-out settlement receipt PDF
const checkOutSummaryPdf = async (req, res, next) => {
  try {
    const { Reservation, Guest, Room, Billing, BillingItem, Payment } = req.db;
    const reservation = await Reservation.findByPk(req.params.id, {
      include: [
        { model: Guest, as: 'guest' },
        { model: Room, as: 'room' },
        { model: Billing, as: 'billing', include: [
          { model: BillingItem, as: 'items' },
          { model: Payment, as: 'payments' },
        ]},
      ],
    });

    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    const guest = reservation.guest || {};
    const room = reservation.room || {};
    const billing = reservation.billing;
    const isHourly = reservation.booking_type === 'hourly';
    const nights = reservation.nights || 1;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=checkout-${reservation.reservation_number}.pdf`);
    doc.pipe(res);

    pdfHeader(doc, 'CHECK-OUT SUMMARY');

    doc.fontSize(9).font('Helvetica');
    doc.text(`Reservation #: ${reservation.reservation_number}`, 50, doc.y, { continued: true });
    doc.text(`Date: ${dayjs().format('DD/MM/YYYY  HH:mm')}`, { align: 'right' });
    doc.moveDown(0.8);

    // Guest Details
    pdfSectionTitle(doc, 'Guest Details');
    let y = doc.y;
    pdfRow(doc, 'Guest Name:', `${guest.first_name || ''} ${guest.last_name || ''}`, 50, y);
    pdfRow(doc, 'Phone:', guest.phone || '', 300, y, 60);
    y += 16;
    pdfRow(doc, 'Room:', `${room.room_number || ''} (${(room.room_type || '').charAt(0).toUpperCase() + (room.room_type || '').slice(1)}, Floor ${room.floor || ''})`, 50, y);
    y += 16;

    if (isHourly) {
      pdfRow(doc, 'Stay Type:', `Short Stay — ${reservation.expected_hours || '-'} hours`, 50, y);
      y += 16;
      pdfRow(doc, 'Check-in:', dayjs(reservation.actual_check_in || reservation.check_in_date).format('DD/MM/YYYY HH:mm'), 50, y);
      pdfRow(doc, 'Check-out:', dayjs(reservation.actual_check_out || new Date()).format('DD/MM/YYYY HH:mm'), 300, y, 80);
    } else {
      pdfRow(doc, 'Check-in:', dayjs(reservation.check_in_date).format('DD/MM/YYYY'), 50, y);
      pdfRow(doc, 'Check-out:', dayjs(reservation.actual_check_out || reservation.check_out_date).format('DD/MM/YYYY'), 300, y, 80);
      y += 16;
      pdfRow(doc, 'Nights:', `${nights}`, 50, y);
    }
    y += 16;
    doc.y = y + 6;

    // Charges Breakdown
    pdfSectionTitle(doc, 'Charges Breakdown');
    const items = billing?.items || [];
    if (items.length > 0) {
      // Table header
      y = doc.y;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text('Description', 56, y, { width: 220 });
      doc.text('Qty', 280, y, { width: 30, align: 'center' });
      doc.text('Rate', 320, y, { width: 70, align: 'right' });
      doc.text('GST%', 395, y, { width: 40, align: 'center' });
      doc.text('Amount', 440, y, { width: 100, align: 'right' });
      y += 14;
      doc.moveTo(56, y).lineTo(540, y).lineWidth(0.5).stroke();
      y += 4;

      doc.font('Helvetica').fontSize(8);
      for (const item of items) {
        if (y > 700) { doc.addPage(); y = 50; }
        const amt = parseFloat(item.amount || 0);
        doc.text(item.description || '', 56, y, { width: 220 });
        doc.text(String(item.quantity || 1), 280, y, { width: 30, align: 'center' });
        doc.text(`Rs. ${(parseFloat(item.unit_price) || amt).toFixed(2)}`, 320, y, { width: 70, align: 'right' });
        doc.text(`${item.gst_rate || 0}%`, 395, y, { width: 40, align: 'center' });
        doc.text(`Rs. ${amt.toFixed(2)}`, 440, y, { width: 100, align: 'right' });
        y += 14;
      }
      doc.moveTo(56, y).lineTo(540, y).lineWidth(0.5).stroke();
      y += 6;
    }
    doc.y = y;

    // Financial Summary
    pdfSectionTitle(doc, 'Settlement Summary');
    y = doc.y;
    const subtotal = billing ? parseFloat(billing.subtotal || 0) : 0;
    const cgst = billing ? parseFloat(billing.cgst_amount || 0) : 0;
    const sgst = billing ? parseFloat(billing.sgst_amount || 0) : 0;
    const discount = billing ? parseFloat(billing.discount_amount || 0) : 0;
    const grandTotal = billing ? parseFloat(billing.grand_total || 0) : 0;
    const paid = billing ? parseFloat(billing.paid_amount || 0) : 0;
    const balance = billing ? parseFloat(billing.balance_due || 0) : 0;

    const summaryX = 320;
    const valX = 440;
    const sumRow = (label, val, bold) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
      doc.text(label, summaryX, y, { width: 115, align: 'right' });
      doc.text(val, valX, y, { width: 100, align: 'right' });
      y += 16;
    };

    sumRow('Subtotal:', `Rs. ${subtotal.toFixed(2)}`);
    if (cgst > 0) sumRow('CGST:', `Rs. ${cgst.toFixed(2)}`);
    if (sgst > 0) sumRow('SGST:', `Rs. ${sgst.toFixed(2)}`);
    if (discount > 0) sumRow('Discount:', `- Rs. ${discount.toFixed(2)}`);
    sumRow('Grand Total:', `Rs. ${grandTotal.toFixed(2)}`, true);
    sumRow('Paid Amount:', `Rs. ${paid.toFixed(2)}`);
    if (balance > 0) {
      sumRow('Balance Due:', `Rs. ${balance.toFixed(2)}`, true);
    } else if (balance < 0) {
      sumRow('Refund:', `Rs. ${Math.abs(balance).toFixed(2)}`, true);
    } else {
      sumRow('Balance:', 'SETTLED', true);
    }
    doc.y = y + 4;

    // Payments
    const payments = billing?.payments || [];
    if (payments.length > 0) {
      pdfSectionTitle(doc, 'Payment History');
      y = doc.y;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text('Date', 56, y, { width: 100 });
      doc.text('Method', 160, y, { width: 100 });
      doc.text('Reference', 270, y, { width: 130 });
      doc.text('Amount', 410, y, { width: 130, align: 'right' });
      y += 14;
      doc.moveTo(56, y).lineTo(540, y).lineWidth(0.5).stroke();
      y += 4;
      doc.font('Helvetica').fontSize(8);
      for (const p of payments) {
        doc.text(dayjs(p.payment_date || p.created_at).format('DD/MM/YYYY HH:mm'), 56, y, { width: 100 });
        doc.text((p.payment_method || 'cash').toUpperCase(), 160, y, { width: 100 });
        doc.text(p.reference_number || '—', 270, y, { width: 130 });
        doc.text(`Rs. ${parseFloat(p.amount || 0).toFixed(2)}`, 410, y, { width: 130, align: 'right' });
        y += 14;
      }
      doc.y = y;
    }

    // Thank you
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).stroke();
    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(11).text('Thank you for staying with us!', { align: 'center' });
    doc.font('Helvetica').fontSize(9).text('We hope you had a pleasant stay. See you again!', { align: 'center' });
    doc.moveDown(1.5);

    // Signature lines
    const sigY = doc.y;
    doc.moveTo(50, sigY + 20).lineTo(220, sigY + 20).stroke();
    doc.fontSize(9).text('Guest Signature', 50, sigY + 24);
    doc.moveTo(340, sigY + 20).lineTo(545, sigY + 20).stroke();
    doc.text('Front Desk', 340, sigY + 24);

    doc.end();
  } catch (error) {
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
  refundPreview,
  roomTransfer,
  getArrivals,
  getDepartures,
  calendar,
  checkAvailability,
  getGroup,
  groupCheckIn,
  groupCheckOut,
  groupCancel,
  convertToNightly,
  checkInSummaryPdf,
  checkOutSummaryPdf,
};
