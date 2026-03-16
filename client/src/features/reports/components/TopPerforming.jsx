import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const TopPerforming = ({ guestStats, dailySummary }) => (
  <div className="col-lg-4">
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0"><i className="bi bi-trophy me-2"></i>Top Performing</h5>
      </div>
      <div className="card-body">
        <h6 className="text-muted mb-3">Room Types by Revenue</h6>
        {(guestStats.top_guests || []).slice(0, 5).map((guest, idx) => {
          const colors = ['#27ae60', '#3498db', '#f39c12', '#9b59b6', '#e74c3c'];
          const maxSpent = guestStats.top_guests[0]?.total_spent || 1;
          const pct = Math.round((guest.total_spent / maxSpent) * 100);
          return (
            <div className="performance-item" key={guest.id || idx}>
              <div className="perf-info">
                <span className="perf-rank">{idx + 1}</span>
                <span className="perf-name">{guest.name}</span>
              </div>
              <div className="perf-bar">
                <div className="perf-progress" style={{ width: `${pct}%`, background: colors[idx % colors.length] }}></div>
              </div>
              <span className="perf-value">{formatCurrency(guest.total_spent)}</span>
            </div>
          );
        })}

        <hr className="my-3" />

        <h6 className="text-muted mb-3">Top Booking Sources</h6>
        <div className="source-item d-flex justify-content-between align-items-center py-2">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-globe text-primary"></i>
            <span>Direct Website</span>
          </div>
          <strong>{dailySummary.direct_pct || 0}%</strong>
        </div>
        <div className="source-item d-flex justify-content-between align-items-center py-2">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-building text-success"></i>
            <span>Booking.com</span>
          </div>
          <strong>{dailySummary.booking_pct || 0}%</strong>
        </div>
        <div className="source-item d-flex justify-content-between align-items-center py-2">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-airplane text-warning"></i>
            <span>Expedia</span>
          </div>
          <strong>{dailySummary.expedia_pct || 0}%</strong>
        </div>
      </div>
    </div>
  </div>
);

export default TopPerforming;
