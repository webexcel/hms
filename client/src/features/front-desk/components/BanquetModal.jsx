import { Modal } from 'react-bootstrap';
import { formatCurrency } from '../../../utils/formatters';

export default function BanquetModal({
  showBanquetModal, setShowBanquetModal,
  banquetForm, setBanquetForm,
  adjustHallRate, setAdjustHallRate, newHallRate, setNewHallRate,
  hallRateReason, setHallRateReason, otherHallReason, setOtherHallReason,
  hallBaseRate, effectiveHallRate, decorationCost, banquetGst, banquetTotal,
}) {
  return (
    <Modal show={showBanquetModal} onHide={() => setShowBanquetModal(false)} centered size="lg">
      <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
          <h5 className="modal-title"><i className="bi bi-building me-2"></i>Book Banquet Hall - Grand Hall</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowBanquetModal(false)}></button>
        </div>
        <div className="modal-body" style={{ padding: 24 }}>
          <div className="row g-3">
            {/* Hall Info */}
            <div className="col-md-6">
              <div style={{ background: '#fef9c3', padding: '12px 16px', borderRadius: 10, border: '1px solid #fde047' }}>
                <small style={{ color: '#854d0e', display: 'block' }}>Hall</small>
                <strong style={{ color: '#854d0e' }}>Grand Hall</strong>
              </div>
            </div>
            <div className="col-md-6">
              <div style={{ background: '#fef9c3', padding: '12px 16px', borderRadius: 10, border: '1px solid #fde047' }}>
                <small style={{ color: '#854d0e', display: 'block' }}>Capacity</small>
                <strong style={{ color: '#854d0e' }}>200 Guests</strong>
              </div>
            </div>

            <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

            {/* Customer Details */}
            <div className="col-md-6">
              <label className="fd-form-label">Customer / Company Name *</label>
              <input type="text" className="fd-form-control" value={banquetForm.customer_name} onChange={e => setBanquetForm({ ...banquetForm, customer_name: e.target.value })} placeholder="Enter name" required />
            </div>
            <div className="col-md-6">
              <label className="fd-form-label">Contact Number *</label>
              <input type="tel" className="fd-form-control" value={banquetForm.contact_number} onChange={e => setBanquetForm({ ...banquetForm, contact_number: e.target.value })} placeholder="Enter phone number" required />
            </div>

            <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

            {/* Event Details */}
            <div className="col-md-6">
              <label className="fd-form-label">Event Date *</label>
              <input type="date" className="fd-form-control" value={banquetForm.event_date} onChange={e => setBanquetForm({ ...banquetForm, event_date: e.target.value })} required />
            </div>
            <div className="col-md-6">
              <label className="fd-form-label">Session *</label>
              <select className="fd-form-control" value={banquetForm.session} onChange={e => setBanquetForm({ ...banquetForm, session: e.target.value })} required>
                <option value="">Select session...</option>
                <option value="morning">Morning (9 AM - 1 PM) - Rs 15,000</option>
                <option value="afternoon">Afternoon (2 PM - 6 PM) - Rs 15,000</option>
                <option value="evening">Evening (7 PM - 11 PM) - Rs 20,000</option>
                <option value="fullday">Full Day (9 AM - 11 PM) - Rs 45,000</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="fd-form-label">Event Type *</label>
              <select className="fd-form-control" value={banquetForm.event_type} onChange={e => setBanquetForm({ ...banquetForm, event_type: e.target.value })} required>
                <option value="">Select event type...</option>
                <option value="wedding">Wedding / Reception</option>
                <option value="corporate">Corporate Event</option>
                <option value="birthday">Birthday Party</option>
                <option value="conference">Conference / Seminar</option>
                <option value="engagement">Engagement</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="fd-form-label">Expected Guests *</label>
              <input type="number" className="fd-form-control" value={banquetForm.expected_guests} onChange={e => setBanquetForm({ ...banquetForm, expected_guests: e.target.value })} min="1" max="200" placeholder="Enter number" required />
            </div>

            {/* Additional Options */}
            <div className="col-md-6">
              <label className="fd-form-label">Catering Required</label>
              <select className="fd-form-control" value={banquetForm.catering} onChange={e => setBanquetForm({ ...banquetForm, catering: e.target.value })}>
                <option value="no">No</option>
                <option value="yes">Yes (Charges Extra)</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="fd-form-label">Decoration Required</label>
              <select className="fd-form-control" value={banquetForm.decoration} onChange={e => setBanquetForm({ ...banquetForm, decoration: e.target.value })}>
                <option value="no">No</option>
                <option value="basic">Basic (Rs 5,000)</option>
                <option value="premium">Premium (Rs 15,000)</option>
              </select>
            </div>

            <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

            {/* Adjust Hall Rate Section */}
            <div className="col-12">
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 16 }}>
                <div className="form-check form-switch mb-3">
                  <input className="form-check-input" type="checkbox" id="adjustHallRateToggle" checked={adjustHallRate} onChange={e => { setAdjustHallRate(e.target.checked); if (!e.target.checked) setNewHallRate(''); }} />
                  <label className="form-check-label fw-semibold" htmlFor="adjustHallRateToggle" style={{ color: '#6b21a8' }}>
                    <i className="bi bi-pencil-square me-1"></i> Adjust Hall Rate
                  </label>
                </div>

                {adjustHallRate && (
                  <>
                    <div className="row g-2 mb-3">
                      <div className="col-md-4">
                        <label style={{ fontSize: 12, color: '#6b21a8', display: 'block', marginBottom: 4 }}>Standard Rate</label>
                        <div style={{ textDecoration: newHallRate ? 'line-through' : 'none', color: '#9ca3af', fontSize: 16, fontWeight: 600 }}>
                          {formatCurrency(hallBaseRate)}
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label style={{ fontSize: 12, color: '#6b21a8', display: 'block', marginBottom: 4 }}>New Hall Rate</label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text" style={{ borderRadius: '8px 0 0 8px' }}>Rs</span>
                          <input type="number" className="form-control" value={newHallRate} onChange={e => setNewHallRate(e.target.value)} min="0" style={{ borderRadius: '0 8px 8px 0' }} />
                        </div>
                      </div>
                      <div className="col-md-4 d-flex align-items-end">
                        <button className="btn btn-sm w-100" style={{ background: '#7c3aed', color: '#fff', borderRadius: 8 }}>
                          Apply Rate
                        </button>
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <label style={{ fontSize: 12, color: '#6b21a8', display: 'block', marginBottom: 4 }}>Reason for Rate Change *</label>
                        <select className="form-select form-select-sm" value={hallRateReason} onChange={e => setHallRateReason(e.target.value)} style={{ borderRadius: 8 }}>
                          <option value="">Select reason...</option>
                          <option>Customer Negotiation</option>
                          <option>Corporate Rate</option>
                          <option>Repeat Customer</option>
                          <option>Off-Season Discount</option>
                          <option>Bulk Booking Discount</option>
                          <option>Referral Discount</option>
                          <option>Other</option>
                        </select>
                      </div>
                      {hallRateReason === 'Other' && (
                        <div className="col-md-6">
                          <label style={{ fontSize: 12, color: '#6b21a8', display: 'block', marginBottom: 4 }}>Specify Reason</label>
                          <input type="text" className="form-control form-control-sm" value={otherHallReason} onChange={e => setOtherHallReason(e.target.value)} placeholder="Enter reason" style={{ borderRadius: 8 }} />
                        </div>
                      )}
                    </div>

                    {newHallRate && (
                      <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ color: '#6b21a8' }}>Original Hall Rate:</span>
                          <span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>{formatCurrency(hallBaseRate)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ color: '#6b21a8' }}>Adjusted Rate:</span>
                          <span style={{ color: '#6b21a8', fontWeight: 600 }}>{formatCurrency(Number(newHallRate))}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                          <span>Discount Given:</span>
                          <span>{formatCurrency(hallBaseRate - Number(newHallRate))}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

            {/* Pricing Summary */}
            <div className="col-12">
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16 }}>
                <h6 style={{ color: '#166534', marginBottom: 12, fontWeight: 600 }}><i className="bi bi-calculator me-2"></i>Booking Summary</h6>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                  <span style={{ color: '#166534' }}>Hall Charges:</span>
                  <span style={{ color: '#166534' }}>{formatCurrency(effectiveHallRate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                  <span style={{ color: '#166534' }}>Decoration:</span>
                  <span style={{ color: '#166534' }}>{formatCurrency(decorationCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                  <span style={{ color: '#166534' }}>GST (18%):</span>
                  <span style={{ color: '#166534' }}>{formatCurrency(banquetGst)}</span>
                </div>
                <hr style={{ borderColor: '#bbf7d0', margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                  <span style={{ color: '#166534' }}>Total Amount:</span>
                  <span style={{ color: '#166534' }}>{formatCurrency(banquetTotal)}</span>
                </div>
              </div>
            </div>

            {/* Advance Payment */}
            <div className="col-12">
              <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #93c5fd', borderRadius: 12, padding: 16 }}>
                <h6 style={{ color: '#1e40af', marginBottom: 12, fontWeight: 600 }}><i className="bi bi-cash-stack me-2"></i>Advance Payment</h6>
                <div className="row g-2">
                  <div className="col-md-4">
                    <label style={{ fontSize: 12, color: '#1e40af', display: 'block', marginBottom: 4 }}>Advance Amount *</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text" style={{ borderRadius: '8px 0 0 8px' }}>Rs</span>
                      <input type="number" className="form-control" value={banquetForm.advance_amount} onChange={e => setBanquetForm({ ...banquetForm, advance_amount: e.target.value })} min="0" style={{ borderRadius: '0 8px 8px 0' }} />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label style={{ fontSize: 12, color: '#1e40af', display: 'block', marginBottom: 4 }}>Payment Mode *</label>
                    <select className="form-select form-select-sm" value={banquetForm.payment_mode} onChange={e => setBanquetForm({ ...banquetForm, payment_mode: e.target.value })} style={{ borderRadius: 8 }}>
                      <option value="">Select...</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label style={{ fontSize: 12, color: '#1e40af', display: 'block', marginBottom: 4 }}>Reference No.</label>
                    <input type="text" className="form-control form-control-sm" value={banquetForm.payment_ref} onChange={e => setBanquetForm({ ...banquetForm, payment_ref: e.target.value })} placeholder="Transaction ID" style={{ borderRadius: 8 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            <div className="col-12">
              <label className="fd-form-label">Special Requests / Notes</label>
              <textarea className="fd-form-control" rows="2" value={banquetForm.special_requests} onChange={e => setBanquetForm({ ...banquetForm, special_requests: e.target.value })} placeholder="Any special arrangements..."></textarea>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
          <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 10 }} onClick={() => setShowBanquetModal(false)}>Cancel</button>
          <button type="button" className="btn" style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#fff', borderRadius: 10, padding: '10px 24px' }}>
            <i className="bi bi-check-lg me-1"></i> Confirm Booking
          </button>
        </div>
      </div>
    </Modal>
  );
}
