const { GST_RATES, HSN_CODES } = require('../config/constants');

function getRoomGstRate(ratePerNight) {
  if (ratePerNight < 1000) return GST_RATES.ROOM_BELOW_1000;
  if (ratePerNight <= 7500) return GST_RATES.ROOM_1000_7500;
  return GST_RATES.ROOM_ABOVE_7500;
}

function getGstRateByItemType(itemType, amount) {
  switch (itemType) {
    case 'restaurant':
    case 'transport':
      return 5;
    case 'laundry':
    case 'spa':
      return 18;
    case 'room_charge':
      return getRoomGstRate(amount);
    default:
      return getRoomGstRate(amount);
  }
}

function calculateGst(amount, gstRate, isInterState = false) {
  const taxableAmount = amount;
  if (isInterState) {
    const igst = (taxableAmount * gstRate) / 100;
    return { cgst: 0, sgst: 0, igst, totalGst: igst };
  }
  const halfRate = gstRate / 2;
  const cgst = (taxableAmount * halfRate) / 100;
  const sgst = (taxableAmount * halfRate) / 100;
  return { cgst, sgst, igst: 0, totalGst: cgst + sgst };
}

function getHsnCode(itemType) {
  switch (itemType) {
    case 'room_charge': return HSN_CODES.ROOM;
    case 'restaurant': return HSN_CODES.RESTAURANT;
    case 'laundry': return HSN_CODES.LAUNDRY;
    case 'spa': return HSN_CODES.SPA;
    case 'transport': return HSN_CODES.TRANSPORT;
    default: return '';
  }
}

module.exports = { getRoomGstRate, getGstRateByItemType, calculateGst, getHsnCode };
