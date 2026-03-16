import { formatCurrency, formatDate, capitalize } from '../../../utils/formatters';

export default function TaxBreakupTotals({ invoice, taxBreakup, payments, isPaid }) {
  return (
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
  );
}
