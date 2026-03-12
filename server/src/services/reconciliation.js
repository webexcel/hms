const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { Reservation, Payment, OtaChannel, OtaReconciliation } = require('../models');

/**
 * Generate a reconciliation report for a channel and date period.
 */
async function generateReconciliationReport(channelId, startDate, endDate, generatedBy = null) {
  const channel = await OtaChannel.findByPk(channelId);
  if (!channel) throw new Error('Channel not found');

  const reservations = await Reservation.findAll({
    where: {
      channel_id: channelId,
      created_at: {
        [Op.between]: [
          dayjs(startDate).startOf('day').toDate(),
          dayjs(endDate).endOf('day').toDate(),
        ],
      },
    },
    raw: true,
  });

  const activeBookings = reservations.filter((r) => r.status !== 'cancelled');
  const cancellations = reservations.filter((r) => r.status === 'cancelled');

  const totalRevenue = activeBookings.reduce(
    (sum, r) => sum + parseFloat(r.total_amount || 0),
    0
  );
  const totalCommission = activeBookings.reduce(
    (sum, r) => sum + parseFloat(r.ota_commission || 0),
    0
  );
  const netAmount = totalRevenue - totalCommission;

  const report = await OtaReconciliation.create({
    channel_id: channelId,
    period_start: startDate,
    period_end: endDate,
    total_bookings: activeBookings.length,
    total_revenue: parseFloat(totalRevenue.toFixed(2)),
    total_commission: parseFloat(totalCommission.toFixed(2)),
    net_amount: parseFloat(netAmount.toFixed(2)),
    cancellations: cancellations.length,
    status: 'generated',
    generated_by: generatedBy,
  });

  return report;
}

/**
 * Match OTA payout data against our records.
 */
async function matchPayments(reconciliationId, otaPayoutAmount) {
  const report = await OtaReconciliation.findByPk(reconciliationId);
  if (!report) throw new Error('Reconciliation report not found');

  const discrepancy = parseFloat((parseFloat(otaPayoutAmount) - parseFloat(report.net_amount)).toFixed(2));

  await report.update({
    ota_payout_amount: otaPayoutAmount,
    discrepancy_amount: discrepancy,
    status: Math.abs(discrepancy) < 1 ? 'matched' : 'discrepancy',
  });

  return report;
}

/**
 * Flag discrepancies in a reconciliation report.
 */
async function flagDiscrepancies(reconciliationId) {
  const report = await OtaReconciliation.findByPk(reconciliationId);
  if (!report) throw new Error('Reconciliation report not found');

  if (report.discrepancy_amount && Math.abs(parseFloat(report.discrepancy_amount)) >= 1) {
    await report.update({ status: 'discrepancy' });
  }

  return report;
}

module.exports = {
  generateReconciliationReport,
  matchPayments,
  flagDiscrepancies,
};
