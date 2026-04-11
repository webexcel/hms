import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency } from '../utils/formatters';
import dayjs from 'dayjs';

const HOTEL_NAME = 'Hotel Udhayam International';
const HOTEL_ADDRESS = 'Travellers Bungalow Road, Thiruchendur, Thoothukudi, Tamil Nadu 628215';

const EXPENSE_CATEGORIES = [
  'Vegetables', 'Groceries', 'Milk & Dairy', 'Meat & Fish',
  'Cleaning Supplies', 'Maintenance', 'Transport', 'Utilities',
  'Wages', 'Stationery', 'Repairs', 'Misc',
];

export default function FormatBReportPage() {
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [report, setReport] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [viewingReport, setViewingReport] = useState(null);

  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showGpayForm, setShowGpayForm] = useState(false);
  const [gpayAmount, setGpayAmount] = useState('');
  const [gpaySubmitting, setGpaySubmitting] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankAmount, setBankAmount] = useState('');
  const [bankSubmitting, setBankSubmitting] = useState(false);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ category: 'Vegetables', description: '', amount: '', paid_to: '', bill_reference: '' });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/expenses/format-b?date=${date}`);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch report', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    try {
      const res = await api.get('/expenses/list');
      setSavedReports(res.data || []);
    } catch {}
  };

  useEffect(() => { fetchReport(); fetchSaved(); }, [date]);

  const num = (v) => parseFloat(v) || 0;
  const opening = num(report?.previous_closing_balance);
  const fromFo = num(report?.cash_from_fo);
  const fromBank = num(report?.total_bank);
  const fromGpay = num(report?.total_gpay);
  const totalIn = Math.round((opening + fromFo + fromBank + fromGpay) * 100) / 100;
  const totalExpenses = num(report?.total_expenses);
  const closing = Math.round((totalIn - totalExpenses) * 100) / 100;

  const handleAddBank = async () => {
    if (!bankAmount) return;
    try {
      setBankSubmitting(true);
      await api.post('/expenses/bank', { amount: bankAmount, withdrawal_date: date });
      setBankAmount('');
      setShowBankForm(false);
      fetchReport();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setBankSubmitting(false);
    }
  };

  const handleDeleteBank = async (id) => {
    if (!window.confirm('Delete this bank withdrawal?')) return;
    try {
      await api.del(`/expenses/bank/${id}`);
      fetchReport();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleAddGpay = async () => {
    if (!gpayAmount) return;
    try {
      setGpaySubmitting(true);
      await api.post('/expenses/gpay', { amount: gpayAmount, transfer_date: date });
      setGpayAmount('');
      setShowGpayForm(false);
      fetchReport();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setGpaySubmitting(false);
    }
  };

  const handleDeleteGpay = async (id) => {
    if (!window.confirm('Delete this GPay transfer?')) return;
    try {
      await api.del(`/expenses/gpay/${id}`);
      fetchReport();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      alert('Description and amount required');
      return;
    }
    try {
      setSubmittingExpense(true);
      await api.post('/expenses/entry', { ...expenseForm, expense_date: date });
      setExpenseForm({ category: 'Vegetables', description: '', amount: '', paid_to: '', bill_reference: '' });
      setShowExpenseForm(false);
      fetchReport();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.del(`/expenses/entry/${id}`);
      fetchReport();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSaveReport = async () => {
    try {
      setSaving(true);
      const res = await api.post('/expenses/format-b/save', {
        report_date: date,
        opening_balance: opening,
        cash_from_fo: fromFo,
        cash_from_bank: fromBank,
        cash_from_gpay: fromGpay,
        total_expenses: totalExpenses,
        closing_balance: closing,
        notes,
      });
      alert(`Report ${res.data.report_number} saved!`);
      setNotes('');
      fetchReport();
      fetchSaved();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  if (loading && !report) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <>
      {/* Controls */}
      <div className="d-print-none mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <h5 className="mb-0" style={{ fontWeight: 700 }}>
            <i className="bi bi-receipt me-2"></i>Format B — HR Expense Report
          </h5>
          <input type="date" className="form-control form-control-sm" style={{ width: 160 }}
            value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm" onClick={handleSaveReport}
            disabled={saving || !report?.shift_saved_today || !!report?.fb_saved_today}
            title={
              report?.fb_saved_today ? `${report.fb_saved_today} already saved for this date`
              : !report?.shift_saved_today ? 'Close Shift 2 Format A first'
              : ''
            }>
            {saving ? <><span className="spinner-border spinner-border-sm me-1"></span>Saving...</>
              : report?.fb_saved_today ? <><i className="bi bi-check-circle me-1"></i>Already Saved ({report.fb_saved_today})</>
              : !report?.shift_saved_today ? <><i className="bi bi-lock me-1"></i>Waiting for Shift 2 (FA)</>
              : <><i className="bi bi-check-circle me-1"></i>Save & Close Day</>}
          </button>
          <button className="btn btn-dark btn-sm" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i> Print
          </button>
        </div>
      </div>

      {/* Report */}
      <div className="format-b-report">
        <div className="fb-header">
          <h2 className="fb-hotel-name">{HOTEL_NAME}</h2>
          <div className="fb-hotel-address">{HOTEL_ADDRESS}</div>
          <div className="fb-report-title">FORMAT B — HR DAILY EXPENSE REPORT</div>
          <div className="fb-report-meta">
            <span>Date: <strong>{dayjs(date).format('DD MMM YYYY')}</strong></span>
            {report?.last_report_number && <span>Last: <strong>{report.last_report_number}</strong></span>}
          </div>
        </div>

        {/* Money In + Expenses Side by Side */}
        <div className="fb-section">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left: Money In */}
            <div>
              <div className="fb-section-title" style={{ background: '#ecfdf5', borderColor: '#16a34a' }}>
                <i className="bi bi-arrow-down-circle me-2" style={{ color: '#16a34a' }}></i>Money In
              </div>
              <table className="fb-table">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Opening Balance <span style={{ fontSize: 10, color: '#16a34a' }}>(prev closing)</span></td>
                    <td style={{ width: 140, textAlign: 'right', paddingRight: 12, fontWeight: 600 }}>
                      {formatCurrency(opening)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Cash from Front Office <span style={{ fontSize: 10, color: '#16a34a' }}>(auto)</span></td>
                    <td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 600 }}>
                      {formatCurrency(fromFo)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>
                      Cash from Bank / Withdrawal <span style={{ fontSize: 10, color: '#16a34a' }}>(auto)</span>
                      <button type="button" className="d-print-none" style={{ marginLeft: 8, background: 'none', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 10, padding: '1px 6px', cursor: 'pointer', color: '#2563eb' }}
                        onClick={() => setShowBankForm(!showBankForm)}>
                        <i className="bi bi-plus"></i> Add
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 600 }}>
                      {formatCurrency(fromBank)}
                    </td>
                  </tr>
                  {report?.bank_withdrawals?.map((b, i) => (
                    <tr key={`bank-${b.id}`} style={{ fontSize: 11, color: '#64748b' }}>
                      <td style={{ paddingLeft: 20 }}>
                        → Withdrawal #{i + 1}
                        <button className="d-print-none" style={{ marginLeft: 6, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 10 }}
                          onClick={() => handleDeleteBank(b.id)}>
                          <i className="bi bi-x"></i>
                        </button>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 12 }}>{formatCurrency(parseFloat(b.amount))}</td>
                    </tr>
                  ))}
                  {showBankForm && (
                    <tr className="d-print-none">
                      <td colSpan={2} style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="number" placeholder="Bank withdrawal amount" style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }}
                            value={bankAmount} onChange={e => setBankAmount(e.target.value)} autoFocus />
                          <button style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 14px', fontSize: 11, cursor: 'pointer' }}
                            onClick={handleAddBank} disabled={bankSubmitting}>
                            {bankSubmitting ? '...' : 'Save'}
                          </button>
                          <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
                            onClick={() => setShowBankForm(false)}>
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ fontWeight: 600 }}>
                      Amount Transferred from GPay <span style={{ fontSize: 10, color: '#16a34a' }}>(auto)</span>
                      <button type="button" className="d-print-none" style={{ marginLeft: 8, background: 'none', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 10, padding: '1px 6px', cursor: 'pointer', color: '#2563eb' }}
                        onClick={() => setShowGpayForm(!showGpayForm)}>
                        <i className="bi bi-plus"></i> Add
                      </button>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 600 }}>
                      {formatCurrency(fromGpay)}
                    </td>
                  </tr>
                  {report?.gpay_transfers?.map((g, i) => (
                    <tr key={`gpay-${g.id}`} style={{ fontSize: 11, color: '#64748b' }}>
                      <td style={{ paddingLeft: 20 }}>
                        → Transfer #{i + 1}
                        <button className="d-print-none" style={{ marginLeft: 6, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 10 }}
                          onClick={() => handleDeleteGpay(g.id)}>
                          <i className="bi bi-x"></i>
                        </button>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 12 }}>{formatCurrency(parseFloat(g.amount))}</td>
                    </tr>
                  ))}
                  {showGpayForm && (
                    <tr className="d-print-none">
                      <td colSpan={2} style={{ padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="number" placeholder="GPay transfer amount" style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 12 }}
                            value={gpayAmount} onChange={e => setGpayAmount(e.target.value)} autoFocus />
                          <button style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 14px', fontSize: 11, cursor: 'pointer' }}
                            onClick={handleAddGpay} disabled={gpaySubmitting}>
                            {gpaySubmitting ? '...' : 'Save'}
                          </button>
                          <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
                            onClick={() => setShowGpayForm(false)}>
                            <i className="bi bi-x"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr style={{ background: '#ecfdf5' }}>
                    <td style={{ fontWeight: 700 }}>Total In</td>
                    <td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 700 }}>{formatCurrency(totalIn)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right: Expenses */}
            <div>
              <div className="fb-section-title" style={{ background: '#fef2f2', borderColor: '#dc2626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><i className="bi bi-arrow-up-circle me-2" style={{ color: '#dc2626' }}></i>Expenses</span>
                <button type="button" className="d-print-none" style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 10px', fontSize: 11, cursor: 'pointer' }}
                  onClick={() => setShowExpenseForm(!showExpenseForm)}>
                  <i className="bi bi-plus"></i> Add
                </button>
              </div>
              <table className="fb-table">
                <tbody>
                  {report?.expenses?.length === 0 && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', color: '#94a3b8', padding: 12, fontStyle: 'italic' }}>No expenses today</td></tr>
                  )}
                  {report?.expenses?.map((e, i) => (
                    <tr key={e.id}>
                      <td style={{ fontSize: 12 }}>
                        <div style={{ fontWeight: 600 }}>{e.description}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>
                          {e.category}
                          {e.paid_to && ` · To: ${e.paid_to}`}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 600 }}>
                        {formatCurrency(parseFloat(e.amount))}
                        <button type="button" className="d-print-none" style={{ marginLeft: 4, background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 10 }}
                          onClick={() => handleDeleteExpense(e.id)}>
                          <i className="bi bi-x"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {showExpenseForm && (
                    <tr className="d-print-none">
                      <td colSpan={2} style={{ padding: 8 }}>
                        <div className="d-flex flex-column gap-1">
                          <select className="form-select form-select-sm" style={{ fontSize: 12 }}
                            value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input type="text" className="form-control form-control-sm" placeholder="Description *" style={{ fontSize: 12 }}
                            value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                          <div className="d-flex gap-1">
                            <input type="number" className="form-control form-control-sm" placeholder="Amount *" style={{ fontSize: 12 }}
                              value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                            <input type="text" className="form-control form-control-sm" placeholder="Paid to" style={{ fontSize: 12 }}
                              value={expenseForm.paid_to} onChange={e => setExpenseForm({ ...expenseForm, paid_to: e.target.value })} />
                          </div>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-primary flex-fill" onClick={handleAddExpense} disabled={submittingExpense}>
                              {submittingExpense ? '...' : 'Save Expense'}
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowExpenseForm(false)}>
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr style={{ background: '#fef2f2' }}>
                    <td style={{ fontWeight: 700 }}>Total Expenses</td>
                    <td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 700 }}>{formatCurrency(totalExpenses)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Closing Balance */}
        <div className="fb-section">
          <div className="fb-closing">
            <div className="fb-closing-label">CLOSING CASH BALANCE</div>
            <div className="fb-closing-amount" style={{ color: closing >= 0 ? '#16a34a' : '#dc2626' }}>
              {formatCurrency(closing)}
            </div>
            <div className="fb-closing-formula">
              Total In ({formatCurrency(totalIn)}) − Expenses ({formatCurrency(totalExpenses)}) = {formatCurrency(closing)}
            </div>
          </div>
        </div>

        {/* Saved Reports */}
        {savedReports.length > 0 && !viewingReport && (
          <div className="fb-section d-print-none">
            <div className="fb-section-title">
              <i className="bi bi-archive me-2"></i>Saved Reports ({savedReports.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {savedReports.map(sr => (
                <div key={sr.id} onClick={() => setViewingReport(sr)}
                  style={{
                    padding: '10px 16px', border: '1.5px solid #e5e7eb', borderRadius: 8,
                    background: '#fff', minWidth: 160, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#fff'; }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#dc2626' }}>{sr.report_number}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{dayjs(sr.report_date).format('DD MMM YYYY')}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginTop: 4 }}>Closing: {formatCurrency(parseFloat(sr.closing_balance) || 0)}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>Spent: {formatCurrency(parseFloat(sr.total_expenses) || 0)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Viewing Saved Report */}
        {viewingReport && (
          <div className="fb-section">
            <div className="d-print-none" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setViewingReport(null)}>
                <i className="bi bi-arrow-left me-1"></i>Back
              </button>
              <button className="btn btn-dark btn-sm" onClick={() => window.print()}>
                <i className="bi bi-printer me-1"></i>Print
              </button>
            </div>
            <div style={{ textAlign: 'center', padding: 20, background: '#fef2f2', borderRadius: 12, border: '2px solid #dc2626' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{viewingReport.report_number}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                {dayjs(viewingReport.report_date).format('DD MMM YYYY')}
              </div>
            </div>
            {(() => {
              const op = parseFloat(viewingReport.opening_balance) || 0;
              const fo = parseFloat(viewingReport.cash_from_fo) || 0;
              const bk = parseFloat(viewingReport.cash_from_bank) || 0;
              const gp = parseFloat(viewingReport.cash_from_gpay) || 0;
              const tIn = parseFloat(viewingReport.total_in) || 0;
              const exp = parseFloat(viewingReport.total_expenses) || 0;
              const cl = parseFloat(viewingReport.closing_balance) || 0;
              return (
                <div style={{ marginTop: 16 }}>
                  <div className="fb-section-title" style={{ background: '#ecfdf5', borderColor: '#16a34a' }}>
                    <i className="bi bi-arrow-down-circle me-2" style={{ color: '#16a34a' }}></i>Money In
                  </div>
                  <table className="fb-table">
                    <tbody>
                      <tr><td style={{ fontWeight: 600 }}>Opening Balance</td><td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 600 }}>{formatCurrency(op)}</td></tr>
                      <tr><td style={{ fontWeight: 600 }}>Cash from Front Office</td><td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 600 }}>{formatCurrency(fo)}</td></tr>
                      <tr><td style={{ fontWeight: 600 }}>Cash from Bank</td><td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 600 }}>{formatCurrency(bk)}</td></tr>
                      <tr><td style={{ fontWeight: 600 }}>From GPay</td><td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 600 }}>{formatCurrency(gp)}</td></tr>
                      <tr style={{ background: '#ecfdf5' }}><td style={{ fontWeight: 700 }}>Total In</td><td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 700 }}>{formatCurrency(tIn)}</td></tr>
                      <tr style={{ background: '#fef2f2' }}><td style={{ fontWeight: 700 }}>Total Expenses</td><td style={{ textAlign: 'right', paddingRight: 12, fontWeight: 700, color: '#dc2626' }}>− {formatCurrency(exp)}</td></tr>
                    </tbody>
                  </table>
                  <div style={{ textAlign: 'center', padding: 20, background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 12, marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#666' }}>Closing Balance</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: cl >= 0 ? '#16a34a' : '#dc2626' }}>{formatCurrency(cl)}</div>
                  </div>
                  {viewingReport.notes && (
                    <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 8, fontSize: 12 }}>
                      <strong>Notes:</strong> {viewingReport.notes}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Signatures */}
        <div className="fb-signatures">
          <div className="fb-sig-box">
            <div className="fb-sig-line"></div>
            <div>HR Manager</div>
          </div>
          <div className="fb-sig-box">
            <div className="fb-sig-line"></div>
            <div>Verified By</div>
          </div>
        </div>
      </div>

      <style>{`
        .format-b-report { max-width: 900px; margin: 0 auto; font-family: 'Inter', sans-serif; font-size: 13px; color: #1a1a1a; }
        .fb-header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 20px; }
        .fb-hotel-name { font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 1px; }
        .fb-hotel-address { font-size: 12px; color: #555; margin-top: 2px; }
        .fb-report-title { font-size: 15px; font-weight: 700; margin-top: 14px; letter-spacing: 2px; background: #111; color: #fff; padding: 6px 16px; display: inline-block; }
        .fb-report-meta { margin-top: 10px; display: flex; justify-content: center; gap: 32px; font-size: 12px; color: #666; }
        .fb-section { margin-bottom: 24px; }
        .fb-section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 8px 12px; background: #f3f4f6; border-left: 4px solid #111; margin-bottom: 8px; }
        .fb-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .fb-table td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
        .fb-input { width: 100%; padding: 6px 10px; border: 1.5px solid #d1d5db; border-radius: 6px; font-size: 13px; text-align: right; font-family: 'Inter', sans-serif; }
        .fb-input:focus { outline: none; border-color: #2563eb; }
        .fb-closing { text-align: center; padding: 24px; background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; }
        .fb-closing-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 4px; }
        .fb-closing-amount { font-size: 32px; font-weight: 800; }
        .fb-closing-formula { font-size: 11px; color: #999; margin-top: 4px; }
        .fb-signatures { display: flex; justify-content: space-around; gap: 40px; margin-top: 48px; padding-top: 24px; }
        .fb-sig-box { text-align: center; flex: 1; max-width: 250px; font-size: 12px; color: #555; }
        .fb-sig-line { border-bottom: 1px solid #999; margin-bottom: 8px; height: 40px; }

        @media print {
          body * { visibility: hidden; }
          .format-b-report, .format-b-report * { visibility: visible; }
          .format-b-report { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .d-print-none { display: none !important; }
          .fb-input { border: none; background: none; font-weight: 600; }
          @page { margin: 15mm; size: A4; }
        }
      `}</style>
    </>
  );
}
