const cron = require('node-cron');
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { getMasterTenant, getTenantModels } = require('../config/connectionManager');

/**
 * Helper: get all active tenants and their db models.
 */
async function forEachTenant(callback) {
  const Tenant = getMasterTenant();
  const tenants = await Tenant.findAll({ where: { is_active: true }, raw: true });
  for (const tenant of tenants) {
    try {
      const db = getTenantModels(tenant.db_name);
      await callback(db, tenant);
    } catch (err) {
      logger.error(`Scheduler error for tenant ${tenant.name}:`, err.message);
    }
  }
}

function startScheduler() {
  logger.info('Starting scheduled jobs...');

  // Every 15 minutes: push inventory for today + 30 days
  cron.schedule('*/15 * * * *', async () => {
    try {
      const inventorySync = require('./inventorySync');
      const fromDate = dayjs().format('YYYY-MM-DD');
      const toDate = dayjs().add(30, 'day').format('YYYY-MM-DD');
      await forEachTenant(async (db) => {
        await inventorySync.recalculateInventory(db, null, fromDate, toDate);
        await inventorySync.pushInventoryToChannels(db, null, fromDate, toDate);
      });
    } catch (err) {
      logger.error('Scheduled inventory sync failed:', err.message);
    }
  });

  // Every hour: push rate changes
  cron.schedule('0 * * * *', async () => {
    try {
      const { pushRatesToChannels } = require('./rateSync');
      await forEachTenant(async (db) => {
        const { RatePlan } = db;
        const ratePlans = await RatePlan.findAll({
          where: { is_ota_visible: true, is_active: true },
          raw: true,
        });
        for (const rp of ratePlans) {
          await pushRatesToChannels(db, rp.id);
        }
      });
    } catch (err) {
      logger.error('Scheduled rate sync failed:', err.message);
    }
  });

  // Daily at 2 AM: full inventory recalculation (90 days)
  cron.schedule('0 2 * * *', async () => {
    try {
      const inventorySync = require('./inventorySync');
      const fromDate = dayjs().format('YYYY-MM-DD');
      const toDate = dayjs().add(90, 'day').format('YYYY-MM-DD');
      await forEachTenant(async (db) => {
        await inventorySync.recalculateInventory(db, null, fromDate, toDate);
      });
      logger.info('Daily full inventory recalculation complete');
    } catch (err) {
      logger.error('Daily inventory recalculation failed:', err.message);
    }
  });

  // Daily at 6 AM: re-queue stale webhook events
  cron.schedule('0 6 * * *', async () => {
    try {
      await forEachTenant(async (db) => {
        const { WebhookEvent } = db;
        const staleEvents = await WebhookEvent.findAll({
          where: {
            status: { [Op.in]: ['received', 'failed'] },
            created_at: { [Op.lt]: dayjs().subtract(1, 'hour').toDate() },
            retry_count: { [Op.lt]: 5 },
          },
        });

        if (staleEvents.length > 0) {
          const { webhookProcessQueue } = require('./queue');
          for (const event of staleEvents) {
            await webhookProcessQueue.add(
              { webhookEventId: event.id, dbName: tenant.db_name },
              { jobId: `webhook-retry-${event.id}-${Date.now()}` }
            );
          }
          logger.info(`Re-queued ${staleEvents.length} stale webhook events`);
        }
      });
    } catch (err) {
      logger.error('Stale webhook re-queue failed:', err.message);
    }
  });

  // Daily at midnight: mark rooms as 'reserved' for today's arriving reservations
  cron.schedule('0 0 * * *', async () => {
    try {
      await forEachTenant(async (db) => {
        const { Reservation, Room } = db;
        const today = dayjs().format('YYYY-MM-DD');

        const todayArrivals = await Reservation.findAll({
          where: {
            check_in_date: today,
            status: { [Op.in]: ['pending', 'confirmed'] },
          },
          include: [{ model: Room, as: 'room' }],
        });

        let updated = 0;
        for (const res of todayArrivals) {
          if (res.room && res.room.status === 'available') {
            await res.room.update({ status: 'reserved' });
            updated++;
          }
        }
        if (updated > 0) logger.info(`Marked ${updated} rooms as reserved for today's arrivals`);
      });
    } catch (err) {
      logger.error('Room reservation status update failed:', err.message);
    }
  });

  // Daily at 11 PM: mark no-shows and free up rooms
  cron.schedule('0 23 * * *', async () => {
    try {
      await forEachTenant(async (db) => {
        const { Reservation, Room } = db;
        const today = dayjs().format('YYYY-MM-DD');

        // Reservations where check_out_date <= today, never checked in
        const noShows = await Reservation.findAll({
          where: {
            status: { [Op.in]: ['pending', 'confirmed'] },
            check_out_date: { [Op.lte]: today },
            actual_check_in: null,
          },
          include: [{ model: Room, as: 'room' }],
        });

        let marked = 0;
        for (const res of noShows) {
          await res.update({ status: 'no_show' });
          // Free the room if it's still reserved for this guest
          if (res.room && res.room.status === 'reserved') {
            // Check if another active reservation holds this room
            const otherActive = await Reservation.findOne({
              where: {
                room_id: res.room_id,
                id: { [Op.ne]: res.id },
                status: { [Op.in]: ['confirmed', 'checked_in'] },
                check_in_date: { [Op.lte]: today },
                check_out_date: { [Op.gt]: today },
              },
            });
            if (!otherActive) {
              await res.room.update({ status: 'available' });
            }
          }
          marked++;
        }
        if (marked > 0) logger.info(`Marked ${marked} reservations as no-show, freed rooms`);
      });
    } catch (err) {
      logger.error('No-show detection failed:', err.message);
    }
  });

  // Daily at 8 AM: send WhatsApp check-in reminders for today's arrivals
  cron.schedule('0 8 * * *', async () => {
    try {
      const waNotifier = require('./whatsapp/hotelNotifier');
      await forEachTenant(async (db) => {
        const { Reservation, Guest, Room } = db;
        const today = dayjs().format('YYYY-MM-DD');

        const arrivals = await Reservation.findAll({
          where: {
            check_in_date: today,
            status: { [Op.in]: ['pending', 'confirmed'] },
          },
          include: [
            { model: Guest, as: 'guest' },
            { model: Room, as: 'room' },
          ],
        });

        for (const res of arrivals) {
          if (res.guest?.phone) {
            await waNotifier.notifyCheckInReminder({
              guestName: `${res.guest.first_name} ${res.guest.last_name}`,
              guestPhone: res.guest.phone,
              reservationNumber: res.reservation_number,
              checkIn: dayjs(res.check_in_date).format('DD MMM YYYY'),
              roomNumber: res.room?.room_number,
            });
          }
        }
        if (arrivals.length > 0) logger.info(`Sent ${arrivals.length} check-in reminders`);
      });
    } catch (err) {
      logger.error('Check-in reminder failed:', err.message);
    }
  });

  // Daily at 8:05 AM: send WhatsApp check-out reminders for today's departures
  cron.schedule('5 8 * * *', async () => {
    try {
      const waNotifier = require('./whatsapp/hotelNotifier');
      await forEachTenant(async (db) => {
        const { Reservation, Guest, Room } = db;
        const today = dayjs().format('YYYY-MM-DD');

        const departures = await Reservation.findAll({
          where: {
            check_out_date: today,
            status: 'checked_in',
          },
          include: [
            { model: Guest, as: 'guest' },
            { model: Room, as: 'room' },
          ],
        });

        for (const res of departures) {
          if (res.guest?.phone) {
            await waNotifier.notifyCheckOutReminder({
              guestName: `${res.guest.first_name} ${res.guest.last_name}`,
              guestPhone: res.guest.phone,
              reservationNumber: res.reservation_number,
              checkOut: dayjs(res.check_out_date).format('DD MMM YYYY'),
              roomNumber: res.room?.room_number,
            });
          }
        }
        if (departures.length > 0) logger.info(`Sent ${departures.length} check-out reminders`);
      });
    } catch (err) {
      logger.error('Check-out reminder failed:', err.message);
    }
  });

  // Weekly (Sunday 3 AM): generate reconciliation reports
  cron.schedule('0 3 * * 0', async () => {
    try {
      const reconciliation = require('./reconciliation');
      await forEachTenant(async (db) => {
        const { OtaChannel } = db;
        const channels = await OtaChannel.findAll({ where: { is_active: true }, raw: true });
        const endDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        const startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

        for (const ch of channels) {
          await reconciliation.generateReconciliationReport(db, ch.id, startDate, endDate);
        }
      });
      logger.info('Weekly reconciliation reports generated');
    } catch (err) {
      logger.error('Weekly reconciliation failed:', err.message);
    }
  });

  // Run room reservation check + no-show detection immediately on startup
  (async () => {
    try {
      await forEachTenant(async (db) => {
        const { Reservation, Room } = db;
        const today = dayjs().format('YYYY-MM-DD');

        // 1. Mark no-shows: checkout date passed, never checked in
        const noShows = await Reservation.findAll({
          where: {
            status: { [Op.in]: ['pending', 'confirmed'] },
            check_out_date: { [Op.lte]: today },
            actual_check_in: null,
          },
          include: [{ model: Room, as: 'room' }],
        });

        let noShowCount = 0;
        for (const res of noShows) {
          await res.update({ status: 'no_show' });
          if (res.room && res.room.status === 'reserved') {
            const otherActive = await Reservation.findOne({
              where: {
                room_id: res.room_id,
                id: { [Op.ne]: res.id },
                status: { [Op.in]: ['confirmed', 'checked_in'] },
                check_in_date: { [Op.lte]: today },
                check_out_date: { [Op.gt]: today },
              },
            });
            if (!otherActive) {
              await res.room.update({ status: 'available' });
            }
          }
          noShowCount++;
        }
        if (noShowCount > 0) logger.info(`Startup: Marked ${noShowCount} reservations as no-show`);

        // 2. Mark rooms as reserved for today's arrivals
        const todayArrivals = await Reservation.findAll({
          where: {
            check_in_date: { [Op.lte]: today },
            status: { [Op.in]: ['pending', 'confirmed'] },
          },
          include: [{ model: Room, as: 'room' }],
        });

        let reserved = 0;
        for (const res of todayArrivals) {
          if (res.room && res.room.status === 'available') {
            await res.room.update({ status: 'reserved' });
            reserved++;
          }
        }
        if (reserved > 0) logger.info(`Startup: Marked ${reserved} rooms as reserved`);
      });
    } catch (err) {
      logger.error('Startup room check failed:', err.message);
    }
  })();

  logger.info('Scheduled jobs started.');
}

module.exports = { startScheduler };
