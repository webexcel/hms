import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate, capitalize } from '../utils/formatters';
import toast from 'react-hot-toast';

const RatesPage = () => {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('ratePlans');
  const [loading, setLoading] = useState(true);

  // Rate Plans state
  const [ratePlans, setRatePlans] = useState([]);
  const [showRatePlanModal, setShowRatePlanModal] = useState(false);
  const [selectedRatePlan, setSelectedRatePlan] = useState(null);
  const [ratePlanForm, setRatePlanForm] = useState({
    room_type: '',
    season: '',
    base_rate: '',
    weekend_rate: '',
    extra_person_rate: '',
    meal_plan: 'none',
    is_active: true
  });

  // Packages state
  const [packages, setPackages] = useState([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    room_type: '',
    nights: '',
    price: '',
    inclusions: ''
  });

  // Promotions state
  const [promotions, setPromotions] = useState([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [promoForm, setPromoForm] = useState({
    code: '',
    name: '',
    discount_type: 'percentage',
    discount_value: '',
    valid_from: '',
    valid_until: '',
    max_uses: '',
    is_active: true
  });

  // Seasonal rates modal
  const [showSeasonalModal, setShowSeasonalModal] = useState(false);

  // Season filter
  const [seasonFilter, setSeasonFilter] = useState('all');

  // Rate calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarRoomType, setCalendarRoomType] = useState('all');

  const [roomTypes, setRoomTypes] = useState([]);
  const seasons = ['Peak Season', 'Off Season', 'Holiday'];
  const mealPlans = ['none', 'breakfast', 'half_board', 'full_board', 'all_inclusive'];

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchRoomTypes = async () => {
    try {
      const res = await api.get('/rooms?limit=100');
      const rooms = res.data?.data || res.data || [];
      const types = [...new Set(rooms.map(r => r.room_type))];
      setRoomTypes(types);
    } catch (err) {
      console.error('Failed to fetch room types', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ratePlans') {
        const res = await api.get('/rates/plans');
        setRatePlans(res.data?.data || res.data || []);
      } else if (activeTab === 'packages') {
        const res = await api.get('/rates/packages');
        setPackages(res.data?.data || res.data || []);
      } else if (activeTab === 'promotions') {
        const res = await api.get('/rates/promotions');
        setPromotions(res.data?.data || res.data || []);
      }
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Rate Plan handlers
  const handleSaveRatePlan = async (e) => {
    e.preventDefault();
    try {
      if (selectedRatePlan) {
        await api.put(`/rates/plans/${selectedRatePlan.id}`, ratePlanForm);
        toast.success('Rate plan updated successfully');
      } else {
        await api.post('/rates/plans', ratePlanForm);
        toast.success('Rate plan created successfully');
      }
      setShowRatePlanModal(false);
      resetRatePlanForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save rate plan');
    }
  };

  const openEditRatePlan = (plan) => {
    setSelectedRatePlan(plan);
    setRatePlanForm({
      room_type: plan.room_type,
      season: plan.season,
      base_rate: plan.base_rate,
      weekend_rate: plan.weekend_rate,
      extra_person_rate: plan.extra_person_rate || '',
      meal_plan: plan.meal_plan,
      is_active: plan.is_active
    });
    setShowRatePlanModal(true);
  };

  const resetRatePlanForm = () => {
    setSelectedRatePlan(null);
    setRatePlanForm({ room_type: '', season: '', base_rate: '', weekend_rate: '', extra_person_rate: '', meal_plan: 'none', is_active: true });
  };

  // Package handlers
  const handleSavePackage = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...packageForm,
        inclusions: packageForm.inclusions.split('\n').filter(i => i.trim())
      };
      if (selectedPackage) {
        await api.put(`/rates/packages/${selectedPackage.id}`, payload);
        toast.success('Package updated successfully');
      } else {
        await api.post('/rates/packages', payload);
        toast.success('Package created successfully');
      }
      setShowPackageModal(false);
      resetPackageForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save package');
    }
  };

  const openEditPackage = (pkg) => {
    setSelectedPackage(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description,
      room_type: pkg.room_type,
      nights: pkg.nights,
      price: pkg.price,
      inclusions: Array.isArray(pkg.inclusions) ? pkg.inclusions.join('\n') : pkg.inclusions || ''
    });
    setShowPackageModal(true);
  };

  const resetPackageForm = () => {
    setSelectedPackage(null);
    setPackageForm({ name: '', description: '', room_type: '', nights: '', price: '', inclusions: '' });
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await api.delete(`/rates/packages/${id}`);
      toast.success('Package deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete package');
    }
  };

  // Promotion handlers
  const handleSavePromo = async (e) => {
    e.preventDefault();
    try {
      if (selectedPromo) {
        await api.put(`/rates/promotions/${selectedPromo.id}`, promoForm);
        toast.success('Promotion updated successfully');
      } else {
        await api.post('/rates/promotions', promoForm);
        toast.success('Promotion created successfully');
      }
      setShowPromoModal(false);
      resetPromoForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save promotion');
    }
  };

  const togglePromoActive = async (promo) => {
    try {
      await api.put(`/rates/promotions/${promo.id}`, { ...promo, is_active: !promo.is_active });
      toast.success(`Promotion ${promo.is_active ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update promotion');
    }
  };

  const openEditPromo = (promo) => {
    setSelectedPromo(promo);
    setPromoForm({
      code: promo.code,
      name: promo.name,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      valid_from: promo.valid_from,
      valid_until: promo.valid_until,
      max_uses: promo.max_uses,
      is_active: promo.is_active
    });
    setShowPromoModal(true);
  };

  const resetPromoForm = () => {
    setSelectedPromo(null);
    setPromoForm({ code: '', name: '', discount_type: 'percentage', discount_value: '', valid_from: '', valid_until: '', max_uses: '', is_active: true });
  };

  // Calendar helpers
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = new Date();

    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, otherMonth: true });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isToday = date.toDateString() === today.toDateString();
      days.push({ day: i, otherMonth: false, weekend: isWeekend, today: isToday });
    }

    // Next month days to fill the grid
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        days.push({ day: i, otherMonth: true });
      }
    }

    return days;
  };

  const calendarMonthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  // Compute stats from data
  const avgRate = ratePlans.length > 0
    ? ratePlans.reduce((sum, p) => sum + Number(p.base_rate || 0), 0) / ratePlans.length
    : 0;

  // Filtered rate plans
  const filteredRatePlans = seasonFilter === 'all'
    ? ratePlans
    : ratePlans.filter(p => p.season === seasonFilter);

  // Room type icon mapping
  const getRoomTypeIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('executive')) return 'bi-gem';
    if (t.includes('junior') || t.includes('suite')) return 'bi-star';
    if (t.includes('deluxe')) return 'bi-house';
    if (t.includes('superior') || t.includes('premium')) return 'bi-house-heart';
    if (t.includes('family')) return 'bi-people';
    return 'bi-house-door';
  };

  const getRoomTypeClass = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('executive')) return 'executive';
    if (t.includes('junior') || t.includes('suite')) return 'suite';
    if (t.includes('deluxe')) return 'deluxe';
    if (t.includes('superior') || t.includes('premium')) return 'superior';
    if (t.includes('family')) return 'family';
    return 'standard';
  };

  if (loading && ratePlans.length === 0 && packages.length === 0 && promotions.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <p className="text-muted mb-0">Manage room rates, seasonal pricing, and packages</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => setShowSeasonalModal(true)}>
            <i className="bi bi-calendar-range me-2"></i>Seasonal Rates
          </button>
          <button className="btn btn-primary" onClick={() => { resetRatePlanForm(); setShowRatePlanModal(true); }}>
            <i className="bi bi-plus-lg me-2"></i>Add Rate Plan
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon bg-primary">
              <i className="bi bi-door-closed"></i>
            </div>
            <div className="stat-details">
              <h3>{roomTypes.length}</h3>
              <p>Room Types</p>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon bg-success">
              <i className="bi bi-currency-rupee"></i>
            </div>
            <div className="stat-details">
              <h3>{avgRate > 0 ? formatCurrency(avgRate) : '--'}</h3>
              <p>Avg. Daily Rate</p>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon bg-warning">
              <i className="bi bi-gift"></i>
            </div>
            <div className="stat-details">
              <h3>{packages.length}</h3>
              <p>Active Packages</p>
            </div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="stat-card">
            <div className="stat-icon bg-info">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <div className="stat-details">
              <h3>+12%</h3>
              <p>RevPAR Growth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <ul className="nav nav-tabs rates-tabs mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link${activeTab === 'ratePlans' ? ' active' : ''}`}
            type="button"
            role="tab"
            onClick={() => setActiveTab('ratePlans')}
          >
            <i className="bi bi-door-closed me-2"></i>Room Rates
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link${activeTab === 'packages' ? ' active' : ''}`}
            type="button"
            role="tab"
            onClick={() => setActiveTab('packages')}
          >
            <i className="bi bi-gift me-2"></i>Packages
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link${activeTab === 'rateCalendar' ? ' active' : ''}`}
            type="button"
            role="tab"
            onClick={() => setActiveTab('rateCalendar')}
          >
            <i className="bi bi-calendar3 me-2"></i>Rate Calendar
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link${activeTab === 'promotions' ? ' active' : ''}`}
            type="button"
            role="tab"
            onClick={() => setActiveTab('promotions')}
          >
            <i className="bi bi-percent me-2"></i>Promotions
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Room Rates Tab */}
        {activeTab === 'ratePlans' && (
          <div className="tab-pane fade show active" role="tabpanel">
            <div className="row">
              {/* Room Rates Table */}
              <div className="col-lg-8">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Room Type Rates</h5>
                    <div className="d-flex gap-2">
                      <select
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                        value={seasonFilter}
                        onChange={(e) => setSeasonFilter(e.target.value)}
                      >
                        <option value="all">All Seasons</option>
                        {seasons.map(s => (
                          <option key={s} value={s.toLowerCase()}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover rates-table mb-0">
                        <thead>
                          <tr>
                            <th>Room Type</th>
                            <th>Rooms</th>
                            <th>Base Rate</th>
                            <th>Weekend</th>
                            <th>Extra Person</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRatePlans.length === 0 && (
                            <tr>
                              <td colSpan="7" className="text-center text-muted py-4">No rate plans found</td>
                            </tr>
                          )}
                          {filteredRatePlans.map((plan) => (
                            <tr key={plan.id}>
                              <td>
                                <div className="room-type-info">
                                  <div className={`room-type-icon ${getRoomTypeClass(plan.room_type)}`}>
                                    <i className={`bi ${getRoomTypeIcon(plan.room_type)}`}></i>
                                  </div>
                                  <div>
                                    <div className="room-type-name">{capitalize(plan.room_type)}</div>
                                    <small className="text-muted">{plan.description || ''}</small>
                                  </div>
                                </div>
                              </td>
                              <td>{plan.room_count || '--'}</td>
                              <td><strong>{formatCurrency(plan.base_rate)}</strong>/night</td>
                              <td>{formatCurrency(plan.weekend_rate)}</td>
                              <td>{plan.extra_person_rate ? formatCurrency(plan.extra_person_rate) : 'N/A'}</td>
                              <td>
                                <span className={`badge ${plan.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                  {plan.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    title="Edit"
                                    onClick={() => openEditRatePlan(plan)}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    title="History"
                                  >
                                    <i className="bi bi-clock-history"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="col-lg-4">
                {/* Seasonal Pricing Summary */}
                <div className="card mb-3">
                  <div className="card-header">
                    <h6 className="mb-0"><i className="bi bi-calendar-range me-2"></i>Seasonal Pricing</h6>
                  </div>
                  <div className="card-body">
                    <div className="season-item">
                      <div className="season-info">
                        <span className="season-name">Peak Season</span>
                        <small className="text-muted">Jun 1 - Aug 31</small>
                      </div>
                      <span className="season-modifier text-danger">+25%</span>
                    </div>
                    <div className="season-item">
                      <div className="season-info">
                        <span className="season-name">Holiday Season</span>
                        <small className="text-muted">Dec 20 - Jan 5</small>
                      </div>
                      <span className="season-modifier text-danger">+35%</span>
                    </div>
                    <div className="season-item">
                      <div className="season-info">
                        <span className="season-name">Off Season</span>
                        <small className="text-muted">Nov 1 - Dec 19</small>
                      </div>
                      <span className="season-modifier text-success">-15%</span>
                    </div>
                    <div className="season-item">
                      <div className="season-info">
                        <span className="season-name">Regular Season</span>
                        <small className="text-muted">Rest of year</small>
                      </div>
                      <span className="season-modifier text-muted">Base Rate</span>
                    </div>
                  </div>
                </div>

                {/* Extra Services */}
                <div className="card mb-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0"><i className="bi bi-plus-circle me-2"></i>Extra Services</h6>
                    <button className="btn btn-sm btn-outline-primary">
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                  <div className="card-body p-0">
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span><i className="bi bi-egg-fried me-2 text-warning"></i>Breakfast</span>
                        <strong>Rs 18/person</strong>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span><i className="bi bi-car-front me-2 text-info"></i>Parking</span>
                        <strong>Rs 15/day</strong>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span><i className="bi bi-wifi me-2 text-primary"></i>Premium WiFi</span>
                        <strong>Rs 10/day</strong>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span><i className="bi bi-clock me-2 text-success"></i>Early Check-in</span>
                        <strong>Rs 35</strong>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span><i className="bi bi-clock-history me-2 text-danger"></i>Late Check-out</span>
                        <strong>Rs 35</strong>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <span><i className="bi bi-person-plus me-2 text-secondary"></i>Extra Bed</span>
                        <strong>Rs 45/night</strong>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Rate Analysis */}
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0"><i className="bi bi-bar-chart me-2"></i>Rate Analysis</h6>
                  </div>
                  <div className="card-body">
                    <div className="rate-analysis-item">
                      <span>Your ADR</span>
                      <div className="d-flex align-items-center">
                        <strong className="me-2">{avgRate > 0 ? formatCurrency(avgRate) : '--'}</strong>
                        <span className="badge bg-success-subtle text-success">+5.2%</span>
                      </div>
                    </div>
                    <div className="rate-analysis-item">
                      <span>Market Average</span>
                      <strong>Rs 135</strong>
                    </div>
                    <div className="rate-analysis-item">
                      <span>RevPAR</span>
                      <div className="d-flex align-items-center">
                        <strong className="me-2">Rs 106</strong>
                        <span className="badge bg-success-subtle text-success">+12%</span>
                      </div>
                    </div>
                    <hr />
                    <small className="text-muted">Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="tab-pane fade show active" role="tabpanel">
            <div className="row g-3">
              {packages.map((pkg) => (
                <div className="col-md-6 col-lg-4" key={pkg.id}>
                  <div className="package-card">
                    {pkg.badge && (
                      <div className={`package-badge ${pkg.badge === 'Most Popular' ? 'popular' : 'new'}`}>{pkg.badge}</div>
                    )}
                    <div className="package-header">
                      <div className={`package-icon ${getRoomTypeClass(pkg.room_type)}`}>
                        <i className={`bi ${getRoomTypeIcon(pkg.room_type)}`}></i>
                      </div>
                      <h5>{pkg.name}</h5>
                      <p className="text-muted">{pkg.description}</p>
                    </div>
                    <div className="package-price">
                      <span className="price">{formatCurrency(pkg.price)}</span>
                      <span className="period">/{pkg.nights} {Number(pkg.nights) === 1 ? 'night' : 'nights'}</span>
                    </div>
                    <ul className="package-features">
                      <li><i className="bi bi-check2 text-success"></i>{capitalize(pkg.room_type)} Room</li>
                      {(Array.isArray(pkg.inclusions) ? pkg.inclusions : (pkg.inclusions || '').split('\n').filter(i => i.trim())).map((item, idx) => (
                        <li key={idx}><i className="bi bi-check2 text-success"></i>{item}</li>
                      ))}
                    </ul>
                    <div className="package-footer">
                      <span className="text-muted"><i className="bi bi-tag me-1"></i>{pkg.savings ? `Save ${formatCurrency(pkg.savings)}` : capitalize(pkg.room_type)}</span>
                      <div>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditPackage(pkg)}>Edit</button>
                        <span className="badge bg-success">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {packages.length === 0 && !loading && (
                <div className="col-12">
                  <p className="text-muted text-center py-4">No packages found</p>
                </div>
              )}

              {/* Add Package Card */}
              <div className="col-md-6 col-lg-4">
                <div className="package-card add-package" onClick={() => { resetPackageForm(); setShowPackageModal(true); }}>
                  <div className="add-package-content">
                    <div className="add-icon">
                      <i className="bi bi-plus-lg"></i>
                    </div>
                    <h5>Create New Package</h5>
                    <p className="text-muted">Design custom packages for guests</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rate Calendar Tab */}
        {activeTab === 'rateCalendar' && (
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
        )}

        {/* Promotions Tab */}
        {activeTab === 'promotions' && (
          <div className="tab-pane fade show active" role="tabpanel">
            <div className="row">
              <div className="col-lg-8">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Active Promotions</h5>
                    <button className="btn btn-sm btn-primary" onClick={() => { resetPromoForm(); setShowPromoModal(true); }}>
                      <i className="bi bi-plus-lg me-1"></i>Add Promotion
                    </button>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Promotion</th>
                            <th>Code</th>
                            <th>Discount</th>
                            <th>Valid Period</th>
                            <th>Usage</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {promotions.length === 0 && (
                            <tr>
                              <td colSpan="7" className="text-center text-muted py-4">No promotions found</td>
                            </tr>
                          )}
                          {promotions.map((promo) => (
                            <tr key={promo.id} className={!promo.is_active ? 'table-light' : ''}>
                              <td>
                                <div className="promo-name">
                                  <strong>{promo.name}</strong>
                                  <small className="text-muted d-block">
                                    {promo.description || (promo.discount_type === 'percentage' ? `${promo.discount_value}% off` : `${formatCurrency(promo.discount_value)} off`)}
                                  </small>
                                </div>
                              </td>
                              <td><code>{promo.code}</code></td>
                              <td>
                                <span className="badge bg-success">
                                  {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `Rs ${promo.discount_value} OFF`}
                                </span>
                              </td>
                              <td>{promo.valid_from && promo.valid_until ? `${formatDate(promo.valid_from)} - ${formatDate(promo.valid_until)}` : 'All Year'}</td>
                              <td>{promo.times_used || 0} / {promo.max_uses || 'Unlimited'}</td>
                              <td>
                                <span className={`badge ${promo.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                  {promo.is_active ? 'Active' : 'Expired'}
                                </span>
                              </td>
                              <td>
                                {promo.is_active ? (
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => openEditPromo(promo)}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => togglePromoActive(promo)}
                                  >
                                    <i className="bi bi-arrow-repeat"></i>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                {/* Promotion Stats */}
                <div className="card mb-3">
                  <div className="card-header">
                    <h6 className="mb-0"><i className="bi bi-graph-up me-2"></i>Promotion Performance</h6>
                  </div>
                  <div className="card-body">
                    <div className="promo-stat-item">
                      <div className="promo-stat-info">
                        <span className="promo-stat-label">Total Redemptions</span>
                        <span className="promo-stat-value">
                          {promotions.reduce((sum, p) => sum + (p.times_used || 0), 0)}
                        </span>
                      </div>
                      <small className="text-success">+18% vs last month</small>
                    </div>
                    <div className="promo-stat-item">
                      <div className="promo-stat-info">
                        <span className="promo-stat-label">Revenue Impact</span>
                        <span className="promo-stat-value">-Rs 8,450</span>
                      </div>
                      <small className="text-muted">Discount value</small>
                    </div>
                    <div className="promo-stat-item">
                      <div className="promo-stat-info">
                        <span className="promo-stat-label">Bookings Generated</span>
                        <span className="promo-stat-value">+Rs 45,200</span>
                      </div>
                      <small className="text-success">From promo bookings</small>
                    </div>
                  </div>
                </div>

                {/* Top Codes */}
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0"><i className="bi bi-trophy me-2"></i>Top Performing Codes</h6>
                  </div>
                  <div className="card-body p-0">
                    <ul className="list-group list-group-flush">
                      {promotions
                        .filter(p => (p.times_used || 0) > 0)
                        .sort((a, b) => (b.times_used || 0) - (a.times_used || 0))
                        .slice(0, 3)
                        .map((promo) => (
                          <li key={promo.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <code>{promo.code}</code>
                              <small className="text-muted d-block">{promo.name}</small>
                            </div>
                            <span className="badge bg-primary rounded-pill">{promo.times_used} uses</span>
                          </li>
                        ))}
                      {promotions.filter(p => (p.times_used || 0) > 0).length === 0 && (
                        <li className="list-group-item text-center text-muted py-3">No usage data yet</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Rate Plan Modal */}
      {showRatePlanModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  {selectedRatePlan ? 'Edit Rate Plan' : 'Add Rate Plan'}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowRatePlanModal(false); resetRatePlanForm(); }}></button>
              </div>
              <form onSubmit={handleSaveRatePlan}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Room Type</label>
                      <select
                        className="form-select"
                        value={ratePlanForm.room_type}
                        onChange={(e) => setRatePlanForm({ ...ratePlanForm, room_type: e.target.value })}
                        required
                      >
                        <option value="">Select Room Type</option>
                        {roomTypes.map(rt => <option key={rt} value={rt}>{capitalize(rt)}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Rate Plan Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Best Available Rate"
                        value={ratePlanForm.season}
                        onChange={(e) => setRatePlanForm({ ...ratePlanForm, season: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Base Rate (Weekday)</label>
                      <div className="input-group">
                        <span className="input-group-text">Rs</span>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={ratePlanForm.base_rate}
                          onChange={(e) => setRatePlanForm({ ...ratePlanForm, base_rate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Weekend Rate</label>
                      <div className="input-group">
                        <span className="input-group-text">Rs</span>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={ratePlanForm.weekend_rate}
                          onChange={(e) => setRatePlanForm({ ...ratePlanForm, weekend_rate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Extra Person</label>
                      <div className="input-group">
                        <span className="input-group-text">Rs</span>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={ratePlanForm.extra_person_rate}
                          onChange={(e) => setRatePlanForm({ ...ratePlanForm, extra_person_rate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Valid From</label>
                      <input
                        type="date"
                        className="form-control"
                        value={ratePlanForm.valid_from || ''}
                        onChange={(e) => setRatePlanForm({ ...ratePlanForm, valid_from: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Valid Until</label>
                      <input
                        type="date"
                        className="form-control"
                        value={ratePlanForm.valid_until || ''}
                        onChange={(e) => setRatePlanForm({ ...ratePlanForm, valid_until: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Inclusions</label>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="incBreakfast" />
                        <label className="form-check-label" htmlFor="incBreakfast">Breakfast Included</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="incWifi" />
                        <label className="form-check-label" htmlFor="incWifi">Premium WiFi</label>
                      </div>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="incParking" />
                        <label className="form-check-label" htmlFor="incParking">Free Parking</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowRatePlanModal(false); resetRatePlanForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Rate Plan</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Seasonal Rates Modal */}
      {showSeasonalModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-calendar-range me-2"></i>Seasonal Rate Adjustments</h5>
                <button type="button" className="btn-close" onClick={() => setShowSeasonalModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="seasonal-rate-item mb-3 p-3 border rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Peak Season</strong>
                    <span className="badge bg-danger">+25%</span>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small">Start Date</label>
                      <input type="date" className="form-control form-control-sm" defaultValue="2026-06-01" />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">End Date</label>
                      <input type="date" className="form-control form-control-sm" defaultValue="2026-08-31" />
                    </div>
                  </div>
                </div>
                <div className="seasonal-rate-item mb-3 p-3 border rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Holiday Season</strong>
                    <span className="badge bg-danger">+35%</span>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small">Start Date</label>
                      <input type="date" className="form-control form-control-sm" defaultValue="2025-12-20" />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">End Date</label>
                      <input type="date" className="form-control form-control-sm" defaultValue="2026-01-05" />
                    </div>
                  </div>
                </div>
                <div className="seasonal-rate-item mb-3 p-3 border rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Off Season</strong>
                    <span className="badge bg-success">-15%</span>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small">Start Date</label>
                      <input type="date" className="form-control form-control-sm" defaultValue="2026-11-01" />
                    </div>
                    <div className="col-6">
                      <label className="form-label small">End Date</label>
                      <input type="date" className="form-control form-control-sm" defaultValue="2026-12-19" />
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline-primary btn-sm w-100">
                  <i className="bi bi-plus me-1"></i>Add New Season
                </button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSeasonalModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Package Modal */}
      {showPackageModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-gift me-2"></i>
                  {selectedPackage ? 'Edit Package' : 'Create New Package'}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowPackageModal(false); resetPackageForm(); }}></button>
              </div>
              <form onSubmit={handleSavePackage}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-8">
                      <label className="form-label">Package Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Weekend Escape"
                        value={packageForm.name}
                        onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Package Price</label>
                      <div className="input-group">
                        <span className="input-group-text">Rs</span>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={packageForm.price}
                          onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Brief description of the package"
                        value={packageForm.description}
                        onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Room Type</label>
                      <select
                        className="form-select"
                        value={packageForm.room_type}
                        onChange={(e) => setPackageForm({ ...packageForm, room_type: e.target.value })}
                        required
                      >
                        <option value="">Select Room Type</option>
                        {roomTypes.map(rt => <option key={rt} value={rt}>{capitalize(rt)}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Duration</label>
                      <select
                        className="form-select"
                        value={packageForm.nights}
                        onChange={(e) => setPackageForm({ ...packageForm, nights: e.target.value })}
                        required
                      >
                        <option value="">Select Duration</option>
                        <option value="1">1 Night</option>
                        <option value="2">2 Nights</option>
                        <option value="3">3 Nights</option>
                        <option value="weekend">Weekend (Fri-Sun)</option>
                        <option value="7">Week (7 Nights)</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Inclusions</label>
                      <div className="row g-2">
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="pkgBreakfast" />
                            <label className="form-check-label" htmlFor="pkgBreakfast">Breakfast</label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="pkgSpa" />
                            <label className="form-check-label" htmlFor="pkgSpa">Spa Credit</label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="pkgParking" />
                            <label className="form-check-label" htmlFor="pkgParking">Free Parking</label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="pkgWifi" />
                            <label className="form-check-label" htmlFor="pkgWifi">Premium WiFi</label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="pkgCheckout" />
                            <label className="form-check-label" htmlFor="pkgCheckout">Late Checkout</label>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="pkgWelcome" />
                            <label className="form-check-label" htmlFor="pkgWelcome">Welcome Drink</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Valid From</label>
                      <input
                        type="date"
                        className="form-control"
                        value={packageForm.valid_from || ''}
                        onChange={(e) => setPackageForm({ ...packageForm, valid_from: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Valid Until</label>
                      <input
                        type="date"
                        className="form-control"
                        value={packageForm.valid_until || ''}
                        onChange={(e) => setPackageForm({ ...packageForm, valid_until: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowPackageModal(false); resetPackageForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{selectedPackage ? 'Save Package' : 'Create Package'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      {showPromoModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-percent me-2"></i>
                  {selectedPromo ? 'Edit Promotion' : 'Add Promotion'}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowPromoModal(false); resetPromoForm(); }}></button>
              </div>
              <form onSubmit={handleSavePromo}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Promotion Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., Summer Sale"
                      value={promoForm.name}
                      onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Promo Code</label>
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="e.g., SUMMER25"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label">Discount Type</label>
                      <select
                        className="form-select"
                        value={promoForm.discount_type}
                        onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Discount Value</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g., 20"
                        min="0"
                        step="0.01"
                        value={promoForm.discount_value}
                        onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label">Valid From</label>
                      <input
                        type="date"
                        className="form-control"
                        value={promoForm.valid_from}
                        onChange={(e) => setPromoForm({ ...promoForm, valid_from: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Valid Until</label>
                      <input
                        type="date"
                        className="form-control"
                        value={promoForm.valid_until}
                        onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Usage Limit</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Leave empty for unlimited"
                      min="0"
                      value={promoForm.max_uses}
                      onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Terms and conditions"
                      value={promoForm.description || ''}
                      onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowPromoModal(false); resetPromoForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{selectedPromo ? 'Save Promotion' : 'Create Promotion'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RatesPage;
