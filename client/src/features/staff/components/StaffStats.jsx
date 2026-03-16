import React from 'react';

const StaffStats = ({ stats }) => {
  return (
    <div className="row g-4 mb-4">
      <div className="col-xl-3 col-md-6">
        <div className="stat-card">
          <div className="stat-icon bg-primary-subtle">
            <i className="bi bi-people text-primary"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Staff</div>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-md-6">
        <div className="stat-card">
          <div className="stat-icon bg-success-subtle">
            <i className="bi bi-person-check text-success"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">On Duty Today</div>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-md-6">
        <div className="stat-card">
          <div className="stat-icon bg-warning-subtle">
            <i className="bi bi-calendar-x text-warning"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.onLeave}</div>
            <div className="stat-label">On Leave</div>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-md-6">
        <div className="stat-card">
          <div className="stat-icon bg-info-subtle">
            <i className="bi bi-clock-history text-info"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total - stats.active - stats.onLeave}</div>
            <div className="stat-label">Inactive</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffStats;
