import { COPY_TYPES } from '../hooks/useInvoice';

export default function InvoiceFooterSection({ invoice, hotel, copyType, setCopyType }) {
  return (
    <>
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
        {COPY_TYPES.map((ct) => (
          <span
            key={ct.value}
            className={`copy-type ${copyType === ct.value ? 'active' : ''}`}
            onClick={() => setCopyType(ct.value)}
          >
            {ct.label}
          </span>
        ))}
      </div>

    </>
  );
}

export function InvoiceContactFooter({ hotel }) {
  return (
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
  );
}
