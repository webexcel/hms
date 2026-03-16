import dayjs from 'dayjs';
import { formatDate, capitalize } from '../../../utils/formatters';
import { getInitials, getStatusBadgeClass } from '../hooks/useReservations';

export default function ListView({ reservations, loading, actionLoading, onAction, onRoomTransfer, currentPage, totalPages, onPageChange }) {
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
