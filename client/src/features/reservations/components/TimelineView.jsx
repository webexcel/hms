import dayjs from 'dayjs';
import { capitalize } from '../../../utils/formatters';
import { getStatusBadgeClass } from '../hooks/useReservations';

export default function TimelineView({ reservations, rooms, timelineStart, onPrevWeek, onNextWeek, onThisWeek }) {
  const numDays = 14;
  const days = Array.from({ length: numDays }, (_, i) => timelineStart.add(i, 'day'));
  const today = dayjs().format('YYYY-MM-DD');
  const slotWidth = 80;

  const calendarRooms = rooms.length > 0 ? rooms : [];

  const getBookingsForRoom = (roomId) => {
    return reservations.filter((res) => {
      return res.room_id === roomId ||
        res.room?.id === roomId;
    }).filter((res) => {
      const checkIn = dayjs(res.check_in);
      const checkOut = dayjs(res.check_out);
      const rangeStart = days[0];
      const rangeEnd = days[days.length - 1].add(1, 'day');
      return checkIn.isBefore(rangeEnd) && checkOut.isAfter(rangeStart);
    });
  };

  const getGuestShortName = (res) => {
    const name = res.guest_name || (res.guest ? `${res.guest.first_name || ''} ${res.guest.last_name || ''}`.trim() : '') || 'Guest';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}. ${parts[parts.length - 1]}`;
    return name;
  };

  if (calendarRooms.length === 0) {
    return (
      <div className="text-center p-5 text-muted">
        No room data available for timeline view.
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <div className="timeline-nav">
        <button className="btn-nav" onClick={onPrevWeek}><i className="bi bi-chevron-left"></i></button>
        <span className="timeline-range">
          {timelineStart.format('MMM D')} — {timelineStart.add(numDays - 1, 'day').format('MMM D, YYYY')}
        </span>
        <button className="btn-nav" onClick={onNextWeek}><i className="bi bi-chevron-right"></i></button>
        <button className="btn btn-sm btn-outline-secondary ms-2" onClick={onThisWeek}>This Week</button>
      </div>
      <div className="timeline-scroll-wrapper">
        <div className="timeline-grid" style={{ minWidth: `${120 + numDays * slotWidth}px` }}>
          <div className="timeline-header">
            <div className="timeline-room-col">Room</div>
            <div className="timeline-dates">
              {days.map((d) => {
                const dateStr = d.format('YYYY-MM-DD');
                const isWeekend = d.day() === 0 || d.day() === 6;
                return (
                  <div key={dateStr} className={`timeline-date${dateStr === today ? ' today' : ''}${isWeekend ? ' weekend' : ''}`} style={{ minWidth: `${slotWidth}px` }}>
                    <div className="day">{d.format('ddd')}</div>
                    <div className="date">{d.date()}</div>
                    <div className="month">{d.format('MMM')}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="timeline-body">
            {calendarRooms.map((room) => {
              const bookings = getBookingsForRoom(room.id);
              return (
                <div className="timeline-row" key={room.id}>
                  <div className="timeline-room">
                    <div className="room-num">{room.room_number || room.number}</div>
                    <div className="room-type">{room.type || room.room_type || 'Standard'}</div>
                  </div>
                  <div className="timeline-slots" style={{ minWidth: `${numDays * slotWidth}px` }}>
                    {days.map((d) => {
                      const isWeekend = d.day() === 0 || d.day() === 6;
                      return <div className={`timeline-slot${isWeekend ? ' weekend' : ''}`} key={d.format('YYYY-MM-DD')} style={{ minWidth: `${slotWidth}px` }}></div>;
                    })}
                    {bookings.map((res) => {
                      const checkIn = dayjs(res.check_in);
                      const checkOut = dayjs(res.check_out);
                      const rangeStart = days[0];
                      const startOffset = Math.max(0, checkIn.diff(rangeStart, 'day', true));
                      const endOffset = Math.min(numDays, checkOut.diff(rangeStart, 'day', true));
                      const span = endOffset - startOffset;
                      if (span <= 0) return null;
                      return (
                        <div
                          key={res.id}
                          className={`timeline-booking ${getStatusBadgeClass(res.status)}`}
                          style={{ left: `${startOffset * slotWidth}px`, width: `${span * slotWidth - 4}px` }}
                          title={`${res.guest_name || 'Guest'} — ${capitalize(res.status)} — ${dayjs(res.check_in).format('MMM D')} to ${dayjs(res.check_out).format('MMM D')}`}
                        >
                          <span className="booking-guest">{getGuestShortName(res)}</span>
                          <span className="booking-room">#{room.room_number}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="timeline-legend">
        <span className="legend-item"><span className="legend-dot confirmed"></span> Confirmed</span>
        <span className="legend-item"><span className="legend-dot pending"></span> Pending</span>
        <span className="legend-item"><span className="legend-dot checked-in"></span> Checked In</span>
        <span className="legend-item"><span className="legend-dot checked-out"></span> Checked Out</span>
      </div>
    </div>
  );
}
