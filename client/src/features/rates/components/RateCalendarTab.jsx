import React from 'react';
import { capitalize } from '../../../utils/formatters';

const RateCalendarTab = ({
  calendarMonthName,
  prevMonth,
  nextMonth,
  calendarRoomType,
  setCalendarRoomType,
  roomTypes,
  getCalendarDays,
}) => {
  return (
    <div className="tab-pane fade show active" role="tabpanel">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-sm btn-outline-secondary" onClick={prevMonth}>
              <i className="bi bi-chevron-left"></i>
            </button>
            <h5 className="mb-0">{calendarMonthName}</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={nextMonth}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={calendarRoomType}
              onChange={(e) => setCalendarRoomType(e.target.value)}
            >
              <option value="all">All Room Types</option>
              {roomTypes.map(rt => (
                <option key={rt} value={rt}>{capitalize(rt)}</option>
              ))}
            </select>
            <button className="btn btn-sm btn-primary">
              <i className="bi bi-pencil me-1"></i>Bulk Edit
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="rate-calendar">
            <div className="calendar-header">
              <div className="calendar-day-header">Sun</div>
              <div className="calendar-day-header">Mon</div>
              <div className="calendar-day-header">Tue</div>
              <div className="calendar-day-header">Wed</div>
              <div className="calendar-day-header">Thu</div>
              <div className="calendar-day-header">Fri</div>
              <div className="calendar-day-header">Sat</div>
            </div>
            <div className="calendar-grid">
              {getCalendarDays().map((day, idx) => {
                let cellClass = 'calendar-cell';
                if (day.otherMonth) cellClass += ' other-month';
                if (day.weekend && !day.otherMonth) cellClass += ' weekend';
                if (day.today) cellClass += ' today';

                return (
                  <div key={idx} className={cellClass}>
                    <span className="day-number">{day.day}</span>
                    {!day.otherMonth && (
                      <>
                        <span className="day-rate">{day.weekend ? 'Rs 125' : 'Rs 110'}</span>
                        <span className="occupancy">{day.weekend ? '85%' : '65%'}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="card-footer">
          <div className="calendar-legend">
            <span><span className="legend-dot regular"></span> Regular Rate</span>
            <span><span className="legend-dot weekend"></span> Weekend Rate</span>
            <span><span className="legend-dot special"></span> Special Event</span>
            <span><span className="legend-dot high-occ"></span> High Occupancy (&gt;85%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateCalendarTab;
