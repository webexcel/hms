export default function SupplierRecipientDetails({ hotel, guest }) {
  return (
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
  );
}
