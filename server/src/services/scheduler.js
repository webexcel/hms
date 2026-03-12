const cron = require('node-cron');
const dayjs = require('dayjs');
const { Op } = require('sequelize');

function startScheduler() {
  console.log('Starting scheduled jobs...');

  // Every 15 minutes: push inventory for today + 30 days
  cron.schedule('*/15 * * * *', async () => {
    try {
      const inventorySync = require('./inventorySync');
      const fromDate = dayjs().format('YYYY-MM-DD');
      const toDate = dayjs().add(30, 'day').format('YYYY-MM-DD');
      await inventorySync.recalculateInventory(null, fromDate, toDate);
      await inventorySync.pushInventoryToChannels(null, fromDate, toDate);
    } catch (err) {
      console.error('Scheduled inventory sync failed:', err.message);
    }
  });

  // Every hour: push rate changes
  cron.schedule('0 * * * *', async () => {
    try {
      const { RatePlan, ChannelRateMapping } = require('../models');
      const ratePlans = await RatePlan.findAll({
        where: { is_ota_visible: true, is_active: true },
        raw: true,
      });

      const { pushRatesToChannels } = require('./rateSync');
      for (const rp of ratePlans) {
        await pushRatesToChannels(rp.id);
      }
    } catch (err) {
      console.error('Scheduled rate sync failed:', err.message);
    }
  });

  // Daily at 2 AM: full inventory recalculation (90 days)
  cron.schedule('0 2 * * *', async () => {
    try {
      const inventorySync = require('./inventorySync');
      const fromDate = dayjs().format('YYYY-MM-DD');
      const toDate = dayjs().add(90, 'day').format('YYYY-MM-DD');
      await inventorySync.recalculateInventory(null, fromDate, toDate);
      console.log('Daily full inventory recalculation complete');
    } catch (err) {
      console.error('Daily inventory recalculation failed:', err.message);
    }
  });

  // Daily at 6 AM: re-queue stale webhook events
  cron.schedule('0 6 * * *', async () => {
    try {
      const { WebhookEvent } = require('../models');
      const { Op } = require('sequelize');
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
            { webhookEventId: event.id },
            { jobId: `webhook-retry-${event.id}-${Date.now()}` }
          );
        }
        console.log(`Re-queued ${staleEvents.length} stale webhook events`);
      }
    } catch (err) {
      console.error('Stale webhook re-queue failed:', err.message);
    }
  });

  // Daily at midnight: mark rooms as 'reserved' for today's arriving reservations
  cron.schedule('0 0 * * *', async () => {
    try {
      const { Reservation, Room } = require('../models');
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
      if (updated > 0) console.log(`Marked ${updated} rooms as reserved for today's arrivals`);
    } catch (err) {
      console.error('Room reservation status update failed:', err.message);
    }
  });

  // Daily at 8 AM: send WhatsApp check-in reminders for today's arrivals
  cron.schedule('0 8 * * *', async () => {
    try {
      const { Reservation, Guest, Room } = require('../models');
      const waNotifier = require('./whatsapp/hotelNotifier');
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
      if (arrivals.length > 0) console.log(`Sent ${arrivals.length} check-in reminders`);
    } catch (err) {
      console.error('Check-in reminder failed:', err.message);
    }
  });

  // Daily at 8 AM: send WhatsApp check-out reminders for today's departures
  cron.schedule('5 8 * * *', async () => {
    try {
      const { Reservation, Guest, Room } = require('../models');
      const waNotifier = require('./whatsapp/hotelNotifier');
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
      if (departures.length > 0) console.log(`Sent ${departures.length} check-out reminders`);
    } catch (err) {
      console.error('Check-out reminder failed:', err.message);
    }
  });

  // Weekly (Sunday 3 AM): generate reconciliation reports
  cron.schedule('0 3 * * 0', async () => {
    try {
      const { OtaChannel } = require('../models');
      const reconciliation = require('./reconciliation');

      const channels = await OtaChannel.findAll({ where: { is_active: true }, raw: true });
      const endDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      const startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

      for (const ch of channels) {
        await reconciliation.generateReconciliationReport(ch.id, startDate, endDate);
      }
      console.log('Weekly reconciliation reports generated');
    } catch (err) {
      console.error('Weekly reconciliation failed:', err.message);
    }
  });

  // Run room reservation check immediately on startup
  (async () => {
    try {
      const { Reservation, Room } = require('../models');
      const today = dayjs().format('YYYY-MM-DD');

      const todayArrivals = await Reservation.findAll({
        where: {
          check_in_date: { [Op.lte]: today },
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
      if (updated > 0) console.log(`Startup: Marked ${updated} rooms as reserved`);
    } catch (err) {
      console.error('Startup room reservation check failed:', err.message);
    }
  })();

  console.log('Scheduled jobs started.');
}

module.exports = { startScheduler };
