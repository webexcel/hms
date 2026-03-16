import React from 'react';
import {
  getInitials,
  getStatusDotClass,
  getDeptLabel,
  getStatusClass,
  getStatusLabel,
} from '../hooks/useStaff';

const StaffGridView = ({ filteredStaff }) => {
  return (
    <div className="staff-grid-container">
      <div className="row g-3">
        {filteredStaff.length === 0 && (
          <div className="col-12 text-center text-muted py-5">No staff members found</div>
        )}
        {filteredStaff.map(staff => (
          <div key={staff.id} className="col-md-4">
            <div className="staff-card-grid">
              <div className="staff-avatar-xl">
                <span>{getInitials(staff.first_name, staff.last_name)}</span>
                <span className={`status-dot ${getStatusDotClass(staff.status)}`}></span>
              </div>
              <h5 className="staff-name">{staff.first_name} {staff.last_name}</h5>
              <span className="staff-role">{staff.designation || getDeptLabel(staff.department)}</span>
              <span className={`dept-badge ${(staff.department || '').toLowerCase().replace(/\s+/g, '')}`}>
                {getDeptLabel(staff.department)}
              </span>
              <div className="staff-contact">
                {staff.phone && (
                  <a href={`tel:${staff.phone}`}><i className="bi bi-telephone"></i></a>
                )}
                {staff.email && (
                  <a href={`mailto:${staff.email}`}><i className="bi bi-envelope"></i></a>
                )}
              </div>
              <span className={`status-badge ${getStatusClass(staff.status)}`}>
                {getStatusLabel(staff.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffGridView;
