const FILTERS = [
  { value: '', label: 'All' },
  { value: 'unpaid', label: 'Open', color: '#3b82f6' },
  { value: 'partial', label: 'Partial', color: '#f59e0b' },
  { value: 'paid', label: 'Paid', color: '#10b981' },
  { value: 'overdue', label: 'Overdue', color: '#ef4444' },
];

export default function BillingActionBar({ searchTerm, setSearchTerm, activeFilter, setActiveFilter }) {
  return (
    <div className="bl-action-bar" style={{ flexWrap: 'wrap' }}>
      <div className="bl-search">
        <i className="bi bi-search"></i>
        <input
          type="text"
          className="form-control"
          placeholder="Search invoice, guest, or room..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {FILTERS.map(f => {
          const active = activeFilter === f.value;
          return (
            <button key={f.value}
              onClick={() => setActiveFilter(f.value)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: active ? 'none' : '1px solid #e2e8f0',
                background: active ? (f.color || '#1a1a2e') : '#fff',
                color: active ? '#fff' : '#64748b',
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {f.color && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: active ? '#fff' : f.color, flexShrink: 0,
                }} />
              )}
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
