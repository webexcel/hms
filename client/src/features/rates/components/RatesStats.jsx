import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const RatesStats = ({ roomTypes, avgRate, packages }) => {
  return (
    <div className="row g-3 mb-4">
      <div className="col-md-6 col-lg-3">
        <div className="stat-card">
          <div className="stat-icon bg-primary">
            <i className="bi bi-door-closed"></i>
          </div>
          <div className="stat-details">
            <h3>{roomTypes.length}</h3>
            <p>Room Types</p>
          </div>
        </div>
      </div>
      <div className="col-md-6 col-lg-3">
        <div className="stat-card">
          <div className="stat-icon bg-success">
            <i className="bi bi-currency-rupee"></i>
          </div>
          <div className="stat-details">
            <h3>{avgRate > 0 ? formatCurrency(avgRate) : '--'}</h3>
            <p>Avg. Daily Rate</p>
          </div>
        </div>
      </div>
      <div className="col-md-6 col-lg-3">
        <div className="stat-card">
          <div className="stat-icon bg-warning">
            <i className="bi bi-gift"></i>
          </div>
          <div className="stat-details">
            <h3>{packages.length}</h3>
            <p>Active Packages</p>
          </div>
        </div>
      </div>
      <div className="col-md-6 col-lg-3">
        <div className="stat-card">
          <div className="stat-icon bg-info">
            <i className="bi bi-graph-up-arrow"></i>
          </div>
          <div className="stat-details">
            <h3>+12%</h3>
            <p>RevPAR Growth</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatesStats;
