import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency } from '../utils/formatters';
import dayjs from 'dayjs';

const HOTEL_NAME = 'Hotel Udhayam International';
const HOTEL_ADDRESS = 'Travellers Bungalow Road, Thiruchendur, Thoothukudi, Tamil Nadu 628215';
const HOTEL_PHONE = '04639-242566 / +91 9554404292';

const INITIAL_FORM = {
  opening_balance: '',
  room_advance: '',
  restaurant_bills: '',
  checkout_balance: '',
  given_to_hr: '',
  gpay_received: '',
  cc_received: '',
  refunded: '',
  deposited_in_bank: '',
};

export default function FormatAReportPage() {
  const api = useApi();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [form, setForm] = useState(INITIAL_FORM);
  const [shift, setShift] = useState('shift_1');
  const [savedReports, setSavedReports] = useState([]);
  const [viewingReport, setViewingReport] = useState(null);

  const fetchReport = async (reportDate) => {
    try {
      setLoading(true);
      const res = await api.get(`/shift-handover/format-a?date=${reportDate}`);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(date); fetchSavedReports(); }, [date]);

  const fetchSavedReports = async () => {
    try {
      const res = await api.get('/shift-handover?limit=20');
      setSavedReports(res.data?.data || res.data || []);
    } catch {}
  };

  // Auto-set shift based on shifts saved today (from API)
  useEffect(() => {
    if (!report?.shifts_saved_today) return;
    const saved = report.shifts_saved_today;
    const hasShift1 = saved.some(r => r.shift === 'shift_1');
    const hasShift2 = saved.some(r => r.shift === 'shift_2');
    if (hasShift1 && !hasShift2) {
      setShift('shift_2');
    } else if (!hasShift1) {
      setShift('shift_1');
    }
  }, [report]);

  const currentShiftSaved = report?.shifts_saved_today?.find(r => r.shift === shift);

  // Auto-populate from DB
  useEffect(() => {
    if (report) {
      setHrList(report.hr_handovers || []);
      setForm(prev => ({
        ...prev,
        opening_balance: String(report.previous_closing_balance || ''),
        room_advance: String(report.total_advances || ''),
        restaurant_bills: String(report.total_restaurant_bills || ''),
        checkout_balance: String(report.total_checkout_balance || ''),
        refunded: String(report.total_refunds || ''),
        given_to_hr: String(report.total_hr_handover || ''),
      }));
    }
  }, [report]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const num = (v) => parseFloat(v) || 0;

  const totalIn = Math.round((num(form.opening_balance) + num(form.room_advance) + num(form.restaurant_bills) + num(form.checkout_balance)) * 100) / 100;
  const totalOut = Math.round((num(form.given_to_hr) + num(form.gpay_received) + num(form.cc_received) + num(form.refunded) + num(form.deposited_in_bank)) * 100) / 100;
  const closingBalance = Math.round((totalIn - totalOut) * 100) / 100;

  const [saving, setSaving] = useState(false);
  const [hrList, setHrList] = useState([]);
  const [hrForm, setHrForm] = useState({ amount: '', given_to: '', notes: '' });
  const [showHrForm, setShowHrForm] = useState(false);
  const [hrSubmitting, setHrSubmitting] = useState(false);

  const handlePrint = () => window.print();

  const handleAddHrHandover = async () => {
    if (!hrForm.amount) return;
    try {
      setHrSubmitting(true);
      await api.post('/shift-handover/hr-handover', { ...hrForm, given_to: hrForm.given_to || 'HR', shift_date: date, shift });
      setHrForm({ amount: '', given_to: '', notes: '' });
      setShowHrForm(false);
      fetchReport(date);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record');
    } finally {
      setHrSubmitting(false);
    }
  };

  const handleDeleteHr = async (id) => {
    if (!window.confirm('Remove this HR handover entry?')) return;
    try {
      await api.del(`/shift-handover/hr-handover/${id}`);
      fetchReport(date);
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleSaveReport = async () => {
    try {
      setSaving(true);
      const res = await api.post('/shift-handover', {
        shift_date: date,
        shift,
        cash_in_hand: closingBalance,
        total_collections: totalIn,
        pending_checkouts: report?.room_summary?.reserved || 0,
        notes: `Format A | In: ${totalIn} | Out: ${totalOut} | Closing: ${closingBalance}`,
        tasks_pending: JSON.stringify({
          opening_balance: num(form.opening_balance),
          room_advance: num(form.room_advance),
          restaurant_bills: num(form.restaurant_bills),
          checkout_balance: num(form.checkout_balance),
          given_to_hr: num(form.given_to_hr),
          gpay_received: num(form.gpay_received),
          cc_received: num(form.cc_received),
          refunded: num(form.refunded),
          deposited_in_bank: num(form.deposited_in_bank),
        }),
      });
      const reportNum = res.data?.report_number || '';
      alert(`Report ${reportNum} saved! Closing balance will carry forward as next shift's opening balance.`);
      fetchReport(date);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  const shiftLabels = {
    shift_1: 'Shift 1 (Morning)',
    shift_2: 'Shift 2 (Evening)',
  };

  return (
    <>
      {/* Controls */}
      <div className="d-print-none mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <h5 className="mb-0" style={{ fontWeight: 700 }}>
            <i className="bi bi-file-earmark-text me-2"></i>Format A Report
          </h5>
          <input type="date" className="form-control form-control-sm" style={{ width: 160 }}
            value={date} onChange={e => setDate(e.target.value)} />
          <select className="form-select form-select-sm" style={{ width: 180 }}
            value={shift} onChange={e => setShift(e.target.value)}>
            <option value="shift_1">Shift 1 (Morning)</option>
            <option value="shift_2">Shift 2 (Evening)</option>
          </select>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm" onClick={handleSaveReport} disabled={saving || !!currentShiftSaved}
            title={currentShiftSaved ? `${currentShiftSaved.report_number} already saved for this shift` : ''}>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>
              : currentShiftSaved ? <><i className="bi bi-check-circle me-1"></i>Already Saved ({currentShiftSaved.report_number})</>
              : <><i className="bi bi-check-circle me-1"></i>Save & Close Shift</>}
          </button>
          <button className="btn btn-dark btn-sm" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i> Print
          </button>
        </div>
      </div>

      {/* Report */}
      <div className="format-a-report">
        {/* Header */}
        <div className="fa-header">
          <h2 className="fa-hotel-name">{HOTEL_NAME}</h2>
          <div className="fa-hotel-address">{HOTEL_ADDRESS}</div>
          <div className="fa-hotel-phone">{HOTEL_PHONE}</div>
          <div className="fa-report-title">FORMAT A — SHIFT HANDOVER REPORT</div>
          <div className="fa-report-meta">
            <span>Date: <strong>{dayjs(date).format('DD MMM YYYY')}</strong></span>
            <span>Shift: <strong>{shiftLabels[shift]}</strong></span>
            {report?.last_report_number && (
              <span>Last: <strong>{report.last_report_number}</strong></span>
            )}
          </div>
        </div>

        {/* Room Summary Bar */}
        {report && (
          <div className="fa-section">
            <div className="fa-summary-grid">
              <div className="fa-summary-item">
                <div className="fa-summary-num">{report.room_summary.total}</div>
                <div className="fa-summary-label">Total Rooms</div>
              </div>
              <div className="fa-summary-item" style={{ borderColor: '#dc2626' }}>
                <div className="fa-summary-num" style={{ color: '#dc2626' }}>{report.room_summary.occupied}</div>
                <div className="fa-summary-label">Occupied</div>
              </div>
              <div className="fa-summary-item" style={{ borderColor: '#16a34a' }}>
                <div className="fa-summary-num" style={{ color: '#16a34a' }}>{report.room_summary.available}</div>
                <div className="fa-summary-label">Available</div>
              </div>
              <div className="fa-summary-item" style={{ borderColor: '#2563eb' }}>
                <div className="fa-summary-num" style={{ color: '#2563eb' }}>{report.room_summary.reserved}</div>
                <div className="fa-summary-label">Reserved</div>
              </div>
              <div className="fa-summary-item" style={{ borderColor: '#d97706' }}>
                <div className="fa-summary-num" style={{ color: '#d97706' }}>{report.check_ins_count}</div>
                <div className="fa-summary-label">Check-ins</div>
              </div>
              <div className="fa-summary-item" style={{ borderColor: '#7c3aed' }}>
                <div className="fa-summary-num" style={{ color: '#7c3aed' }}>{report.check_outs_count}</div>
                <div className="fa-summary-label">Check-outs</div>
              </div>
            </div>
          </div>
        )}

        {/* Earnings vs Money Out — Side by Side */}
        <div className="fa-section">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left: Earnings */}
            <div>
              <div className="fa-section-title" style={{ background: '#ecfdf5', borderColor: '#16a34a' }}>
                <i className="bi bi-arrow-down-circle me-2" style={{ color: '#16a34a' }}></i>Earnings (Money In)
              </div>
              <table className="fa-table">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Opening Balance <span style={{ fontSize: 10, color: '#16a34a' }}>(prev closing)</span></td>
                    <td style={{ width: 150 }}>
                      <input type="number" className="fa-input" placeholder="0" readOnly
                        style={{ background: '#f0fdf4', fontWeight: 600 }}
                        value={form.opening_balance} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Room Advance <span style={{ fontSize: 10, color: '#16a34a' }}>(auto)</span></td>
                    <td>
                      <input type="number" className="fa-input" placeholder="0" readOnly
                        style={{ background: '#f0fdf4', fontWeight: 600 }}
                        value={form.room_advance} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Restaurant Bills <span style={{ fontSize: 10, color: '#16a34a' }}>(auto)</span></td>
                    <td>
                      <input type="number" className="fa-input" placeholder="0" readOnly
                        style={{ background: '#f0fdf4', fontWeight: 600 }}
                        value={form.restaurant_bills} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Check-out Balance <span style={{ fontSize: 10, color: '#16a34a' }}>(auto)</span></td>
                    <td>
                      <input type="number" className="fa-input" placeholder="0" readOnly
                        style={{ background: '#f0fdf4', fontWeight: 600 }}
                        value={form.checkout_balance} />
                    </td>
                  </tr>
                  <tr className="fa-total-row" style={{ background: '#ecfdf5' }}>
                    <td style={{ fontWeight: 700, fontSize: 14 }}>Total In</td>
                    <td style={{ fontWeight: 700, fontSize: 14, textAlign: 'right', paddingRight: 12 }}>
                      {formatCurrency(totalIn)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right: Money Out */}
            <div>
              <div className="fa-section-title" style={{ background: '#fef2f2', borderColor: '#dc2626' }}>
                <i className="bi bi-arrow-up-circle me-2" style={{ color: '#dc2626' }}></i>Money Out
              </div>
              <table className="fa-table">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>
                      Given to HR <span style={{ fontSize: 10, color: '#dc2626' }}>(auto)</span>
                      <button type="button" className="d-print-none" style={{ marginLeft: 8, background: 'none', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 10, padding: '1px 6px', cursor: 'pointer', color: '#2563eb' }}
                        onClick={() => setShowHrForm(!showHrForm)}>
                        <i className="bi bi-plus"></i> Add
                      </button>
                    </td>
                    <td style={{ width: 150 }}>
                      <input type="number" className="fa-input" placeholder="0" readOnly
                        style={{ background: '#fef2f2', fontWeight: 600 }}
                        value={form.given_to_hr} />
                    </td>
                  </tr>
                  {/* HR Handover entries */}
                  {hrList.length > 0 && hrList.map((h, i) => (
                    <tr key={`hr-${i}`} style={{ fontSize: 11, color: '#64748b' }}>
                      <td style={{ paddingLeft: 20 }}>
                        → Entry #{i + 1}
                        <button className="d-print-none" style={{ marginLeft: 6, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 10 }}
                          onClick={() => handleDeleteHr(h.id)}>
                          <i className="bi bi-x"></i>
                        </button>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 12 }}>{formatCurrency(parseFloat(h.amount))}</td>
                    </tr>
                  ))}
                  {/* Add HR form inline */}
                  {showHrForm && (
                    <tr className="d-print-none">
                      <td colSpan={2} style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="number" placeholder="Amount given to HR" style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }}
                            value={hrForm.amount} onChange={e => setHrForm(p => ({ ...p, amount: e.target.value }))} autoFocus />
                          <button style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 14px', fontSize: 11, cursor: 'pointer' }}
                            onClick={handleAddHrHandover} disabled={hrSubmitting}>
                            {hrSubmitting ? '...' : 'Save'}
                          </button>
                          <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
                            onClick={() => setShowHrForm(false)}>
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ fontWeight: 600 }}>GPay Received</td>
                    <td>
                      <input type="number" className="fa-input" placeholder="0"
                        value={form.gpay_received} onChange={e => updateField('gpay_received', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Credit Card</td>
                    <td>
                      <input type="number" className="fa-input" placeholder="0"
                        value={form.cc_received} onChange={e => updateField('cc_received', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Refunded <span style={{ fontSize: 10, color: '#dc2626' }}>(auto)</span></td>
                    <td>
                      <input type="number" className="fa-input" placeholder="0" readOnly
                        style={{ background: '#fef2f2', fontWeight: 600 }}
                        value={form.refunded} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Deposited in SBI</td>
                    <td>
                      <input type="number" className="fa-input" placeholder="0"
                        value={form.deposited_in_bank} onChange={e => updateField('deposited_in_bank', e.target.value)} />
                    </td>
                  </tr>
                  <tr className="fa-total-row" style={{ background: '#fef2f2' }}>
                    <td style={{ fontWeight: 700, fontSize: 14 }}>Total Out</td>
                    <td style={{ fontWeight: 700, fontSize: 14, textAlign: 'right', paddingRight: 12 }}>
                      {formatCurrency(totalOut)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Closing Balance */}
        <div className="fa-section">
          <div className="fa-closing-balance">
            <div className="fa-closing-label">CLOSING CASH BALANCE</div>
            <div className="fa-closing-amount" style={{ color: closingBalance >= 0 ? '#16a34a' : '#dc2626' }}>
              {formatCurrency(closingBalance)}
            </div>
            <div className="fa-closing-formula">
              Total In ({formatCurrency(totalIn)}) − Total Out ({formatCurrency(totalOut)}) = {formatCurrency(closingBalance)}
            </div>
          </div>
        </div>

        {/* Advances Collected (auto from DB) */}
        {report && (
          <div className="fa-section">
            <div className="fa-section-title">Advances Collected ({report.advances.length}) — Total: {formatCurrency(report.total_advances)}</div>
            {report.advances.length === 0 ? (
              <div className="fa-empty">No advances collected today</div>
            ) : (
              <table className="fa-table">
                <thead>
                  <tr>
                    <th>Res. No.</th>
                    <th>Guest</th>
                    <th>Room</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th className="text-end">Advance</th>
                  </tr>
                </thead>
                <tbody>
                  {report.advances.map((a, i) => (
                    <tr key={i}>
                      <td>{a.reservation_number}</td>
                      <td>{a.guest_name}</td>
                      <td>{a.room_number || '—'}</td>
                      <td>{dayjs(a.check_in).format('DD/MM')}</td>
                      <td>{dayjs(a.check_out).format('DD/MM')}</td>
                      <td className="text-end"><strong>{formatCurrency(a.amount)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Outstanding Bills (auto from DB) */}
        {report && (
          <div className="fa-section">
            <div className="fa-section-title">Outstanding Bills ({report.outstanding.length}) — Total Due: {formatCurrency(report.total_outstanding)}</div>
            {report.outstanding.length === 0 ? (
              <div className="fa-empty">No outstanding bills</div>
            ) : (
              <table className="fa-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Guest</th>
                    <th>Room</th>
                    <th className="text-end">Bill Amount</th>
                    <th className="text-end">Paid</th>
                    <th className="text-end">Balance Due</th>
                  </tr>
                </thead>
                <tbody>
                  {report.outstanding.map((o, i) => (
                    <tr key={i}>
                      <td>{o.invoice_number}</td>
                      <td>{o.guest_name}</td>
                      <td>{o.room_number || '—'}</td>
                      <td className="text-end">{formatCurrency(o.grand_total)}</td>
                      <td className="text-end">{formatCurrency(o.paid_amount)}</td>
                      <td className="text-end"><strong style={{ color: '#dc2626' }}>{formatCurrency(o.balance_due)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Saved Reports History */}
        {savedReports.length > 0 && !viewingReport && (
          <div className="fa-section d-print-none">
            <div className="fa-section-title">
              <i className="bi bi-archive me-2"></i>Saved Reports ({savedReports.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {savedReports.map((sr, i) => {
                let taskData = {};
                try { taskData = typeof sr.tasks_pending === 'string' ? JSON.parse(sr.tasks_pending) : (sr.tasks_pending || {}); } catch {}
                return (
                  <div key={sr.id} onClick={() => setViewingReport(sr)}
                    style={{
                      padding: '10px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8,
                      cursor: 'pointer', background: '#fff', transition: 'all 0.2s', minWidth: 160,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#2563eb' }}>{sr.report_number || `#${sr.id}`}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{dayjs(sr.shift_date).format('DD MMM YYYY')}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{shiftLabels[sr.shift] || sr.shift}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginTop: 4 }}>Closing: {formatCurrency(parseFloat(sr.cash_in_hand) || 0)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Viewing a Saved Report */}
        {viewingReport && (
          <div className="fa-section">
            <div className="d-print-none" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setViewingReport(null)}>
                <i className="bi bi-arrow-left me-1"></i>Back to Current Shift
              </button>
              <button className="btn btn-dark btn-sm" onClick={() => window.print()}>
                <i className="bi bi-printer me-1"></i>Print
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: 20, background: '#eff6ff', borderRadius: 12, border: '2px solid #2563eb' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>{viewingReport.report_number || `Report #${viewingReport.id}`}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                {dayjs(viewingReport.shift_date).format('DD MMM YYYY')} — {shiftLabels[viewingReport.shift] || viewingReport.shift}
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                By: {viewingReport.outgoingUser?.full_name || viewingReport.outgoingUser?.username || 'Staff'}
              </div>
            </div>
            {(() => {
              let td = {};
              try { td = typeof viewingReport.tasks_pending === 'string' ? JSON.parse(viewingReport.tasks_pending) : (viewingReport.tasks_pending || {}); } catch {}
              const vTotalIn = (parseFloat(td.opening_balance) || 0) + (parseFloat(td.room_advance) || 0) + (parseFloat(td.restaurant_bills) || 0) + (parseFloat(td.checkout_balance) || 0);
              const vTotalOut = (parseFloat(td.given_to_hr) || 0) + (parseFloat(td.gpay_received) || 0) + (parseFloat(td.cc_received) || 0) + (parseFloat(td.refunded) || 0) + (parseFloat(td.deposited_in_bank) || 0);
              const vClosing = parseFloat(viewingReport.cash_in_hand) || 0;
              return (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                      <div className="fa-section-title" style={{ background: '#ecfdf5', borderColor: '#16a34a' }}>
                        <i className="bi bi-arrow-down-circle me-2" style={{ color: '#16a34a' }}></i>Money In
                      </div>
                      <table className="fa-table">
                        <tbody>
                          <tr><td style={{ fontWeight: 600 }}>Opening Balance</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(td.opening_balance || 0)}</td></tr>
                          <tr><td style={{ fontWeight: 600 }}>Room Advance</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(td.room_advance || 0)}</td></tr>
                          <tr><td style={{ fontWeight: 600 }}>Restaurant Bills</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(td.restaurant_bills || 0)}</td></tr>
                          <tr><td style={{ fontWeight: 600 }}>Check-out Balance</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(td.checkout_balance || 0)}</td></tr>
                          <tr style={{ background: '#ecfdf5' }}><td style={{ fontWeight: 700 }}>Total In</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(vTotalIn)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <div className="fa-section-title" style={{ background: '#fef2f2', borderColor: '#dc2626' }}>
                        <i className="bi bi-arrow-up-circle me-2" style={{ color: '#dc2626' }}></i>Money Out
                      </div>
                      <table className="fa-table">
                        <tbody>
                          <tr><td style={{ fontWeight: 600 }}>Given to HR</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(td.given_to_hr || 0)}</td></tr>
                          <tr><td style={{ fontWeight: 600 }}>GPay Received</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(td.gpay_received || 0)}</td></tr>
                          <tr><td style={{ fontWeight: 600 }}>Credit Card</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(td.cc_received || 0)}</td></tr>
                          <tr><td style={{ fontWeight: 600 }}>Refunded</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(td.refunded || 0)}</td></tr>
                          <tr><td style={{ fontWeight: 600 }}>Deposited in SBI</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(td.deposited_in_bank || 0)}</td></tr>
                          <tr style={{ background: '#fef2f2' }}><td style={{ fontWeight: 700 }}>Total Out</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(vTotalOut)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 20, background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 12, marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#666' }}>Closing Cash Balance</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: vClosing >= 0 ? '#16a34a' : '#dc2626' }}>{formatCurrency(vClosing)}</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Signatures */}
        <div className="fa-signatures">
          <div className="fa-sig-box">
            <div className="fa-sig-line"></div>
            <div>Outgoing Staff</div>
          </div>
          <div className="fa-sig-box">
            <div className="fa-sig-line"></div>
            <div>Incoming Staff</div>
          </div>
          <div className="fa-sig-box">
            <div className="fa-sig-line"></div>
            <div>Manager</div>
          </div>
        </div>
      </div>

      <style>{`
        .format-a-report { max-width: 900px; margin: 0 auto; font-family: 'Inter', sans-serif; font-size: 13px; color: #1a1a1a; }
        .fa-header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 20px; }
        .fa-hotel-name { font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 1px; }
        .fa-hotel-address { font-size: 12px; color: #555; margin-top: 2px; }
        .fa-hotel-phone { font-size: 12px; color: #555; }
        .fa-report-title { font-size: 15px; font-weight: 700; margin-top: 14px; letter-spacing: 2px; background: #111; color: #fff; padding: 6px 16px; display: inline-block; }
        .fa-report-meta { margin-top: 10px; display: flex; justify-content: center; gap: 32px; font-size: 12px; color: #666; }
        .fa-section { margin-bottom: 24px; }
        .fa-section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 12px; background: #f3f4f6; border-left: 4px solid #111; margin-bottom: 8px; }
        .fa-summary-grid { display: flex; gap: 12px; }
        .fa-summary-item { flex: 1; text-align: center; padding: 12px 8px; border: 2px solid #e5e7eb; border-radius: 8px; }
        .fa-summary-num { font-size: 24px; font-weight: 800; color: #111; }
        .fa-summary-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        .fa-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .fa-table th { background: #f9fafb; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 2px solid #e5e7eb; }
        .fa-table td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
        .fa-table tbody tr:hover { background: #fafafa; }
        .fa-total-row td { border-top: 2px solid #333; border-bottom: none; }
        .fa-empty { padding: 16px; text-align: center; color: #999; font-style: italic; font-size: 12px; }
        .fa-input { width: 100%; padding: 6px 10px; border: 1.5px solid #d1d5db; border-radius: 6px; font-size: 13px; text-align: right; font-family: 'Inter', sans-serif; }
        .fa-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
        .fa-closing-balance { text-align: center; padding: 24px; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; }
        .fa-closing-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 4px; }
        .fa-closing-amount { font-size: 32px; font-weight: 800; }
        .fa-closing-formula { font-size: 11px; color: #999; margin-top: 4px; }
        .fa-signatures { display: flex; justify-content: space-between; gap: 40px; margin-top: 48px; padding-top: 24px; }
        .fa-sig-box { text-align: center; flex: 1; font-size: 12px; color: #555; }
        .fa-sig-line { border-bottom: 1px solid #999; margin-bottom: 8px; height: 40px; }

        @media print {
          body * { visibility: hidden; }
          .format-a-report, .format-a-report * { visibility: visible; }
          .format-a-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .d-print-none { display: none !important; }
          .fa-input { border: none; background: none; font-weight: 600; }
          .fa-table tbody tr:hover { background: none; }
          .fa-section { break-inside: avoid; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>
    </>
  );
}
