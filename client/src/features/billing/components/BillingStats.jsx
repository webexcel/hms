import dayjs from 'dayjs';
import { formatCurrency } from '../../../utils/formatters';

const STAT_CONFIG = [
  { key: 'businessRevenue', label: "Business Revenue", icon: 'bi-wallet2', gradient: 'linear-gradient(135deg, #10b981, #059669)', bg: '#ecfdf5' },
  { key: 'totalRevenue', label: 'Collected', icon: 'bi-graph-up-arrow', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', bg: '#eff6ff' },
  { key: 'pendingPayments', label: 'Pending', icon: 'bi-hourglass-split', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', bg: '#fffbeb' },
  { key: 'cashDigitalReceived', label: 'Cash + Digital', icon: 'bi-cash-coin', gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)', bg: '#f0f9ff' },
  { key: 'overPayment', label: 'Over-payment', icon: 'bi-exclamation-diamond', gradient: 'linear-gradient(135deg, #f97316, #ea580c)', bg: '#fff7ed' },
  { key: 'refund', label: 'Refund', icon: 'bi-arrow-counterclockwise', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', bg: '#fef2f2' },
  { key: 'totalDiscount', label: 'Discount', icon: 'bi-tag', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', bg: '#f5f3ff' },
];

export default function BillingStats({ stats, statsDate, setStatsDate }) {
  const today = dayjs().format('YYYY-MM-DD');
  const isToday = !statsDate || statsDate === today;
  return (
    <>
      {setStatsDate && (
        <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            <i className="bi bi-calendar3 me-1"></i>Revenue for date:
          </label>
          <input type="date" className="form-control form-control-sm" style={{ width: 160 }}
            value={statsDate || today} max={today}
            onChange={e => setStatsDate(e.target.value)} />
          {!isToday && (
            <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 11 }}
              onClick={() => setStatsDate(today)}>
              <i className="bi bi-arrow-counterclockwise me-1"></i>Today
            </button>
          )}
          {!isToday && (
            <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: 11 }}>
              Showing {dayjs(statsDate).format('DD MMM YYYY')}
            </span>
          )}
        </div>
      )}
      <div className="bl-stats">
      {STAT_CONFIG.map(({ key, label, icon, gradient, bg }) => {
        const displayLabel = !isToday && (key === 'businessRevenue' || key === 'totalRevenue' || key === 'pendingPayments' || key === 'refund' || key === 'cashDigitalReceived' || key === 'overPayment')
          ? `${label} (${dayjs(statsDate).format('DD MMM')})`
          : label;
        return (
        <div key={key} className="bl-stat" style={{ background: bg, border: 'none' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, background: gradient, color: '#fff', flexShrink: 0,
          }}>
            <i className={`bi ${icon}`}></i>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{displayLabel}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2, marginTop: 2 }}>
              {formatCurrency(stats[key] || 0)}
            </div>
          </div>
        </div>
        );
      })}
      </div>
    </>
  );
}
