import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const RestaurantStats = ({ stats }) => (
  <div className="rest-stats">
    <div className="rest-stat">
      <div className="rest-stat-icon orders">
        <i className="bi bi-receipt"></i>
      </div>
      <div className="rest-stat-content">
        <h3>{stats.totalOrders}</h3>
        <p>Today's Orders</p>
      </div>
    </div>
    <div className="rest-stat">
      <div className="rest-stat-icon posted">
        <i className="bi bi-check-circle"></i>
      </div>
      <div className="rest-stat-content">
        <h3>{formatCurrency(stats.totalPosted)}</h3>
        <p>Total Posted</p>
      </div>
    </div>
    <div className="rest-stat">
      <div className="rest-stat-icon pending">
        <i className="bi bi-clock"></i>
      </div>
      <div className="rest-stat-content">
        <h3>{stats.pendingOrders}</h3>
        <p>Pending Orders</p>
      </div>
    </div>
  </div>
);

export default RestaurantStats;
