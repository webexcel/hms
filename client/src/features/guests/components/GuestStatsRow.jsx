import React from 'react';

const GuestStatsRow = ({ stats }) => (
  <div className="row g-3 mb-4">
    <div className="col-sm-6 col-lg-3">
      <div className="stat-card">
        <div className="stat-icon bg-primary">
          <i className="bi bi-people"></i>
        </div>
        <div className="stat-details">
          <h3>{stats.total.toLocaleString()}</h3>
          <p>Total Guests</p>
        </div>
      </div>
    </div>
    <div className="col-sm-6 col-lg-3">
      <div className="stat-card">
        <div className="stat-icon bg-success">
          <i className="bi bi-person-check"></i>
        </div>
        <div className="stat-details">
          <h3>{stats.inHouse}</h3>
          <p>Currently In-House</p>
        </div>
      </div>
    </div>
    <div className="col-sm-6 col-lg-3">
      <div className="stat-card">
        <div className="stat-icon bg-warning">
          <i className="bi bi-star"></i>
        </div>
        <div className="stat-details">
          <h3>{stats.vip}</h3>
          <p>VIP Guests</p>
        </div>
      </div>
    </div>
    <div className="col-sm-6 col-lg-3">
      <div className="stat-card">
        <div className="stat-icon bg-info">
          <i className="bi bi-arrow-repeat"></i>
        </div>
        <div className="stat-details">
          <h3>{stats.returning || 0}</h3>
          <p>Returning Guests</p>
        </div>
      </div>
    </div>
  </div>
);

export default GuestStatsRow;
