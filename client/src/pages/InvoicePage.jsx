import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate, formatDateTime, capitalize } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';

const printStyles = `
@media print {
  .no-print { display: none !important; }
  body {
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .invoice-container {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 15px !important;
  }
  .sidebar, .navbar, .header, nav, footer,
  .app-sidebar, .app-header { display: none !important; }
  .page-break { page-break-before: always; }
}

.invoice-container {
  max-width: 900px;
  margin: 20px auto;
  background: white;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  border-radius: 8px;
}
.invoice-header {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 25px;
  border-radius: 8px 8px 0 0;
}
.invoice-body { padding: 25px; }
.info-section {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 20px;
}
.info-header {
  background: #f8f9fa;
  padding: 10px 15px;
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
  font-size: 13px;
  color: #2c3e50;
}
.info-body { padding: 15px; }
.info-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
}
.info-label {
  font-weight: 500;
  color: #6c757d;
  width: 140px;
  flex-shrink: 0;
}
.info-value { color: #2c3e50; }
.gstin-highlight {
  background: #fff3cd;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-family: monospace;
}
.hsn-code {
  font-family: monospace;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}
.invoice-table { font-size: 13px; }
.invoice-table thead {
  background: #2c3e50;
  color: white;
}
.invoice-table thead th {
  font-weight: 500;
  padding: 12px 10px;
  border: none;
  font-size: 12px;
}
.invoice-table tbody td {
  padding: 12px 10px;
  vertical-align: middle;
  border-color: #e9ecef;
}
.invoice-table tfoot { background: #f8f9fa; }
.invoice-table tfoot td { padding: 10px; border-color: #dee2e6; }
.tax-summary-table { font-size: 12px; }
.tax-summary-table th {
  background: #34495e;
  color: white;
  font-weight: 500;
  padding: 8px;
}
.tax-summary-table td { padding: 8px; }
.total-section {
  background: #2c3e50;
  color: white;
  padding: 15px 20px;
  border-radius: 6px;
}
.grand-total { font-size: 24px; font-weight: 700; }
.amount-words {
  background: #f8f9fa;
  padding: 12px 15px;
  border-radius: 6px;
  border-left: 4px solid #3498db;
  font-style: italic;
}
.qr-section {
  text-align: center;
  padding: 15px;
  border: 1px dashed #dee2e6;
  border-radius: 6px;
}
.qr-placeholder {
  width: 100px;
  height: 100px;
  background: #e9ecef;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.signature-box {
  border-top: 1px solid #2c3e50;
  padding-top: 10px;
  margin-top: 60px;
  text-align: center;
}
.terms-section {
  font-size: 11px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}
.terms-section ol { margin-bottom: 0; padding-left: 20px; }
.invoice-footer {
  background: #2c3e50;
  color: white;
  padding: 15px 25px;
  border-radius: 0 0 8px 8px;
  font-size: 12px;
}
.copy-type {
  display: inline-block;
  padding: 3px 10px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 11px;
  cursor: pointer;
}
.copy-type.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}
.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 80px;
  font-weight: 700;
  pointer-events: none;
  z-index: 0;
}
.watermark.paid { color: rgba(39, 174, 96, 0.1); }
.watermark.unpaid { color: rgba(231, 76, 60, 0.1); }
`;

