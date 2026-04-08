import { Modal } from 'react-bootstrap';
import { formatDate, formatCurrency, capitalize } from '../../../utils/formatters';
import { gstInclusiveRate } from '../hooks/useFrontDesk';
import toast from 'react-hot-toast';

export default function CheckInModal({
  showCheckInModal, setShowCheckInModal, checkInData, selectedRoom,
  guest, room, originalRate, effectiveRate, totalNights, totalAmount, advancePaid, balanceDue,
  appliedRate, adjustRate, setAdjustRate, newRate, setNewRate, rateReason, setRateReason,
  otherRateReason, setOtherRateReason, setAppliedRate, handleApplyRate,
  idType, setIdType, idNumber, setIdNumber,
  depositAmount, setDepositAmount, paymentMode, setPaymentMode, paymentRef, setPaymentRef,
  handleCheckIn, handleGroupCheckIn,
  setCancelData, setRefundMethod, setRefundRef, setRefundPreview,
  setUseOverrideRefund, setOverrideRefundAmount, setShowCancelModal, get,
}) {
  return (
    <Modal show={showCheckInModal} onHide={() => setShowCheckInModal(false)} centered size="lg">
      <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
          <h5 className="modal-title"><i className="bi bi-box-arrow-in-right me-2"></i>Guest Check-In</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowCheckInModal(false)}></button>
        </div>
        <div className="modal-body" style={{ padding: 24 }}>
          <div className="row g-3">
            {/* Group Banner */}
            {checkInData?.group_id && (
              <div className="col-12">
                <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #f59e0b', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                    <i className="bi bi-people-fill me-2"></i>Group Booking: {checkInData.group_id}
                  </span>
                  <button className="btn btn-sm" style={{ background: '#f59e0b', color: '#fff', fontWeight: 700, borderRadius: 6, fontSize: 12 }}
                    onClick={() => handleGroupCheckIn(checkInData.group_id)}>
                    <i className="bi bi-check-all me-1"></i>Check In All Group Rooms
                  </button>
                </div>
              </div>
            )}
            {/* Meal Plan Badge */}
            {checkInData?.meal_plan && checkInData.meal_plan !== 'none' && (
              <div className="col-12">
                <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-cup-hot-fill" style={{ color: '#f59e0b' }}></i>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                    Meal Plan: {checkInData.meal_plan === 'both' ? 'Breakfast + Dinner' : checkInData.meal_plan === 'breakfast' ? 'Breakfast Only' : 'Dinner Only'}
                  </span>
                </div>
              </div>
            )}
            {/* Booking Info */}
            <div className="col-md-6">
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                <small style={{ color: '#64748b', display: 'block' }}>Booking ID</small>
                <strong style={{ color: '#1a1a2e' }}>#{checkInData?.reservation_number || 'N/A'}</strong>
              </div>
            </div>
            <div className="col-md-6">
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                <small style={{ color: '#64748b', display: 'block' }}>Room Assigned</small>
                <strong style={{ color: '#1a1a2e' }}>{room.room_number} - {capitalize(room.room_type)}</strong>
              </div>
            </div>
            <div className="col-md-6">
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                <small style={{ color: '#64748b', display: 'block' }}>Check-in Date</small>
                <strong style={{ color: '#1a1a2e' }}>{formatDate(checkInData?.check_in_date)}</strong>
              </div>
            </div>
            <div className="col-md-6">
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                <small style={{ color: '#64748b', display: 'block' }}>Check-out Date</small>
                <strong style={{ color: '#1a1a2e' }}>{formatDate(checkInData?.check_out_date)}</strong>
              </div>
            </div>

            <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

            {/* Guest Details */}
            <div className="col-md-6">
              <label className="fd-form-label">Full Name *</label>
              <input type="text" className="fd-form-control" defaultValue={`${guest.first_name || ''} ${guest.last_name || ''}`} readOnly />
            </div>
            <div className="col-md-6">
              <label className="fd-form-label">Phone Number *</label>
              <input type="tel" className="fd-form-control" defaultValue={guest.phone || ''} readOnly />
            </div>
            <div className="col-md-6">
              <label className="fd-form-label">ID Type *</label>
              <select className="fd-form-control" value={idType} onChange={e => setIdType(e.target.value)}>
                <option value="aadhaar">Aadhaar Card</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="voter_id">Voter ID</option>
                <option value="pan">PAN Card</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="fd-form-label">ID Number *</label>
              <input type="text" className="fd-form-control" placeholder="Enter ID number" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
            </div>

            <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

            {/* Room Rate Adjustment Section */}
            <div className="col-12">
              <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #fbbf24', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-currency-rupee"></i> Adjust Room Rate
                  </label>
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="enableRateAdjust" style={{ width: 40, height: 20 }} checked={adjustRate} onChange={e => { setAdjustRate(e.target.checked); if (!e.target.checked) { setAppliedRate(null); setNewRate(''); } }} />
                  </div>
                </div>

                {adjustRate && (
                  <>
                    <div className="row g-2 align-items-end">
                      <div className="col-md-4">
                        <label style={{ fontSize: 12, color: '#92400e', display: 'block', marginBottom: 4 }}>Standard Rate</label>
                        <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, fontWeight: 600, color: '#64748b', textDecoration: 'line-through' }}>
                          {formatCurrency(gstInclusiveRate(originalRate))}/night
                        </div>
                      </div>
                      <div className="col-md-4">
                        <label style={{ fontSize: 12, color: '#92400e', display: 'block', marginBottom: 4 }}>New Rate/Night *</label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text" style={{ borderRadius: '8px 0 0 8px' }}>Rs</span>
                          <input type="number" className="form-control" value={newRate} onChange={e => setNewRate(e.target.value)} min="0" style={{ borderRadius: '0 8px 8px 0' }} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <button type="button" className="btn btn-sm w-100" style={{ background: '#d97706', color: '#fff', borderRadius: 8, padding: 8 }} onClick={handleApplyRate}>
                          <i className="bi bi-check-lg me-1"></i>Apply Rate
                        </button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <label style={{ fontSize: 12, color: '#92400e', display: 'block', marginBottom: 4 }}>Reason for Rate Change *</label>
                      <select className="form-select form-select-sm" value={rateReason} onChange={e => setRateReason(e.target.value)} style={{ borderRadius: 8 }}>
                        <option value="">Select reason...</option>
                        <option value="walkin">Walk-in Negotiation</option>
                        <option value="corporate">Corporate Rate</option>
                        <option value="loyalty">Loyalty/Repeat Guest</option>
                        <option value="longstay">Long Stay Discount</option>
                        <option value="offseason">Off-Season Rate</option>
                        <option value="upgrade">Complimentary Upgrade</option>
                        <option value="complaint">Service Recovery</option>
                        <option value="other">Other (specify below)</option>
                      </select>
                    </div>
                    {rateReason === 'other' && (
                      <div className="mt-2">
                        <input type="text" className="form-control form-control-sm" value={otherRateReason} onChange={e => setOtherRateReason(e.target.value)} placeholder="Specify reason..." style={{ borderRadius: 8 }} />
                      </div>
                    )}

                    <div style={{ marginTop: 12, padding: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: '#92400e' }}>Original Total ({totalNights} nights):</span>
                        <span style={{ color: '#64748b', textDecoration: 'line-through' }}>{formatCurrency(gstInclusiveRate(originalRate) * totalNights)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
                        <span style={{ color: '#92400e' }}>New Total (incl. GST):</span>
                        <span style={{ color: '#d97706' }}>{formatCurrency(gstInclusiveRate(appliedRate != null ? appliedRate : originalRate) * totalNights)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                        <span style={{ color: '#92400e' }}>You Save Guest:</span>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(appliedRate != null ? gstInclusiveRate(originalRate - appliedRate) * totalNights : 0)}</span>
                      </div>
                    </div>
                    <small style={{ color: '#92400e', fontSize: 11, marginTop: 8, display: 'block' }}>
                      <i className="bi bi-shield-check me-1"></i>Rate change will be logged with OM authorization for audit
                    </small>
                  </>
                )}
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="col-md-4">
              <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <small style={{ color: '#166534', display: 'block' }}>Total Amount</small>
                <strong style={{ color: '#166534', fontSize: 18 }}>{formatCurrency(totalAmount)}</strong>
              </div>
            </div>
            <div className="col-md-4">
              <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                <small style={{ color: '#1e40af', display: 'block' }}>Advance Paid</small>
                <strong style={{ color: '#1e40af', fontSize: 18 }}>{formatCurrency(advancePaid)}</strong>
              </div>
            </div>
            <div className="col-md-4">
              <div style={{ background: '#fef3c7', padding: '12px 16px', borderRadius: 10, border: '1px solid #fbbf24' }}>
                <small style={{ color: '#92400e', display: 'block' }}>Balance Due</small>
                <strong style={{ color: '#92400e', fontSize: 18 }}>{formatCurrency(balanceDue)}</strong>
              </div>
            </div>

            {/* Deposit Collection Section */}
            <div className="col-12">
              <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #6ee7b7', borderRadius: 12, padding: 16 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#065f46', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <i className="bi bi-cash-stack"></i> Collect Deposit
                </label>
                <div className="row g-2 align-items-end">
                  <div className="col-md-4">
                    <label style={{ fontSize: 12, color: '#065f46', display: 'block', marginBottom: 4 }}>Deposit Amount *</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text" style={{ borderRadius: '8px 0 0 8px' }}>Rs</span>
                      <input type="number" className="form-control" value={depositAmount} onChange={e => setDepositAmount(Number(e.target.value))} min="0" style={{ borderRadius: '0 8px 8px 0' }} />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label style={{ fontSize: 12, color: '#065f46', display: 'block', marginBottom: 4 }}>Payment Mode *</label>
                    <select className="form-select form-select-sm" value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{ borderRadius: 8 }}>
                      <option value="">Select mode...</option>
                      <option value="cash">Cash</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label style={{ fontSize: 12, color: '#065f46', display: 'block', marginBottom: 4 }}>Reference No. (Optional)</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Transaction ID / Cheque No." value={paymentRef} onChange={e => setPaymentRef(e.target.value)} style={{ borderRadius: 8 }} />
                  </div>
                </div>
                <div style={{ marginTop: 12, padding: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#065f46' }}>Total Amount:</span>
                    <span style={{ color: '#065f46' }}>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#065f46' }}>Advance Paid:</span>
                    <span style={{ color: '#10b981' }}>- {formatCurrency(advancePaid)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: '#065f46' }}>Deposit Now:</span>
                    <span style={{ color: '#10b981' }}>- {formatCurrency(depositAmount)}</span>
                  </div>
                  <hr style={{ margin: '8px 0', borderColor: '#6ee7b7' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
                    <span style={{ color: '#065f46' }}>Remaining Balance:</span>
                    <span style={{ color: '#065f46' }}>{formatCurrency(Math.max(0, balanceDue - depositAmount))}</span>
                  </div>
                </div>
                <small style={{ color: '#065f46', fontSize: 11, marginTop: 8, display: 'block' }}>
                  <i className="bi bi-info-circle me-1"></i>Receipt will be generated after check-in completion
                </small>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
          <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 10 }} onClick={() => setShowCheckInModal(false)}>Close</button>
          {checkInData?.id && (
            <button type="button" className="btn btn-outline-primary" style={{ borderRadius: 10 }}
              onClick={async () => {
                try {
                  const res = await get(`/reservations/${checkInData.id}/check-in-summary`, { responseType: 'blob', silent: true });
                  const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                  window.open(url, '_blank');
                } catch { toast.error('Failed to generate PDF'); }
              }}>
              <i className="bi bi-printer me-1"></i>Print Registration
            </button>
          )}
          {checkInData?.id && ['pending', 'confirmed'].includes(checkInData?.status) && (
            <button type="button" className="btn btn-outline-danger" style={{ borderRadius: 10 }}
              onClick={async () => {
                setCancelData(checkInData);
                setRefundMethod('cash');
                setRefundRef('');
                setRefundPreview(null);
                setUseOverrideRefund(false);
                setOverrideRefundAmount('');
                setShowCheckInModal(false);
                setShowCancelModal(true);
                try {
                  const res = await get(`/reservations/${checkInData.id}/refund-preview`, { silent: true });
                  setRefundPreview(res.data);
                } catch { /* no advance */ }
              }}>
              <i className="bi bi-x-circle me-1"></i>Cancel Reservation
            </button>
          )}
          {(() => {
            const roomDirty = selectedRoom && !['clean', 'inspected'].includes(selectedRoom.cleanliness_status);
            const missingId = !idNumber || !idNumber.trim();
            const blocked = roomDirty || missingId;
            return (
              <>
                {roomDirty && (
                  <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>Room is {selectedRoom.cleanliness_status === 'dirty' ? 'dirty' : selectedRoom.cleanliness_status === 'in_progress' ? 'being cleaned' : selectedRoom.cleanliness_status?.replace('_', ' ')}
                  </span>
                )}
                {!roomDirty && missingId && (
                  <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>ID proof is required for check-in
                  </span>
                )}
                <button type="button" className="btn" style={{ background: blocked ? '#9ca3af' : '#10b981', color: '#fff', borderRadius: 10, padding: '10px 24px', cursor: blocked ? 'not-allowed' : 'pointer' }} onClick={handleCheckIn} disabled={blocked}>
                  <i className="bi bi-check-lg me-1"></i> Complete Check-In
                </button>
              </>
            );
          })()}
        </div>
      </div>
    </Modal>
  );
}
