import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency, formatDate, capitalize } from '../utils/formatters';
import { toast } from 'react-hot-toast';

const GuestsPage = () => {
  const navigate = useNavigate();
  const api = useApi();

  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState({ total: 0, inHouse: 0, vip: 0, returning: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const debouncedSearch = useDebounce(searchTerm, 400);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    id_proof_type: '',
    id_proof_number: '',
    gstin: '',
    company_name: '',
    vip_status: false,
    notes: '',
    nationality: '',
    date_of_birth: '',
    title: 'Mr.',
    marketing_consent: true,
  });

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterType && filterType !== 'all') params.filter = filterType;
      const response = await api.get('/guests', { params });
      setGuests(response.data.guests || response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch guests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/guests/stats');
      setStats({
        total: response.data.total || 0,
        inHouse: response.data.inHouse || response.data.currentlyInHouse || 0,
        vip: response.data.vip || 0,
        returning: response.data.returning || 0,
      });
    } catch (error) {
      console.error('Failed to fetch guest stats:', error);
    }
  };

  const fetchGuestProfile = async (guest) => {
    try {
      const response = await api.get(`/guests/${guest.id}`);
      setSelectedGuest(response.data.guest || response.data || guest);
    } catch (error) {
      setSelectedGuest(guest);
    }
    setShowProfileModal(true);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterType]);

  useEffect(() => {
    fetchGuests();
  }, [currentPage, debouncedSearch, filterType]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setSubmitting(true);
      await api.post('/guests', formData);
      toast.success('Guest added successfully');
      setShowModal(false);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        id_proof_type: '',
        id_proof_number: '',
        gstin: '',
        company_name: '',
        vip_status: false,
        notes: '',
        nationality: '',
        date_of_birth: '',
        title: 'Mr.',
        marketing_consent: true,
      });
      fetchGuests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add guest');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRowClick = (guest) => {
    navigate(`/guests/${guest.id}`);
  };

  const getInitials = (firstName, lastName) => {
    return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
  };

  const getGuestStatus = (guest) => {
    if (guest.current_room) return { label: 'In House', className: 'in-house' };
    if (guest.upcoming_reservation) return { label: 'Reserved', className: 'reserved' };
    return { label: 'Past Guest', className: 'past' };
  };

  const formatSpentShort = (amount) => {
    if (!amount) return '0';
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toLocaleString('en-IN');
  };

  const handleFilter = (type, e) => {
    e.preventDefault();
    setFilterType(type);
  };

  const toggleDropdown = (guestId, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === guestId ? null : guestId);
  };

  // Pagination helpers
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <>
      {/* Stats Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon bg-primary">
              <i className="bi bi-people"></i>
            </div>
            <div className="stat-details">
              <h3>{stats.total.toLocaleString()}</h3>
              <p>Total Guests</p>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon bg-success">
              <i className="bi bi-person-check"></i>
            </div>
            <div className="stat-details">
              <h3>{stats.inHouse}</h3>
              <p>Currently In-House</p>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon bg-warning">
              <i className="bi bi-star"></i>
            </div>
            <div className="stat-details">
              <h3>{stats.vip}</h3>
              <p>VIP Guests</p>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon bg-info">
              <i className="bi bi-arrow-repeat"></i>
            </div>
            <div className="stat-details">
              <h3>{stats.returning || 0}</h3>
              <p>Returning Guests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="form-control form-control-custom"
              placeholder="Search guests by name, email, phone..."
              style={{ paddingLeft: '2.5rem', minWidth: '300px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Filter */}
          <div className="dropdown">
            <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
              <i className="bi bi-funnel me-1"></i> Filter
            </button>
            <ul className="dropdown-menu">
              <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('all', e)}>All Guests</a></li>
              <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('in_house', e)}>Currently In-House</a></li>
              <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('vip', e)}>VIP Guests</a></li>
              <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('returning', e)}>Returning Guests</a></li>
              <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('corporate', e)}>Corporate Guests</a></li>
              <li><hr className="dropdown-divider" /></li>
              <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('blacklisted', e)}>Blacklisted</a></li>
            </ul>
          </div>
          {/* View Toggle */}
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-outline-secondary${viewMode === 'list' ? ' active' : ''}`}
              title="List View"
              onClick={() => setViewMode('list')}
            >
              <i className="bi bi-list-ul"></i>
            </button>
            <button
              type="button"
              className={`btn btn-outline-secondary${viewMode === 'grid' ? ' active' : ''}`}
              title="Grid View"
              onClick={() => setViewMode('grid')}
            >
              <i className="bi bi-grid-3x3-gap"></i>
            </button>
          </div>
        </div>
        <button
          className="btn btn-primary"
          style={{ background: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
          onClick={() => setShowModal(true)}
        >
          <i className="bi bi-plus-lg me-1"></i> Add Guest
        </button>
      </div>

      {/* Guest List View */}
      {viewMode === 'list' && (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                  <a
                    className="page-link"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                  >
                    Previous
                  </a>
                </li>
                {getPageNumbers().map((page) => (
                  <li key={page} className={`page-item${currentPage === page ? ' active' : ''}`}>
                    <a
                      className="page-link"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </a>
                  </li>
                ))}
                <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                  <a
                    className="page-link"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                  >
                    Next
                  </a>
                </li>
              </ul>
            </nav>
          )}
        </div>
      )}

      {/* Guest Grid View */}
      {viewMode === 'grid' && (
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

          {/* Pagination for grid view */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
                  <a
                    className="page-link"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                  >
                    Previous
                  </a>
                </li>
                {getPageNumbers().map((page) => (
                  <li key={page} className={`page-item${currentPage === page ? ' active' : ''}`}>
                    <a
                      className="page-link"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </a>
                  </li>
                ))}
                <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
                  <a
                    className="page-link"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                  >
                    Next
                  </a>
                </li>
              </ul>
            </nav>
          )}
        </div>
      )}

      {/* Add/Edit Guest Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header modal-header-custom">
                <h5 className="modal-title"><i className="bi bi-person-plus me-2"></i>Add New Guest</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body modal-body-custom">
                <form onSubmit={handleSubmit}>
                  {/* Personal Information */}
                  <div className="form-section border rounded mb-3">
                    <div className="form-section-title">
                      <i className="bi bi-person"></i> Personal Information
                    </div>
                    <div className="row g-3">
                      <div className="col-md-2">
                        <label className="form-label-custom">Title</label>
                        <select
                          className="form-select form-select-custom"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                        >
                          <option>Mr.</option>
                          <option>Mrs.</option>
                          <option>Ms.</option>
                          <option>Dr.</option>
                        </select>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label-custom">First Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-custom"
                          placeholder="Enter first name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label-custom">Last Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-custom"
                          placeholder="Enter last name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-custom">Email Address *</label>
                        <input
                          type="email"
                          className="form-control form-control-custom"
                          placeholder="Enter email address"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-custom">Phone Number *</label>
                        <input
                          type="tel"
                          className="form-control form-control-custom"
                          placeholder="Enter phone number"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-custom">Date of Birth</label>
                        <input
                          type="date"
                          className="form-control form-control-custom"
                          name="date_of_birth"
                          value={formData.date_of_birth}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-custom">Nationality</label>
                        <select
                          className="form-select form-select-custom"
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleInputChange}
                        >
                          <option value="">Select nationality</option>
                          <option value="IN">India</option>
                          <option value="US">United States</option>
                          <option value="UK">United Kingdom</option>
                          <option value="CA">Canada</option>
                          <option value="AU">Australia</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="form-section border rounded mb-3">
                    <div className="form-section-title">
                      <i className="bi bi-geo-alt"></i> Address
                    </div>
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label-custom">Street Address</label>
                        <input
                          type="text"
                          className="form-control form-control-custom"
                          placeholder="Enter street address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-custom">City</label>
                        <input
                          type="text"
                          className="form-control form-control-custom"
                          placeholder="Enter city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label-custom">State/Province</label>
                        <input
                          type="text"
                          className="form-control form-control-custom"
                          placeholder="Enter state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label-custom">Postal Code</label>
                        <input
                          type="text"
                          className="form-control form-control-custom"
                          placeholder="Enter postal code"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ID Verification */}
                  <div className="form-section border rounded mb-3">
                    <div className="form-section-title">
                      <i className="bi bi-card-text"></i> ID Verification
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label-custom">ID Type *</label>
                        <select
                          className="form-select form-select-custom"
                          name="id_proof_type"
                          value={formData.id_proof_type}
                          onChange={handleInputChange}
                        >
                          <option value="">Select ID type</option>
                          <option value="passport">Passport</option>
                          <option value="aadhar">Aadhar Card</option>
                          <option value="driving_license">Driving License</option>
                          <option value="voter_id">Voter ID</option>
                          <option value="pan">PAN Card</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-custom">ID Number *</label>
                        <input
                          type="text"
                          className="form-control form-control-custom"
                          placeholder="Enter ID number"
                          name="id_proof_number"
                          value={formData.id_proof_number}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-custom">Upload ID (Front)</label>
                        <input type="file" className="form-control form-control-custom" accept="image/*,.pdf" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-custom">Upload ID (Back)</label>
                        <input type="file" className="form-control form-control-custom" accept="image/*,.pdf" />
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="form-section border rounded">
                    <div className="form-section-title">
                      <i className="bi bi-info-circle"></i> Additional Information
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label-custom">Company Name</label>
                        <input
                          type="text"
                          className="form-control form-control-custom"
                          placeholder="Enter company name (if corporate)"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-custom">GST Number</label>
                        <input
                          type="text"
                          className="form-control form-control-custom"
                          placeholder="Enter GST number (for invoicing)"
                          name="gstin"
                          value={formData.gstin}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <div className="form-check mt-4">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="vipGuest"
                            name="vip_status"
                            checked={formData.vip_status}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label" htmlFor="vipGuest">
                            <i className="bi bi-star text-warning me-1"></i> Mark as VIP Guest
                          </label>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-check mt-4">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="marketingConsent"
                            name="marketing_consent"
                            checked={formData.marketing_consent}
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label" htmlFor="marketingConsent">
                            Receive promotional emails and offers
                          </label>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label-custom">Notes / Preferences</label>
                        <textarea
                          className="form-control form-control-custom"
                          rows="3"
                          placeholder="Any special preferences, allergies, or notes about this guest..."
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer modal-footer-custom">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i> Save Guest
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Profile Modal */}
      {showProfileModal && selectedGuest && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="guest-profile-header">
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowProfileModal(false)}
                ></button>
                <div className={`profile-avatar${selectedGuest.vip_status ? ' vip' : ''}`}>
                  <span>{getInitials(selectedGuest.first_name, selectedGuest.last_name)}</span>
                  {selectedGuest.vip_status && (
                    <span className="vip-badge"><i className="bi bi-star-fill"></i></span>
                  )}
                </div>
                <h4 className="profile-name">{selectedGuest.first_name} {selectedGuest.last_name}</h4>
                <p className="profile-email">{selectedGuest.email}</p>
                <div className="profile-status">
                  {selectedGuest.current_room && (
                    <span className="badge bg-success">Currently In House</span>
                  )}
                  {selectedGuest.vip_status && (
                    <span className="badge bg-warning text-dark">VIP</span>
                  )}
                  {!selectedGuest.current_room && !selectedGuest.upcoming_reservation && (
                    <span className="badge bg-secondary">Past Guest</span>
                  )}
                  {selectedGuest.upcoming_reservation && !selectedGuest.current_room && (
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
                        <span className="value">{selectedGuest.phone || '-'}</span>
                      </div>
                      <div className="profile-info-row">
                        <span className="label">Email</span>
                        <span className="value">{selectedGuest.email || '-'}</span>
                      </div>
                      <div className="profile-info-row">
                        <span className="label">Address</span>
                        <span className="value">
                          {[selectedGuest.address, selectedGuest.city, selectedGuest.state, selectedGuest.pincode]
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
                        <span className="value">{selectedGuest.id_proof_type ? capitalize(selectedGuest.id_proof_type) : '-'}</span>
                      </div>
                      <div className="profile-info-row">
                        <span className="label">ID Number</span>
                        <span className="value">{selectedGuest.id_proof_number || '-'}</span>
                      </div>
                      <div className="profile-info-row">
                        <span className="label">Nationality</span>
                        <span className="value">{selectedGuest.nationality || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="profile-stats-row">
                  <div className="profile-stat">
                    <div className="stat-value">{selectedGuest.total_stays || 0}</div>
                    <div className="stat-label">Total Stays</div>
                  </div>
                  <div className="profile-stat">
                    <div className="stat-value">{selectedGuest.total_nights || 0}</div>
                    <div className="stat-label">Nights</div>
                  </div>
                  <div className="profile-stat">
                    <div className="stat-value">{selectedGuest.total_spent ? formatCurrency(selectedGuest.total_spent) : '0'}</div>
                    <div className="stat-label">Total Spent</div>
                  </div>
                  <div className="profile-stat">
                    <div className="stat-value">{selectedGuest.avg_rating || '-'}</div>
                    <div className="stat-label">Avg Rating</div>
                  </div>
                </div>

                {/* Recent Stay History */}
                {selectedGuest.stay_history && selectedGuest.stay_history.length > 0 && (
                  <div className="profile-section">
                    <h6><i className="bi bi-clock-history me-2"></i>Recent Stay History</h6>
                    <div className="stay-history">
                      {selectedGuest.stay_history.map((stay, index) => (
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
                {(selectedGuest.preferences || selectedGuest.notes) && (
                  <div className="profile-section">
                    <h6><i className="bi bi-sticky me-2"></i>Preferences & Notes</h6>
                    {selectedGuest.preferences && selectedGuest.preferences.length > 0 && (
                      <div className="preferences-tags">
                        {selectedGuest.preferences.map((pref, index) => (
                          <span className="pref-tag" key={index}>
                            <i className={`bi ${pref.icon || 'bi-check-circle'}`}></i> {pref.label || pref}
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedGuest.notes && (
                      <p className="notes-text">{selectedGuest.notes}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="guest-profile-footer">
                <button className="btn btn-outline-secondary" onClick={() => setShowProfileModal(false)}>Close</button>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => {
                      setShowProfileModal(false);
                      navigate('/reservations/new', { state: { guestId: selectedGuest.id } });
                    }}
                  >
                    <i className="bi bi-calendar-plus me-1"></i> New Reservation
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ background: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
                    onClick={() => {
                      setShowProfileModal(false);
                      navigate(`/guests/${selectedGuest.id}`);
                    }}
                  >
                    <i className="bi bi-pencil me-1"></i> Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GuestsPage;
