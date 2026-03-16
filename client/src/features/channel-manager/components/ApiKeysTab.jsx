import React from 'react';

const ApiKeysTab = ({ apiKeys, newKeyDisplay, setNewKeyDisplay, openKeyModal, revokeKey }) => (
  <div>
    <div className="d-flex justify-content-end mb-3">
      <button className="btn btn-primary" onClick={openKeyModal}>
        <i className="bi bi-key me-1" />Create API Key
      </button>
    </div>

    {newKeyDisplay && (
      <div className="alert alert-warning alert-dismissible">
        <strong>New API Key (copy now, shown only once):</strong>
        <code className="d-block mt-1 user-select-all">{newKeyDisplay}</code>
        <button type="button" className="btn-close" onClick={() => setNewKeyDisplay(null)} />
      </div>
    )}

    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Name</th><th>Prefix</th><th>Channel</th><th>Rate Limit</th>
            <th>Last Used</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {apiKeys.map((k) => (
            <tr key={k.id}>
              <td>{k.name}</td>
              <td><code>{k.key_prefix}...</code></td>
              <td>{k.channel?.name || '\u2014'}</td>
              <td>{k.rate_limit}/15min</td>
              <td>{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</td>
              <td>
                <span className={`badge ${k.is_active ? 'bg-success' : 'bg-danger'}`}>
                  {k.is_active ? 'Active' : 'Revoked'}
                </span>
              </td>
              <td>
                {k.is_active && (
                  <button className="btn btn-sm btn-outline-danger" onClick={() => revokeKey(k.id)}>
                    Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
          {apiKeys.length === 0 && (
            <tr><td colSpan="7" className="text-center text-muted py-4">No API keys created</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default ApiKeysTab;
