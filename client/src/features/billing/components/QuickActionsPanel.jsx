import { formatCurrency } from '../../../utils/formatters';

export default function QuickActionsPanel({ stats, openQuickPayment, refreshData }) {
  return (
    <div className="col-xl-4">
      {/* Quick Actions */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: 20,
        border: '1px solid #f0f0f0', marginBottom: 16,
      }}>
        <h6 style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-lightning" style={{ color: '#f59e0b' }}></i> Quick Actions
        </h6>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ActionButton icon="bi-cash-stack" label="Record Payment" color="#10b981" onClick={openQuickPayment} />
          <ActionButton icon="bi-arrow-clockwise" label="Refresh" color="#3b82f6" onClick={refreshData} />
        </div>
      </div>

      {/* Billing Summary */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: 16,
        padding: 20, color: '#fff',
      }}>
        <h6 style={{ fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0' }}>
          <i className="bi bi-pie-chart"></i> Billing Overview
        </h6>
        <SummaryRow label="Total Revenue" value={stats.totalRevenue} color="#34d399" />
        <SummaryRow label="Today's Collections" value={stats.todayCollections} color="#60a5fa" />
        <SummaryRow label="Pending Payments" value={stats.pendingPayments} color="#fbbf24" />
        <div style={{
          marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Outstanding</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#fbbf24' }}>
            {formatCurrency(stats.pendingPayments || 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '14px 10px', borderRadius: 12, border: '1px solid #f0f0f0',
        background: '#fafbfc', cursor: 'pointer', transition: 'all 0.15s',
        fontSize: 12, fontWeight: 600, color: '#475569',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fafbfc'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
    >
      <i className={`bi ${icon}`} style={{ fontSize: 20, color }}></i>
      {label}
    </button>
  );
}

function SummaryRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(value || 0)}</span>
    </div>
  );
}
