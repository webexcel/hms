import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { toast } from 'react-hot-toast';
import GuestPagination from './GuestPagination';
import { getInitials, getGuestStatus } from '../utils';

const GuestListView = ({
  guests,
  loading,
  currentPage,
  totalPages,
  setCurrentPage,
  getPageNumbers,
  handleRowClick,
  fetchGuestProfile,
  activeDropdown,
  toggleDropdown,
  navigate,
}) => (
  <div className="guests-container" id="guestListView">
    <div className="guest-list-container">
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : guests.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-people" style={{ fontSize: '3rem' }}></i>
          <p className="mt-2">No guests found</p>
        </div>
      ) : (
        guests.map((guest) => {
          const status = getGuestStatus(guest);
          return (
            <div
              className="guest-card-list"
              key={guest.id}
              onClick={() => handleRowClick(guest)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`guest-card-avatar${guest.vip_status ? ' vip' : ''}`}>
                <span>{getInitials(guest.first_name, guest.last_name)}</span>
                {guest.vip_status && (
                  <span className="vip-badge" title="VIP Guest"><i className="bi bi-star-fill"></i></span>
                )}
              </div>
              <div className="guest-card-info">
                <div className="guest-name-row">
                  <h5 className="guest-name">{guest.first_name} {guest.last_name}</h5>
                  <span className={`guest-status ${status.className}`}>{status.label}</span>
                </div>
                <div className="guest-meta">
                  {guest.email && (
                    <span><i className="bi bi-envelope"></i> {guest.email}</span>
                  )}
                  {guest.phone && (
                    <span><i className="bi bi-telephone"></i> {guest.phone}</span>
                  )}
                  {guest.company_name ? (
                    <span><i className="bi bi-building"></i> {guest.company_name}</span>
                  ) : guest.city ? (
                    <span><i className="bi bi-geo-alt"></i> {guest.city}{guest.state ? `, ${guest.state}` : ''}</span>
                  ) : null}
                </div>
                <div className="guest-stats">
                  <span className="stat">
                    <i className="bi bi-calendar-check"></i> {guest.total_stays || 0} Stays
                  </span>
                  <span className="stat">
                    <i className="bi bi-moon"></i> {guest.total_nights || 0} Nights
                  </span>
                  {guest.total_spent != null && (
                    <span className="stat">
                      <i className="bi bi-currency-rupee"></i> {formatCurrency(guest.total_spent)} Total Spent
                    </span>
                  )}
                </div>
              </div>
              <div className="guest-card-room">
                {guest.current_room ? (
                  <div className="current-room">
                    <span className="label">Current Room</span>
                    <span className="room-num">{guest.current_room}</span>
                    <span className="room-type">{guest.room_type || ''}</span>
                  </div>
                ) : guest.upcoming_reservation ? (
                  <div className="upcoming-stay">
                    <span className="label">Upcoming</span>
                    <span className="date">{formatDate(guest.upcoming_reservation)}</span>
                  </div>
                ) : guest.last_stay_date ? (
                  <div className="last-stay">
                    <span className="label">Last Stay</span>
                    <span className="date">{formatDate(guest.last_stay_date)}</span>
                  </div>
                ) : null}
              </div>
              <div className="guest-card-actions">
                <button
                  className="btn-icon"
                  title="View Profile"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchGuestProfile(guest);
                  }}
                >
                  <i className="bi bi-eye"></i>
                </button>
                <button
                  className="btn-icon"
                  title="Edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/guests/${guest.id}`);
                  }}
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  className="btn-icon"
                  title="Send Message"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast('Message feature coming soon');
                  }}
                >
                  <i className="bi bi-chat-dots"></i>
                </button>
                <div className="dropdown" style={{ position: 'relative' }}>
                  <button
                    className="btn-icon"
                    onClick={(e) => toggleDropdown(guest.id, e)}
                  >
                    <i className="bi bi-three-dots-vertical"></i>
                  </button>
                  {activeDropdown === guest.id && (
                    <ul className="dropdown-menu dropdown-menu-end show" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 1050 }}>
                      <li>
                        <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/guests/${guest.id}`); }}>
                          <i className="bi bi-file-text me-2"></i>View History
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/guests/${guest.id}?tab=invoices`); }}>
                          <i className="bi bi-receipt me-2"></i>View Invoices
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate('/reservations/new', { state: { guestId: guest.id } }); }}>
                          <i className="bi bi-calendar-plus me-2"></i>New Reservation
                        </a>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <a className="dropdown-item text-danger" href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast('Blacklist feature coming soon'); }}>
                          <i className="bi bi-slash-circle me-2"></i>Blacklist Guest
                        </a>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>

    <GuestPagination
      currentPage={currentPage}
      totalPages={totalPages}
      setCurrentPage={setCurrentPage}
      getPageNumbers={getPageNumbers}
    />
  </div>
);

export default GuestListView;
