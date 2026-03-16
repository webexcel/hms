import React from 'react';

const InventoryStats = ({ stats }) => {
  return (
    <div className="row g-4 mb-4">
      <div className="col-xl-3 col-md-6">
        <div className="stat-card">
          <div className="stat-icon bg-primary-subtle">
            <i className="bi bi-box-seam text-primary"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Total Items</div>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-md-6">
        <div className="stat-card">
          <div className="stat-icon bg-success-subtle">
            <i className="bi bi-check-circle text-success"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.inStock || 0}</div>
            <div className="stat-label">In Stock</div>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-md-6">
        <div className="stat-card">
          <div className="stat-icon bg-warning-subtle">
            <i className="bi bi-exclamation-triangle text-warning"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.lowStock || 0}</div>
            <div className="stat-label">Low Stock</div>
          </div>
        </div>
      </div>
      <div className="col-xl-3 col-md-6">
        <div className="stat-card">
          <div className="stat-icon bg-danger-subtle">
            <i className="bi bi-x-circle text-danger"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.outOfStock || 0}</div>
            <div className="stat-label">Out of Stock</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryStats;
