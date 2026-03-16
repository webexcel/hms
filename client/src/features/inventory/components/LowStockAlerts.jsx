import React from 'react';
import { getCategoryIcon } from '../utils';

const LowStockAlerts = ({ alerts, onAdjust }) => {
  return (
    <div className="inventory-alert-card">
      <div className="card-header-custom">
        <h5><i className="bi bi-exclamation-triangle text-warning me-2"></i>Low Stock Alerts</h5>
        {alerts.length > 0 && (
          <span className="badge bg-warning text-dark">{alerts.length} items</span>
        )}
      </div>
      <div className="alert-list">
        {alerts.length === 0 ? (
          <div className="text-center text-muted py-4">No low stock alerts</div>
        ) : (
          alerts.map(item => {
            const isCritical = item.current_stock === 0;
            return (
              <div key={item.id} className={`alert-item ${isCritical ? 'critical' : 'warning'}`}>
                <div className="alert-icon">
                  <i className={`bi ${getCategoryIcon(item.category)}`}></i>
                </div>
                <div className="alert-info">
                  <span className="alert-name">{item.name}</span>
                  <span className="alert-stock">
                    {isCritical
                      ? '0 units remaining'
                      : `${item.current_stock} units (Min: ${item.min_stock_level})`
                    }
                  </span>
                </div>
                <button
                  className={`btn btn-sm ${isCritical ? 'btn-danger' : 'btn-warning'}`}
                  onClick={() => onAdjust(item)}
                >
                  Order
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LowStockAlerts;
