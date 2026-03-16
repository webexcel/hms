import React from 'react';
import { formatDate, capitalize } from '../../../utils/formatters';
import {
  getShiftLabel,
  getStatusClass,
  getStatusLabel,
  getDeptLabel,
  getInitials,
} from '../hooks/useStaff';

const WeekNavigator = ({ scheduleWeekStart, weekDates, navigateWeek }) => (
  <div className="d-flex gap-2 align-items-center">
    <button className="btn btn-sm btn-outline-secondary" onClick={() => navigateWeek(-1)}>
      <i className="bi bi-chevron-left"></i> Prev
    </button>
    <span className="fw-bold">
      {new Date(scheduleWeekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      {' - '}
      {weekDates[6]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
    </span>
    <button className="btn btn-sm btn-outline-secondary" onClick={() => navigateWeek(1)}>
      Next <i className="bi bi-chevron-right"></i>
    </button>
  </div>
);

const IndividualSchedule = ({ selectedStaffSchedule, weekDates, dayNames, scheduleWeekStart, navigateWeek, getScheduleForStaffDate }) => (
  <div>
    <div className="mb-3">
      <strong>Department:</strong> {capitalize(selectedStaffSchedule.department || '')}
      <br />
      <strong>Default Shift:</strong> {getShiftLabel(selectedStaffSchedule.shift)}
      <br />
      <strong>Status:</strong>{' '}
      <span className={`status-badge ${getStatusClass(selectedStaffSchedule.status)}`}>
        {getStatusLabel(selectedStaffSchedule.status)}
      </span>
    </div>

    <div className="d-flex justify-content-between align-items-center mb-3">
      <h6 className="mb-0">Weekly Schedule</h6>
      <WeekNavigator scheduleWeekStart={scheduleWeekStart} weekDates={weekDates} navigateWeek={navigateWeek} />
    </div>

    <div className="table-responsive">
      <table className="table table-bordered table-sm">
        <thead>
          <tr>
            <th>Day</th>
            <th>Date</th>
            <th>Shift</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {weekDates.map((date, i) => {
            const schedule = getScheduleForStaffDate(selectedStaffSchedule.id, date);
            return (
              <tr key={i}>
                <td>{dayNames[date.getDay()]}</td>
                <td>{formatDate(date)}</td>
                <td>
                  {schedule?.is_off
                    ? 'Off'
                    : capitalize(schedule?.shift || selectedStaffSchedule.shift || 'morning')}
                </td>
                <td>
                  <span className={`badge bg-${schedule?.is_off ? 'danger' : 'success'}`}>
                    {schedule?.is_off ? 'Day Off' : 'Working'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const OverviewSchedule = ({ staffList, weekDates, dayNames, scheduleWeekStart, navigateWeek, getScheduleForStaffDate }) => {
  const shiftColors = {
    morning: '#fff3cd',
    evening: '#cce5ff',
    afternoon: '#cce5ff',
    night: '#d6d8db',
    off: '#f8d7da'
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Week Overview</h6>
        <WeekNavigator scheduleWeekStart={scheduleWeekStart} weekDates={weekDates} navigateWeek={navigateWeek} />
      </div>
      <div className="table-responsive">
        <table className="table table-bordered table-sm">
          <thead>
            <tr>
              <th style={{ minWidth: 150 }}>Staff</th>
              {weekDates.map((date, i) => (
                <th key={i} className="text-center" style={{ minWidth: 100 }}>
                  <div>{dayNames[date.getDay()]}</div>
                  <small className="text-muted">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffList
              .filter(s => s.status === 'active')
              .slice(0, 15)
              .map(staff => (
                <tr key={staff.id}>
                  <td>
                    <div className="fw-bold" style={{ fontSize: '0.85rem' }}>
                      {staff.first_name} {staff.last_name}
                    </div>
                    <small className="text-muted">{getDeptLabel(staff.department)}</small>
                  </td>
                  {weekDates.map((date, i) => {
                    const schedule = getScheduleForStaffDate(staff.id, date);
                    const shiftType = schedule?.shift || staff.shift || 'morning';
                    return (
                      <td
                        key={i}
                        className="text-center"
                        style={{
                          backgroundColor: schedule?.is_off
                            ? shiftColors.off
                            : shiftColors[shiftType] || '#fff',
                          fontSize: '0.8rem',
                          verticalAlign: 'middle'
                        }}
                      >
                        {schedule?.is_off ? (
                          <span className="text-danger">OFF</span>
                        ) : (
                          <span>{capitalize(shiftType)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            {staffList.filter(s => s.status === 'active').length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-muted py-3">
                  No active staff to display
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ScheduleModal = ({
  selectedStaffSchedule,
  staffList,
  weekDates,
  dayNames,
  scheduleWeekStart,
  navigateWeek,
  getScheduleForStaffDate,
  onClose,
}) => {
  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={onClose}>
      <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
      <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-calendar-week me-2"></i>
              {selectedStaffSchedule
                ? `Schedule - ${selectedStaffSchedule.first_name} ${selectedStaffSchedule.last_name}`
                : 'Staff Schedule'
              }
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {selectedStaffSchedule ? (
              <IndividualSchedule
                selectedStaffSchedule={selectedStaffSchedule}
                weekDates={weekDates}
                dayNames={dayNames}
                scheduleWeekStart={scheduleWeekStart}
                navigateWeek={navigateWeek}
                getScheduleForStaffDate={getScheduleForStaffDate}
              />
            ) : (
              <OverviewSchedule
                staffList={staffList}
                weekDates={weekDates}
                dayNames={dayNames}
                scheduleWeekStart={scheduleWeekStart}
                navigateWeek={navigateWeek}
                getScheduleForStaffDate={getScheduleForStaffDate}
              />
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
