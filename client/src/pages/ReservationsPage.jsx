import { useState, useEffect, useRef } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatCurrency, capitalize } from '../utils/formatters';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

// GST-inclusive rate helper
const gstInclusiveRate = (baseRate) => Math.round((parseFloat(baseRate) || 0) * 1.12);

const STATUS_OPTIONS = [
  { label: 'All Reservations', value: '' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Checked In', value: 'checked_in' },
  { label: 'Cancelled', value: 'cancelled' },
];

const SOURCE_OPTIONS = [
  { label: 'Direct Booking', value: 'direct' },
  { label: 'Booking.com', value: 'booking_com' },
  { label: 'Expedia', value: 'expedia' },
  { label: 'Agoda', value: 'agoda' },
  { label: 'MakeMyTrip', value: 'makemytrip' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Walk-in', value: 'walk_in' },
];

const PAYMENT_OPTIONS = [
  { label: 'Pay at Hotel', value: 'pay_at_hotel' },
  { label: 'Prepaid - Card', value: 'prepaid_card' },
  { label: 'Prepaid - UPI', value: 'prepaid_upi' },
  { label: 'Corporate Credit', value: 'corporate_credit' },
];

const GUEST_OPTIONS = [
  { label: '1 Adult', value: '1_adult' },
  { label: '2 Adults', value: '2_adults' },
  { label: '2 Adults, 1 Child', value: '2_adults_1_child' },
  { label: '3 Adults', value: '3_adults' },
];

const initialFormData = {
  guest_id: '',
  room_id: '',
  room_type: '',
  check_in: dayjs().format('YYYY-MM-DD'),
  check_out: dayjs().add(2, 'day').format('YYYY-MM-DD'),
  guests_count: '2_adults',
  adults: 2,
  children: 0,
  rate_per_night: '',
  source: 'direct',
  payment_mode: 'pay_at_hotel',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  special_requests: '',
  send_confirmation: true,
  collect_advance: true,
  advance_amount: '0',
  advance_method: 'cash',
};

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function parseToDate(val) {
  if (!val) return new Date();
  if (val instanceof Date && !isNaN(val)) return val;
  const d = typeof val === 'string' ? new Date(val + (val.length === 10 ? 'T00:00:00' : '')) : new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

function DateRangePickerInput({ checkIn, checkOut, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const startDate = parseToDate(checkIn);
  const endDate = parseToDate(checkOut);

  const [range, setRange] = useState([{ startDate, endDate, key: 'selection' }]);

  useEffect(() => {
    setRange([{ startDate: parseToDate(checkIn), endDate: parseToDate(checkOut), key: 'selection' }]);
  }, [checkIn, checkOut]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ciDisplay = dayjs(startDate).isValid() ? dayjs(startDate).format('DD MMM YYYY') : '—';
  const coDisplay = dayjs(endDate).isValid() ? dayjs(endDate).format('DD MMM YYYY') : '—';
  const nights = dayjs(endDate).isValid() && dayjs(startDate).isValid() ? dayjs(endDate).diff(dayjs(startDate), 'day') : 0;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className="form-control form-control-custom d-flex align-items-center justify-content-between"
        style={{ cursor: 'pointer', minHeight: 38 }}
        onClick={() => setOpen(!open)}
      >
        <span>
          <i className="bi bi-box-arrow-in-right text-success me-1"></i>
          {ciDisplay}
          <span className="mx-2 text-muted">—</span>
          <i className="bi bi-box-arrow-right text-danger me-1"></i>
          {coDisplay}
          {nights > 0 && <span className="badge bg-primary-subtle text-primary ms-2">{nights} night{nights > 1 ? 's' : ''}</span>}
        </span>
        <i className="bi bi-calendar-range text-muted"></i>
      </div>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 1050, top: '100%', left: 0, marginTop: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', borderRadius: 12, overflow: 'hidden',
          border: '1px solid #e2e8f0', background: '#fff',
        }}>
          <DateRange
            ranges={range}
            onChange={(item) => {
              const sel = item.selection;
              setRange([sel]);
              const s = dayjs(sel.startDate);
              const e = dayjs(sel.endDate);
              if (s.isValid() && e.isValid()) {
                const startStr = s.format('YYYY-MM-DD');
                const endStr = e.format('YYYY-MM-DD');
                onChange(startStr, endStr);
              }
            }}
            moveRangeOnFirstSelection={false}
            months={2}
            direction="horizontal"
            minDate={new Date()}
            rangeColors={['#4f46e5']}
            showDateDisplay={false}
          />
          <div className="d-flex justify-content-end p-2 border-top">
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusBadgeClass(status) {
  const map = {
    pending: 'pending',
    confirmed: 'confirmed',
    checked_in: 'checked-in',
    checked_out: 'checked-out',
    cancelled: 'cancelled',
  };
  return map[status] || 'pending';
}

/* ===================== Calendar View ===================== */
function CalendarView({ reservations, currentMonth, onPrevMonth, onNextMonth, onToday, onDayClick }) {
  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');
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

/* ===================== List View ===================== */
function ListView({ reservations, loading, actionLoading, onAction, onRoomTransfer, currentPage, totalPages, onPageChange }) {
  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!reservations || reservations.length === 0) {
    return (
      <div className="text-center p-5 text-muted">
        No reservations found.
      </div>
    );
  }

  const getNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    return dayjs(checkOut).diff(dayjs(checkIn), 'day');
  };

  return (
    <>
      <div className="reservations-list">
        {reservations.map((res) => {
          const guestName = res.guest_name || res.guest?.name || 'N/A';
          const initials = getInitials(guestName);
          const roomNumber = res.room_number || res.room?.room_number || res.room?.number || 'N/A';
          const roomType = res.room_type || res.room?.type || '';
          const nights = getNights(res.check_in, res.check_out);
          const isLoading = actionLoading === res.id;

          return (
            <div className="reservation-item" key={res.id}>
              <div className="reservation-avatar">{initials}</div>
              <div className="reservation-details">
                <p className="res-guest">{guestName}</p>
                <p className="res-info">
                  <span><i className="bi bi-door-open"></i> Room {roomNumber}{roomType ? ` (${capitalize(roomType)})` : ''}</span>
                  {res.guest_phone && (
                    <span><i className="bi bi-telephone"></i> {res.guest_phone}</span>
                  )}
                  {res.guest_email && (
                    <span><i className="bi bi-envelope"></i> {res.guest_email}</span>
                  )}
                  {res.source && (
                    <span><i className="bi bi-globe"></i> {capitalize(res.source)}</span>
                  )}
                </p>
              </div>
              <div className="reservation-dates">
                <div className="date-range">{formatDate(res.check_in, 'MMM DD')}{res.booking_type !== 'hourly' ? ` - ${formatDate(res.check_out, 'MMM DD, YYYY')}` : ''}</div>
                <div className="nights">{res.booking_type === 'hourly'
                  ? <><i className="bi bi-clock" style={{ fontSize: 10, marginRight: 3 }}></i>{res.expected_hours || 3} Hour{(res.expected_hours || 3) !== 1 ? 's' : ''}</>
                  : <>{nights} Night{nights !== 1 ? 's' : ''}</>
                }</div>
              </div>
              <div className="reservation-status">
                <span className={`status-badge ${getStatusBadgeClass(res.status)}`}>{capitalize(res.status)}</span>
              </div>
              <div className="reservation-actions">
                {(res.status === 'confirmed' || res.status === 'pending') && (
                  <button
                    className="btn-icon"
                    title="Check In"
                    onClick={() => onAction(res.id, 'check_in')}
                    disabled={isLoading}
                  >
                    <i className="bi bi-box-arrow-in-right"></i>
                  </button>
                )}
                {res.status === 'pending' && (
                  <button
                    className="btn-icon"
                    title="Confirm"
                    onClick={() => onAction(res.id, 'confirm')}
                    disabled={isLoading}
                  >
                    <i className="bi bi-check-circle"></i>
                  </button>
                )}
                {res.status === 'checked_in' && (
                  <button
                    className="btn-icon"
                    title="Change Room"
                    onClick={() => onRoomTransfer(res)}
                    disabled={isLoading}
                    style={{ color: '#f59e0b' }}
                  >
                    <i className="bi bi-arrow-left-right"></i>
                  </button>
                )}
                {res.status === 'checked_in' && (
                  <button
                    className="btn-icon"
                    title="Check Out"
                    onClick={() => onAction(res.id, 'check_out')}
                    disabled={isLoading}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                  </button>
                )}
                {(res.status === 'pending' || res.status === 'confirmed') && (
                  <button
                    className="btn-icon"
                    title="Cancel Reservation"
                    onClick={() => onAction(res.id, 'cancel', res)}
                    disabled={isLoading}
                    style={{ color: '#dc2626' }}
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item${currentPage <= 1 ? ' disabled' : ''}`}>
              <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); onPageChange(currentPage - 1); }}>Previous</a>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li key={page} className={`page-item${currentPage === page ? ' active' : ''}`}>
                <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); onPageChange(page); }}>{page}</a>
              </li>
            ))}
            <li className={`page-item${currentPage >= totalPages ? ' disabled' : ''}`}>
              <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); onPageChange(currentPage + 1); }}>Next</a>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}

/* ===================== Timeline View ===================== */
function TimelineView({ reservations, rooms, timelineStart, onPrevWeek, onNextWeek, onThisWeek }) {
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

/* ===================== Day Detail Modal ===================== */
function DayDetailModal({ date, reservations, rooms, onClose, onNewBooking }) {
  if (!date) return null;

  const dateStr = date.format('YYYY-MM-DD');
  const totalRooms = rooms.length || 58;

  // Get check-ins for this day
  const checkIns = reservations.filter((res) => {
    return dayjs(res.check_in).format('YYYY-MM-DD') === dateStr;
  });

  // Get check-outs for this day
  const checkOuts = reservations.filter((res) => {
    return dayjs(res.check_out).format('YYYY-MM-DD') === dateStr;
  });

  // Get in-house guests (staying through this day)
  const inHouse = reservations.filter((res) => {
    const checkIn = dayjs(res.check_in).format('YYYY-MM-DD');
    const checkOut = dayjs(res.check_out).format('YYYY-MM-DD');
    return dateStr > checkIn && dateStr < checkOut && (res.status === 'checked_in' || res.status === 'confirmed');
  });

  const occupiedCount = checkIns.length + inHouse.length;

  const getNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    return dayjs(checkOut).diff(dayjs(checkIn), 'day');
  };

  const getRoomNumber = (res) => res.room?.room_number || res.room_number || 'N/A';
  const getRoomType = (res) => res.room?.room_type || res.room_type || 'Standard';
  const getGuestName = (res) => res.guest_name || (res.guest ? `${res.guest.first_name || ''} ${res.guest.last_name || ''}`.trim() : 'Guest');

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={onClose}>
      <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="day-detail-header">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="date-display">{date.format('MMMM D, YYYY')}</div>
                <div className="day-name">{date.format('dddd')}</div>
              </div>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="day-detail-stats">
              <div className="day-stat">
                <div className="stat-icon check-in"><i className="bi bi-box-arrow-in-right"></i></div>
                <div>
                  <div className="stat-count">{checkIns.length}</div>
                  <div className="stat-label">Check-ins</div>
                </div>
              </div>
              <div className="day-stat">
                <div className="stat-icon check-out"><i className="bi bi-box-arrow-right"></i></div>
                <div>
                  <div className="stat-count">{checkOuts.length}</div>
                  <div className="stat-label">Check-outs</div>
                </div>
              </div>
              <div className="day-stat">
                <div className="stat-icon stays"><i className="bi bi-house"></i></div>
                <div>
                  <div className="stat-count">{occupiedCount}</div>
                  <div className="stat-label">In-house</div>
                </div>
              </div>
            </div>
          </div>
          <div className="day-detail-body">
            {/* Check-ins Section */}
            {checkIns.length > 0 && (
              <div className="day-section">
                <div className="day-section-title check-in-title">
                  <i className="bi bi-box-arrow-in-right"></i> Arrivals
                </div>
                <div>
                  {checkIns.map((res) => {
                    const guestName = getGuestName(res);
                    const initials = getInitials(guestName);
                    const nights = getNights(res.check_in, res.check_out);
                    return (
                      <div className="day-booking-item" key={res.id}>
                        <div className="day-booking-avatar check-in">{initials}</div>
                        <div className="day-booking-info">
                          <div className="guest-name">{guestName}</div>
                          <div className="booking-details">
                            <span><i className="bi bi-door-open"></i> Room {getRoomNumber(res)}</span>
                            <span><i className="bi bi-tag"></i> {capitalize(getRoomType(res))}</span>
                            <span><i className="bi bi-moon"></i> {nights} Night{nights !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="day-booking-status">
                          <span className={`status-badge ${getStatusBadgeClass(res.status)}`}>{capitalize(res.status)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Check-outs Section */}
            {checkOuts.length > 0 && (
              <div className="day-section">
                <div className="day-section-title check-out-title">
                  <i className="bi bi-box-arrow-right"></i> Departures
                </div>
                <div>
                  {checkOuts.map((res) => {
                    const guestName = getGuestName(res);
                    const initials = getInitials(guestName);
                    const nights = getNights(res.check_in, res.check_out);
                    return (
                      <div className="day-booking-item" key={res.id}>
                        <div className="day-booking-avatar check-out">{initials}</div>
                        <div className="day-booking-info">
                          <div className="guest-name">{guestName}</div>
                          <div className="booking-details">
                            <span><i className="bi bi-door-open"></i> Room {getRoomNumber(res)}</span>
                            <span><i className="bi bi-tag"></i> {capitalize(getRoomType(res))}</span>
                            <span><i className="bi bi-moon"></i> {nights} Night{nights !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="day-booking-status">
                          <span className={`status-badge ${getStatusBadgeClass(res.status)}`}>{capitalize(res.status)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* In-House Guests Section */}
            {inHouse.length > 0 && (
              <div className="day-section">
                <div className="day-section-title stays-title">
                  <i className="bi bi-house"></i> Staying Guests
                </div>
                <div>
                  {inHouse.map((res) => {
                    const guestName = getGuestName(res);
                    const initials = getInitials(guestName);
                    return (
                      <div className="day-booking-item" key={res.id}>
                        <div className="day-booking-avatar stay">{initials}</div>
                        <div className="day-booking-info">
                          <div className="guest-name">{guestName}</div>
                          <div className="booking-details">
                            <span><i className="bi bi-door-open"></i> Room {getRoomNumber(res)}</span>
                            <span><i className="bi bi-tag"></i> {capitalize(getRoomType(res))}</span>
                            <span><i className="bi bi-calendar"></i> {formatDate(res.check_in, 'MMM DD')} - {formatDate(res.check_out, 'MMM DD')}</span>
                          </div>
                        </div>
                        <div className="day-booking-status">
                          <span className={`status-badge ${getStatusBadgeClass(res.status)}`}>{capitalize(res.status)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {checkIns.length === 0 && checkOuts.length === 0 && inHouse.length === 0 && (
              <div className="text-center p-4 text-muted">
                No reservations for this day.
              </div>
            )}
          </div>
          <div className="day-detail-footer">
            <div className="total-rooms">
              <strong>{occupiedCount}</strong> of <strong>{totalRooms}</strong> rooms occupied
            </div>
            {!date.isBefore(dayjs(), 'day') && (
              <button
                className="btn btn-primary btn-sm"
                style={{ background: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
                onClick={onNewBooking}
              >
                <i className="bi bi-plus-lg me-1"></i> Add Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Main Page ===================== */
export default function ReservationsPage() {
  const api = useApi();
  const { user } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(dayjs().startOf('month'));
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [calendarReservations, setCalendarReservations] = useState([]);
  const [timelineStart, setTimelineStart] = useState(dayjs().startOf('week').add(1, 'day')); // Monday
  const [timelineReservations, setTimelineReservations] = useState([]);

  // Group booking state
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [selectedGroupRooms, setSelectedGroupRooms] = useState([]);
  const [availableRoomsForGroup, setAvailableRoomsForGroup] = useState([]);
  const [selectedSingleRoom, setSelectedSingleRoom] = useState(null);
  const [omDiscount, setOmDiscount] = useState(false);
  const [omDiscountType, setOmDiscountType] = useState('percentage');
  const [omDiscountValue, setOmDiscountValue] = useState('');
  const [omDiscountReason, setOmDiscountReason] = useState('');
  const [mealPlan, setMealPlan] = useState('none');
  const [mealRates, setMealRates] = useState({ breakfast_rate: 250, dinner_rate: 400 });
  const [bookingType, setBookingType] = useState('nightly');
  const [expectedHours, setExpectedHours] = useState(2);

  // Room transfer state
  const [showRoomTransferModal, setShowRoomTransferModal] = useState(false);
  const [roomTransferData, setRoomTransferData] = useState({ reservationId: null, reservation: null, new_room_id: '', reason: '', adjust_rate: false });
  const [roomTransferLoading, setRoomTransferLoading] = useState(false);
  const [availableTransferRooms, setAvailableTransferRooms] = useState([]);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelPreview, setCancelPreview] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [overrideRefund, setOverrideRefund] = useState('');
  const [useOverride, setUseOverride] = useState(false);

  const fetchCalendarReservations = async (month) => {
    try {
      const start = month.startOf('month').subtract(7, 'day').format('YYYY-MM-DD');
      const end = month.endOf('month').add(7, 'day').format('YYYY-MM-DD');
      const res = await api.get(`/reservations?limit=500&check_in_date=${start}&check_out_date=${end}`);
      const data = res.data?.data || res.data?.reservations || res.data || [];
      // Normalize field names for calendar
      const normalized = (Array.isArray(data) ? data : []).map(r => ({
        ...r,
        check_in: r.check_in_date || r.check_in,
        check_out: r.check_out_date || r.check_out,
        guest_name: r.guest ? `${r.guest.first_name || ''} ${r.guest.last_name || ''}`.trim() : (r.guest_name || 'Guest'),
      }));
      setCalendarReservations(normalized);
    } catch (err) {
      console.error('Failed to fetch calendar reservations:', err);
    }
  };

  const fetchTimelineReservations = async (start) => {
    try {
      const from = start.format('YYYY-MM-DD');
      const to = start.add(14, 'day').format('YYYY-MM-DD');
      const res = await api.get(`/reservations?limit=500&check_in_date=${from}&check_out_date=${to}`);
      const data = res.data?.data || res.data?.reservations || res.data || [];
      const normalized = (Array.isArray(data) ? data : []).map(r => ({
        ...r,
        check_in: r.check_in_date || r.check_in,
        check_out: r.check_out_date || r.check_out,
        guest_name: r.guest ? `${r.guest.first_name || ''} ${r.guest.last_name || ''}`.trim() : (r.guest_name || 'Guest'),
      }));
      setTimelineReservations(normalized);
    } catch (err) {
      console.error('Failed to fetch timeline reservations:', err);
    }
  };

  const fetchReservations = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await api.get(`/reservations?${params.toString()}`);
      const data = res.data;
      setReservations(data.reservations || data.data || data || []);
      setTotalPages(data.totalPages || data.last_page || 1);
      setCurrentPage(data.currentPage || data.current_page || page);
    } catch (err) {
      toast.error('Failed to load reservations');
      console.error('ReservationsPage fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsAndGuests = async () => {
    try {
      const [roomsRes, guestsRes] = await Promise.all([
        api.get('/rooms?limit=200'),
        api.get('/guests?limit=100'),
      ]);
      setRooms(roomsRes.data?.rooms || roomsRes.data?.data || roomsRes.data || []);
      setGuests(guestsRes.data?.guests || guestsRes.data?.data || guestsRes.data || []);
    } catch (err) {
      console.error('Failed to load rooms/guests:', err);
    }
  };

  const fetchAvailableRoomsForGroup = async (checkIn, checkOut) => {
    if (!checkIn) return;
    const co = checkOut || checkIn;
    try {
      const res = await api.get(`/reservations/availability?check_in=${checkIn}&check_out=${co}`, { silent: true });
      const data = res.data?.available || res.data?.data || res.data || [];
      setAvailableRoomsForGroup(Array.isArray(data) ? data : []);
    } catch { setAvailableRoomsForGroup([]); }
  };

  const toggleGroupRoom = (rm) => {
    setSelectedGroupRooms(prev => {
      const exists = prev.find(r => r.room_id === rm.id);
      if (exists) return prev.filter(r => r.room_id !== rm.id);
      return [...prev, { room_id: rm.id, room_number: rm.room_number, room_type: rm.room_type || rm.type, rate: parseFloat(rm.base_rate || rm.rate || 0), hourly_rate: parseFloat(rm.hourly_rate) || Math.round((parseFloat(rm.base_rate || rm.rate || 0)) * 0.35), hourly_rates: rm.hourly_rates }];
    });
  };

  // Resolve tiered hourly rate: returns total price for the given hours
  const getHourlyTotal = (hours, room) => {
    const rates = room?.hourly_rates;
    if (rates && typeof rates === 'object') {
      const tierRate = rates[String(hours)];
      if (tierRate !== undefined) return parseFloat(tierRate);
      const tiers = Object.keys(rates).filter(k => k !== 'default').map(Number).sort((a, b) => a - b);
      const defaultPerHour = parseFloat(rates.default) || parseFloat(room?.hourly_rate) || Math.round((parseFloat(room?.base_rate || room?.rate || room?.price || 0)) * 0.35);
      const bestTier = tiers.filter(t => t <= hours).pop();
      if (bestTier) return parseFloat(rates[String(bestTier)]) + (hours - bestTier) * defaultPerHour;
      return hours * defaultPerHour;
    }
    return hours * (parseFloat(room?.hourly_rate) || Math.round((parseFloat(room?.base_rate || room?.rate || room?.price || 0)) * 0.35));
  };

  const fetchMealRates = async () => {
    try {
      const res = await api.get('/settings', { silent: true });
      const settings = res.data?.data || res.data || [];
      const arr = Array.isArray(settings) ? settings : [];
      const br = arr.find(s => s.key === 'meal_breakfast_rate');
      const dr = arr.find(s => s.key === 'meal_dinner_rate');
      if (br) setMealRates(prev => ({ ...prev, breakfast_rate: parseFloat(br.value) || 250 }));
      if (dr) setMealRates(prev => ({ ...prev, dinner_rate: parseFloat(dr.value) || 400 }));
    } catch { /* use defaults */ }
  };

  useEffect(() => {
    fetchReservations();
    fetchRoomsAndGuests();
    fetchMealRates();
    fetchCalendarReservations(calendarMonth);
    fetchTimelineReservations(timelineStart);
  }, []);

  useEffect(() => {
    fetchReservations(1);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchCalendarReservations(calendarMonth);
  }, [calendarMonth]);

  useEffect(() => {
    fetchTimelineReservations(timelineStart);
  }, [timelineStart]);

  // Stats
  const allReservations = Array.isArray(reservations) ? reservations : [];

  // Room types for the form
  const roomTypes = [];
  const seenTypes = new Set();
  rooms.forEach((r) => {
    const type = r.type || r.room_type || 'Standard';
    if (!seenTypes.has(type)) {
      seenTypes.add(type);
      const available = rooms.filter(rm => (rm.type || rm.room_type || 'Standard') === type && rm.status === 'available').length;
      const rate = r.base_rate || r.rate || r.rate_per_night || r.price || 0;
      roomTypes.push({ name: type, desc: r.description || '', price: rate, available, hourly_rates: r.hourly_rates, hourly_rate: r.hourly_rate });
    }
  });

  // Form handlers
  const handleOpenNewModal = (date) => {
    const checkIn = date ? dayjs(date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    const checkOut = dayjs(checkIn).add(2, 'day').format('YYYY-MM-DD');
    setFormData({ ...initialFormData, check_in: checkIn, check_out: checkOut });
    setEditingId(null);
    setSelectedRoomType('');
    setSelectedSingleRoom(null);
    setIsGroupBooking(false);
    setSelectedGroupRooms([]);
    setAvailableRoomsForGroup([]);
    setMealPlan('none');
    setOmDiscount(false);
    setOmDiscountType('percentage');
    setOmDiscountValue('');
    setOmDiscountReason('');
    setBookingType('nightly');
    setExpectedHours(3);
    fetchAvailableRoomsForGroup(checkIn, checkOut);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setFormData(initialFormData);
    setEditingId(null);
    setSelectedRoomType('');
    setSelectedSingleRoom(null);
    setIsGroupBooking(false);
    setSelectedGroupRooms([]);
    setAvailableRoomsForGroup([]);
    setMealPlan('none');
    setOmDiscount(false);
    setOmDiscountType('percentage');
    setOmDiscountValue('');
    setOmDiscountReason('');
    setBookingType('nightly');
    setExpectedHours(3);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoomTypeSelect = (type, price) => {
    setSelectedRoomType(type);
    setSelectedSingleRoom(null);
    setFormData((prev) => ({ ...prev, room_type: type, rate_per_night: price || prev.rate_per_night }));
  };

  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setFormLoading(true);

      if (isGroupBooking && selectedGroupRooms.length < 2) {
        toast.error('Please select at least 2 rooms for group booking');
        setFormLoading(false);
        return;
      }

      // Build discount note for special_requests
      let discountNote = '';
      if (omDiscount && omDiscountValue && Number(omDiscountValue) > 0) {
        discountNote = omDiscountType === 'percentage'
          ? `OM Discount: ${omDiscountValue}%`
          : `OM Discount: ₹${omDiscountValue}`;
        if (omDiscountReason) discountNote += ` (${omDiscountReason})`;
      }
      const specialReqs = [formData.special_requests, discountNote].filter(Boolean).join(' | ');

      // Compute effective rate after discount
      let effectiveRate = parseFloat(formData.rate_per_night) || 0;
      if (omDiscount && omDiscountValue && Number(omDiscountValue) > 0) {
        if (omDiscountType === 'percentage') {
          effectiveRate = effectiveRate * (1 - Number(omDiscountValue) / 100);
        } else {
          effectiveRate = Math.max(0, effectiveRate - (Number(omDiscountValue) / (nights || 1)));
        }
        effectiveRate = Math.round(effectiveRate * 100) / 100;
      }

      const isHourly = bookingType === 'hourly';
      const advanceAmount = formData.collect_advance && formData.advance_amount ? Number(formData.advance_amount) : 0;

      const baseSubmitData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        check_in_date: formData.check_in,
        check_out_date: isHourly ? formData.check_in : formData.check_out,
        adults: formData.adults || 2,
        children: formData.children || 0,
        source: formData.source,
        special_requests: [specialReqs, isHourly ? `Short Stay: ${expectedHours}h` : ''].filter(Boolean).join(' | '),
        meal_plan: isHourly ? 'none' : mealPlan,
        booking_type: bookingType,
        ...(isHourly ? { expected_hours: expectedHours } : {}),
        ...(advanceAmount > 0 ? { advance_paid: advanceAmount, payment_mode: formData.advance_method || 'cash' } : {}),
      };

      if (editingId) {
        await api.put(`/reservations/${editingId}`, { ...baseSubmitData, rate_per_night: formData.rate_per_night });
        toast.success('Reservation updated successfully');
      } else if (isGroupBooking && selectedGroupRooms.length > 1) {
        const submitData = {
          ...baseSubmitData,
          rooms: selectedGroupRooms.map(r => {
            let rate = isHourly
              ? (parseFloat(r.hourly_rate) || Math.round((r.rate || 0) * 0.35))
              : r.rate;
            if (omDiscount && omDiscountValue && Number(omDiscountValue) > 0) {
              if (omDiscountType === 'percentage') {
                rate = rate * (1 - Number(omDiscountValue) / 100);
              } else {
                // Flat: split equally across all rooms
                rate = Math.max(0, rate - (Number(omDiscountValue) / selectedGroupRooms.length));
              }
            }
            return {
              room_id: r.room_id,
              rate_per_night: isHourly ? 0 : Math.round(rate * 100) / 100,
            };
          }),
        };
        const res = await api.post('/reservations', submitData);
        const groupId = res.data?.data?.group_id || res.data?.group_id;
        toast.success(`Group booking created (${selectedGroupRooms.length} rooms)${groupId ? ` — ${groupId}` : ''}`);
      } else {
        const submitData = {
          ...baseSubmitData,
          room_type: formData.room_type,
          rate_per_night: isHourly ? 0 : effectiveRate,
          ...(selectedSingleRoom ? { room_id: selectedSingleRoom.id } : {}),
        };
        const res = await api.post('/reservations', submitData);
        const created = res.data || {};
        const roomNum = selectedSingleRoom?.room_number || created.room?.room_number || created.Room?.room_number || '';
        toast.success(`Reservation created — Room ${roomNum} allocated`);
      }
      handleCloseModal();
      fetchReservations(currentPage);
      fetchCalendarReservations(calendarMonth);
      fetchTimelineReservations(timelineStart);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save reservation';
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAction = async (reservationId, action, reservation) => {
    // Intercept cancel to show modal with refund preview
    if (action === 'cancel') {
      setCancelTarget(reservation || { id: reservationId });
      setCancelPreview(null);
      setOverrideRefund('');
      setUseOverride(false);
      setShowCancelModal(true);
      try {
        const { data } = await api.get(`/reservations/${reservationId}/refund-preview`);
        setCancelPreview(data);
        setOverrideRefund(data.refund_amount?.toString() || '0');
      } catch {
        setCancelPreview({ error: true });
      }
      return;
    }

    const actionMap = {
      check_in: { endpoint: `/reservations/${reservationId}/check-in`, label: 'Checked in' },
      check_out: { endpoint: `/reservations/${reservationId}/check-out`, label: 'Checked out' },
      confirm: { endpoint: `/reservations/${reservationId}/confirm`, label: 'Confirmed' },
    };

    const config = actionMap[action];
    if (!config) return;

    try {
      setActionLoading(reservationId);
      await api.put(config.endpoint);
      toast.success(`${config.label} successfully`);
      fetchReservations(currentPage);
      fetchCalendarReservations(calendarMonth);
      fetchTimelineReservations(timelineStart);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action.replace('_', ' ')}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const reservationId = cancelTarget.id;
    const body = {};
    if (useOverride && cancelPreview?.can_override) {
      body.override_refund_amount = parseFloat(overrideRefund) || 0;
    }
    try {
      setCancelLoading(true);
      const res = await api.put(`/reservations/${reservationId}/cancel`, body);
      const refund = res?.data?.refund_amount;
      if (refund > 0) {
        toast.success(`Reservation cancelled. Refund of ₹${refund}${res?.data?.refund_overridden ? ' (OM override)' : ''} to be processed.`);
      } else {
        toast.success('Reservation cancelled. No refund applicable.');
      }
      setShowCancelModal(false);
      setCancelTarget(null);
      fetchReservations(currentPage);
      fetchCalendarReservations(calendarMonth);
      fetchTimelineReservations(timelineStart);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleDayClick = (date) => {
    setSelectedDay(date);
    setShowDayDetailModal(true);
  };

  const handleCloseDayDetail = () => {
    setShowDayDetailModal(false);
    setSelectedDay(null);
  };

  // Room Transfer handlers
  const openRoomTransfer = (reservation) => {
    const currentRoomId = reservation.room_id || reservation.room?.id;
    // Filter rooms: available/cleaning/reserved, and not the current room
    const transferRooms = rooms.filter(r => r.id !== currentRoomId && ['available', 'reserved', 'cleaning'].includes(r.status));
    setAvailableTransferRooms(transferRooms);
    setRoomTransferData({ reservationId: reservation.id, reservation, new_room_id: '', reason: '', adjust_rate: false });
    setShowRoomTransferModal(true);
  };

  const handleRoomTransfer = async () => {
    if (!roomTransferData.new_room_id) {
      toast.error('Please select a room to transfer to');
      return;
    }
    try {
      setRoomTransferLoading(true);
      const res = await api.put(`/reservations/${roomTransferData.reservationId}/room-transfer`, {
        new_room_id: roomTransferData.new_room_id,
        reason: roomTransferData.reason,
        adjust_rate: roomTransferData.adjust_rate,
      });
      toast.success(res.data?.message || 'Room transferred successfully');
      setShowRoomTransferModal(false);
      fetchReservations(currentPage);
      fetchCalendarReservations(calendarMonth);
      fetchTimelineReservations(timelineStart);
      // Refresh rooms list to update statuses
      const roomRes = await api.get('/rooms?limit=200');
      setRooms(roomRes.data?.data || roomRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transfer room');
    } finally {
      setRoomTransferLoading(false);
    }
  };

  const handleFilterSelect = (value) => {
    setStatusFilter(value);
    setShowFilterDropdown(false);
  };

  // Calculate nights/hours and total for booking summary
  const isHourlyBooking = bookingType === 'hourly';
  const nights = formData.check_in && formData.check_out && !isHourlyBooking
    ? dayjs(formData.check_out).diff(dayjs(formData.check_in), 'day')
    : 0;
  const baseRate = parseFloat(formData.rate_per_night) || 0;
  const rateInclGst = gstInclusiveRate(baseRate);
  const hourlyTotalCalc = selectedSingleRoom
    ? getHourlyTotal(expectedHours, selectedSingleRoom)
    : (baseRate ? Math.round(baseRate * 0.35) * expectedHours : 0);
  const grandTotalBeforeDiscount = isHourlyBooking
    ? gstInclusiveRate(hourlyTotalCalc)
    : nights * rateInclGst;
  // OM Discount calculation
  let omDiscountAmount = 0;
  if (omDiscount && omDiscountValue && Number(omDiscountValue) > 0) {
    if (omDiscountType === 'percentage') {
      omDiscountAmount = Math.round(grandTotalBeforeDiscount * (Number(omDiscountValue) / 100) * 100) / 100;
    } else {
      omDiscountAmount = Math.round(Number(omDiscountValue) * 100) / 100;
    }
  }
  const grandTotal = grandTotalBeforeDiscount - omDiscountAmount;

  if (loading && reservations.length === 0) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Action Bar */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          {/* Search */}
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="form-control form-control-custom"
              placeholder="Search reservations..."
              style={{ paddingLeft: '2.5rem', minWidth: '250px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Filter */}
          <div className="dropdown" style={{ position: 'relative' }}>
            <button
              className="btn btn-outline-secondary dropdown-toggle"
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <i className="bi bi-funnel me-1"></i> Filter
            </button>
            {showFilterDropdown && (
              <ul className="dropdown-menu show" style={{ display: 'block' }}>
                {STATUS_OPTIONS.map((opt) => (
                  <li key={opt.value}>
                    <a
                      className={`dropdown-item${statusFilter === opt.value ? ' active' : ''}`}
                      href="#"
                      onClick={(e) => { e.preventDefault(); handleFilterSelect(opt.value); }}
                    >
                      {opt.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ background: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
          onClick={handleOpenNewModal}
        >
          <i className="bi bi-plus-lg me-1"></i> New Reservation
        </button>
      </div>

      {/* View Tabs */}
      <ul className="nav nav-tabs nav-tabs-custom mb-4" role="tablist">
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'calendar' ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab('calendar')}
          >
            <i className="bi bi-calendar3 me-1"></i> Calendar View
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'list' ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab('list')}
          >
            <i className="bi bi-list-ul me-1"></i> List View
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${activeTab === 'timeline' ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab('timeline')}
          >
            <i className="bi bi-view-stacked me-1"></i> Timeline View
          </button>
        </li>
      </ul>

      <div className="tab-content">
        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <div className="tab-pane fade show active" style={{ display: 'block' }}>
            <CalendarView
              reservations={calendarReservations}
              currentMonth={calendarMonth}
              onPrevMonth={() => setCalendarMonth(prev => prev.subtract(1, 'month'))}
              onNextMonth={() => setCalendarMonth(prev => prev.add(1, 'month'))}
              onToday={() => setCalendarMonth(dayjs().startOf('month'))}
              onDayClick={handleDayClick}
            />
          </div>
        )}

        {/* List View */}
        {activeTab === 'list' && (
          <div className="tab-pane fade show active" style={{ display: 'block' }}>
            <ListView
              reservations={allReservations}
              loading={loading}
              actionLoading={actionLoading}
              onAction={handleAction}
              onRoomTransfer={openRoomTransfer}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => fetchReservations(page)}
            />
          </div>
        )}

        {/* Timeline View */}
        {activeTab === 'timeline' && (
          <div className="tab-pane fade show active" style={{ display: 'block' }}>
            <TimelineView
              reservations={timelineReservations}
              rooms={rooms}
              timelineStart={timelineStart}
              onPrevWeek={() => setTimelineStart(prev => prev.subtract(7, 'day'))}
              onNextWeek={() => setTimelineStart(prev => prev.add(7, 'day'))}
              onThisWeek={() => setTimelineStart(dayjs().startOf('week').add(1, 'day'))}
            />
          </div>
        )}
      </div>

      {/* Day Detail Modal */}
      {showDayDetailModal && selectedDay && (
        <DayDetailModal
          date={selectedDay}
          reservations={calendarReservations}
          rooms={rooms}
          onClose={handleCloseDayDetail}
          onNewBooking={() => {
            const day = selectedDay;
            handleCloseDayDetail();
            handleOpenNewModal(day);
          }}
        />
      )}

      {/* New / Edit Reservation Modal */}
      {showFormModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={handleCloseModal}>
          <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
          <div className="modal-dialog modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header modal-header-custom">
                <h5 className="modal-title d-flex align-items-center gap-2" style={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  <i className={`bi ${isGroupBooking ? 'bi-people-fill' : 'bi-calendar-plus'} me-1`}></i>
                  {editingId ? 'Edit Reservation' : isGroupBooking ? 'Group Booking' : 'New Reservation'}
                  {isGroupBooking && selectedGroupRooms.length > 0 && (
                    <span className="badge bg-warning text-dark ms-2">{selectedGroupRooms.length} Rooms</span>
                  )}
                </h5>
                <div className="d-flex align-items-center" style={{ flex: '0 0 auto', gap: 12 }}>
                  {!editingId && (
                    <label className="d-flex align-items-center" style={{ gap: 8, cursor: 'pointer', margin: 0 }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 900, color: isGroupBooking ? '#f59e0b' : '#94a3b8', whiteSpace: 'nowrap' }}>Group Bookings</span>
                      <div className="form-check form-switch" style={{ margin: 0, padding: 0, minHeight: 'auto' }}>
                        <input className="form-check-input" type="checkbox" role="switch" checked={isGroupBooking}
                          onChange={(e) => {
                            setIsGroupBooking(e.target.checked);
                            setSelectedGroupRooms([]);
                            if (formData.check_in && formData.check_out) {
                              fetchAvailableRoomsForGroup(formData.check_in, formData.check_out);
                            }
                          }} style={{ width: 36, height: 18, margin: 0, float: 'none', cursor: 'pointer' }} />
                      </div>
                    </label>
                  )}
                  <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                </div>
              </div>
              <div className="modal-body modal-body-custom">
                <div className="row g-4">
                  {/* Left Column - Form */}
                  <div className="col-lg-8">
                    {/* Dates Section */}
                    <div className="form-section border rounded mb-3">
                      <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><i className="bi bi-calendar-range"></i> Stay Details</span>
                        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2 }}>
                          <button type="button" onClick={() => { setBookingType('nightly'); }}
                            style={{ padding: '4px 12px', borderRadius: 5, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              background: bookingType === 'nightly' ? '#2dd4bf' : 'transparent',
                              color: bookingType === 'nightly' ? '#0f172a' : '#64748b' }}>
                            <i className="bi bi-moon me-1"></i>Nightly
                          </button>
                          <button type="button" onClick={() => {
                            setBookingType('hourly');
                            setMealPlan('none');
                            const today = dayjs().format('YYYY-MM-DD');
                            handleFormChange('check_in', today);
                            handleFormChange('check_out', today);
                            fetchAvailableRoomsForGroup(today, today);
                          }}
                            style={{ padding: '4px 12px', borderRadius: 5, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              background: bookingType === 'hourly' ? '#f59e0b' : 'transparent',
                              color: bookingType === 'hourly' ? '#0f172a' : '#64748b' }}>
                            <i className="bi bi-clock me-1"></i>Short Stay
                          </button>
                        </div>
                      </div>
                      <div className="row g-3">
                        {bookingType === 'hourly' && (
                          <div className="col-12">
                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                              <i className="bi bi-clock-fill" style={{ color: '#f59e0b', fontSize: 18 }}></i>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Short Stay Duration</div>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  {(() => {
                                    const src = selectedSingleRoom || rooms.find(r => r.hourly_rates);
                                    const rates = src?.hourly_rates;
                                    if (rates && typeof rates === 'object') {
                                      const tiers = Object.keys(rates).filter(k => k !== 'default').map(Number).sort((a, b) => a - b);
                                      const maxTier = Math.max(...tiers, 3);
                                      return [...new Set([...tiers, maxTier + 1, maxTier + 2, maxTier + 3])].sort((a, b) => a - b).map(h => (
                                        <button key={h} type="button" onClick={() => setExpectedHours(h)}
                                          style={{ padding: '4px 10px', borderRadius: 6, border: `2px solid ${expectedHours === h ? '#f59e0b' : '#e2e8f0'}`,
                                            background: expectedHours === h ? '#fef3c7' : '#fff', fontSize: 12, fontWeight: 700,
                                            color: expectedHours === h ? '#92400e' : '#64748b', cursor: 'pointer' }}>
                                          {h}h
                                        </button>
                                      ));
                                    }
                                    return [2, 3, 4, 5, 6, 8].map(h => (
                                      <button key={h} type="button" onClick={() => setExpectedHours(h)}
                                        style={{ padding: '4px 10px', borderRadius: 6, border: `2px solid ${expectedHours === h ? '#f59e0b' : '#e2e8f0'}`,
                                          background: expectedHours === h ? '#fef3c7' : '#fff', fontSize: 12, fontWeight: 700,
                                          color: expectedHours === h ? '#92400e' : '#64748b', cursor: 'pointer' }}>
                                        {h}h
                                      </button>
                                    ));
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className={bookingType === 'hourly' ? 'col-12' : 'col-md-8'}>
                          <label className="form-label-custom">{bookingType === 'hourly' ? 'Check-in Date *' : 'Check-in & Check-out Dates *'}</label>
                          {bookingType === 'hourly' ? (
                            <input
                              type="date"
                              className="form-control"
                              value={formData.check_in}
                              min={dayjs().format('YYYY-MM-DD')}
                              onChange={(e) => {
                                const d = e.target.value;
                                handleFormChange('check_in', d);
                                handleFormChange('check_out', d);
                                fetchAvailableRoomsForGroup(d, d);
                              }}
                              style={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
                            />
                          ) : (
                          <DateRangePickerInput
                            checkIn={formData.check_in}
                            checkOut={formData.check_out}
                            onChange={(startDate, endDate) => {
                              handleFormChange('check_in', startDate);
                              handleFormChange('check_out', endDate);
                              fetchAvailableRoomsForGroup(startDate, endDate);
                            }}
                          />
                          )}
                        </div>
                        <div className="col-md-4">
                          <label className="form-label-custom">Number of Guests</label>
                          <select
                            className="form-select form-select-custom"
                            value={formData.guests_count}
                            onChange={(e) => handleFormChange('guests_count', e.target.value)}
                          >
                            {GUEST_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Meal Plan - hidden for short stay */}
                    {bookingType !== 'hourly' && <div className="form-section border rounded mb-3">
                      <div className="form-section-title">
                        <i className="bi bi-cup-hot"></i> Meal Plan
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        {[
                          { value: 'none', label: 'Room Only', icon: 'bi-house', color: '#64748b' },
                          { value: 'breakfast', label: 'Breakfast', icon: 'bi-sunrise', color: '#f59e0b' },
                          { value: 'dinner', label: 'Dinner', icon: 'bi-moon-stars', color: '#6366f1' },
                          { value: 'both', label: 'B + D', icon: 'bi-stars', color: '#10b981' },
                        ].map(opt => (
                          <div key={opt.value} onClick={() => setMealPlan(opt.value)} style={{
                            cursor: 'pointer', padding: '8px 16px', borderRadius: 8, textAlign: 'center', minWidth: 90,
                            border: `2px solid ${mealPlan === opt.value ? opt.color : '#e2e8f0'}`,
                            background: mealPlan === opt.value ? `${opt.color}15` : '#fff',
                          }}>
                            <i className={`bi ${opt.icon}`} style={{ fontSize: 16, color: mealPlan === opt.value ? opt.color : '#94a3b8' }}></i>
                            <div style={{ fontSize: 11, fontWeight: 700, color: mealPlan === opt.value ? opt.color : '#1a1a2e' }}>{opt.label}</div>
                            {opt.value !== 'none' && (
                              <div style={{ fontSize: 10, color: '#64748b' }}>
                                +{formatCurrency(opt.value === 'both' ? mealRates.breakfast_rate + mealRates.dinner_rate : mealRates[`${opt.value}_rate`])}/pax/night
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>}

                    {/* Group Room Picker */}
                    {isGroupBooking && (
                      <div className="form-section border rounded mb-3">
                        <div className="form-section-title">
                          <i className="bi bi-grid-3x3-gap"></i> Select Rooms ({selectedGroupRooms.length} selected)
                        </div>
                        {availableRoomsForGroup.length === 0 ? (
                          <p className="text-muted text-center py-3">Select check-in & check-out dates to see available rooms</p>
                        ) : (
                          <div className="row g-2">
                            {availableRoomsForGroup.map(rm => {
                              const isSelected = selectedGroupRooms.some(r => r.room_id === rm.id);
                              return (
                                <div className="col-md-4 col-lg-3" key={rm.id}>
                                  <div onClick={() => toggleGroupRoom(rm)} style={{
                                    cursor: 'pointer', padding: '10px 12px', borderRadius: 8,
                                    border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                                    background: isSelected ? '#f0fdf4' : '#fff',
                                  }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                      <strong style={{ fontSize: 14 }}>{rm.room_number}</strong>
                                      <input type="checkbox" className="form-check-input" checked={isSelected} readOnly style={{ pointerEvents: 'none' }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b' }}>{capitalize(rm.room_type || rm.type || '')}</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: bookingType === 'hourly' ? '#92400e' : '#1a1a2e' }}>
                                      {bookingType === 'hourly'
                                        ? `${formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours, rm)))} / ${expectedHours}h`
                                        : `${formatCurrency(gstInclusiveRate(rm.base_rate || rm.rate || 0))}/night`
                                      }
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Room Type Selection - Single booking only */}
                    {!isGroupBooking && (
                    <div className="form-section border rounded mb-3">
                      <div className="form-section-title">
                        <i className="bi bi-door-open"></i> Select Room Type
                      </div>
                      <div className="row g-3">
                        {roomTypes.length > 0 ? roomTypes.map((rt) => (
                          <div className="col-md-6 col-lg-3" key={rt.name}>
                            <div
                              className={`room-type-card${selectedRoomType === rt.name ? ' selected' : ''}`}
                              onClick={() => handleRoomTypeSelect(rt.name, rt.price)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="room-type-name">{capitalize(rt.name)}</div>
                              <div className="room-type-desc">{rt.desc || 'Standard amenities'}</div>
                              <div className="room-type-price">
                                {bookingType === 'hourly'
                                  ? <>{formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours, rt)))} <small>/ {expectedHours}h <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST</span></small></>
                                  : <>{formatCurrency(gstInclusiveRate(rt.price))} <small>/night <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST</span></small></>
                                }
                              </div>
                              <div className={`availability${rt.available <= 2 ? ' low' : ''}`}>{rt.available} room{rt.available !== 1 ? 's' : ''} available</div>
                            </div>
                          </div>
                        )) : (
                          <>
                            <div className="col-md-6 col-lg-3">
                              <div
                                className={`room-type-card${selectedRoomType === 'standard' ? ' selected' : ''}`}
                                onClick={() => handleRoomTypeSelect('standard', 2500)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="room-type-name">Standard</div>
                                <div className="room-type-desc">Basic amenities, 1 King bed</div>
                                <div className="room-type-price">{formatCurrency(gstInclusiveRate(2500))} <small>/night <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST</span></small></div>
                                <div className="availability">8 rooms available</div>
                              </div>
                            </div>
                            <div className="col-md-6 col-lg-3">
                              <div
                                className={`room-type-card${selectedRoomType === 'deluxe' ? ' selected' : ''}`}
                                onClick={() => handleRoomTypeSelect('deluxe', 3500)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="room-type-name">Deluxe</div>
                                <div className="room-type-desc">City view, 1 King bed</div>
                                <div className="room-type-price">{formatCurrency(gstInclusiveRate(3500))} <small>/night <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST</span></small></div>
                                <div className="availability">5 rooms available</div>
                              </div>
                            </div>
                            <div className="col-md-6 col-lg-3">
                              <div
                                className={`room-type-card${selectedRoomType === 'suite' ? ' selected' : ''}`}
                                onClick={() => handleRoomTypeSelect('suite', 5500)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="room-type-name">Suite</div>
                                <div className="room-type-desc">Living area, 1 King bed</div>
                                <div className="room-type-price">{formatCurrency(gstInclusiveRate(5500))} <small>/night <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST</span></small></div>
                                <div className="availability low">2 rooms available</div>
                              </div>
                            </div>
                            <div className="col-md-6 col-lg-3">
                              <div
                                className={`room-type-card${selectedRoomType === 'premium' ? ' selected' : ''}`}
                                onClick={() => handleRoomTypeSelect('premium', 8500)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="room-type-name">Premium</div>
                                <div className="room-type-desc">Luxury suite, 2 beds</div>
                                <div className="room-type-price">{formatCurrency(gstInclusiveRate(8500))} <small>/night <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST</span></small></div>
                                <div className="availability low">1 room available</div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Room Picker for single booking */}
                      {selectedRoomType && availableRoomsForGroup.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                            <i className="bi bi-grid-3x3-gap me-1"></i> Select Room ({availableRoomsForGroup.filter(rm => (rm.room_type || rm.type || '').toLowerCase() === selectedRoomType.toLowerCase()).length} available)
                          </div>
                          <div className="row g-2">
                            {availableRoomsForGroup
                              .filter(rm => (rm.room_type || rm.type || '').toLowerCase() === selectedRoomType.toLowerCase())
                              .map(rm => {
                                const isSelected = selectedSingleRoom?.id === rm.id;
                                return (
                                  <div className="col-md-4 col-lg-3" key={rm.id}>
                                    <div onClick={() => {
                                      setSelectedSingleRoom(isSelected ? null : rm);
                                      if (!isSelected) {
                                        setFormData(prev => ({ ...prev, rate_per_night: parseFloat(rm.base_rate || rm.rate || 0) }));
                                      }
                                    }} style={{
                                      cursor: 'pointer', padding: '10px 12px', borderRadius: 8,
                                      border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                                      background: isSelected ? '#f0fdf4' : '#fff',
                                      transition: 'all 0.15s',
                                    }}>
                                      <div className="d-flex justify-content-between align-items-center">
                                        <strong style={{ fontSize: 14 }}>{rm.room_number}</strong>
                                        {isSelected && <i className="bi bi-check-circle-fill" style={{ color: '#10b981' }}></i>}
                                      </div>
                                      <div style={{ fontSize: 11, color: '#64748b' }}>Floor {rm.floor} &middot; Max {rm.max_occupancy || 2} guests</div>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: bookingType === 'hourly' ? '#92400e' : '#1a1a2e' }}>
                                        {bookingType === 'hourly'
                                          ? `${formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours, rm)))} / ${expectedHours}h`
                                          : `${formatCurrency(gstInclusiveRate(rm.base_rate || rm.rate || 0))}/night`
                                        }
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            {availableRoomsForGroup.filter(rm => (rm.room_type || rm.type || '').toLowerCase() === selectedRoomType.toLowerCase()).length === 0 && (
                              <div className="col-12">
                                <p className="text-muted text-center py-2" style={{ fontSize: 13 }}>No {selectedRoomType} rooms available for selected dates</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    )}

                    {/* Guest Information */}
                    <div className="form-section border rounded">
                      <div className="form-section-title">
                        <i className="bi bi-person"></i> Guest Information
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label-custom">First Name *</label>
                          <input
                            type="text"
                            className="form-control form-control-custom"
                            placeholder="Enter first name"
                            value={formData.first_name}
                            onChange={(e) => handleFormChange('first_name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label-custom">Last Name</label>
                          <input
                            type="text"
                            className="form-control form-control-custom"
                            placeholder="Enter last name"
                            value={formData.last_name}
                            onChange={(e) => handleFormChange('last_name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label-custom">Phone Number *</label>
                          <input
                            type="tel"
                            className="form-control form-control-custom"
                            placeholder="Enter phone number"
                            value={formData.phone}
                            onChange={(e) => handleFormChange('phone', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label-custom">Email</label>
                          <input
                            type="email"
                            className="form-control form-control-custom"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label-custom">Booking Source</label>
                          <select
                            className="form-select form-select-custom"
                            value={formData.source}
                            onChange={(e) => handleFormChange('source', e.target.value)}
                          >
                            {SOURCE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label-custom">Payment Mode</label>
                          <select
                            className="form-select form-select-custom"
                            value={formData.payment_mode}
                            onChange={(e) => handleFormChange('payment_mode', e.target.value)}
                          >
                            {PAYMENT_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label-custom">Special Requests</label>
                          <textarea
                            className="form-control form-control-custom"
                            rows="2"
                            placeholder="Any special requests or notes..."
                            value={formData.special_requests}
                            onChange={(e) => handleFormChange('special_requests', e.target.value)}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Summary */}
                  <div className="col-lg-4">
                    <div className="booking-summary">
                      <h6 className="mb-3"><i className="bi bi-receipt me-2"></i>Booking Summary</h6>
                      <div className="date-range-display mb-3">
                        <div className="date-box">
                          <div className="label">Check-in</div>
                          <div className="date">{formatDate(formData.check_in, 'MMM DD, YYYY')}</div>
                        </div>
                        <div className="date-arrow">
                          <i className="bi bi-arrow-right"></i>
                        </div>
                        <div className="date-box">
                          <div className="label">Check-out</div>
                          <div className="date">{formatDate(formData.check_out, 'MMM DD, YYYY')}</div>
                        </div>
                      </div>
                      <div className="text-center mb-3">
                        <span className="nights-badge">{nights} Night{nights !== 1 ? 's' : ''}</span>
                      </div>
                      <hr />
                      {isGroupBooking && selectedGroupRooms.length > 0 ? (
                        <>
                          <div className="summary-row">
                            <span className="label">Rooms</span>
                            <span className="value">{selectedGroupRooms.length} rooms</span>
                          </div>
                          {selectedGroupRooms.map(r => {
                            const hrTotal = getHourlyTotal(expectedHours, r);
                            return (
                              <div className="summary-row" key={r.room_id} style={{ fontSize: 12 }}>
                                <span className="label">{r.room_number} ({capitalize(r.room_type || '')})</span>
                                <span className="value">{isHourlyBooking ? `${formatCurrency(gstInclusiveRate(hrTotal))} / ${expectedHours}h` : `${formatCurrency(gstInclusiveRate(r.rate))}/n`}</span>
                              </div>
                            );
                          })}
                          <hr className="my-2" />
                          <div className="summary-row">
                            <span className="label">Room Total</span>
                            <span className="value">{formatCurrency(isHourlyBooking
                              ? selectedGroupRooms.reduce((s, r) => s + gstInclusiveRate(getHourlyTotal(expectedHours, r)), 0)
                              : selectedGroupRooms.reduce((s, r) => s + gstInclusiveRate(r.rate) * nights, 0))}</span>
                          </div>
                          {mealPlan !== 'none' && (() => {
                            const mealPerNight = mealPlan === 'both' ? mealRates.breakfast_rate + mealRates.dinner_rate : mealRates[`${mealPlan}_rate`] || 0;
                            const totalMeal = mealPerNight * nights * selectedGroupRooms.length * (formData.adults || 2);
                            return (
                              <div className="summary-row" style={{ color: '#f59e0b' }}>
                                <span className="label"><i className="bi bi-cup-hot me-1"></i>{mealPlan === 'both' ? 'B+D' : capitalize(mealPlan)}</span>
                                <span className="value">{formatCurrency(totalMeal)}</span>
                              </div>
                            );
                          })()}
                          {(() => {
                            const roomTotal = isHourlyBooking
                              ? selectedGroupRooms.reduce((s, r) => s + gstInclusiveRate(getHourlyTotal(expectedHours, r)), 0)
                              : selectedGroupRooms.reduce((s, r) => s + gstInclusiveRate(r.rate) * nights, 0);
                            const mealPerNight = (!isHourlyBooking && mealPlan !== 'none') ? (mealPlan === 'both' ? mealRates.breakfast_rate + mealRates.dinner_rate : mealRates[`${mealPlan}_rate`] || 0) : 0;
                            const totalMeal = mealPerNight * nights * selectedGroupRooms.length * (formData.adults || 2);
                            const groupGrandTotal = roomTotal + totalMeal;
                            let groupDiscountAmt = 0;
                            if (omDiscount && omDiscountValue && Number(omDiscountValue) > 0) {
                              groupDiscountAmt = omDiscountType === 'percentage'
                                ? Math.round(groupGrandTotal * (Number(omDiscountValue) / 100) * 100) / 100
                                : Math.round(Number(omDiscountValue) * 100) / 100;
                            }
                            return (
                              <>
                                <div className="summary-row total">
                                  <span className="label">Total ({isHourlyBooking ? `${expectedHours}h` : `${nights}N`})</span>
                                  <span className="value">{formatCurrency(groupGrandTotal)}</span>
                                </div>
                                {groupDiscountAmt > 0 && (
                                  <>
                                    <div className="summary-row" style={{ color: '#8b5cf6' }}>
                                      <span className="label"><i className="bi bi-tag me-1"></i>OM Discount</span>
                                      <span className="value">- {formatCurrency(groupDiscountAmt)}</span>
                                    </div>
                                    <div className="summary-row total" style={{ background: '#f5f3ff', borderRadius: 6, padding: '6px 8px', marginTop: 4 }}>
                                      <span className="label">After Discount</span>
                                      <span className="value">{formatCurrency(groupGrandTotal - groupDiscountAmt)}</span>
                                    </div>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <>
                          {selectedRoomType && (
                            <div className="summary-row">
                              <span className="label">Room Type</span>
                              <span className="value">{capitalize(selectedRoomType)}</span>
                            </div>
                          )}
                          {selectedSingleRoom && (
                            <div className="summary-row">
                              <span className="label">Room</span>
                              <span className="value" style={{ fontWeight: 700, color: '#10b981' }}>
                                <i className="bi bi-door-closed me-1"></i>{selectedSingleRoom.room_number}
                              </span>
                            </div>
                          )}
                          {isHourlyBooking ? (
                            <>
                              <div className="summary-row">
                                <span className="label">Total for {expectedHours}h <small style={{ opacity: 0.6 }}>(incl. GST)</small></span>
                                <span className="value" style={{ color: '#f59e0b' }}>{formatCurrency(gstInclusiveRate(hourlyTotalCalc))}</span>
                              </div>
                              <div className="summary-row">
                                <span className="label">Duration</span>
                                <span className="value">{expectedHours} hours</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="summary-row">
                                <span className="label">Rate/Night <small style={{ opacity: 0.6 }}>(incl. GST)</small></span>
                                <span className="value">{formatCurrency(rateInclGst)}</span>
                              </div>
                              {mealPlan !== 'none' && (() => {
                                const mealPerNight = mealPlan === 'both' ? mealRates.breakfast_rate + mealRates.dinner_rate : mealRates[`${mealPlan}_rate`] || 0;
                                const totalMeal = mealPerNight * nights * (formData.adults || 2);
                                return (
                                  <div className="summary-row" style={{ color: '#f59e0b' }}>
                                    <span className="label"><i className="bi bi-cup-hot me-1"></i>{mealPlan === 'both' ? 'B+D' : capitalize(mealPlan)}</span>
                                    <span className="value">{formatCurrency(totalMeal)}</span>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                          <div className="summary-row total">
                            <span className="label">Total ({isHourlyBooking ? `${expectedHours}h` : `${nights} night${nights !== 1 ? 's' : ''}`})</span>
                            <span className="value">{formatCurrency(grandTotalBeforeDiscount + (!isHourlyBooking && mealPlan !== 'none' ? ((mealPlan === 'both' ? mealRates.breakfast_rate + mealRates.dinner_rate : mealRates[`${mealPlan}_rate`] || 0) * nights * (formData.adults || 2)) : 0))}</span>
                          </div>

                          {/* OM Discount */}
                          {omDiscount && omDiscountAmount > 0 && (
                            <>
                              <div className="summary-row" style={{ color: '#8b5cf6' }}>
                                <span className="label"><i className="bi bi-tag me-1"></i>OM Discount</span>
                                <span className="value">- {formatCurrency(omDiscountAmount)}</span>
                              </div>
                              <div className="summary-row total" style={{ background: '#f5f3ff', borderRadius: 6, padding: '6px 8px', marginTop: 4 }}>
                                <span className="label">After Discount</span>
                                <span className="value">{formatCurrency(grandTotal + (mealPlan !== 'none' ? ((mealPlan === 'both' ? mealRates.breakfast_rate + mealRates.dinner_rate : mealRates[`${mealPlan}_rate`] || 0) * nights * (formData.adults || 2)) : 0))}</span>
                              </div>
                            </>
                          )}

                          {/* Advance Payment in summary */}
                          {formData.collect_advance && Number(formData.advance_amount) > 0 && (
                            <>
                              <div className="summary-row" style={{ color: '#10b981' }}>
                                <span className="label"><i className="bi bi-cash me-1"></i>Advance ({capitalize(formData.advance_method || 'cash')})</span>
                                <span className="value">- {formatCurrency(Number(formData.advance_amount))}</span>
                              </div>
                              <div className="summary-row" style={{ fontWeight: 700 }}>
                                <span className="label">Balance Due</span>
                                <span className="value" style={{ color: '#dc2626' }}>{formatCurrency(Math.max(0, (grandTotal + (!isHourlyBooking && mealPlan !== 'none' ? ((mealPlan === 'both' ? mealRates.breakfast_rate + mealRates.dinner_rate : mealRates[`${mealPlan}_rate`] || 0) * nights * (formData.adults || 2)) : 0)) - Number(formData.advance_amount)))}</span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {/* OM Discount Section */}
                    <div style={{ marginTop: 12, background: '#faf5ff', borderRadius: 10, padding: '10px 14px', border: '1px solid #e9d5ff' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: omDiscount ? '#7c3aed' : '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>
                          <i className="bi bi-tag-fill me-1"></i>OM Discount
                        </span>
                        <input className="form-check-input" type="checkbox" checked={omDiscount}
                          onChange={(e) => { setOmDiscount(e.target.checked); if (!e.target.checked) { setOmDiscountValue(''); setOmDiscountReason(''); } }}
                          style={{ width: 18, height: 18, cursor: 'pointer' }} />
                      </label>
                      {omDiscount && (
                        <div style={{ marginTop: 8 }}>
                          <div className="d-flex gap-2 mb-2">
                            <select className="form-select form-select-sm" value={omDiscountType}
                              onChange={(e) => { setOmDiscountType(e.target.value); setOmDiscountValue(''); }}
                              style={{ width: 90, borderRadius: 6, fontSize: 12 }}>
                              <option value="percentage">%</option>
                              <option value="flat">₹ Flat</option>
                            </select>
                            <input type="number" className="form-control form-control-sm" placeholder={omDiscountType === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                              min="0" max={omDiscountType === 'percentage' ? 100 : undefined}
                              value={omDiscountValue} onChange={(e) => setOmDiscountValue(e.target.value)}
                              style={{ borderRadius: 6, fontSize: 12 }} />
                          </div>
                          <input type="text" className="form-control form-control-sm" placeholder="Reason (optional)"
                            value={omDiscountReason} onChange={(e) => setOmDiscountReason(e.target.value)}
                            style={{ borderRadius: 6, fontSize: 12 }} />
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="sendConfirmation"
                          checked={formData.send_confirmation}
                          onChange={(e) => handleFormChange('send_confirmation', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="sendConfirmation">
                          Send confirmation email to guest
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="collectAdvance"
                          checked={formData.collect_advance}
                          onChange={(e) => handleFormChange('collect_advance', e.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="collectAdvance">
                          Collect advance payment
                        </label>
                      </div>
                      {formData.collect_advance && (
                        <div style={{ marginTop: 8, marginLeft: 24 }}>
                          <div className="d-flex gap-2 align-items-center">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Advance amount"
                              min="0"
                              value={formData.advance_amount || ''}
                              onChange={(e) => handleFormChange('advance_amount', e.target.value)}
                              style={{ borderRadius: 8, maxWidth: 160 }}
                            />
                            <select
                              className="form-select form-select-sm"
                              value={formData.advance_method || 'cash'}
                              onChange={(e) => handleFormChange('advance_method', e.target.value)}
                              style={{ borderRadius: 8, maxWidth: 130 }}
                            >
                              <option value="cash">Cash</option>
                              <option value="upi">UPI</option>
                              <option value="card">Card</option>
                              <option value="bank_transfer">Bank Transfer</option>
                            </select>
                          </div>
                          {formData.advance_amount && Number(formData.advance_amount) > 0 && (
                            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                              <i className="bi bi-check-circle me-1"></i>₹{Number(formData.advance_amount).toFixed(2)} will be collected
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer modal-footer-custom">
                <button type="button" className="btn btn-outline-secondary" onClick={handleCloseModal}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
                  onClick={handleFormSubmit}
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i>
                      {editingId ? 'Update Reservation' : 'Create Reservation'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Transfer Modal */}
      {showRoomTransferModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ borderRadius: 16, overflow: 'hidden' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none' }}>
                <h5 className="modal-title">
                  <i className="bi bi-arrow-left-right me-2"></i>Room Transfer
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRoomTransferModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {/* Current Room Info */}
                {roomTransferData.reservation && (
                  <div className="alert alert-light border mb-4" style={{ borderRadius: 12 }}>
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="bi bi-door-open" style={{ fontSize: 22, color: '#ef4444' }}></i>
                        </div>
                      </div>
                      <div className="col">
                        <div style={{ fontWeight: 700, fontSize: 15 }}>
                          Current Room: {roomTransferData.reservation.room?.room_number || 'N/A'}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>
                          {capitalize(roomTransferData.reservation.room?.room_type || '')} &middot;
                          Floor {roomTransferData.reservation.room?.floor} &middot;
                          {formatCurrency(roomTransferData.reservation.rate_per_night)}/night &middot;
                          Guest: {roomTransferData.reservation.guest ? `${roomTransferData.reservation.guest.first_name} ${roomTransferData.reservation.guest.last_name}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: 13 }}>
                    <i className="bi bi-chat-text me-1"></i> Reason for Transfer
                  </label>
                  <select
                    className="form-select"
                    value={roomTransferData.reason}
                    onChange={(e) => setRoomTransferData(prev => ({ ...prev, reason: e.target.value }))}
                  >
                    <option value="">Select a reason...</option>
                    <option value="AC/Heating not working">AC/Heating not working</option>
                    <option value="Plumbing issue">Plumbing issue</option>
                    <option value="Noise complaint">Noise complaint</option>
                    <option value="Room upgrade request">Room upgrade request</option>
                    <option value="Room downgrade request">Room downgrade request</option>
                    <option value="Electrical issue">Electrical issue</option>
                    <option value="Pest issue">Pest issue</option>
                    <option value="Cleanliness issue">Cleanliness issue</option>
                    <option value="Guest preference">Guest preference</option>
                    <option value="Maintenance required">Maintenance required</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Select New Room */}
                <div className="mb-3">
                  <label className="form-label fw-bold" style={{ fontSize: 13 }}>
                    <i className="bi bi-door-closed me-1"></i> Transfer To
                  </label>
                  {availableTransferRooms.length === 0 ? (
                    <div className="alert alert-warning" style={{ borderRadius: 10 }}>
                      <i className="bi bi-exclamation-triangle me-1"></i> No available rooms for transfer
                    </div>
                  ) : (
                    <div className="row g-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                      {availableTransferRooms.map(room => {
                        const isSelected = roomTransferData.new_room_id === room.id;
                        return (
                          <div key={room.id} className="col-md-4 col-sm-6">
                            <div
                              onClick={() => setRoomTransferData(prev => ({ ...prev, new_room_id: room.id }))}
                              style={{
                                cursor: 'pointer', padding: '12px 14px', borderRadius: 10, transition: 'all 0.2s',
                                border: `2px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                                background: isSelected ? '#eef2ff' : '#fff',
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: 16, color: isSelected ? '#4f46e5' : '#1e293b' }}>
                                {room.room_number}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b' }}>
                                {capitalize(room.room_type)} &middot; Floor {room.floor}
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>
                                {formatCurrency(room.base_rate)}/night
                              </div>
                              <span className={`badge mt-1 ${room.status === 'available' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`} style={{ fontSize: 10 }}>
                                {capitalize(room.status)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Adjust Rate Toggle */}
                {roomTransferData.new_room_id && (() => {
                  const newRoom = availableTransferRooms.find(r => r.id === roomTransferData.new_room_id);
                  const currentRate = parseFloat(roomTransferData.reservation?.rate_per_night || 0);
                  const newRate = parseFloat(newRoom?.base_rate || 0);
                  const rateDiff = newRate - currentRate;
                  return (
                    <div className="p-3 rounded mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="form-check form-switch d-flex align-items-center gap-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={roomTransferData.adjust_rate}
                          onChange={(e) => setRoomTransferData(prev => ({ ...prev, adjust_rate: e.target.checked }))}
                          id="adjustRateSwitch"
                        />
                        <label className="form-check-label" htmlFor="adjustRateSwitch" style={{ fontSize: 13 }}>
                          Adjust rate to new room ({formatCurrency(newRate)}/night)
                        </label>
                      </div>
                      {rateDiff !== 0 && (
                        <div style={{ fontSize: 12, color: rateDiff > 0 ? '#dc2626' : '#059669', marginTop: 4, marginLeft: 40 }}>
                          {rateDiff > 0 ? '+' : ''}{formatCurrency(rateDiff)}/night {rateDiff > 0 ? 'increase' : 'decrease'}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="modal-footer" style={{ border: 'none' }}>
                <button className="btn btn-light" onClick={() => setShowRoomTransferModal(false)} disabled={roomTransferLoading}>
                  Cancel
                </button>
                <button className="btn btn-warning text-white" onClick={handleRoomTransfer} disabled={roomTransferLoading || !roomTransferData.new_room_id}>
                  {roomTransferLoading ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span> Transferring...</>
                  ) : (
                    <><i className="bi bi-arrow-left-right me-1"></i> Transfer Room</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reservation Modal */}
      {showCancelModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title"><i className="bi bi-x-circle me-2"></i>Cancel Reservation</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCancelModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                {!cancelPreview ? (
                  <div className="text-center py-3">
                    <span className="spinner-border spinner-border-sm me-2"></span> Loading refund details...
                  </div>
                ) : cancelPreview.error ? (
                  <div className="alert alert-warning">Could not load refund preview. You can still cancel.</div>
                ) : (
                  <>
                    <div className="alert alert-warning mb-3">
                      <i className="bi bi-exclamation-triangle me-1"></i> This action cannot be undone.
                    </div>

                    {cancelPreview.advance_paid > 0 ? (
                      <>
                        <table className="table table-sm mb-3">
                          <tbody>
                            <tr>
                              <td className="text-muted">Advance Paid</td>
                              <td className="text-end fw-bold">₹{cancelPreview.advance_paid.toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="text-muted">Hours Until Check-in</td>
                              <td className="text-end">{cancelPreview.hours_until_checkin} hrs</td>
                            </tr>
                            <tr>
                              <td className="text-muted">Policy</td>
                              <td className="text-end">{cancelPreview.rule_label}</td>
                            </tr>
                            <tr>
                              <td className="text-muted">Refund Amount</td>
                              <td className="text-end fw-bold text-success">₹{cancelPreview.refund_amount.toFixed(2)} ({cancelPreview.refund_percent}%)</td>
                            </tr>
                            <tr>
                              <td className="text-muted">Deduction</td>
                              <td className="text-end text-danger">₹{cancelPreview.deduction.toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Refund policy summary */}
                        <div className="small text-muted mb-3">
                          <strong>Refund Policy:</strong>
                          <ul className="mb-0 mt-1">
                            {cancelPreview.rules?.map((r, i) => (
                              <li key={i} className={cancelPreview.refund_percent === r.refundPercent && !useOverride ? 'fw-bold text-dark' : ''}>
                                {r.label}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* OM Override */}
                        {cancelPreview.can_override && (
                          <div className="border rounded p-3 bg-light">
                            <div className="form-check mb-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="overrideRefund"
                                checked={useOverride}
                                onChange={(e) => setUseOverride(e.target.checked)}
                              />
                              <label className="form-check-label fw-bold" htmlFor="overrideRefund">
                                <i className="bi bi-shield-lock me-1"></i> Override Refund Amount (OM)
                              </label>
                            </div>
                            {useOverride && (
                              <div className="input-group mt-2">
                                <span className="input-group-text">₹</span>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={overrideRefund}
                                  onChange={(e) => setOverrideRefund(e.target.value)}
                                  min="0"
                                  max={cancelPreview.advance_paid}
                                  step="0.01"
                                />
                                <span className="input-group-text">/ ₹{cancelPreview.advance_paid.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted">No advance was paid for this reservation. No refund applicable.</p>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-light" onClick={() => setShowCancelModal(false)} disabled={cancelLoading}>
                  Go Back
                </button>
                <button className="btn btn-danger" onClick={handleConfirmCancel} disabled={cancelLoading || !cancelPreview}>
                  {cancelLoading ? (
                    <><span className="spinner-border spinner-border-sm me-1"></span> Cancelling...</>
                  ) : (
                    <><i className="bi bi-x-circle me-1"></i> Confirm Cancellation</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
