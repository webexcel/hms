import React from 'react';

export default function NotificationsTab({
  notifications, setNotifications,
  saving, saveSettings,
}) {
  return (
    <div className="tab-pane fade show active" id="notifications">
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-bell me-2"></i>Notification Settings</h5>
        </div>
        <div className="card-body">
          <h6 className="mb-3">Email Notifications</h6>
          <div className="notification-settings">
            {[
              { key: 'new_reservations', label: 'New Reservations', desc: 'Get notified when a new reservation is made' },
              { key: 'cancellations', label: 'Cancellations', desc: 'Get notified when a reservation is cancelled' },
              { key: 'checkin_reminders', label: 'Check-in Reminders', desc: 'Daily summary of expected arrivals' },
              { key: 'low_inventory', label: 'Low Inventory Alerts', desc: 'Alert when inventory items are running low' },
              { key: 'payment_alerts', label: 'Payment Alerts', desc: 'Notifications for payment confirmations' },
              { key: 'daily_reports', label: 'Daily Reports', desc: 'Receive daily summary reports via email' }
            ].map(item => (
              <div key={item.key} className="notification-item">
                <div className="notification-info">
                  <strong>{item.label}</strong>
                  <small className="text-muted d-block">{item.desc}</small>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                  />
                </div>
              </div>
            ))}
          </div>

          <hr className="my-4" />

          <h6 className="mb-3">System Notifications</h6>
          <div className="notification-settings">
            {[
              { key: 'browser_notifications', label: 'Browser Notifications', desc: 'Show desktop notifications in browser' },
              { key: 'sound_alerts', label: 'Sound Alerts', desc: 'Play sound for important notifications' }
            ].map(item => (
              <div key={item.key} className="notification-item">
                <div className="notification-info">
                  <strong>{item.label}</strong>
                  <small className="text-muted d-block">{item.desc}</small>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={notifications[item.key]}
                    onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => saveSettings('Notification', notifications, 'notifications')} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
