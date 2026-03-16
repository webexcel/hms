import React from 'react';
import {
  getInitials,
  getStatusDotClass,
  getDeptLabel,
  getShiftLabel,
  getShiftTime,
  getStatusClass,
  getStatusLabel,
} from '../hooks/useStaff';

const StaffListView = ({ filteredStaff, onViewProfile, onEditStaff, onViewSchedule }) => {
  return (
    <div className="staff-list-container">
      {filteredStaff.length === 0 && (
        <div className="text-center text-muted py-5">No staff members found</div>
      )}
      {filteredStaff.map(staff => (
        <div key={staff.id} className={`staff-card-list${staff.status === 'on_leave' ? ' on-leave' : ''}`}>
          <div className="staff-avatar-lg">
            <span>{getInitials(staff.first_name, staff.last_name)}</span>
            <span className={`status-dot ${getStatusDotClass(staff.status)}`}></span>
          </div>
          <div className="staff-main-info">
            <h5 className="staff-name">{staff.first_name} {staff.last_name}</h5>
            <span className="staff-role">{staff.designation || getDeptLabel(staff.department)}</span>
            <div className="staff-meta">
              <span><i className="bi bi-building"></i> {getDeptLabel(staff.department)}</span>
              {staff.phone && <span><i className="bi bi-telephone"></i> {staff.phone}</span>}
              {staff.email && <span><i className="bi bi-envelope"></i> {staff.email}</span>}
            </div>
          </div>
          <div className="staff-schedule">
            {staff.status === 'on_leave' ? (
              <span className="leave-info"><i className="bi bi-calendar-x"></i> On Leave</span>
            ) : (
              <>
                <span className={`shift-badge ${staff.shift || 'morning'}`}>{getShiftLabel(staff.shift)}</span>
                <span className="shift-time">{getShiftTime(staff.shift)}</span>
              </>
            )}
          </div>
          <div className="staff-status-info">
            <span className={`status-badge ${getStatusClass(staff.status)}`}>
              {getStatusLabel(staff.status)}
            </span>
          </div>
          <div className="staff-actions">
            <button className="btn btn-sm btn-outline-primary" title="View Profile" onClick={() => onViewProfile(staff)}>
              <i className="bi bi-eye"></i>
            </button>
            <button className="btn btn-sm btn-outline-secondary" title="Edit" onClick={() => onEditStaff(staff)}>
              <i className="bi bi-pencil"></i>
            </button>
            <button className="btn btn-sm btn-outline-info" title="Schedule" onClick={() => onViewSchedule(staff)}>
              <i className="bi bi-calendar-week"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StaffListView;
