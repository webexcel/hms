import dayjs from 'dayjs';
import { formatDate, capitalize } from '../../../utils/formatters';
import { getInitials, getStatusBadgeClass } from '../hooks/useReservations';

export default function DayDetailModal({ date, reservations, rooms, onClose, onNewBooking }) {
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
