import React from 'react';

const SyncLogsTab = ({ channels, syncLogs, selectedLogChannel, onLogChannelChange }) => (
  <div>
    <div className="d-flex align-items-center gap-3 mb-3">
      <select
        className="form-select"
        style={{ maxWidth: 250 }}
        value={selectedLogChannel || ''}
        onChange={(e) => onLogChannelChange(e.target.value)}
      >
        <option value="">Select channel...</option>
        {channels.map((ch) => (
          <option key={ch.id} value={ch.id}>{ch.name}</option>
        ))}
      </select>
    </div>

    <div className="table-responsive">
      <table className="table table-sm table-hover">
        <thead>
          <tr>
            <th>Time</th><th>Direction</th><th>Operation</th><th>Status</th>
            <th>Code</th><th>Duration</th><th>Error</th>
          </tr>
        </thead>
        <tbody>
          {syncLogs.map((log) => (
            <tr key={log.id}>
              <td className="small">{new Date(log.created_at).toLocaleString()}</td>
              <td>
                <span className={`badge ${log.direction === 'inbound' ? 'bg-info' : 'bg-primary'}`}>
                  {log.direction}
                </span>
              </td>
              <td>{log.operation}</td>
              <td>
                <span className={`badge ${log.status === 'success' ? 'bg-success' : log.status === 'failed' ? 'bg-danger' : 'bg-warning'}`}>
                  {log.status}
                </span>
              </td>
              <td>{log.status_code || '\u2014'}</td>
              <td>{log.duration_ms ? `${log.duration_ms}ms` : '\u2014'}</td>
              <td className="small text-danger">{log.error_message || ''}</td>
            </tr>
          ))}
          {syncLogs.length === 0 && (
            <tr><td colSpan="7" className="text-center text-muted py-4">No sync logs</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default SyncLogsTab;
