import React from 'react';
import { formatDate, capitalize } from '../../../utils/formatters';

const ShiftInfoBanner = ({ user, latestHandover, stats, getUserInitials, getShiftLabel }) => (
  <div className="sh-info-banner">
    <div className="sh-info-left">
      <div className="sh-avatar">
        {getUserInitials(user?.full_name || user?.username)}
      </div>
      <div className="sh-info-text">
        <h3>{user?.full_name || user?.username || 'Staff'} - {latestHandover ? capitalize(latestHandover.shift) : 'Morning'} Shift</h3>
        <p>
          <i className="bi bi-clock me-1"></i>
          {' '}{latestHandover ? getShiftLabel(latestHandover.shift) : 'Morning Shift (6 AM - 2 PM)'} | {formatDate(new Date())}
        </p>
      </div>
    </div>
    <div className="sh-info-stats">
      <div className="sh-info-stat">
        <span className="sh-info-stat-value">{stats.total}</span>
        <span className="sh-info-stat-label">Total Handovers</span>
      </div>
      <div className="sh-info-stat">
        <span className="sh-info-stat-value">{stats.pending}</span>
        <span className="sh-info-stat-label">Pending</span>
      </div>
      <div className="sh-info-stat">
        <span className="sh-info-stat-value">{stats.accepted}</span>
        <span className="sh-info-stat-label">Accepted</span>
      </div>
    </div>
  </div>
);

export default ShiftInfoBanner;
