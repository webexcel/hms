import dayjs from 'dayjs';
import { capitalize } from '../../../utils/formatters';

export default function CalendarView({ reservations, currentMonth, onPrevMonth, onNextMonth, onToday, onDayClick }) {
  const startOfMonth = currentMonth.startOf('month');
  const startDay = startOfMonth.day(); // 0=Sun
  const today = dayjs();

  // Build weeks
  const prevMonthDays = startOfMonth.subtract(startDay, 'day');
  const weeks = [];
  let day = prevMonthDays;
  for (let w = 0; w < 5; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(day);
      day = day.add(1, 'day');
    }
    weeks.push(week);
  }

  const getEventsForDay = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return reservations.filter((res) => {
      const checkIn = dayjs(res.check_in).format('YYYY-MM-DD');
      const checkOut = dayjs(res.check_out).format('YYYY-MM-DD');
      return dateStr >= checkIn && dateStr < checkOut;
    });
  };

  const getEventType = (res, dateStr) => {
    const checkIn = dayjs(res.check_in).format('YYYY-MM-DD');
    const checkOut = dayjs(res.check_out).format('YYYY-MM-DD');
    if (dateStr === checkIn) return 'check-in';
    if (dateStr === checkOut) return 'check-out';
    if (res.status === 'confirmed') return 'confirmed';
    if (res.status === 'pending') return 'pending';
    return 'confirmed';
  };

  const getGuestShortName = (res) => {
    const name = res.guest_name || (res.guest ? `${res.guest.first_name || ''} ${res.guest.last_name || ''}`.trim() : '') || 'Guest';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}. ${parts[parts.length - 1]}`;
    return name;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="btn-nav" onClick={onPrevMonth}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <span className="current-month">{currentMonth.format('MMMM YYYY')}</span>
          <button className="btn-nav" onClick={onNextMonth}>
            <i className="bi bi-chevron-right"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary ms-2" onClick={onToday}>Today</button>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <span className="badge" style={{ background: 'rgba(23, 162, 184, 0.2)', color: 'var(--info-color)' }}>Check-in</span>
            <span className="badge" style={{ background: 'rgba(230, 126, 34, 0.2)', color: '#e67e22' }}>Check-out</span>
            <span className="badge" style={{ background: 'rgba(39, 174, 96, 0.2)', color: 'var(--success-color)' }}>Confirmed</span>
            <span className="badge" style={{ background: 'rgba(243, 156, 18, 0.2)', color: 'var(--warning-color)' }}>Pending</span>
          </div>
        </div>
      </div>
      <div className="calendar-grid">
        <table className="calendar-table">
          <thead>
            <tr>
              <th>Sun</th>
              <th>Mon</th>
              <th>Tue</th>
              <th>Wed</th>
              <th>Thu</th>
              <th>Fri</th>
              <th>Sat</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((d, di) => {
                  const isOtherMonth = d.month() !== currentMonth.month();
                  const isToday = d.format('YYYY-MM-DD') === today.format('YYYY-MM-DD');
                  const isPast = d.isBefore(today, 'day');
                  const dateStr = d.format('YYYY-MM-DD');
                  const events = isOtherMonth ? [] : getEventsForDay(d);
                  const displayEvents = events.slice(0, 3);
                  const moreCount = events.length - 3;
                  const isDisabled = isOtherMonth || isPast;

                  return (
                    <td key={di}>
                      <div
                        className={`calendar-day${isOtherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}${isPast ? ' past-day' : ''}`}
                        onClick={() => !isDisabled && onDayClick && onDayClick(d)}
                        style={{ cursor: isDisabled ? 'default' : 'pointer', opacity: isPast ? 0.5 : 1 }}
                      >
                        <div className="calendar-day-header">
                          <span className="calendar-day-number">{d.date()}</span>
                        </div>
                        {displayEvents.length > 0 && (
                          <div className="calendar-events">
                            {displayEvents.map((res, ei) => {
                              const evtType = getEventType(res, dateStr);
                              const shortName = getGuestShortName(res);
                              const label = evtType === 'check-in' ? `${shortName} (In)` :
                                evtType === 'check-out' ? `${shortName} (Out)` :
                                `${shortName} (Stay)`;
                              return (
                                <div
                                  key={res.id || ei}
                                  className={`calendar-event ${evtType}`}
                                  title={`${res.guest_name || res.guest?.name || 'Guest'} - ${capitalize(res.status)}`}
                                >
                                  {label}
                                </div>
                              );
                            })}
                            {moreCount > 0 && (
                              <span className="more-events">+{moreCount} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
