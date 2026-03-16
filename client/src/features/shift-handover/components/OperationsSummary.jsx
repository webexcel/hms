import React from 'react';

const OperationsSummary = ({ latestHandover }) => (
  <div className="sh-section">
    <div className="sh-section-header">
      <h2 className="sh-section-title">
        <i className="bi bi-clipboard-data operations"></i>
        Operations Summary
      </h2>
    </div>
    <div className="sh-section-body">
      <div className="sh-ops-grid">
        <div className="sh-ops-item success">
          <span className="sh-ops-item-value">{latestHandover?.checkins_completed || 0}</span>
          <div className="sh-ops-item-label">Check-ins Completed</div>
        </div>
        <div className="sh-ops-item info">
          <span className="sh-ops-item-value">{latestHandover?.checkouts_completed || 0}</span>
          <div className="sh-ops-item-label">Check-outs Completed</div>
        </div>
        <div className="sh-ops-item warning">
          <span className="sh-ops-item-value">{latestHandover?.pending_checkins || 0}</span>
          <div className="sh-ops-item-label">Pending Check-ins</div>
        </div>
        <div className="sh-ops-item danger">
          <span className="sh-ops-item-value">{latestHandover?.pending_checkouts || 0}</span>
          <div className="sh-ops-item-label">Overdue Check-outs</div>
        </div>
        <div className="sh-ops-item">
          <span className="sh-ops-item-value">{latestHandover?.new_reservations || 0}</span>
          <div className="sh-ops-item-label">New Reservations</div>
        </div>
        <div className="sh-ops-item">
          <span className="sh-ops-item-value">{latestHandover?.cancellations || 0}</span>
          <div className="sh-ops-item-label">Cancellations</div>
        </div>
      </div>
    </div>
  </div>
);

export default OperationsSummary;
