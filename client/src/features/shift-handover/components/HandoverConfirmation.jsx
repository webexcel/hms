import React from 'react';

const HandoverConfirmation = ({
  user,
  outgoingConfirm,
  incomingConfirm,
  onOutgoingConfirmChange,
  onIncomingConfirmChange,
  onPrint,
  onComplete
}) => (
  <div className="sh-section">
    <div className="sh-section-header">
      <h2 className="sh-section-title">
        <i className="bi bi-pen signature"></i>
        Handover Confirmation
      </h2>
    </div>
    <div className="sh-section-body">
      <div className="sh-signature-grid">
        <div className="sh-signature-card outgoing">
          <div className="sh-signature-label">Outgoing OM</div>
          <input
            type="text"
            className="sh-signature-input"
            value={user?.full_name || user?.username || ''}
            readOnly
          />
          <div className="sh-signature-time">
            Time: <strong>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
          </div>
          <div className="sh-signature-checkbox">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="outgoingConfirm"
                checked={outgoingConfirm}
                onChange={(e) => onOutgoingConfirmChange(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="outgoingConfirm" style={{ fontSize: '12px' }}>
                I confirm all details are accurate
              </label>
            </div>
          </div>
        </div>
        <div className="sh-signature-card incoming">
          <div className="sh-signature-label">Incoming OM</div>
          <input
            type="text"
            className="sh-signature-input"
            placeholder="Enter name"
          />
          <div className="sh-signature-time">
            Time: <strong>--:-- --</strong>
          </div>
          <div className="sh-signature-checkbox">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="incomingConfirm"
                checked={incomingConfirm}
                onChange={(e) => onIncomingConfirmChange(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="incomingConfirm" style={{ fontSize: '12px' }}>
                I accept this handover
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="sh-handover-actions">
        <button className="btn-print-report" onClick={onPrint}>
          <i className="bi bi-printer me-2"></i>Print Report
        </button>
        <button className="btn-complete-handover" onClick={onComplete}>
          <i className="bi bi-check-lg me-2"></i>Complete Handover
        </button>
      </div>
    </div>
  </div>
);

export default HandoverConfirmation;
