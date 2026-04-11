import { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const HOTEL_NAME = 'Hotel Udhayam International';
const HOTEL_ADDRESS = 'Travellers Bungalow Road, Thiruchendur, Thoothukudi, Tamil Nadu 628215';

export default function CheckoutHistory() {
  const api = useApi();
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [expanded, setExpanded] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [printData, setPrintData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/checkout-history?from=${fromDate}&to=${toDate}&limit=200`);
      setData(res.data.data || []);
      setSummary(res.data.summary || null);
      setSelected(new Set());
    } catch (err) {
      console.error('Failed to fetch checkout history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [fromDate, toDate]);

  const formatRoomType = (t) => t ? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

  const toggleSelect = (billingId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(billingId)) next.delete(billingId);
      else next.add(billingId);
      return next;
    });
  };

  const toggleAll = () => {
    const unbilled = data.filter(d => !d.bill_number && !d.gst_bill_number && d.id);
    if (selected.size === unbilled.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unbilled.map(d => d.id)));
    }
  };

  const handleGenerate = async () => {
    // Auto-include GST-marked records that don't have a bill number yet
    const gstMarkedIds = data.filter(d => !d.bill_number && d.gst_bill_number && d.id).map(d => d.id);
    const allIds = new Set([...selected, ...gstMarkedIds]);
    if (allIds.size === 0) {
      toast.error('Please select at least one checkout');
      return;
    }
    try {
      setGenerating(true);
      const res = await api.post('/reports/generate-bill-numbers', { ids: [...allIds] });
      toast.success(res.data.message);
      setPrintData(res.data);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate bill numbers');
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset the bill sequence? This will clear all generated bill numbers.')) return;
    try {
      setResetting(true);
      const res = await api.post('/reports/reset-bill-sequence');
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset');
    } finally {
      setResetting(false);
    }
  };

  const unbilledCount = data.filter(d => !d.bill_number && !d.gst_bill_number && d.id).length;
  const billedCount = data.filter(d => d.bill_number).length;

  // Printable bill list view
  if (printData) {
    return (
      <div>
        <div className="d-print-none mb-3 d-flex justify-content-between align-items-center">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setPrintData(null)}>
            <i className="bi bi-arrow-left me-1"></i>Back to History
          </button>
          <button className="btn btn-dark btn-sm" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i>Print Bill List
          </button>
        </div>

        <div className="bill-print-report">
          <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: 16, marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{HOTEL_NAME}</h2>
            <div style={{ fontSize: 11, color: '#555' }}>{HOTEL_ADDRESS}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 12, background: '#111', color: '#fff', padding: '4px 16px', display: 'inline-block', letterSpacing: 2 }}>
              BILL REGISTER
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
              {printData.generated[0]?.bill_number} to {printData.generated[printData.generated.length - 1]?.bill_number}
              &nbsp;&nbsp;|&nbsp;&nbsp; Generated: {dayjs().format('DD MMM YYYY hh:mm A')}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={thStyle}>Bill No.</th>
                <th style={thStyle}>Guest</th>
                <th style={thStyle}>Room</th>
                <th style={thStyle}>Nights</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Subtotal</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>CGST</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>SGST</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Discount</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {printData.print_data.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={tdStyle}><strong>{d.bill_number}</strong></td>
                  <td style={tdStyle}>{d.guest_name}<br /><span style={{ fontSize: 10, color: '#94a3b8' }}>{d.guest_phone}</span></td>
                  <td style={tdStyle}>{d.room_number} <span style={{ fontSize: 10, color: '#94a3b8' }}>({formatRoomType(d.room_type)})</span></td>
                  <td style={tdStyle}>{d.nights}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(d.subtotal)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(d.cgst)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(d.sgst)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{d.discount > 0 ? formatCurrency(d.discount) : '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{formatCurrency(d.grand_total)}</td>
                </tr>
              ))}
              <tr style={{ background: '#f0fdf4', fontWeight: 700 }}>
                <td style={tdStyle} colSpan={4}>TOTAL ({printData.print_data.length} bills)</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(printData.totals.subtotal)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(printData.totals.cgst)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(printData.totals.sgst)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(printData.totals.discount)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(printData.totals.grand_total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            .bill-print-report, .bill-print-report * { visibility: visible; }
            .bill-print-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            .d-print-none { display: none !important; }
            @page { margin: 15mm; size: A4 landscape; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
      <div className="card-header bg-white border-0 py-3 px-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-box-arrow-right me-2 text-primary"></i>Checkout History with GST
          </h6>
          <div className="d-flex align-items-center gap-2">
            <input type="date" className="form-control form-control-sm" style={{ width: 140 }}
              value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <span style={{ fontSize: 12, color: '#94a3b8' }}>to</span>
            <input type="date" className="form-control form-control-sm" style={{ width: 140 }}
              value={toDate} onChange={e => setToDate(e.target.value)} />
            {selected.size > 0 && (
              <button className="btn btn-sm btn-success" onClick={handleGenerate} disabled={generating}>
                {generating ? <><span className="spinner-border spinner-border-sm me-1"></span>Generating...</> : <><i className="bi bi-receipt me-1"></i>Generate Bill No. ({selected.size})</>}
              </button>
            )}
            <button className="btn btn-sm btn-outline-dark" onClick={() => window.print()}>
              <i className="bi bi-printer"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary"></div></div>
        ) : data.length === 0 ? (
          <div className="text-center py-5 text-muted">No checkouts found for this period</div>
        ) : (
          <>
            {/* Summary */}
            {summary && (
              <div style={{ display: 'flex', gap: 12, padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                <SumBadge label="Checkouts" value={summary.total_checkouts} color="#1a1a2e" />
                <SumBadge label="Subtotal" value={formatCurrency(summary.total_subtotal)} color="#2563eb" />
                <SumBadge label="GST" value={formatCurrency(summary.total_gst)} color="#d97706" />
                <SumBadge label="Grand Total" value={formatCurrency(summary.total_grand)} color="#16a34a" />
                <SumBadge label="Cash" value={formatCurrency(summary.total_cash)} color="#059669" />
                <SumBadge label="Card" value={formatCurrency(summary.total_card)} color="#2563eb" />
                <SumBadge label="UPI" value={formatCurrency(summary.total_upi)} color="#d97706" />
                {summary.total_refunded > 0 && <SumBadge label="Refunded" value={formatCurrency(summary.total_refunded)} color="#dc2626" />}
              </div>
            )}

            {/* Table */}
            <div className="table-responsive">
              <table className="table table-sm table-hover mb-0" style={{ fontSize: 12 }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ paddingLeft: 12, width: 30 }}>
                      {unbilledCount > 0 && (
                        <input type="checkbox" checked={selected.size === unbilledCount && unbilledCount > 0}
                          onChange={toggleAll} style={{ cursor: 'pointer' }} />
                      )}
                    </th>
                    <th>Bill No.</th>
                    <th>Checkout</th>
                    <th>Guest</th>
                    <th>Room</th>
                    <th className="text-end">Subtotal</th>
                    <th className="text-end">CGST</th>
                    <th className="text-end">SGST</th>
                    <th className="text-end">Discount</th>
                    <th className="text-end">Grand Total</th>
                    <th className="text-end">Paid</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => (
                    <>
                      <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === i ? null : i)}>
                        <td style={{ paddingLeft: 12 }} onClick={e => e.stopPropagation()}>
                          {!d.bill_number && d.gst_bill_number && d.id ? (
                            <input type="checkbox" checked disabled style={{ cursor: 'not-allowed' }} />
                          ) : !d.bill_number && d.id ? (
                            <input type="checkbox" checked={selected.has(d.id)}
                              onChange={() => toggleSelect(d.id)} style={{ cursor: 'pointer' }} />
                          ) : null}
                        </td>
                        <td>
                          {d.bill_number ? (
                            <span style={{ background: '#dcfce7', color: '#166534', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                              {d.bill_number}
                            </span>
                          ) : (
                            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>
                              Pending
                            </span>
                          )}
                          {d.gst_bill_number && (
                            <div style={{ marginTop: 2 }}>
                              <span style={{ background: '#ede9fe', color: '#6d28d9', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                                GST: {d.gst_bill_number}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>{formatDate(d.actual_check_out, 'DD MMM YY hh:mm A')}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{d.guest_name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{d.guest_phone}</div>
                        </td>
                        <td>
                          <strong>{d.room_number}</strong>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{formatRoomType(d.room_type)}</div>
                        </td>
                        <td className="text-end">{formatCurrency(d.subtotal)}</td>
                        <td className="text-end">{formatCurrency(d.cgst)}</td>
                        <td className="text-end">{formatCurrency(d.sgst)}</td>
                        <td className="text-end" style={{ color: d.discount > 0 ? '#8b5cf6' : '' }}>{d.discount > 0 ? formatCurrency(d.discount) : '—'}</td>
                        <td className="text-end fw-bold">{formatCurrency(d.grand_total)}</td>
                        <td className="text-end" style={{ color: '#16a34a' }}>{formatCurrency(d.net_paid)}</td>
                        <td style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          {d.bill_number && (
                            <button className="btn btn-sm" style={{ fontSize: 10, padding: '2px 6px', color: d.is_permanent ? '#16a34a' : '#94a3b8', background: 'none', border: 'none' }}
                              title={d.is_permanent ? 'Locked — click to unlock' : 'Lock permanently'}
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await api.post(`/reports/checkout-history/${d.id}/toggle-permanent`);
                                  toast.success(d.is_permanent ? 'Bill unlocked' : 'Bill locked permanently');
                                  fetchData();
                                } catch (err) {
                                  toast.error(err.response?.data?.message || 'Failed to update');
                                }
                              }}>
                              <i className={`bi bi-${d.is_permanent ? 'lock-fill' : 'unlock'}`}></i>
                            </button>
                          )}
                          {!d.bill_number && !d.gst_bill_number && (
                            <button className="btn btn-sm" style={{ fontSize: 10, padding: '2px 6px', color: '#dc2626', background: 'none', border: 'none' }}
                              title="Remove from history"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!window.confirm(`Remove ${d.guest_name} (Room ${d.room_number}) from checkout history?`)) return;
                                try {
                                  await api.del(`/reports/checkout-history/${d.id}`);
                                  toast.success('Removed from history');
                                  fetchData();
                                } catch (err) {
                                  toast.error(err.response?.data?.message || 'Failed to remove');
                                }
                              }}>
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                          <i className={`bi bi-chevron-${expanded === i ? 'up' : 'down'}`} style={{ color: '#94a3b8' }}></i>
                        </td>
                      </tr>
                      {expanded === i && (
                        <tr key={`detail-${i}`}>
                          <td colSpan={12} style={{ background: '#f8fafc', padding: '12px 20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, fontSize: 12 }}>
                              <div>
                                <div style={{ fontWeight: 700, marginBottom: 6, color: '#475569' }}>Stay Details</div>
                                <div>Res: {d.reservation_number}</div>
                                <div>Invoice: {d.invoice_number || '—'}</div>
                                {d.gst_bill_number && <div>GST Bill: <strong style={{ color: '#6d28d9' }}>{d.gst_bill_number}</strong></div>}
                                {d.bill_number && <div>Bill No: <strong>{d.bill_number}</strong></div>}
                                <div>Check-in: {formatDate(d.check_in, 'DD MMM YYYY')}</div>
                                <div>Check-out: {formatDate(d.check_out, 'DD MMM YYYY')}</div>
                                <div>Nights: {d.nights} x {formatCurrency(d.rate_per_night)}</div>
                                <div>Source: {d.source}</div>
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, marginBottom: 6, color: '#475569' }}>GST Breakup</div>
                                <div>Subtotal: {formatCurrency(d.subtotal)}</div>
                                <div>CGST: {formatCurrency(d.cgst)}</div>
                                <div>SGST: {formatCurrency(d.sgst)}</div>
                                {d.igst > 0 && <div>IGST: {formatCurrency(d.igst)}</div>}
                                <div style={{ fontWeight: 700, marginTop: 4 }}>Total GST: {formatCurrency(d.total_gst)}</div>
                                {d.discount > 0 && <div style={{ color: '#8b5cf6' }}>Discount: -{formatCurrency(d.discount)}</div>}
                                <div style={{ fontWeight: 700, marginTop: 4 }}>Grand Total: {formatCurrency(d.grand_total)}</div>
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, marginBottom: 6, color: '#475569' }}>Payment Breakup</div>
                                {d.cash_paid > 0 && <div>Cash: {formatCurrency(d.cash_paid)}</div>}
                                {d.card_paid > 0 && <div>Card: {formatCurrency(d.card_paid)}</div>}
                                {d.upi_paid > 0 && <div>UPI: {formatCurrency(d.upi_paid)}</div>}
                                <div style={{ fontWeight: 700, marginTop: 4, color: '#16a34a' }}>Total Paid: {formatCurrency(d.paid_amount)}</div>
                                {d.refunded_amount > 0 && <div style={{ color: '#dc2626' }}>Refunded: -{formatCurrency(d.refunded_amount)}</div>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: '#555', borderBottom: '2px solid #e5e7eb' };
const tdStyle = { padding: '7px 10px', borderBottom: '1px solid #f0f0f0' };

function SumBadge({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <span style={{ color: '#94a3b8' }}>{label}:</span>
      <span style={{ fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
