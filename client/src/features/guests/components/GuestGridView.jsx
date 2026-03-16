import React from 'react';
import { toast } from 'react-hot-toast';
import GuestPagination from './GuestPagination';
import { getInitials, getGuestStatus, formatSpentShort } from '../utils';

const GuestGridView = ({
  guests,
  loading,
  currentPage,
  totalPages,
  setCurrentPage,
  getPageNumbers,
  fetchGuestProfile,
}) => (
  <div className="guests-container" id="guestGridView">
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
      <div className="row g-3">
        {guests.map((guest) => {
          const status = getGuestStatus(guest);
          return (
            <div className="col-md-6 col-lg-4 col-xl-3" key={guest.id}>
              <div className="guest-card-grid">
                <div className="guest-card-grid-header">
                  <div className={`avatar${guest.vip_status ? ' vip' : ''}`}>
                    <span>{getInitials(guest.first_name, guest.last_name)}</span>
                    {guest.vip_status && (
                      <span className="vip-badge"><i className="bi bi-star-fill"></i></span>
                    )}
                  </div>
                  <span className={`guest-status ${status.className}`}>{status.label}</span>
                </div>
                <div className="guest-card-grid-body">
                  <h5 className="guest-name">{guest.first_name} {guest.last_name}</h5>
                  {guest.email && (
                    <p className="guest-email"><i className="bi bi-envelope"></i> {guest.email}</p>
                  )}
                  {guest.phone && (
                    <p className="guest-phone"><i className="bi bi-telephone"></i> {guest.phone}</p>
                  )}
                </div>
                <div className="guest-card-grid-stats">
                  <div className="stat">
                    <span className="value">{guest.total_stays || 0}</span>
                    <span className="label">Stays</span>
                  </div>
                  <div className="stat">
                    <span className="value">{guest.total_nights || 0}</span>
                    <span className="label">Nights</span>
                  </div>
                  <div className="stat">
                    <span className="value">{formatSpentShort(guest.total_spent)}</span>
                    <span className="label">Spent</span>
                  </div>
                </div>
                <div className="guest-card-grid-footer">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => fetchGuestProfile(guest)}
                  >
                    View Profile
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => toast('Message feature coming soon')}
                  >
                    <i className="bi bi-chat-dots"></i>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

    <GuestPagination
      currentPage={currentPage}
      totalPages={totalPages}
      setCurrentPage={setCurrentPage}
      getPageNumbers={getPageNumbers}
    />
  </div>
);

export default GuestGridView;
