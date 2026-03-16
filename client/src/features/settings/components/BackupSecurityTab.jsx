import React from 'react';

export default function BackupSecurityTab({
  backupSettings, setBackupSettings,
  securitySettings, setSecuritySettings,
  saving, saveSettings,
}) {
  return (
    <div className="tab-pane fade show active" id="backup">
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-cloud-arrow-up me-2"></i>Data Backup</h5>
        </div>
        <div className="card-body">
          <div className="backup-status mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Last Backup</h6>
                <p className="text-muted mb-0">February 3, 2026 at 03:00 AM</p>
              </div>
              <span className="badge bg-success-subtle text-success fs-6">
                <i className="bi bi-check-circle me-1"></i>Successful
              </span>
            </div>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Backup Frequency</label>
              <select
                className="form-select"
                value={backupSettings.frequency}
                onChange={(e) => setBackupSettings({ ...backupSettings, frequency: e.target.value })}
              >
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Backup Time</label>
              <input
                type="time"
                className="form-control"
                value={backupSettings.backup_time}
                onChange={(e) => setBackupSettings({ ...backupSettings, backup_time: e.target.value })}
              />
            </div>
            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={backupSettings.keep_30_days}
                  onChange={(e) => setBackupSettings({ ...backupSettings, keep_30_days: e.target.checked })}
                />
                <label className="form-check-label">Keep backups for 30 days</label>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-outline-primary me-2">
              <i className="bi bi-cloud-arrow-up me-1"></i>Backup Now
            </button>
            <button className="btn btn-outline-secondary">
              <i className="bi bi-cloud-arrow-down me-1"></i>Restore Backup
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-shield-check me-2"></i>Security Settings</h5>
        </div>
        <div className="card-body">
          <div className="security-settings">
            <div className="security-item">
              <div className="security-info">
                <strong>Two-Factor Authentication</strong>
                <small className="text-muted d-block">Add an extra layer of security to your account</small>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={securitySettings.two_factor}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, two_factor: e.target.checked })}
                />
              </div>
            </div>
            <div className="security-item">
              <div className="security-info">
                <strong>Session Timeout</strong>
                <small className="text-muted d-block">Auto logout after inactivity</small>
              </div>
              <select
                className="form-select"
                style={{ width: '150px' }}
                value={securitySettings.session_timeout}
                onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: e.target.value })}
              >
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
              </select>
            </div>
            <div className="security-item">
              <div className="security-info">
                <strong>Password Requirements</strong>
                <small className="text-muted d-block">Minimum 8 characters with uppercase, lowercase, and numbers</small>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={securitySettings.password_requirements}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, password_requirements: e.target.checked })}
                />
              </div>
            </div>
            <div className="security-item">
              <div className="security-info">
                <strong>Login Attempt Limit</strong>
                <small className="text-muted d-block">Lock account after failed login attempts</small>
              </div>
              <select
                className="form-select"
                style={{ width: '150px' }}
                value={securitySettings.login_attempt_limit}
                onChange={(e) => setSecuritySettings({ ...securitySettings, login_attempt_limit: e.target.value })}
              >
                <option>3 attempts</option>
                <option>5 attempts</option>
                <option>10 attempts</option>
              </select>
            </div>
          </div>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => saveSettings('Security', securitySettings, 'operations')} disabled={saving}>
            {saving ? 'Saving...' : 'Save Security Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
