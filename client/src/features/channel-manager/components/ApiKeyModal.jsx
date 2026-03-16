import React from 'react';

const ApiKeyModal = ({ show, onClose, channels, keyForm, setKeyForm, onSave }) => {
  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create API Key</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input className="form-control" value={keyForm.name}
                onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label">Channel</label>
              <select className="form-select" value={keyForm.channel_id}
                onChange={(e) => setKeyForm({ ...keyForm, channel_id: e.target.value })}>
                <option value="">Select...</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Rate Limit (per 15 min)</label>
              <input type="number" className="form-control" value={keyForm.rate_limit}
                onChange={(e) => setKeyForm({ ...keyForm, rate_limit: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={onSave}>Create</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
