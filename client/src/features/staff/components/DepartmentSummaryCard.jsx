import React from 'react';
import { getDeptIcon } from '../hooks/useStaff';

const DepartmentSummaryCard = ({ deptSummary }) => {
  return (
    <div className="staff-dept-card">
      <div className="card-header-custom">
        <h5><i className="bi bi-diagram-3 me-2"></i>By Department</h5>
      </div>
      <div className="dept-list">
        {deptSummary.map(dept => (
          <div key={dept.name} className="dept-item">
            <div className="dept-info">
              <span className={`dept-icon ${dept.name.toLowerCase().replace(/\s+/g, '')}`}>
                <i className={`bi ${getDeptIcon(dept.name)}`}></i>
              </span>
              <span className="dept-name">{dept.name}</span>
            </div>
            <div className="dept-stats">
              <span className="dept-count">{dept.total} staff</span>
              <span className="dept-active">{dept.onDuty} on duty</span>
            </div>
          </div>
        ))}
        {deptSummary.length === 0 && (
          <div className="text-center text-muted py-3">No department data</div>
        )}
      </div>
    </div>
  );
};

export default DepartmentSummaryCard;
