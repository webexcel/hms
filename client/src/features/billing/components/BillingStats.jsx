import { formatCurrency } from '../../../utils/formatters';

const STAT_CONFIG = [
  { key: 'todayCollections', label: "Today's Revenue", icon: 'bi-wallet2', gradient: 'linear-gradient(135deg, #10b981, #059669)', bg: '#ecfdf5' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: 'bi-graph-up-arrow', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', bg: '#eff6ff' },
  { key: 'pendingPayments', label: 'Pending', icon: 'bi-hourglass-split', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', bg: '#fffbeb' },
  { key: 'overdueAmount', label: 'Overdue', icon: 'bi-exclamation-triangle', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', bg: '#fef2f2' },
  { key: 'totalDiscount', label: 'Discount', icon: 'bi-tag', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', bg: '#f5f3ff' },
];

export default function BillingStats({ stats }) {
  return (
    <div className="bl-stats">
      {STAT_CONFIG.map(({ key, label, icon, gradient, bg }) => (
        <div key={key} className="bl-stat" style={{ background: bg, border: 'none' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, background: gradient, color: '#fff', flexShrink: 0,
          }}>
            <i className={`bi ${icon}`}></i>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2, marginTop: 2 }}>
              {formatCurrency(stats[key] || 0)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
