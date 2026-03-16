import React from 'react';
import { getInitials } from '../hooks/useStaff';

const ShiftSection = ({ className, icon, label, staffList }) => (
  <div className="shift-section">
    <div className={`shift-header ${className}`}>
      <i className={`bi ${icon}`}></i>
      <span>{label}</span>
      <span className="shift-count">{staffList.length} staff</span>
    </div>
    <div className="shift-staff">
      {staffList.slice(0, 3).map(s => (
        <span key={s.id} className="staff-mini">{getInitials(s.first_name, s.last_name)}</span>
      ))}
      {staffList.length > 3 && (
        <span className="staff-mini">+{staffList.length - 3}</span>
      )}
    </div>
  </div>
);

const TodayScheduleCard = ({ morningStaff, afternoonStaff, nightStaff }) => {
  return (
    <div className="staff-schedule-card">
      <div className="card-header-custom">
        <h5><i className="bi bi-calendar-day me-2"></i>Today's Schedule</h5>
        <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); }}>Full Schedule</a>
      </div>
      <div className="schedule-shifts">
        <ShiftSection
          className="morning"
          icon="bi-sunrise"
          label="Morning Shift (6 AM - 2 PM)"
          staffList={morningStaff}
        />
        <ShiftSection
          className="afternoon"
          icon="bi-sun"
          label="Evening Shift (2 PM - 10 PM)"
          staffList={afternoonStaff}
        />
        <ShiftSection
          className="night"
          icon="bi-moon-stars"
          label="Night Shift (10 PM - 6 AM)"
          staffList={nightStaff}
        />
      </div>
    </div>
  );
};

export default TodayScheduleCard;
