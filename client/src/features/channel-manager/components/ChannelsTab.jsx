import React from 'react';

const ChannelsTab = ({
  channels, openChannelModal, testConnection, triggerSync,
  openMappings, viewLogs, toggleChannel,
}) => (
  <div>
    <div className="d-flex justify-content-end mb-3">
      <button className="btn btn-primary" onClick={() => openChannelModal()}>
        <i className="bi bi-plus-lg me-1" />Add Channel
      </button>
    </div>

    <div className="row g-3">
      {channels.map((ch) => (
        <div className="col-md-6 col-xl-4" key={ch.id}>
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="card-title mb-0">{ch.name}</h5>
                <span className={`badge ${ch.is_active ? 'bg-success' : 'bg-secondary'}`}>
                  {ch.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-muted small mb-1">Code: <code>{ch.code}</code></p>
              <p className="text-muted small mb-1">Hotel ID: {ch.hotel_id_on_ota || '\u2014'}</p>
              <p className="text-muted small mb-1">Commission: {ch.commission_percentage}%</p>
              <p className="text-muted small mb-3">
                Last Sync: {ch.last_sync_at ? new Date(ch.last_sync_at).toLocaleString() : 'Never'}
              </p>
              <div className="d-flex flex-wrap gap-1">
                <button className="btn btn-sm btn-outline-primary" onClick={() => openChannelModal(ch)}>
                  <i className="bi bi-pencil" />
                </button>
                <button className="btn btn-sm btn-outline-info" onClick={() => testConnection(ch.id)}>
                  <i className="bi bi-wifi" /> Test
                </button>
                <button className="btn btn-sm btn-outline-success" onClick={() => triggerSync(ch.id)}>
                  <i className="bi bi-arrow-repeat" /> Sync
                </button>
                <button className="btn btn-sm btn-outline-warning" onClick={() => openMappings(ch.id)}>
                  <i className="bi bi-link-45deg" /> Rates
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => viewLogs(ch.id)}>
                  <i className="bi bi-journal-text" /> Logs
                </button>
                <button
                  className={`btn btn-sm ${ch.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                  onClick={() => toggleChannel(ch)}
                >
                  {ch.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {channels.length === 0 && (
        <div className="col-12 text-center text-muted py-5">
          <i className="bi bi-diagram-3 display-4 d-block mb-2" />
          No channels configured. Add MakeMyTrip or Goibibo to get started.
        </div>
      )}
    </div>
  </div>
);

export default ChannelsTab;
