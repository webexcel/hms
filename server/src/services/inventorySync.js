const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { Room, Reservation, RoomTypeInventory } = require('../models');

/**
 * Recalculate RoomTypeInventory rows for a room type and date range.
 */
async function recalculateInventory(roomType, fromDate, toDate) {
  const from = dayjs(fromDate);
  const to = dayjs(toDate);
  const results = [];

  // Get total rooms of this type
  const roomWhere = roomType ? { room_type: roomType } : {};
  const rooms = await Room.findAll({ where: roomWhere, raw: true });

  const roomTypes = roomType
    ? [roomType]
    : [...new Set(rooms.map((r) => r.room_type))];

  for (const type of roomTypes) {
    const totalRooms = rooms.filter((r) => r.room_type === type).length;
    const typeRoomIds = rooms.filter((r) => r.room_type === type).map((r) => r.id);

    // Count blocked rooms (maintenance status)
    const blockedRooms = rooms.filter(
      (r) => r.room_type === type && r.status === 'maintenance'
    ).length;

    for (let d = from; d.isBefore(to) || d.isSame(to, 'day'); d = d.add(1, 'day')) {
      const dateStr = d.format('YYYY-MM-DD');

      // Count reservations that overlap this date
      const bookedCount = await Reservation.count({
        where: {
          room_id: { [Op.in]: typeRoomIds },
          status: { [Op.notIn]: ['cancelled', 'checked_out', 'no_show'] },
          check_in_date: { [Op.lte]: dateStr },
          check_out_date: { [Op.gt]: dateStr },
        },
      });

      const available = Math.max(0, totalRooms - bookedCount - blockedRooms);

      const [record] = await RoomTypeInventory.upsert({
        room_type: type,
        date: dateStr,
        total_rooms: totalRooms,
        booked_rooms: bookedCount,
        available_rooms: available,
        blocked_rooms: blockedRooms,
        last_synced_at: new Date(),
      });

      results.push(record);
    }
  }

  return results;
}

/**
 * Get inventory data for pushing to channels.
 */
async function getInventoryData(roomType, fromDate, toDate) {
  const where = {
    date: {
      [Op.between]: [fromDate, toDate],
    },
  };
  if (roomType) where.room_type = roomType;

  return RoomTypeInventory.findAll({
    where,
    order: [['room_type', 'ASC'], ['date', 'ASC']],
    raw: true,
  });
}

/**
 * Push inventory updates to all active channels.
 * Enqueues jobs to the availability sync queue.
 */
async function pushInventoryToChannels(roomType, fromDate, toDate) {
  try {
    const { availabilitySyncQueue } = require('./queue');
    await availabilitySyncQueue.add({
      roomType,
      fromDate,
      toDate,
    }, {
      priority: 1,
    });
  } catch (err) {
    console.warn('Failed to queue availability sync:', err.message);
  }
}

/**
 * Called after any reservation create/update/cancel.
 * Recalculates inventory and pushes to channels.
 */
async function handleInventoryChange(reservationId) {
  try {
    const reservation = await Reservation.findByPk(reservationId, {
      include: [{ model: Room, as: 'room' }],
    });

    if (!reservation || !reservation.room) return;

    const roomType = reservation.room.room_type;
    const fromDate = dayjs(reservation.check_in_date).format('YYYY-MM-DD');
    const toDate = dayjs(reservation.check_out_date).format('YYYY-MM-DD');

    await recalculateInventory(roomType, fromDate, toDate);
    await pushInventoryToChannels(roomType, fromDate, toDate);
  } catch (err) {
    console.error('Inventory sync after reservation change failed:', err.message);
  }
}

module.exports = {
  recalculateInventory,
  getInventoryData,
  pushInventoryToChannels,
  handleInventoryChange,
};
