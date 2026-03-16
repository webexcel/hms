import { formatCurrency } from '../../../utils/formatters';

export default function BillingStats({ stats }) {
  return (
    <div className="bl-stats">
      <div className="bl-stat">
        <div className="bl-stat-icon revenue">
          <i className="bi bi-wallet2"></i>
        </div>
        <div className="bl-stat-content">
          <h3>{formatCurrency(stats.todayCollections)}</h3>
          <p>Today's Revenue</p>
        </div>
      </div>
      <div className="bl-stat">
        <div className="bl-stat-icon collected">
          <i className="bi bi-check-circle"></i>
        </div>
        <div className="bl-stat-content">
          <h3>{formatCurrency(stats.totalRevenue)}</h3>
          <p>Total Revenue</p>
        </div>
      </div>
      <div className="bl-stat">
        <div className="bl-stat-icon pending">
          <i className="bi bi-hourglass-split"></i>
        </div>
        <div className="bl-stat-content">
          <h3>{formatCurrency(stats.pendingPayments)}</h3>
          <p>Pending Payments</p>
        </div>
      </div>
      <div className="bl-stat">
        <div className="bl-stat-icon overdue">
          <i className="bi bi-exclamation-triangle"></i>
        </div>
        <div className="bl-stat-content">
          <h3>{formatCurrency(stats.overdueAmount)}</h3>
          <p>Overdue Amount</p>
        </div>
      </div>
    </div>
  );
}
