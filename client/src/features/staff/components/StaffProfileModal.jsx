import React from 'react';
import { formatDate, formatCurrency, capitalize } from '../../../utils/formatters';
import {
  getInitials,
  getStatusClass,
  getStatusLabel,
  getShiftLabel,
  getShiftTime,
} from '../hooks/useStaff';

const StaffProfileModal = ({ selectedStaff, onClose, onEdit }) => {
  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={onClose}>
      <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title"><i className="bi bi-person-badge me-2"></i>Staff Profile</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="staff-profile">
              <div className="profile-header">
                <div className="profile-avatar">
                  <span>{getInitials(selectedStaff.first_name, selectedStaff.last_name)}</span>
                </div>
                <div className="profile-info">
                  <h4>{selectedStaff.first_name} {selectedStaff.last_name}</h4>
                  <span className="profile-role">{selectedStaff.designation || capitalize(selectedStaff.department || '')}</span>
                  <span className="profile-dept">{capitalize(selectedStaff.department || '')} Department</span>
                  <span className={`status-badge ${getStatusClass(selectedStaff.status)}`}>
                    {getStatusLabel(selectedStaff.status)}
                  </span>
                </div>
              </div>
              <div className="row g-4 mt-3">
                <div className="col-md-6">
                  <div className="profile-section">
                    <h6><i className="bi bi-person me-2"></i>Personal Information</h6>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Employee ID</span>
                        <span className="value">{selectedStaff.employee_id || `EMP-${selectedStaff.id}`}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Phone</span>
                        <span className="value">{selectedStaff.phone || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Email</span>
                        <span className="value">{selectedStaff.email || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Join Date</span>
                        <span className="value">{formatDate(selectedStaff.date_of_joining)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="profile-section">
                    <h6><i className="bi bi-clock me-2"></i>Work Schedule</h6>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Default Shift</span>
                        <span className="value">{getShiftLabel(selectedStaff.shift)} ({getShiftTime(selectedStaff.shift)})</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Department</span>
                        <span className="value">{capitalize(selectedStaff.department || '')}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Salary</span>
                        <span className="value">{formatCurrency(selectedStaff.salary)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-primary" onClick={() => onEdit(selectedStaff)}>
              <i className="bi bi-pencil me-1"></i>Edit Profile
            </button>
            <button type="button" className="btn btn-light" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfileModal;
