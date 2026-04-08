export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  FRONT_DESK: 'front_desk',
  HOUSEKEEPING: 'housekeeping',
  RESTAURANT: 'restaurant',
  STAFF: 'staff',
};

export const ROOM_TYPES = ['standard_single', 'standard_double', 'executive_single', 'executive_double', 'comfort_single', 'comfort_double', 'comfort_executive_double', 'comfort_executive_triple', 'suite_triple'];
export const ROOM_STATUSES = ['available', 'occupied', 'reserved', 'maintenance', 'cleaning'];
export const RESERVATION_STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];
export const PAYMENT_METHODS = ['cash', 'card', 'upi', 'bank_transfer', 'ota_collected'];

export const NAV_SECTIONS = [
  {
    title: 'Main',
    items: [
      { label: 'Front Desk', path: '/front-desk', icon: 'bi-door-open', roles: ['admin', 'manager', 'front_desk'] },
      { label: 'Reservations', path: '/reservations', icon: 'bi-calendar-check', roles: ['admin', 'manager', 'front_desk'] },
    ],
  },
  {
    title: 'Guest Management',
    items: [
      { label: 'Guests', path: '/guests', icon: 'bi-people', roles: ['admin', 'manager', 'front_desk', 'housekeeping'] },
      { label: 'Billing', path: '/billing', icon: 'bi-receipt', roles: ['admin', 'manager', 'front_desk'] },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Restaurant', path: '/restaurant', icon: 'bi-cup-hot', roles: ['admin', 'manager', 'restaurant'] },
      { label: 'Laundry', path: '/laundry', icon: 'bi-water', roles: ['admin', 'manager', 'front_desk', 'housekeeping'] },
      { label: 'Housekeeping', path: '/housekeeping', icon: 'bi-brush', roles: ['admin', 'manager', 'front_desk', 'housekeeping'] },
      { label: 'Shift Handover', path: '/shift-handover', icon: 'bi-arrow-left-right', roles: ['admin', 'manager', 'front_desk'] },
      { label: 'Inventory', path: '/inventory', icon: 'bi-box-seam', roles: ['admin', 'manager', 'housekeeping', 'restaurant'] },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Staff', path: '/staff', icon: 'bi-person-badge', roles: ['admin', 'manager'] },
      { label: 'Rates', path: '/rates', icon: 'bi-currency-dollar', roles: ['admin', 'manager', 'front_desk'] },
      { label: 'Reports', path: '/reports', icon: 'bi-bar-chart-line', roles: ['admin', 'manager', 'front_desk'] },
    ],
  },
  {
    title: 'Channel Manager',
    items: [
      { label: 'Channels', path: '/channel-manager', icon: 'bi-diagram-3', roles: ['admin', 'manager'] },
      { label: 'OTA Bookings', path: '/ota-bookings', icon: 'bi-globe', roles: ['admin', 'manager', 'front_desk'] },
      { label: 'Reconciliation', path: '/reconciliation', icon: 'bi-clipboard-data', roles: ['admin', 'manager'] },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', path: '/settings', icon: 'bi-gear', roles: ['admin'] },
    ],
  },
];

// Flat list for backward compatibility
export const NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items);
