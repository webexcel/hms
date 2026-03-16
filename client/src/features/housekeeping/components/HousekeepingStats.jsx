import React from 'react';

const HousekeepingStats = ({ cleanCount, dirtyCount, progressCount, maintCount, stats }) => (
  <div className="row g-4 mb-4">
    <div className="col-xl-3 col-md-6">
      <div className="stat-card">
        <div className="stat-icon bg-success-subtle">
          <i className="bi bi-check-circle text-success"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">{cleanCount}</div>
          <div className="stat-label">Clean Rooms</div>
        </div>
      </div>
    </div>
    <div className="col-xl-3 col-md-6">
      <div className="stat-card">
        <div className="stat-icon bg-warning-subtle">
          <i className="bi bi-brush text-warning"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">{dirtyCount || stats.pending}</div>
          <div className="stat-label">Needs Cleaning</div>
        </div>
      </div>
    </div>
    <div className="col-xl-3 col-md-6">
      <div className="stat-card">
        <div className="stat-icon bg-info-subtle">
          <i className="bi bi-arrow-repeat text-info"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">{progressCount || stats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
      </div>
    </div>
    <div className="col-xl-3 col-md-6">
      <div className="stat-card">
        <div className="stat-icon bg-danger-subtle">
          <i className="bi bi-wrench text-danger"></i>
        </div>
        <div className="stat-content">
          <div className="stat-value">{maintCount || stats.maintenanceRequests}</div>
          <div className="stat-label">Maintenance</div>
        </div>
      </div>
    </div>
  </div>
);

export default HousekeepingStats;
