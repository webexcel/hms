import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, formatCurrency, capitalize } from '../utils/formatters';
import { toast } from 'react-hot-toast';

const StaffPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, onLeave: 0 });
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedStaffSchedule, setSelectedStaffSchedule] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(true);

  const [scheduleWeekStart, setScheduleWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  });

  const [staffForm, setStaffForm] = useState({
    first_name: '',
    last_name: '',
    department: '',
    designation: '',
    phone: '',
    email: '',
    date_of_joining: '',
    salary: '',
    shift: 'morning'
  });

  const api = useApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, schedulesRes] = await Promise.all([
        api.get('/staff'),
        api.get('/staff/schedules')
      ]);

      const staffData = staffRes.data?.data || staffRes.data || [];
      setStaffList(staffData);
      setSchedules(schedulesRes.data?.data || schedulesRes.data || []);

      const active = staffData.filter(s => s.status === 'active').length;
      const onLeave = staffData.filter(s => s.status === 'on_leave').length;
      setStats({ total: staffData.length, active, onLeave });
    } catch (error) {
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, staffForm);
        toast.success('Staff updated successfully');
      } else {
        await api.post('/staff', staffForm);
        toast.success('Staff added successfully');
      }
      resetStaffForm();
      fetchData();
    } catch (error) {
      toast.error(editingStaff ? 'Failed to update staff' : 'Failed to add staff');
    }
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setStaffForm({
      first_name: staffMember.first_name || '',
      last_name: staffMember.last_name || '',
      department: staffMember.department || '',
      designation: staffMember.designation || '',
      phone: staffMember.phone || '',
      email: staffMember.email || '',
      date_of_joining: staffMember.date_of_joining
        ? new Date(staffMember.date_of_joining).toISOString().split('T')[0]
        : '',
      salary: staffMember.salary || '',
      shift: staffMember.shift || 'morning'
    });
    setShowStaffModal(true);
  };

  const handleViewProfile = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowProfileModal(true);
  };

  const handleViewSchedule = (staffMember) => {
    setSelectedStaffSchedule(staffMember);
    setShowScheduleModal(true);
  };

  const resetStaffForm = () => {
    setShowStaffModal(false);
    setEditingStaff(null);
    setStaffForm({
      first_name: '',
      last_name: '',
      department: '',
      designation: '',
      phone: '',
      email: '',
      date_of_joining: '',
      salary: '',
      shift: 'morning'
    });
  };

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(scheduleWeekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getScheduleForStaffDate = (staffId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.find(
      s => s.staff_id === staffId && s.date === dateStr
    );
  };

  const navigateWeek = (direction) => {
    const current = new Date(scheduleWeekStart);
    current.setDate(current.getDate() + direction * 7);
    setScheduleWeekStart(current.toISOString().split('T')[0]);
  };

  const departments = [
    { label: 'Front Office', value: 'front_office' },
    { label: 'Housekeeping', value: 'housekeeping' },
    { label: 'Restaurant', value: 'restaurant' },
    { label: 'Maintenance', value: 'maintenance' },
    { label: 'Security', value: 'security' },
    { label: 'Management', value: 'management' },
    { label: 'Accounts', value: 'accounts' },
  ];

  const getDeptLabel = (value) => {
    const dept = departments.find(d => d.value === value);
    return dept ? dept.label : capitalize((value || '').replace(/_/g, ' '));
  };

  const getInitials = (firstName, lastName) => {
    return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
  };

  const getShiftLabel = (shift) => {
    const map = { morning: 'Morning Shift', afternoon: 'Afternoon Shift', night: 'Night Shift' };
    return map[shift] || capitalize(shift || '');
  };

  const getShiftTime = (shift) => {
    const map = { morning: '6:00 AM - 2:00 PM', evening: '2:00 PM - 10:00 PM', afternoon: '2:00 PM - 10:00 PM', night: '10:00 PM - 6:00 AM' };
    return map[shift] || '';
  };

  const getStatusLabel = (status) => {
    const map = { active: 'On Duty', on_leave: 'On Leave', inactive: 'Inactive' };
    return map[status] || capitalize(status || '');
  };

  const getStatusClass = (status) => {
    const map = { active: 'active', on_leave: 'leave', inactive: 'offduty' };
    return map[status] || 'offduty';
  };

  const getStatusDotClass = (status) => {
    const map = { active: 'online', on_leave: 'away', inactive: 'offline' };
    return map[status] || 'offline';
  };

  const getDeptIcon = (dept) => {
    const map = {
      housekeeping: 'bi-brush',
      'front desk': 'bi-door-open',
      frontdesk: 'bi-door-open',
      restaurant: 'bi-cup-hot',
      kitchen: 'bi-cup-hot',
      maintenance: 'bi-wrench',
      security: 'bi-shield-check',
      management: 'bi-briefcase',
      accounts: 'bi-calculator'
    };
    return map[(dept || '').toLowerCase()] || 'bi-building';
  };

  const filteredStaff = staffList.filter(staff => {
    if (departmentFilter && staff.department !== departmentFilter) return false;
    if (statusFilter && staff.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase();
      const empId = (staff.employee_id || '').toLowerCase();
      if (!fullName.includes(query) && !empId.includes(query)) return false;
    }
    return true;
  });

  const weekDates = getWeekDates();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Compute department summary
  const deptSummary = departments.map(dept => {
    const deptStaff = staffList.filter(s => (s.department || '') === dept.value);
    const onDuty = deptStaff.filter(s => s.status === 'active').length;
    return { name: dept.label, total: deptStaff.length, onDuty };
  }).filter(d => d.total > 0);

  // Compute shift counts for today's schedule
  const morningStaff = staffList.filter(s => s.status === 'active' && s.shift === 'morning');
  const afternoonStaff = staffList.filter(s => s.status === 'active' && s.shift === 'afternoon');
  const nightStaff = staffList.filter(s => s.status === 'active' && s.shift === 'night');

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Staff Management</h1>
          <p>Manage employees, schedules, and department assignments</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline-secondary" onClick={() => setShowScheduleModal(true)}>
            <i className="bi bi-calendar-week me-2"></i>Schedule
          </button>
          <button className="btn btn-primary" onClick={() => setShowStaffModal(true)}>
            <i className="bi bi-plus-lg me-2"></i>Add Staff
          </button>
        </div>
      </div>

      {/* Staff Stats */}
      <div className="row g-4 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-primary-subtle">
              <i className="bi bi-people text-primary"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Staff</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-success-subtle">
              <i className="bi bi-person-check text-success"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">On Duty Today</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-warning-subtle">
              <i className="bi bi-calendar-x text-warning"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.onLeave}</div>
              <div className="stat-label">On Leave</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-info-subtle">
              <i className="bi bi-clock-history text-info"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total - stats.active - stats.onLeave}</div>
              <div className="stat-label">Inactive</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-4">
        {/* Left Column - Staff List */}
        <div className="col-xl-8">
          {/* Filter Bar */}
          <div className="staff-filter-bar">
            <div className="search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select
                className="form-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="view-toggle">
              <button
                className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <i className="bi bi-list-ul"></i>
              </button>
              <button
                className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <i className="bi bi-grid-3x3-gap"></i>
              </button>
            </div>
          </div>

          {/* Staff List View */}
          {viewMode === 'list' && (
            <div className="staff-list-container">
              {filteredStaff.length === 0 && (
                <div className="text-center text-muted py-5">No staff members found</div>
              )}
              {filteredStaff.map(staff => (
                <div key={staff.id} className={`staff-card-list${staff.status === 'on_leave' ? ' on-leave' : ''}`}>
                  <div className="staff-avatar-lg">
                    <span>{getInitials(staff.first_name, staff.last_name)}</span>
                    <span className={`status-dot ${getStatusDotClass(staff.status)}`}></span>
                  </div>
                  <div className="staff-main-info">
                    <h5 className="staff-name">{staff.first_name} {staff.last_name}</h5>
                    <span className="staff-role">{staff.designation || getDeptLabel(staff.department)}</span>
                    <div className="staff-meta">
                      <span><i className="bi bi-building"></i> {getDeptLabel(staff.department)}</span>
                      {staff.phone && <span><i className="bi bi-telephone"></i> {staff.phone}</span>}
                      {staff.email && <span><i className="bi bi-envelope"></i> {staff.email}</span>}
                    </div>
                  </div>
                  <div className="staff-schedule">
                    {staff.status === 'on_leave' ? (
                      <>
                        <span className="leave-info"><i className="bi bi-calendar-x"></i> On Leave</span>
                      </>
                    ) : (
                      <>
                        <span className={`shift-badge ${staff.shift || 'morning'}`}>{getShiftLabel(staff.shift)}</span>
                        <span className="shift-time">{getShiftTime(staff.shift)}</span>
                      </>
                    )}
                  </div>
                  <div className="staff-status-info">
                    <span className={`status-badge ${getStatusClass(staff.status)}`}>
                      {getStatusLabel(staff.status)}
                    </span>
                  </div>
                  <div className="staff-actions">
                    <button className="btn btn-sm btn-outline-primary" title="View Profile" onClick={() => handleViewProfile(staff)}>
                      <i className="bi bi-eye"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" title="Edit" onClick={() => handleEditStaff(staff)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-info" title="Schedule" onClick={() => handleViewSchedule(staff)}>
                      <i className="bi bi-calendar-week"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Staff Grid View */}
          {viewMode === 'grid' && (
            <div className="staff-grid-container">
              <div className="row g-3">
                {filteredStaff.length === 0 && (
                  <div className="col-12 text-center text-muted py-5">No staff members found</div>
                )}
                {filteredStaff.map(staff => (
                  <div key={staff.id} className="col-md-4">
                    <div className="staff-card-grid">
                      <div className="staff-avatar-xl">
                        <span>{getInitials(staff.first_name, staff.last_name)}</span>
                        <span className={`status-dot ${getStatusDotClass(staff.status)}`}></span>
                      </div>
                      <h5 className="staff-name">{staff.first_name} {staff.last_name}</h5>
                      <span className="staff-role">{staff.designation || getDeptLabel(staff.department)}</span>
                      <span className={`dept-badge ${(staff.department || '').toLowerCase().replace(/\s+/g, '')}`}>
                        {getDeptLabel(staff.department)}
                      </span>
                      <div className="staff-contact">
                        {staff.phone && (
                          <a href={`tel:${staff.phone}`}><i className="bi bi-telephone"></i></a>
                        )}
                        {staff.email && (
                          <a href={`mailto:${staff.email}`}><i className="bi bi-envelope"></i></a>
                        )}
                      </div>
                      <span className={`status-badge ${getStatusClass(staff.status)}`}>
                        {getStatusLabel(staff.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-xl-4">
          {/* Today's Schedule */}
          <div className="staff-schedule-card">
            <div className="card-header-custom">
              <h5><i className="bi bi-calendar-day me-2"></i>Today's Schedule</h5>
              <a href="#" className="view-all" onClick={(e) => { e.preventDefault(); }}>Full Schedule</a>
            </div>
            <div className="schedule-shifts">
              <div className="shift-section">
                <div className="shift-header morning">
                  <i className="bi bi-sunrise"></i>
                  <span>Morning Shift (6 AM - 2 PM)</span>
                  <span className="shift-count">{morningStaff.length} staff</span>
                </div>
                <div className="shift-staff">
                  {morningStaff.slice(0, 3).map(s => (
                    <span key={s.id} className="staff-mini">{getInitials(s.first_name, s.last_name)}</span>
                  ))}
                  {morningStaff.length > 3 && (
                    <span className="staff-mini">+{morningStaff.length - 3}</span>
                  )}
                </div>
              </div>
              <div className="shift-section">
                <div className="shift-header afternoon">
                  <i className="bi bi-sun"></i>
                  <span>Evening Shift (2 PM - 10 PM)</span>
                  <span className="shift-count">{afternoonStaff.length} staff</span>
                </div>
                <div className="shift-staff">
                  {afternoonStaff.slice(0, 3).map(s => (
                    <span key={s.id} className="staff-mini">{getInitials(s.first_name, s.last_name)}</span>
                  ))}
                  {afternoonStaff.length > 3 && (
                    <span className="staff-mini">+{afternoonStaff.length - 3}</span>
                  )}
                </div>
              </div>
              <div className="shift-section">
                <div className="shift-header night">
                  <i className="bi bi-moon-stars"></i>
                  <span>Night Shift (10 PM - 6 AM)</span>
                  <span className="shift-count">{nightStaff.length} staff</span>
                </div>
                <div className="shift-staff">
                  {nightStaff.slice(0, 3).map(s => (
                    <span key={s.id} className="staff-mini">{getInitials(s.first_name, s.last_name)}</span>
                  ))}
                  {nightStaff.length > 3 && (
                    <span className="staff-mini">+{nightStaff.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Department Summary */}
          <div className="staff-dept-card">
            <div className="card-header-custom">
              <h5><i className="bi bi-diagram-3 me-2"></i>By Department</h5>
            </div>
            <div className="dept-list">
              {deptSummary.map(dept => (
                <div key={dept.name} className="dept-item">
                  <div className="dept-info">
                    <span className={`dept-icon ${dept.name.toLowerCase().replace(/\s+/g, '')}`}>
                      <i className={`bi ${getDeptIcon(dept.name)}`}></i>
                    </span>
                    <span className="dept-name">{dept.name}</span>
                  </div>
                  <div className="dept-stats">
                    <span className="dept-count">{dept.total} staff</span>
                    <span className="dept-active">{dept.onDuty} on duty</span>
                  </div>
                </div>
              ))}
              {deptSummary.length === 0 && (
                <div className="text-center text-muted py-3">No department data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Staff Modal */}
      {showStaffModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={resetStaffForm}>
          <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${editingStaff ? 'bi-pencil' : 'bi-person-plus'} me-2`}></i>
                  {editingStaff ? 'Edit Staff' : 'Add New Staff'}
                </h5>
                <button type="button" className="btn-close" onClick={resetStaffForm}></button>
              </div>
              <form onSubmit={handleCreateStaff}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter first name"
                        value={staffForm.first_name}
                        onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter last name"
                        value={staffForm.last_name}
                        onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="email@hotel.com"
                        value={staffForm.email}
                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="+91 98765 43210"
                        value={staffForm.phone}
                        onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department</label>
                      <select
                        className="form-select"
                        value={staffForm.department}
                        onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                        required
                      >
                        <option value="">Select department...</option>
                        {departments.map(dept => (
                          <option key={dept.value} value={dept.value}>{dept.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Role/Position</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., Senior Housekeeper"
                        value={staffForm.designation}
                        onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Default Shift</label>
                      <select
                        className="form-select"
                        value={staffForm.shift}
                        onChange={(e) => setStaffForm({ ...staffForm, shift: e.target.value })}
                      >
                        <option value="morning">Morning (6 AM - 2 PM)</option>
                        <option value="afternoon">Afternoon (2 PM - 10 PM)</option>
                        <option value="night">Night (10 PM - 6 AM)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Join Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={staffForm.date_of_joining}
                        onChange={(e) => setStaffForm({ ...staffForm, date_of_joining: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Salary</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Monthly salary"
                        step="0.01"
                        min="0"
                        value={staffForm.salary}
                        onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={resetStaffForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-lg me-1"></i>{editingStaff ? 'Update Staff' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Staff Profile Modal */}
      {showProfileModal && selectedStaff && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={() => { setShowProfileModal(false); setSelectedStaff(null); }}>
          <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-person-badge me-2"></i>Staff Profile</h5>
                <button type="button" className="btn-close" onClick={() => { setShowProfileModal(false); setSelectedStaff(null); }}></button>
              </div>
              <div className="modal-body">
                <div className="staff-profile">
                  <div className="profile-header">
                    <div className="profile-avatar">
                      <span>{getInitials(selectedStaff.first_name, selectedStaff.last_name)}</span>
                    </div>
                    <div className="profile-info">
                      <h4>{selectedStaff.first_name} {selectedStaff.last_name}</h4>
                      <span className="profile-role">{selectedStaff.designation || capitalize(selectedStaff.department || '')}</span>
                      <span className="profile-dept">{capitalize(selectedStaff.department || '')} Department</span>
                      <span className={`status-badge ${getStatusClass(selectedStaff.status)}`}>
                        {getStatusLabel(selectedStaff.status)}
                      </span>
                    </div>
                  </div>
                  <div className="row g-4 mt-3">
                    <div className="col-md-6">
                      <div className="profile-section">
                        <h6><i className="bi bi-person me-2"></i>Personal Information</h6>
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="label">Employee ID</span>
                            <span className="value">{selectedStaff.employee_id || `EMP-${selectedStaff.id}`}</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Phone</span>
                            <span className="value">{selectedStaff.phone || '-'}</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Email</span>
                            <span className="value">{selectedStaff.email || '-'}</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Join Date</span>
                            <span className="value">{formatDate(selectedStaff.date_of_joining)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="profile-section">
                        <h6><i className="bi bi-clock me-2"></i>Work Schedule</h6>
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="label">Default Shift</span>
                            <span className="value">{getShiftLabel(selectedStaff.shift)} ({getShiftTime(selectedStaff.shift)})</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Department</span>
                            <span className="value">{capitalize(selectedStaff.department || '')}</span>
                          </div>
                          <div className="info-item">
                            <span className="label">Salary</span>
                            <span className="value">{formatCurrency(selectedStaff.salary)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-primary" onClick={() => { setShowProfileModal(false); handleEditStaff(selectedStaff); }}>
                  <i className="bi bi-pencil me-1"></i>Edit Profile
                </button>
                <button type="button" className="btn btn-light" onClick={() => { setShowProfileModal(false); setSelectedStaff(null); }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={() => { setShowScheduleModal(false); setSelectedStaffSchedule(null); }}>
          <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-calendar-week me-2"></i>
                  {selectedStaffSchedule
                    ? `Schedule - ${selectedStaffSchedule.first_name} ${selectedStaffSchedule.last_name}`
                    : 'Staff Schedule'
                  }
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowScheduleModal(false); setSelectedStaffSchedule(null); }}></button>
              </div>
              <div className="modal-body">
                {selectedStaffSchedule ? (
                  <div>
                    <div className="mb-3">
                      <strong>Department:</strong> {capitalize(selectedStaffSchedule.department || '')}
                      <br />
                      <strong>Default Shift:</strong> {getShiftLabel(selectedStaffSchedule.shift)}
                      <br />
                      <strong>Status:</strong>{' '}
                      <span className={`status-badge ${getStatusClass(selectedStaffSchedule.status)}`}>
                        {getStatusLabel(selectedStaffSchedule.status)}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Weekly Schedule</h6>
                      <div className="d-flex gap-2 align-items-center">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigateWeek(-1)}>
                          <i className="bi bi-chevron-left"></i> Prev
                        </button>
                        <span className="fw-bold">
                          {new Date(scheduleWeekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' - '}
                          {weekDates[6]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigateWeek(1)}>
                          Next <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-bordered table-sm">
                        <thead>
                          <tr>
                            <th>Day</th>
                            <th>Date</th>
                            <th>Shift</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {weekDates.map((date, i) => {
                            const schedule = getScheduleForStaffDate(selectedStaffSchedule.id, date);
                            return (
                              <tr key={i}>
                                <td>{dayNames[date.getDay()]}</td>
                                <td>{formatDate(date)}</td>
                                <td>
                                  {schedule?.is_off
                                    ? 'Off'
                                    : capitalize(schedule?.shift || selectedStaffSchedule.shift || 'morning')}
                                </td>
                                <td>
                                  <span className={`badge bg-${schedule?.is_off ? 'danger' : 'success'}`}>
                                    {schedule?.is_off ? 'Day Off' : 'Working'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Week Overview</h6>
                      <div className="d-flex gap-2 align-items-center">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigateWeek(-1)}>
                          <i className="bi bi-chevron-left"></i> Prev
                        </button>
                        <span className="fw-bold">
                          {new Date(scheduleWeekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {' - '}
                          {weekDates[6]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigateWeek(1)}>
                          Next <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm">
                        <thead>
                          <tr>
                            <th style={{ minWidth: 150 }}>Staff</th>
                            {weekDates.map((date, i) => (
                              <th key={i} className="text-center" style={{ minWidth: 100 }}>
                                <div>{dayNames[date.getDay()]}</div>
                                <small className="text-muted">
                                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </small>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {staffList
                            .filter(s => s.status === 'active')
                            .slice(0, 15)
                            .map(staff => (
                              <tr key={staff.id}>
                                <td>
                                  <div className="fw-bold" style={{ fontSize: '0.85rem' }}>
                                    {staff.first_name} {staff.last_name}
                                  </div>
                                  <small className="text-muted">{getDeptLabel(staff.department)}</small>
                                </td>
                                {weekDates.map((date, i) => {
                                  const schedule = getScheduleForStaffDate(staff.id, date);
                                  const shiftColors = {
                                    morning: '#fff3cd',
                                    evening: '#cce5ff',
                                    afternoon: '#cce5ff',
                                    night: '#d6d8db',
                                    off: '#f8d7da'
                                  };
                                  const shiftType = schedule?.shift || staff.shift || 'morning';
                                  return (
                                    <td
                                      key={i}
                                      className="text-center"
                                      style={{
                                        backgroundColor: schedule?.is_off
                                          ? shiftColors.off
                                          : shiftColors[shiftType] || '#fff',
                                        fontSize: '0.8rem',
                                        verticalAlign: 'middle'
                                      }}
                                    >
                                      {schedule?.is_off ? (
                                        <span className="text-danger">OFF</span>
                                      ) : (
                                        <span>{capitalize(shiftType)}</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          {staffList.filter(s => s.status === 'active').length === 0 && (
                            <tr>
                              <td colSpan={8} className="text-center text-muted py-3">
                                No active staff to display
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => { setShowScheduleModal(false); setSelectedStaffSchedule(null); }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffPage;
