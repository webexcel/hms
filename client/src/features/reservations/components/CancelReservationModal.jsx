export default function CancelReservationModal({
  showCancelModal, setShowCancelModal,
  cancelPreview, cancelLoading,
  overrideRefund, setOverrideRefund,
  useOverride, setUseOverride,
  handleConfirmCancel,
}) {
  if (!showCancelModal) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-danger text-white">
            <h5 className="modal-title"><i className="bi bi-x-circle me-2"></i>Cancel Reservation</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowCancelModal(false)}></button>
          </div>
          <div className="modal-body p-4">
            {!cancelPreview ? (
              <div className="text-center py-3">
                <span className="spinner-border spinner-border-sm me-2"></span> Loading refund details...
              </div>
            ) : cancelPreview.error ? (
              <div className="alert alert-warning">Could not load refund preview. You can still cancel.</div>
            ) : (
              <>
                <div className="alert alert-warning mb-3">
                  <i className="bi bi-exclamation-triangle me-1"></i> This action cannot be undone.
                </div>

                {cancelPreview.advance_paid > 0 ? (
                  <>
                    <table className="table table-sm mb-3">
                      <tbody>
                        <tr>
                          <td className="text-muted">Advance Paid</td>
                          <td className="text-end fw-bold">₹{cancelPreview.advance_paid.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Hours Until Check-in</td>
                          <td className="text-end">{cancelPreview.hours_until_checkin} hrs</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Policy</td>
                          <td className="text-end">{cancelPreview.rule_label}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Refund Amount</td>
                          <td className="text-end fw-bold text-success">₹{cancelPreview.refund_amount.toFixed(2)} ({cancelPreview.refund_percent}%)</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Deduction</td>
                          <td className="text-end text-danger">₹{cancelPreview.deduction.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Refund policy summary */}
                    <div className="small text-muted mb-3">
                      <strong>Refund Policy:</strong>
                      <ul className="mb-0 mt-1">
                        {cancelPreview.rules?.map((r, i) => (
                          <li key={i} className={cancelPreview.refund_percent === r.refundPercent && !useOverride ? 'fw-bold text-dark' : ''}>
                            {r.label}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* OM Override */}
                    {cancelPreview.can_override && (
                      <div className="border rounded p-3 bg-light">
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="overrideRefund"
                            checked={useOverride}
                            onChange={(e) => setUseOverride(e.target.checked)}
                          />
                          <label className="form-check-label fw-bold" htmlFor="overrideRefund">
                            <i className="bi bi-shield-lock me-1"></i> Override Refund Amount (OM)
                          </label>
                        </div>
                        {useOverride && (
                          <div className="input-group mt-2">
                            <span className="input-group-text">₹</span>
                            <input
                              type="number"
                              className="form-control"
                              value={overrideRefund}
                              onChange={(e) => setOverrideRefund(e.target.value)}
                              min="0"
                              max={cancelPreview.advance_paid}
                              step="0.01"
                            />
                            <span className="input-group-text">/ ₹{cancelPreview.advance_paid.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted">No advance was paid for this reservation. No refund applicable.</p>
                )}
              </>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-light" onClick={() => setShowCancelModal(false)} disabled={cancelLoading}>
              Go Back
            </button>
            <button className="btn btn-danger" onClick={handleConfirmCancel} disabled={cancelLoading || !cancelPreview}>
              {cancelLoading ? (
                <><span className="spinner-border spinner-border-sm me-1"></span> Cancelling...</>
              ) : (
                <><i className="bi bi-x-circle me-1"></i> Confirm Cancellation</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
