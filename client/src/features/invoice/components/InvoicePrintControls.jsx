import { formatCurrency } from '../../../utils/formatters';

export default function InvoicePrintControls({
  isGroup,
  isPaid,
  id,
  showPayment,
  togglePayment,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  paymentRef,
  setPaymentRef,
  paymentLoading,
  handleGroupPayment,
  setShowPayment,
  balanceDue,
  handlePrint,
  handleGoBack,
}) {
  return (
    <>
      {/* Print Controls */}
      <div className="no-print" style={{ background: '#2c3e50', padding: '12px 0', marginBottom: 0 }}>
        <div className="d-flex justify-content-between align-items-center" style={{ maxWidth: 900, margin: '0 auto', padding: '0 15px' }}>
          <button className="btn btn-outline-light btn-sm" onClick={handleGoBack}>
            <i className="bi bi-arrow-left me-1"></i> Back to Billing
          </button>
          <div>
            {isGroup && !isPaid && (
              <button className="btn btn-warning btn-sm me-2" onClick={togglePayment}>
                <i className="bi bi-credit-card me-1"></i> Record Payment
              </button>
            )}
            <button className="btn btn-light btn-sm me-2" onClick={handlePrint}>
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
              <input type="number" className="form-control form-control-sm" placeholder={`Balance: ${formatCurrency(balanceDue)}`}
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
            Payment will be distributed across all room billings in this group. Total balance: {formatCurrency(balanceDue)}
          </div>
        </div>
      )}
    </>
  );
}
