module.exports = {
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    FRONT_DESK: 'front_desk',
    HOUSEKEEPING: 'housekeeping',
    RESTAURANT: 'restaurant',
    STAFF: 'staff',
  },

  ROOM_TYPES: ['standard_single', 'standard_double', 'executive_single', 'executive_double', 'comfort_single', 'comfort_double', 'comfort_executive_double', 'comfort_executive_triple', 'suite_triple'],
  ROOM_STATUSES: ['available', 'occupied', 'reserved', 'maintenance', 'cleaning'],

  RESERVATION_STATUSES: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'],

  PAYMENT_METHODS: ['cash', 'card', 'upi', 'bank_transfer'],
  PAYMENT_STATUSES: ['unpaid', 'partial', 'paid', 'refunded'],

  GST_RATES: {
    ROOM_BELOW_1000: 0,
    ROOM_1000_7500: 12,
    ROOM_ABOVE_7500: 18,
    RESTAURANT: 5,
  },

  HSN_CODES: {
    ROOM: '996311',
    RESTAURANT: '996331',
    LAUNDRY: '999713',
    SPA: '999722',
    TRANSPORT: '996411',
  },

  HOTEL_INFO: {
    LEGAL_NAME: 'Udhayam International Pvt. Ltd.',
    TRADE_NAME: 'Udhayam International',
    GSTIN: '33ABGPA3200K1ZD',
    PAN: 'AABCG1234F',
    ADDRESS: 'Travellers Bungalow Road',
    CITY: 'Thiruchendur',
    DISTRICT: 'Thoothukudi',
    STATE: 'Tamil Nadu',
    PINCODE: '628215',
    STATE_CODE: '33',
    PHONE: '04639-242566',
    MOBILE: '+91 9554404292',
    EMAIL: 'udhayam.intl@gmail.com',
    WEBSITE: 'www.udhayaminternational.com',
    BANK_NAME: 'HDFC Bank',
    BANK_ACCOUNT: '50100XXXXXXX123',
    BANK_IFSC: 'HDFC0001234',
    BANK_BRANCH: 'Anna Salai, Chennai',
  },

  HOTEL_DEFAULTS: {
    CHECK_IN_TIME: '12:00',
    CHECK_OUT_TIME: '12:00',
    TIMEZONE: 'Asia/Kolkata',
    CURRENCY: 'INR',
  },
};
