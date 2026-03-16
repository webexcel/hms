import React from 'react';

const ChannelModal = ({ show, onClose, selectedChannel, channelForm, setChannelForm, onSave }) => {
  if (!show) return null;

  const updateField = (field, value) => setChannelForm({ ...channelForm, [field]: value });
  const updateCredential = (field, value) =>
    setChannelForm({
      ...channelForm,
      api_credentials: { ...channelForm.api_credentials, [field]: value },
    });

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{selectedChannel ? 'Edit Channel' : 'Add Channel'}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Name</label>
                <input className="form-control" value={channelForm.name}
                  onChange={(e) => updateField('name', e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Code</label>
                <select className="form-select" value={channelForm.code}
                  onChange={(e) => updateField('code', e.target.value)}
                  disabled={!!selectedChannel}>
                  <option value="">Select...</option>
                  <option value="mmt">MakeMyTrip (mmt)</option>
                  <option value="goibibo">Goibibo</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">API URL</label>
                <input className="form-control" value={channelForm.api_url}
                  onChange={(e) => updateField('api_url', e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Hotel ID on OTA</label>
                <input className="form-control" value={channelForm.hotel_id_on_ota}
                  onChange={(e) => updateField('hotel_id_on_ota', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Commission %</label>
                <input type="number" className="form-control" value={channelForm.commission_percentage}
                  onChange={(e) => updateField('commission_percentage', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Webhook Secret</label>
                <input className="form-control" value={channelForm.webhook_secret}
                  onChange={(e) => updateField('webhook_secret', e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact Email</label>
                <input type="email" className="form-control" value={channelForm.contact_email}
                  onChange={(e) => updateField('contact_email', e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label">API Credentials</label>
                <div className="row g-2">
                  <div className="col-md-6">
                    <input className="form-control" placeholder="API Key"
                      value={channelForm.api_credentials.api_key}
                      onChange={(e) => updateCredential('api_key', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <input type="password" className="form-control" placeholder="API Secret"
                      value={channelForm.api_credentials.api_secret}
                      onChange={(e) => updateCredential('api_secret', e.target.value)} />
                  </div>
                </div>
                <small className="text-muted">Leave empty to keep existing credentials</small>
              </div>
              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows="2" value={channelForm.notes}
                  onChange={(e) => updateField('notes', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={onSave}>
              {selectedChannel ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelModal;
