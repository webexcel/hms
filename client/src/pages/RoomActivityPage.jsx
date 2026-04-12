import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency } from '../utils/formatters';
import dayjs from 'dayjs';

const HOTEL_NAME = 'Hotel Udhayam International';
const HOTEL_ADDRESS = 'Travellers Bungalow Road, Thiruchendur, Thoothukudi, Tamil Nadu 628215';

export default function RoomActivityPage() {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().add(30, 'day').format('YYYY-MM-DD'));
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch ALL reservations (regardless of status/checkout) within date range
      const params = { limit: 500, _t: Date.now() };
      if (from) params.check_in_date = from;
      if (to) params.check_out_date = to;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/reservations', { params });
      // Handle multiple response shapes
      let data = [];
      if (Array.isArray(res.data)) data = res.data;
      else if (Array.isArray(res.data?.data)) data = res.data.data;
      else if (Array.isArray(res.data?.reservations)) data = res.data.reservations;
      else if (Array.isArray(res.data?.rows)) data = res.data.rows;
      console.log('Room Activity — fetched:', { count: data.length, rawType: typeof res.data, rawKeys: res.data ? Object.keys(res.data) : null });
      setRows(data);
    } catch (err) {
      console.error('Failed to fetch', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [from, to, statusFilter]);

  const sourceLabel = (src) => {
    if (!src) return 'Walk-in';
    const s = src.toLowerCase();
    if (s.includes('mmt') || s.includes('make_my_trip')) return 'MMT';
    if (s.includes('goibibo')) return 'Goibibo';
    if (s.includes('booking')) return 'Booking.com';
    if (s.includes('agoda')) return 'Agoda';
    if (s.includes('ota')) return 'OTA';
    if (s.includes('walk')) return 'Walk-in';
    if (s.includes('direct')) return 'Direct';
    return src;
  };
  const sourceColor = (src) => {
    const s = (src || '').toLowerCase();
    if (s.includes('mmt') || s.includes('goibibo') || s.includes('booking') || s.includes('agoda') || s.includes('ota')) return { bg: '#ede9fe', fg: '#6d28d9' };
    if (s.includes('walk')) return { bg: '#dcfce7', fg: '#166534' };
    if (s.includes('direct')) return { bg: '#dbeafe', fg: '#1e40af' };
    return { bg: '#f3f4f6', fg: '#374151' };
  };
  const statusColor = (st) => {
    const s = (st || '').toLowerCase();
    if (s === 'checked_in') return { bg: '#dcfce7', fg: '#166534' };
    if (s === 'checked_out') return { bg: '#dbeafe', fg: '#1e40af' };
    if (s === 'confirmed') return { bg: '#fef3c7', fg: '#92400e' };
    if (s === 'cancelled') return { bg: '#fecaca', fg: '#991b1b' };
    return { bg: '#f3f4f6', fg: '#374151' };
  };

  // Filter client-side for source and search
  const filteredRows = rows.filter(r => {
    if (sourceFilter && !(r.source || '').toLowerCase().includes(sourceFilter.toLowerCase())) return false;
    if (search) {
      const q = search.toLowerCase();
      const guestName = `${r.guest?.first_name || ''} ${r.guest?.last_name || ''}`.toLowerCase();
      const roomNum = (r.room?.room_number || '').toLowerCase();
      const resNo = (r.reservation_number || '').toLowerCase();
      if (!guestName.includes(q) && !roomNum.includes(q) && !resNo.includes(q)) return false;
    }
    return true;
  });

  const totals = filteredRows.reduce((acc, r) => {
    const billing = r.billing || {};
    const items = billing.items || [];
    const restaurant = r.restaurant_charges != null
      ? parseFloat(r.restaurant_charges) || 0
      : items.filter(i => i.item_type === 'restaurant').reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const extraBed = items.filter(i => i.item_type === 'service' && i.description && i.description.toLowerCase().includes('extra bed')).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    return {
      payment: acc.payment + (parseFloat(billing.paid_amount) || 0),
      restaurant: acc.restaurant + restaurant,
      extra_bed: acc.extra_bed + extraBed,
      balance: acc.balance + (parseFloat(billing.balance_due) || 0),
    };
  }, { payment: 0, restaurant: 0, extra_bed: 0, balance: 0 });

  return (
    <>
      <div className="d-print-none mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-door-open me-2 text-primary"></i>Room Activity
        </h5>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <input type="date" className="form-control form-control-sm" style={{ width: 140 }}
            value={from} onChange={e => setFrom(e.target.value)} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>to</span>
          <input type="date" className="form-control form-control-sm" style={{ width: 140 }}
            value={to} onChange={e => setTo(e.target.value)} />
          <select className="form-select form-select-sm" style={{ width: 140 }}
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked-in</option>
            <option value="checked_out">Checked-out</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="form-select form-select-sm" style={{ width: 130 }}
            value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
            <option value="">All Sources</option>
            <option value="walk">Walk-in</option>
            <option value="direct">Direct</option>
            <option value="ota">OTA</option>
            <option value="mmt">MMT</option>
            <option value="goibibo">Goibibo</option>
            <option value="booking">Booking.com</option>
          </select>
          <input type="text" className="form-control form-control-sm" placeholder="Search..." style={{ width: 150 }}
            value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-sm btn-outline-dark" onClick={() => window.print()}>
            <i className="bi bi-printer"></i>
          </button>
        </div>
      </div>

      <div className="room-activity-report">
        <div className="ra-header d-none d-print-block" style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: 16, marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{HOTEL_NAME}</h2>
          <div style={{ fontSize: 11, color: '#555' }}>{HOTEL_ADDRESS}</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12, background: '#111', color: '#fff', padding: '4px 16px', display: 'inline-block', letterSpacing: 2 }}>
            ROOM ACTIVITY REPORT
          </div>
          <div style={{ marginTop: 8, fontSize: 12 }}>{dayjs(from).format('DD MMM YYYY')} — {dayjs(to).format('DD MMM YYYY')}</div>
        </div>

        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></div>
            ) : filteredRows.length === 0 ? (
              <div className="text-center py-5 text-muted">No reservations found for this period</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
                  <thead style={{ background: '#f9fafb' }}>
                    <tr>
                      <th style={{ paddingLeft: 20 }}>Room</th>
                      <th>Guest</th>
                      <th>Check-in</th>
                      <th className="text-end">Payment</th>
                      <th className="text-end">Restaurant</th>
                      <th className="text-end">Extra Bed</th>
                      <th>Check-out</th>
                      <th>Source</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => {
                      const billing = r.billing || {};
                      const items = billing.items || [];
                      // Use backend-computed restaurant_charges, else sum from items
                      const restaurant = r.restaurant_charges != null
                        ? parseFloat(r.restaurant_charges) || 0
                        : items.filter(it => it.item_type === 'restaurant').reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
                      const extraBed = items.filter(it => it.item_type === 'service' && it.description && it.description.toLowerCase().includes('extra bed')).reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
                      const c = sourceColor(r.source);
                      const sc = statusColor(r.status);
                      const guestName = `${r.guest?.first_name || ''} ${r.guest?.last_name || ''}`.trim() || 'Unknown';
                      return (
                        <tr key={i}>
                          <td style={{ paddingLeft: 20 }}><strong>{r.room?.room_number || '—'}</strong></td>
                          <td style={{ fontSize: 12 }}>
                            <div>{guestName}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.reservation_number}</div>
                          </td>
                          <td style={{ fontSize: 11 }}>
                            {r.actual_check_in ? dayjs(r.actual_check_in).format('DD MMM hh:mm A') : dayjs(r.check_in_date).format('DD MMM')}
                          </td>
                          <td className="text-end" style={{ color: billing.paid_amount > 0 ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                            {billing.paid_amount > 0 ? formatCurrency(billing.paid_amount) : '—'}
                          </td>
                          <td className="text-end" style={{ color: restaurant > 0 ? '#9a3412' : '#94a3b8' }}>
                            {restaurant > 0 ? formatCurrency(restaurant) : '—'}
                          </td>
                          <td className="text-end" style={{ color: extraBed > 0 ? '#92400e' : '#94a3b8' }}>
                            {extraBed > 0 ? formatCurrency(extraBed) : '—'}
                          </td>
                          <td style={{ fontSize: 11 }}>
                            {r.actual_check_out ? dayjs(r.actual_check_out).format('DD MMM hh:mm A') : dayjs(r.check_out_date).format('DD MMM')}
                          </td>
                          <td>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: c.bg, color: c.fg }}>
                              {sourceLabel(r.source)}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: sc.bg, color: sc.fg, textTransform: 'uppercase' }}>
                              {(r.status || '').replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: '#f9fafb', fontWeight: 700 }}>
                      <td colSpan={3} style={{ paddingLeft: 20 }}>Total ({filteredRows.length} reservations)</td>
                      <td className="text-end" style={{ color: '#16a34a' }}>{formatCurrency(totals.payment)}</td>
                      <td className="text-end" style={{ color: '#9a3412' }}>{formatCurrency(totals.restaurant)}</td>
                      <td className="text-end" style={{ color: '#92400e' }}>{formatCurrency(totals.extra_bed)}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .room-activity-report, .room-activity-report * { visibility: visible; }
          .room-activity-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .d-print-none { display: none !important; }
          @page { margin: 10mm; size: A4 landscape; }
        }
      `}</style>
    </>
  );
}