export default function InvoicePage() {
  const { id, groupId } = useParams();
  const navigate = useNavigate();
  const api = useApi();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copyType, setCopyType] = useState('ORIGINAL FOR RECIPIENT');
  const isGroup = !!groupId;

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const url = isGroup ? `/billing/group/${groupId}/invoice` : `/billing/${id}/invoice`;
        const response = await api.get(url);
        setInvoice(response.data);
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (!invoice) {
    return (
      <div className="text-center py-5">
        <h4>Invoice not found</h4>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const items = invoice.items || [];
  const hotel = invoice.hotel || {};
  const guest = invoice.guest || {};
  const reservation = invoice.reservation || {};
  const taxBreakup = invoice.tax_breakup || [];
  const payments = invoice.payments || [];
  const isPaid = invoice.payment_status === 'paid';

  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleGroupPayment = async () => {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return;
    try {
      setPaymentLoading(true);
      await api.post(`/billing/group/${groupId}/payments`, {
        amount: amt,
        payment_method: paymentMethod,
        reference_number: paymentRef || undefined,
      });
      setShowPayment(false);
      setPaymentAmount('');
      setPaymentRef('');
      // Refresh invoice data
      const response = await api.get(`/billing/group/${groupId}/invoice`);
      setInvoice(response.data);
    } catch (err) {
      // error is handled by useApi toast
    } finally {
      setPaymentLoading(false);
    }
  };

  const copyTypes = [
    { label: 'Original for Recipient', value: 'ORIGINAL FOR RECIPIENT' },
    { label: 'Duplicate for Transporter', value: 'DUPLICATE FOR TRANSPORTER' },
    { label: 'Triplicate for Supplier', value: 'TRIPLICATE FOR SUPPLIER' },
  ];

  return (
    <>
      <style>{printStyles}</style>

      {/* Print Controls */}
      <div className="no-print" style={{ background: '#2c3e50', padding: '12px 0', marginBottom: 0 }}>
        <div className="d-flex justify-content-between align-items-center" style={{ maxWidth: 900, margin: '0 auto', padding: '0 15px' }}>
          <button className="btn btn-outline-light btn-sm" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left me-1"></i> Back to Billing
          </button>
          <div>
            {isGroup && !isPaid && (
              <button className="btn btn-warning btn-sm me-2" onClick={() => setShowPayment(!showPayment)}>
                <i className="bi bi-credit-card me-1"></i> Record Payment
              </button>
            )}
            <button className="btn btn-light btn-sm me-2" onClick={() => window.print()}>
              <i className="bi bi-printer me-1"></i> Print Invoice
            </button>
            {!isGroup && (
              <a
                href={`/api/v1/billing/${id}/invoice/pdf`}
                className="btn btn-success btn-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="bi bi-download me-1"></i> Download PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Group Payment Form */}
      {isGroup && showPayment && !isPaid && (
        <div className="no-print" style={{ maxWidth: 900, margin: '0 auto', padding: '15px', background: '#fffbeb', borderBottom: '2px solid #f59e0b' }}>
          <h6 style={{ color: '#92400e', marginBottom: 12 }}><i className="bi bi-credit-card me-2"></i>Record Group Payment</h6>
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label style={{ fontSize: 12, fontWeight: 600 }}>Amount *</label>
              <input type="number" className="form-control form-control-sm" placeholder={`Balance: ${formatCurrency(invoice.balance_due || 0)}`}
                value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label style={{ fontSize: 12, fontWeight: 600 }}>Method</label>
              <select className="form-select form-select-sm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="col-md-3">
              <label style={{ fontSize: 12, fontWeight: 600 }}>Reference #</label>
              <input type="text" className="form-control form-control-sm" placeholder="Optional" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-warning btn-sm w-100" disabled={paymentLoading || !paymentAmount} onClick={handleGroupPayment}>
                {paymentLoading ? 'Processing...' : 'Pay'}
              </button>
            </div>
            <div className="col-md-2">
              <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => setShowPayment(false)}>Cancel</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#92400e', marginTop: 6 }}>
            Payment will be distributed across all room billings in this group. Total balance: {formatCurrency(invoice.balance_due || 0)}
          </div>
        </div>
      )}

      {/* Invoice Document */}
      <div className="invoice-container position-relative">
        {/* Watermark */}
        <div className={`watermark ${isPaid ? 'paid' : 'unpaid'}`}>
          {isPaid ? 'PAID' : 'UNPAID'}
        </div>

        {/* Invoice Header */}
        <div className="invoice-header">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-building me-2" style={{ fontSize: 32 }}></i>
                <div>
                  <h1 className="mb-0" style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>
                    {(hotel.trade_name || 'UDHAYAM INTERNATIONAL').toUpperCase()}
                  </h1>
                  <small className="opacity-75">Luxury Accommodation & Services</small>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <span style={{
                background: '#e74c3c', color: 'white', padding: '5px 15px',
                borderRadius: 4, fontSize: 12, fontWeight: 600, letterSpacing: 1
              }}>TAX INVOICE</span>
              <div className="mt-2">
                <span style={{
                  background: '#27ae60', color: 'white', padding: '3px 10px',
                  borderRadius: 4, fontSize: 11, fontWeight: 500
                }}>{copyType}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="invoice-body">
          {/* Supplier & Recipient Details */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="info-section h-100">
                <div className="info-header">
                  <i className="bi bi-building me-2"></i>Supplier Details
                </div>
                <div className="info-body">
                  <div className="info-row">
                    <span className="info-label">Legal Name:</span>
                    <span className="info-value"><strong>{hotel.legal_name}</strong></span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Trade Name:</span>
                    <span className="info-value">{hotel.trade_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">GSTIN:</span>
                    <span className="info-value"><span className="gstin-highlight">{hotel.gstin}</span></span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Address:</span>
                    <span className="info-value">{hotel.address}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">City/State:</span>
                    <span className="info-value">{hotel.city}, {hotel.state} - {hotel.pincode}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">State Code:</span>
                    <span className="info-value">{hotel.state_code}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">PAN:</span>
                    <span className="info-value">{hotel.pan}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Contact:</span>
                    <span className="info-value">{hotel.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="info-section h-100">
                <div className="info-header">
                  <i className="bi bi-person me-2"></i>Recipient Details
                </div>
                <div className="info-body">
                  <div className="info-row">
                    <span className="info-label">Guest Name:</span>
                    <span className="info-value"><strong>{guest.name || '-'}</strong></span>
                  </div>
                  {guest.company && (
                    <div className="info-row">
                      <span className="info-label">Company:</span>
                      <span className="info-value">{guest.company}</span>
                    </div>
                  )}
                  {guest.gstin && (
                    <div className="info-row">
                      <span className="info-label">GSTIN:</span>
                      <span className="info-value"><span className="gstin-highlight">{guest.gstin}</span></span>
                    </div>
                  )}
                  {guest.address && (
                    <div className="info-row">
                      <span className="info-label">Address:</span>
                      <span className="info-value">{guest.address}</span>
                    </div>
                  )}
                  {(guest.city || guest.state) && (
                    <div className="info-row">
                      <span className="info-label">City/State:</span>
                      <span className="info-value">{[guest.city, guest.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="info-row">
                      <span className="info-label">Mobile:</span>
                      <span className="info-value">{guest.phone}</span>
                    </div>
                  )}
                  {guest.email && (
                    <div className="info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{guest.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details & Stay Details */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="info-section">
                <div className="info-header">
                  <i className="bi bi-file-text me-2"></i>Invoice Details
                </div>
                <div className="info-body">
                  <div className="row">
                    <div className="col-6">
                      <div className="info-row flex-column">
                        <span className="info-label">Invoice Number</span>
                        <span className="info-value"><strong>{invoice.invoice_number}</strong></span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-row flex-column">
                        <span className="info-label">Invoice Date</span>
                        <span className="info-value"><strong>{formatDate(invoice.invoice_date)}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="info-section">
                <div className="info-header">
                  <i className="bi bi-door-open me-2"></i>Stay Details
                  {reservation.total_rooms > 1 && (
                    <span style={{ float: 'right', background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                      Group: {reservation.total_rooms} Rooms
                    </span>
                  )}
                </div>
                <div className="info-body">
                  <div className="row">
                    <div className="col-6">
                      <div className="info-row flex-column">
                        <span className="info-label">{reservation.rooms ? 'Rooms' : 'Room Number'}</span>
                        <span className="info-value">
                          {reservation.rooms ? (
                            reservation.rooms.map((rm, i) => (
                              <div key={i}><strong>{rm.room_number}</strong> — {capitalize(rm.room_type || '')} ({formatCurrency(rm.rate)}/night)</div>
                            ))
                          ) : (
                            <strong>{reservation.room_number || '-'}{reservation.room_type ? ` - ${capitalize(reservation.room_type)}` : ''}</strong>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-row flex-column">
                        <span className="info-label">Reservation #</span>
                        <span className="info-value"><strong>{reservation.reservation_number || '-'}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-2">
                    <div className="col-6">
                      <div className="info-row flex-column">
                        <span className="info-label">Check-in</span>
                        <span className="info-value">{formatDate(reservation.check_in)}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="info-row flex-column">
                        <span className="info-label">Check-out</span>
                        <span className="info-value">{formatDate(reservation.check_out)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="table-responsive mb-4">
            <table className="table table-bordered invoice-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>S.No</th>
                  <th>Description of Services</th>
                  <th style={{ width: 80 }}>SAC Code</th>
                  <th style={{ width: 60 }}>Qty</th>
                  <th style={{ width: 90 }} className="text-end">Rate</th>
                  <th style={{ width: 100 }} className="text-end">Amount</th>
                  <th style={{ width: 80 }} className="text-center">Tax Rate</th>
                  <th style={{ width: 100 }} className="text-end">Tax Amt</th>
                  <th style={{ width: 110 }} className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-muted">No items</td></tr>
                ) : items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="text-center">{idx + 1}</td>
                    <td>
                      <strong>{item.description}</strong>
                      {item.item_type && (
                        <><br /><small className="text-muted">{capitalize(item.item_type)}</small></>
                      )}
                    </td>
                    <td className="text-center"><span className="hsn-code">{item.hsn_code || '-'}</span></td>
                    <td className="text-center">{item.quantity || 1}</td>
                    <td className="text-end">{formatCurrency(item.rate)}</td>
                    <td className="text-end">{formatCurrency(item.amount)}</td>
                    <td className="text-center">{item.gst_rate}%</td>
                    <td className="text-end">{formatCurrency(item.total_gst)}</td>
                    <td className="text-end"><strong>{formatCurrency(item.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={5} className="text-end"><strong>Sub Total:</strong></td>
                    <td className="text-end"><strong>{formatCurrency(invoice.subtotal)}</strong></td>
                    <td colSpan={2} className="text-end"><strong>Total Tax:</strong></td>
                    <td className="text-end"><strong>{formatCurrency(invoice.total_gst)}</strong></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Tax Breakup & Totals */}
          <div className="row mb-4">
            <div className="col-md-7">
              {taxBreakup.length > 0 && (
                <div className="info-section">
                  <div className="info-header">
                    <i className="bi bi-percent me-2"></i>Tax Breakup Summary (CGST + SGST)
                  </div>
                  <div className="info-body p-0">
                    <table className="table table-bordered tax-summary-table mb-0">
                      <thead>
                        <tr>
                          <th>Tax Rate</th>
                          <th>Taxable Amount</th>
                          <th>CGST</th>
                          <th>SGST</th>
                          <th>Total Tax</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxBreakup.map((tb, idx) => (
                          <tr key={idx}>
                            <td className="text-center">{tb.rate}%</td>
                            <td className="text-end">{formatCurrency(tb.taxable_amount)}</td>
                            <td className="text-end">{formatCurrency(tb.cgst)}</td>
                            <td className="text-end">{formatCurrency(tb.sgst)}</td>
                            <td className="text-end">{formatCurrency(tb.total_tax)}</td>
                          </tr>
                        ))}
                        <tr className="fw-bold" style={{ background: '#e9ecef' }}>
                          <td className="text-center">Total</td>
                          <td className="text-end">{formatCurrency(invoice.subtotal)}</td>
                          <td className="text-end">{formatCurrency(invoice.cgst)}</td>
                          <td className="text-end">{formatCurrency(invoice.sgst)}</td>
                          <td className="text-end">{formatCurrency(invoice.total_gst)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="col-md-5">
              {/* Grand Total */}
              <div className="total-section">
                <div className="d-flex justify-content-between mb-2">
                  <span>Sub Total:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>CGST:</span>
                  <span>{formatCurrency(invoice.cgst)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                  <span>SGST:</span>
                  <span>{formatCurrency(invoice.sgst)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fs-5">Grand Total:</span>
                  <span className="grand-total">{formatCurrency(invoice.grand_total)}</span>
                </div>
              </div>

              {/* Payment Details */}
              {payments.length > 0 && (
                <div className="info-section mt-3">
                  <div className="info-header">
                    <i className="bi bi-credit-card me-2"></i>Payment Details
                  </div>
                  <div className="info-body">
                    {payments.map((p, idx) => (
                      <div key={idx} className={idx > 0 ? 'border-top pt-2 mt-2' : ''}>
                        <div className="info-row">
                          <span className="info-label">Payment Mode:</span>
                          <span className="info-value">{capitalize(p.method || '')}</span>
                        </div>
                        {p.reference && (
                          <div className="info-row">
                            <span className="info-label">Transaction ID:</span>
                            <span className="info-value" style={{ fontFamily: 'monospace' }}>{p.reference}</span>
                          </div>
                        )}
                        <div className="info-row">
                          <span className="info-label">Date:</span>
                          <span className="info-value">{formatDate(p.date)}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Amount:</span>
                          <span className="info-value fw-bold">{formatCurrency(p.amount)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="border-top pt-2 mt-2">
                      <div className="info-row">
                        <span className="info-label">Status:</span>
                        <span className={`badge bg-${isPaid ? 'success' : invoice.payment_status === 'partial' ? 'warning' : 'danger'}`}>
                          {(invoice.payment_status || 'unpaid').toUpperCase()}
                        </span>
                      </div>
                      {invoice.balance_due > 0 && (
                        <div className="info-row">
                          <span className="info-label">Balance Due:</span>
                          <span className="info-value text-danger fw-bold">{formatCurrency(invoice.balance_due)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amount in Words */}
          {invoice.amount_in_words && (
            <div className="amount-words mb-4">
              <strong>Amount in Words:</strong> {invoice.amount_in_words}
            </div>
          )}

          {/* QR Code, Bank Details, Signature */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="qr-section">
                <div className="qr-placeholder">
                  <i className="bi bi-qr-code" style={{ fontSize: 40, color: '#adb5bd' }}></i>
                </div>
                <small className="text-muted d-block">Scan for e-Invoice verification</small>
                <small className="text-muted">IRN QR Code</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="info-section h-100">
                <div className="info-header">
                  <i className="bi bi-bank me-2"></i>Bank Details
                </div>
                <div className="info-body" style={{ fontSize: 12 }}>
                  <div className="info-row">
                    <span className="info-label">Bank Name:</span>
                    <span className="info-value">{hotel.bank_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Account No:</span>
                    <span className="info-value">{hotel.bank_account}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">IFSC Code:</span>
                    <span className="info-value">{hotel.bank_ifsc}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Branch:</span>
                    <span className="info-value">{hotel.bank_branch}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="text-center">
                <div className="signature-box">
                  <small className="text-muted d-block">For {hotel.legal_name}</small>
                  <strong>Authorized Signatory</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="terms-section">
            <strong className="d-block mb-2">Terms & Conditions:</strong>
            <ol>
              <li>This is a computer-generated invoice and does not require a physical signature.</li>
              <li>All disputes are subject to the jurisdiction of Chennai courts only.</li>
              <li>Please verify the GSTIN and other details before claiming Input Tax Credit (ITC).</li>
              <li>E&OE - Errors and Omissions Excepted.</li>
              <li>This invoice is valid subject to realization of payment.</li>
              <li>GST Registration is valid as on the date of invoice.</li>
            </ol>
          </div>

          {/* Copy Type Selection */}
          <div className="text-center mt-4 no-print">
            {copyTypes.map((ct) => (
              <span
                key={ct.value}
                className={`copy-type ${copyType === ct.value ? 'active' : ''}`}
                onClick={() => setCopyType(ct.value)}
              >
                {ct.label}
              </span>
            ))}
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="invoice-footer text-center">
          <div className="row">
            <div className="col-md-4">
              <i className="bi bi-telephone me-1"></i> {hotel.phone}
            </div>
            <div className="col-md-4">
              <i className="bi bi-envelope me-1"></i> {hotel.email}
            </div>
            <div className="col-md-4">
              <i className="bi bi-globe me-1"></i> {hotel.website}
            </div>
          </div>
          <div className="mt-2 opacity-75" style={{ fontSize: 10 }}>
            Thank you for staying with us! We look forward to serving you again.
          </div>
        </div>
      </div>
    </>
  );
}
