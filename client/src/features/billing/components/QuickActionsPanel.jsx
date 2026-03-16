import { formatCurrency } from '../../../utils/formatters';
import { toast } from 'react-hot-toast';

export default function QuickActionsPanel({ stats, openQuickPayment, refreshData }) {
  return (
    <div className="col-xl-4">
      {/* Quick Actions */}
      <div className="bl-quick-actions">
        <h5><i className="bi bi-lightning"></i> Quick Actions</h5>
        <div className="bl-action-grid">
          <button className="bl-action-btn" onClick={openQuickPayment}>
            <i className="bi bi-cash-stack"></i>
            <span>Record Payment</span>
          </button>
          <button className="bl-action-btn" onClick={() => toast('Feature coming soon')}>
            <i className="bi bi-file-earmark-text"></i>
            <span>GST Invoice</span>
          </button>
          <button className="bl-action-btn" onClick={() => toast('Feature coming soon')}>
            <i className="bi bi-receipt"></i>
            <span>Generate Report</span>
          </button>
          <button className="bl-action-btn" onClick={refreshData}>
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Outstanding Summary */}
      <div className="bl-outstanding-card">
        <div className="bl-card-header">
          <h5><i className="bi bi-pie-chart"></i> Billing Summary</h5>
        </div>
        <div className="bl-category-item">
          <div>
            <div className="bl-category-info">
              <span className="name">Total Revenue</span>
            </div>
          </div>
          <div className="bl-category-amount">{formatCurrency(stats.totalRevenue)}</div>
        </div>
        <div className="bl-category-item">
          <div>
            <div className="bl-category-info">
              <span className="name">Pending Payments</span>
            </div>
          </div>
          <div className="bl-category-amount">{formatCurrency(stats.pendingPayments)}</div>
        </div>
        <div className="bl-category-item">
          <div>
            <div className="bl-category-info">
              <span className="name">Today's Collections</span>
            </div>
          </div>
          <div className="bl-category-amount">{formatCurrency(stats.todayCollections)}</div>
        </div>
        <div className="bl-category-total">
          <span>Total Outstanding</span>
          <span>{formatCurrency(stats.pendingPayments)}</span>
        </div>
      </div>
    </div>
  );
}
