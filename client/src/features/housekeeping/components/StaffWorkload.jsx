import React from 'react';

const StaffWorkload = ({ housekeepingStaff, tasks }) => (
  <div className="hk-staff-card">
    <div className="card-header-custom">
      <h5><i className="bi bi-people me-2"></i>Staff on Duty</h5>
      <span className="badge bg-success">{housekeepingStaff.length} active</span>
    </div>
    <div className="staff-list">
      {housekeepingStaff.map(s => {
        const initials = `${(s.first_name || '')[0] || ''}${(s.last_name || '')[0] || ''}`.toUpperCase();
        const assigned = tasks.filter(t => t.assigned_to === s.id && t.status !== 'completed' && t.status !== 'verified').length;
        const maxRooms = 5;
        const pct = Math.min((assigned / maxRooms) * 100, 100);
        return (
          <div className="staff-item" key={s.id}>
            <div className="staff-avatar">
              <span>{initials}</span>
            </div>
            <div className="staff-info">
              <span className="staff-name">{s.first_name} {s.last_name}</span>
              <span className="staff-role">{s.role || 'Housekeeper'}</span>
            </div>
            <div className="staff-workload">
              <div className="workload-bar">
                <div className="workload-progress" style={{ width: `${pct}%` }}></div>
              </div>
              <span className="workload-text">{assigned}/{maxRooms} rooms</span>
            </div>
          </div>
        );
      })}
      {housekeepingStaff.length === 0 && (
        <div className="text-center text-muted py-3">No housekeeping staff found</div>
      )}
    </div>
  </div>
);

export default StaffWorkload;
