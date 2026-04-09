import dayjs from 'dayjs';

export function formatCurrency(amount) {
  const num = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `Rs. ${num}`;
}

export function formatDate(date, format = 'DD MMM YYYY') {
  if (!date) return '-';
  return dayjs(date).format(format);
}

export function formatDateTime(date) {
  if (!date) return '-';
  return dayjs(date).format('DD MMM YYYY, hh:mm A');
}

export function getStatusColor(status) {
  const map = {
    available: 'success',
    occupied: 'danger',
    reserved: 'warning',
    maintenance: 'secondary',
    cleaning: 'info',
    pending: 'warning',
    confirmed: 'primary',
    checked_in: 'success',
    checked_out: 'secondary',
    cancelled: 'danger',
    no_show: 'dark',
    paid: 'success',
    partial: 'warning',
    unpaid: 'danger',
    active: 'success',
    inactive: 'secondary',
    on_leave: 'warning',
    completed: 'success',
    in_progress: 'info',
    verified: 'primary',
    low: 'info',
    medium: 'warning',
    high: 'danger',
    urgent: 'danger',
    in_stock: 'success',
    low_stock: 'warning',
    out_of_stock: 'danger',
  };
  return map[status] || 'secondary';
}

export function capitalize(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
