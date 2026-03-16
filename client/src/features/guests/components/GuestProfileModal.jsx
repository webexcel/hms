import React from 'react';
import { formatCurrency, formatDate, capitalize } from '../../../utils/formatters';
import { getInitials } from '../utils';

const GuestProfileModal = ({ guest, onClose, navigate }) => (
  <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-lg modal-dialog-centered">
      <div className="modal-content">
        <div className="guest-profile-header">
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={onClose}
          ></button>
          <div className={`profile-avatar${guest.vip_status ? ' vip' : ''}`}>
            <span>{getInitials(guest.first_name, guest.last_name)}</span>
            {guest.vip_status && (
              <span className="vip-badge"><i className="bi bi-star-fill"></i></span>
            )}
          </div>
          <h4 className="profile-name">{guest.first_name} {guest.last_name}</h4>
          <p className="profile-email">{guest.email}</p>
          <div className="profile-status">
            {guest.current_room && (
              <span className="badge bg-success">Currently In House</span>
            )}
            {guest.vip_status && (
              <span className="badge bg-warning text-dark">VIP</span>
            )}
            {!guest.current_room && !guest.upcoming_reservation && (
              <span className="badge bg-secondary">Past Guest</span>
            )}
            {guest.upcoming_reservation && !guest.current_room && (
              <span className="badge bg-info">Reserved</span>
            )}
          </div>
        </div>
        <div className="guest-profile-body">
          <div className="row">
            <div className="col-md-6">
              <div className="profile-section">
                <h6><i className="bi bi-person me-2"></i>Contact Information</h6>
                <div className="profile-info-row">
                  <span className="label">Phone</span>
                  <span className="value">{guest.phone || '-'}</span>
                </div>
                <div className="profile-info-row">
                  <span className="label">Email</span>
                  <span className="value">{guest.email || '-'}</span>
                </div>
                <div className="profile-info-row">
                  <span className="label">Address</span>
                  <span className="value">
                    {[guest.address, guest.city, guest.state, guest.pincode]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="profile-section">
                <h6><i className="bi bi-card-text me-2"></i>ID Information</h6>
                <div className="profile-info-row">
                  <span className="label">ID Type</span>
                  <span className="value">{guest.id_proof_type ? capitalize(guest.id_proof_type) : '-'}</span>
                </div>
                <div className="profile-info-row">
                  <span className="label">ID Number</span>
                  <span className="value">{guest.id_proof_number || '-'}</span>
                </div>
                <div className="profile-info-row">
                  <span className="label">Nationality</span>
                  <span className="value">{guest.nationality || '-'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="profile-stats-row">
            <div className="profile-stat">
              <div className="stat-value">{guest.total_stays || 0}</div>
              <div className="stat-label">Total Stays</div>
            </div>
            <div className="profile-stat">
              <div className="stat-value">{guest.total_nights || 0}</div>
              <div className="stat-label">Nights</div>
            </div>
            <div className="profile-stat">
              <div className="stat-value">{guest.total_spent ? formatCurrency(guest.total_spent) : '0'}</div>
              <div className="stat-label">Total Spent</div>
            </div>
            <div className="profile-stat">
              <div className="stat-value">{guest.avg_rating || '-'}</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>

          {/* Recent Stay History */}
          {guest.stay_history && guest.stay_history.length > 0 && (
            <div className="profile-section">
              <h6><i className="bi bi-clock-history me-2"></i>Recent Stay History</h6>
              <div className="stay-history">
                {guest.stay_history.map((stay, index) => (
                  <div className="stay-item" key={index}>
                    <div className="stay-date">
                      <span className="day">{stay.date_range || formatDate(stay.check_in, 'MMM DD') + ' - ' + formatDate(stay.check_out, 'MMM DD')}</span>
                      <span className="year">{stay.year || formatDate(stay.check_in, 'YYYY')}</span>
                    </div>
                    <div className="stay-details">
                      <span className="room">{stay.room || '-'}</span>
                      <span className="nights">{stay.nights || 0} Nights</span>
                    </div>
                    <div className="stay-amount">{stay.amount ? formatCurrency(stay.amount) : '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preferences & Notes */}
          {(guest.preferences || guest.notes) && (
            <div className="profile-section">
              <h6><i className="bi bi-sticky me-2"></i>Preferences & Notes</h6>
              {guest.preferences && guest.preferences.length > 0 && (
                <div className="preferences-tags">
                  {guest.preferences.map((pref, index) => (
                    <span className="pref-tag" key={index}>
                      <i className={`bi ${pref.icon || 'bi-check-circle'}`}></i> {pref.label || pref}
                    </span>
                  ))}
                </div>
              )}
              {guest.notes && (
                <p className="notes-text">{guest.notes}</p>
              )}
            </div>
          )}
        </div>
        <div className="guest-profile-footer">
          <button className="btn btn-outline-secondary" onClick={onClose}>Close</button>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-primary"
              onClick={() => {
                onClose();
                navigate('/reservations/new', { state: { guestId: guest.id } });
              }}
            >
              <i className="bi bi-calendar-plus me-1"></i> New Reservation
            </button>
            <button
              className="btn btn-primary"
              style={{ background: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
              onClick={() => {
                onClose();
                navigate(`/guests/${guest.id}`);
              }}
            >
              <i className="bi bi-pencil me-1"></i> Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default GuestProfileModal;
