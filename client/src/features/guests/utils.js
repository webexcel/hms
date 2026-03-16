export const getInitials = (firstName, lastName) => {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
};

export const getGuestStatus = (guest) => {
  if (guest.current_room) return { label: 'In House', className: 'in-house' };
  if (guest.upcoming_reservation) return { label: 'Reserved', className: 'reserved' };
  return { label: 'Past Guest', className: 'past' };
};

export const formatSpentShort = (amount) => {
  if (!amount) return '0';
  if (amount >= 100000) return `${(amount / 100000).toFixed(2)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toLocaleString('en-IN');
};
