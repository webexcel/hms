import React from 'react';
import { formatDate, capitalize } from '../../../utils/formatters';

const getMaintenanceIcon = (issueType) => {
  const icons = {
    hvac: 'bi-snow',
    plumbing: 'bi-droplet',
    electrical: 'bi-lightbulb',
    furniture: 'bi-lamp',
    appliance: 'bi-tv',
    structural: 'bi-hammer',
  };
  return icons[issueType] || 'bi-wrench';
};

const MaintenanceList = ({ maintenanceRequests }) => (
  <div className="hk-maintenance-card">
    <div className="card-header-custom">
      <h5><i className="bi bi-tools me-2"></i>Maintenance</h5>
      <span className="badge bg-danger">{maintenanceRequests.length} pending</span>
    </div>
    <div className="maintenance-list">
      {maintenanceRequests.map(req => (
        <div className="maintenance-item" key={req.id}>
          <div className="maintenance-icon">
            <i className={`bi ${getMaintenanceIcon(req.issue_type)}`}></i>
          </div>
          <div className="maintenance-info">
            <span className="maintenance-room">Room {req.room_number}</span>
            <span className="maintenance-issue">{req.description || capitalize(req.issue_type || 'General')}</span>
            <span className="maintenance-time">
              <i className="bi bi-clock"></i> {formatDate(req.created_at)}
            </span>
          </div>
          <span className={`maintenance-status ${(req.status || 'pending').replace('_', '-')}`}>
            {capitalize((req.status || 'pending').replace('_', ' '))}
          </span>
        </div>
      ))}
      {maintenanceRequests.length === 0 && (
        <div className="text-center text-muted py-3">No maintenance requests</div>
      )}
    </div>
  </div>
);

export default MaintenanceList;
