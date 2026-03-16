import { formatDate, formatCurrency, capitalize } from '../../../utils/formatters';

export default function InvoiceStayDetails({ invoice, reservation }) {
  return (
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
  );
}
