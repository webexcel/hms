import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate } from '../utils/formatters';
import dayjs from 'dayjs';

const CATEGORY_COLORS = {
  'Room Payment': '#16a34a',
  'Restaurant': '#059669',
  'Refund': '#dc2626',
  'Given to HR': '#d97706',
  'GPay Transfer': '#7c3aed',
  'Card Settlement': '#2563eb',
  'Deposited in SBI': '#0891b2',
};

export default function CashLedgerPage() {
  const api = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [filter, setFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/shift-handover/cash-ledger?from=${from}&to=${to}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLedger(); }, [from, to]);

  const visibleEntries = (data?.entries || []).filter(e => {
    if (filter === 'in' && e.type !== 'IN') return false;
    if (filter === 'out' && e.type !== 'OUT') return false;
    if (methodFilter !== 'all') {
      const m = (e.mode || '').toLowerCase();
      if (methodFilter === 'cash' && m !== 'cash') return false;
      if (methodFilter === 'upi' && m !== 'upi' && m !== 'gpay') return false;
      if (methodFilter === 'card' && m !== 'card') return false;
      if (methodFilter === 'bank' && m !== 'bank_transfer' && m !== 'bank') return false;
    }
    return true;
  });

  return (
    <>
      <div className="d-print-none mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-cash-coin me-2 text-success"></i>Front Office Cash Ledger
        </h5>
        <div className="d-flex align-items-center gap-2">
          <input type="date" className="form-control form-control-sm" style={{ width: 140 }}
            value={from} onChange={e => setFrom(e.target.value)} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>to</span>
          <input type="date" className="form-control form-control-sm" style={{ width: 140 }}
            value={to} onChange={e => setTo(e.target.value)} />
          <div className="btn-group btn-group-sm">
            <button className={`btn ${filter === 'all' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setFilter('all')}>All</button>
            <button className={`btn ${filter === 'in' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setFilter('in')}>IN</button>
            <button className={`btn ${filter === 'out' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setFilter('out')}>OUT</button>
          </div>
          <div className="btn-group btn-group-sm">
            <button className={`btn ${methodFilter === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setMethodFilter('all')}>All Methods</button>
            <button className={`btn ${methodFilter === 'cash' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setMethodFilter('cash')}>Cash</button>
            <button className={`btn ${methodFilter === 'upi' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => setMethodFilter('upi')}>UPI</button>
            <button className={`btn ${methodFilter === 'card' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMethodFilter('card')}>Card</button>
            <button className={`btn ${methodFilter === 'bank' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setMethodFilter('bank')}>Bank</button>
          </div>
          <button className="btn btn-sm btn-outline-dark" onClick={() => window.print()}>
            <i className="bi bi-printer"></i>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Opening Balance</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>{formatCurrency(data.summary.opening_balance)}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Total In</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{formatCurrency(data.summary.total_in)}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Total Out</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{formatCurrency(data.summary.total_out)}</div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Closing Balance</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: data.summary.closing_balance >= 0 ? '#16a34a' : '#dc2626' }}>{formatCurrency(data.summary.closing_balance)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></div>
          ) : visibleEntries.length === 0 ? (
            <div className="text-center py-5 text-muted">No transactions found for this period</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Date & Time</th>
                    <th>Category</th>
                    <th>Customer / Details</th>
                    <th>Mode</th>
                    <th>Reference</th>
                    <th className="text-end">In</th>
                    <th className="text-end">Out</th>
                    <th className="text-end" style={{ paddingRight: 20 }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {[...visibleEntries].reverse().map((e, i) => (
                    <tr key={i}>
                      <td style={{ paddingLeft: 20, fontSize: 11 }}>{formatDate(e.time, 'DD MMM hh:mm A')}</td>
                      <td>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: (CATEGORY_COLORS[e.category] || '#6b7280') + '20',
                          color: CATEGORY_COLORS[e.category] || '#6b7280',
                        }}>{e.category}</span>
                      </td>
                      <td style={{ fontSize: 12, color: '#1a1a2e', fontWeight: 500, maxWidth: 280 }}>
                        {e.description || '—'}
                      </td>
                      <td>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                          background: e.mode === 'cash' ? '#dcfce7' : e.mode === 'card' ? '#dbeafe' : e.mode === 'upi' || e.mode === 'gpay' ? '#fef3c7' : e.mode === 'bank' ? '#e0e7ff' : '#f3f4f6',
                          color: e.mode === 'cash' ? '#166534' : e.mode === 'card' ? '#1e40af' : e.mode === 'upi' || e.mode === 'gpay' ? '#92400e' : e.mode === 'bank' ? '#3730a3' : '#374151',
                          textTransform: 'uppercase',
                        }}>{e.mode || 'N/A'}</span>
                      </td>
                      <td style={{ fontSize: 11, color: '#64748b' }}>{e.reference}</td>
                      <td className="text-end" style={{ color: '#16a34a', fontWeight: 600 }}>
                        {e.type === 'IN' ? formatCurrency(e.amount) : ''}
                      </td>
                      <td className="text-end" style={{ color: '#dc2626', fontWeight: 600 }}>
                        {e.type === 'OUT' ? formatCurrency(e.amount) : ''}
                      </td>
                      <td className="text-end" style={{ paddingRight: 20, fontWeight: 700, color: e.running_balance >= 0 ? '#1a1a2e' : '#dc2626' }}>
                        {formatCurrency(e.running_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
