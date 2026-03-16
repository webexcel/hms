export default function InvoiceHeader({ hotel, copyType }) {
  return (
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
  );
}
