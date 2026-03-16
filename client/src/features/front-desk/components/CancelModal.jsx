import { Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../../utils/formatters';

export default function CancelModal({
  showCancelModal, setShowCancelModal, cancelData, selectedRoom,
  refundPreview, refundMethod, setRefundMethod, refundRef, setRefundRef,
  useOverrideRefund, setUseOverrideRefund, overrideRefundAmount, setOverrideRefundAmount,
  cancelLoading, setCancelLoading,
  put, fetchData,
}) {
  return (
    <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
      <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', borderRadius: '16px 16px 0 0', padding: '20px 24px' }}>
          <h5 className="modal-title"><i className="bi bi-x-circle me-2"></i>Cancel Reservation</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowCancelModal(false)}></button>
        </div>
        <div className="modal-body" style={{ padding: 24 }}>
          {cancelData && (
            <>
              <div style={{ background: '#fef2f2', borderRadius: 10, padding: '12px 16px', marginBottom: 16, border: '1px solid #fca5a5' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>
                  Room {cancelData.room?.room_number || selectedRoom?.room_number || ''} — {cancelData.reservation_number || ''}
                </div>
                <div style={{ fontSize: 12, color: '#7f1d1d' }}>
                  {cancelData.guest?.first_name} {cancelData.guest?.last_name} &middot; {cancelData.booking_type === 'hourly' ? `${cancelData.expected_hours}h Short Stay` : `${cancelData.nights || 0} Night(s)`}
                </div>
              </div>

              {/* Refund Rules */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                  <i className="bi bi-info-circle me-1"></i>Cancellation Policy
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  {(refundPreview?.rules || [
                    { minHours: 72, refundPercent: 100, label: '72+ hours before check-in — Full refund' },
                    { minHours: 48, refundPercent: 75, label: '48–72 hours — 75% refund' },
                    { minHours: 24, refundPercent: 50, label: '24–48 hours — 50% refund' },
                    { minHours: 0, refundPercent: 0, label: 'Less than 24 hours — No refund' },
                  ]).map((rule, i) => (
                    <div key={i} style={{
                      padding: '8px 14px', fontSize: 12, borderBottom: '1px solid #e2e8f0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: refundPreview && refundPreview.refund_percent === rule.refundPercent ? '#eff6ff' : 'transparent',
                      fontWeight: refundPreview && refundPreview.refund_percent === rule.refundPercent ? 700 : 400,
                    }}>
                      <span>{rule.label}</span>
                      {refundPreview && refundPreview.refund_percent === rule.refundPercent && (
                        <i className="bi bi-arrow-left" style={{ color: '#2563eb', fontSize: 14 }}></i>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Calculation */}
              {refundPreview && refundPreview.advance_paid > 0 ? (
                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px', border: '1px solid #bbf7d0', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 8 }}>Refund Calculation</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                    <span>Advance Paid</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(refundPreview.advance_paid)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                    <span>Hours Until Check-in</span>
                    <span style={{ fontWeight: 600 }}>{refundPreview.hours_until_checkin}h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#dc2626' }}>
                    <span>Cancellation Deduction ({100 - refundPreview.refund_percent}%)</span>
                    <span style={{ fontWeight: 600 }}>- {formatCurrency(refundPreview.deduction)}</span>
                  </div>
                  <hr style={{ margin: '8px 0', borderColor: '#86efac' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 15, fontWeight: 700, color: '#166534' }}>
                    <span>Refund Amount ({refundPreview.refund_percent}%)</span>
                    <span>{formatCurrency(refundPreview.refund_amount)}</span>
                  </div>
                </div>
              ) : refundPreview ? (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0', marginBottom: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No advance payment — no refund applicable
                </div>
              ) : null}

              {/* Refund Method */}
              {refundPreview && (refundPreview.refund_amount > 0 || useOverrideRefund) && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>Refund Method</label>
                  <div className="d-flex gap-2">
                    <select className="form-select form-select-sm" value={refundMethod} onChange={e => setRefundMethod(e.target.value)} style={{ borderRadius: 8, maxWidth: 160 }}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                    <input type="text" className="form-control form-control-sm" placeholder="Reference (optional)"
                      value={refundRef} onChange={e => setRefundRef(e.target.value)} style={{ borderRadius: 8 }} />
                  </div>
                </div>
              )}

              {/* OM Override Refund */}
              {refundPreview?.can_override && refundPreview.advance_paid > 0 && (
                <div style={{ background: '#fefce8', borderRadius: 10, padding: '14px 16px', border: '1px solid #fde68a', marginBottom: 16 }}>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="omOverrideRefund"
                      checked={useOverrideRefund}
                      onChange={(e) => {
                        setUseOverrideRefund(e.target.checked);
                        if (e.target.checked) setOverrideRefundAmount(refundPreview.refund_amount?.toString() || '0');
                      }}
                    />
                    <label className="form-check-label" htmlFor="omOverrideRefund" style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                      <i className="bi bi-shield-lock me-1"></i>Override Refund Amount (OM)
                    </label>
                  </div>
                  {useOverrideRefund && (
                    <div className="input-group input-group-sm mt-2">
                      <span className="input-group-text">₹</span>
                      <input type="number" className="form-control" value={overrideRefundAmount}
                        onChange={e => setOverrideRefundAmount(e.target.value)}
                        min="0" max={refundPreview.advance_paid} step="0.01" style={{ borderRadius: '0 8px 8px 0' }}
                      />
                      <span className="input-group-text" style={{ borderRadius: '0 8px 8px 0' }}>/ {formatCurrency(refundPreview.advance_paid)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
          <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 10 }} onClick={() => setShowCancelModal(false)}>Go Back</button>
          <button type="button" className="btn btn-danger" style={{ borderRadius: 10, padding: '10px 24px' }} disabled={cancelLoading}
            onClick={async () => {
              setCancelLoading(true);
              try {
                const cancelBody = { refund_method: refundMethod, refund_reference: refundRef };
                if (useOverrideRefund && refundPreview?.can_override) {
                  cancelBody.override_refund_amount = parseFloat(overrideRefundAmount) || 0;
                }
                const res = await put(`/reservations/${cancelData.id}/cancel`, cancelBody);
                const d = res?.data;
                if (d?.refund_amount > 0) {

                  toast.success(`Reservation cancelled. Refund of ${formatCurrency(d.refund_amount)}${d.refund_overridden ? ' (OM override)' : ` (${d.refund_percent}%)`} processed via ${refundMethod}.`);
                } else if (d?.advance_paid_amount > 0) {

                  toast.success(`Reservation cancelled. No refund per cancellation policy.`);
                } else {

                  toast.success('Reservation cancelled');
                }
                setShowCancelModal(false);
                fetchData();
              } catch (err) {

                toast.error(err?.response?.data?.message || 'Failed to cancel reservation');
              } finally {
                setCancelLoading(false);
              }
            }}>
            {cancelLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</> : <><i className="bi bi-x-circle me-1"></i>Confirm Cancellation</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}
