import React from 'react';

const NewShiftModal = ({ show, user, formData, shifts, getShiftLabel, onUpdateField, onClose, onSubmit }) => {
  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog">
        <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
            <h5 className="modal-title"><i className="bi bi-play-fill me-2"></i>Start New Shift</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body" style={{ padding: '24px' }}>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Your Name</label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: '10px', padding: '12px' }}
                placeholder="Enter your name"
                value={user?.full_name || user?.username || ''}
                readOnly
              />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Shift Type</label>
              <select
                className="form-select"
                style={{ borderRadius: '10px', padding: '12px' }}
                value={formData.shift}
                onChange={(e) => onUpdateField('shift', e.target.value)}
              >
                {shifts.map(s => (
                  <option key={s} value={s}>{getShiftLabel(s)}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Opening Cash Balance</label>
              <div className="input-group">
                <span className="input-group-text" style={{ borderRadius: '10px 0 0 10px' }}>Rs</span>
                <input
                  type="number"
                  className="form-control"
                  style={{ borderRadius: '0 10px 10px 0', padding: '12px' }}
                  min="0"
                  step="0.01"
                  value={formData.cash_in_hand}
                  onChange={(e) => onUpdateField('cash_in_hand', e.target.value)}
                  required
                />
              </div>
              <small className="text-muted">Carried forward from previous shift</small>
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Total Collections</label>
              <div className="input-group">
                <span className="input-group-text" style={{ borderRadius: '10px 0 0 10px' }}>Rs</span>
                <input
                  type="number"
                  className="form-control"
                  style={{ borderRadius: '0 10px 10px 0', padding: '12px' }}
                  min="0"
                  step="0.01"
                  value={formData.total_collections}
                  onChange={(e) => onUpdateField('total_collections', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Pending Checkouts</label>
              <input
                type="number"
                className="form-control"
                style={{ borderRadius: '10px', padding: '12px' }}
                min="0"
                value={formData.pending_checkouts}
                onChange={(e) => onUpdateField('pending_checkouts', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Notes</label>
              <textarea
                className="form-control"
                style={{ borderRadius: '10px', padding: '12px' }}
                rows={2}
                value={formData.notes}
                onChange={(e) => onUpdateField('notes', e.target.value)}
                placeholder="Any important notes for the incoming shift..."
              ></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Tasks Pending</label>
              <textarea
                className="form-control"
                style={{ borderRadius: '10px', padding: '12px' }}
                rows={3}
                value={formData.tasks_pending}
                onChange={(e) => onUpdateField('tasks_pending', e.target.value)}
                placeholder="List any pending tasks..."
              ></textarea>
            </div>
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" id="reviewedHandover" />
              <label className="form-check-label" htmlFor="reviewedHandover">
                I have reviewed the previous shift handover report
              </label>
            </div>
          </div>
          <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: '10px' }} onClick={onClose}>Cancel</button>
            <button type="button" className="btn" style={{ background: '#10b981', color: '#fff', borderRadius: '10px', padding: '10px 24px' }} onClick={onSubmit}>
              <i className="bi bi-play-fill me-1"></i> Start Shift
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewShiftModal;
