import React from 'react';

export default function IntegrationsTab({
  integrations, toggleIntegration,
}) {
  return (
    <div className="tab-pane fade show active" id="integrations">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-plug me-2"></i>Third-Party Integrations</h5>
        </div>
        <div className="card-body">
          <div className="integration-list">
            {integrations.map((item, idx) => (
              <div key={idx} className="integration-item">
                <div className="integration-icon">
                  <i className={`bi ${item.icon}`}></i>
                </div>
                <div className="integration-info">
                  <h6>{item.name}</h6>
                  <small className="text-muted">{item.desc}</small>
                </div>
                <span className={`badge ${item.connected ? 'bg-success' : 'bg-secondary'}`}>
                  {item.connected ? 'Connected' : 'Not Connected'}
                </span>
                <button
                  className={`btn btn-sm ${item.connected ? 'btn-outline-danger' : 'btn-primary'}`}
                  onClick={() => toggleIntegration(idx)}
                >
                  {item.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
