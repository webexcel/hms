import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApi } from '../../../hooks/useApi';
import { capitalize } from '../../../utils/formatters';
import { toast } from 'react-hot-toast';

const DEPARTMENTS = [
  { label: 'Front Office', value: 'front_office' },
  { label: 'Housekeeping', value: 'housekeeping' },
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Security', value: 'security' },
  { label: 'Management', value: 'management' },
  { label: 'Accounts', value: 'accounts' },
];

const INITIAL_STAFF_FORM = {
  first_name: '',
  last_name: '',
  department: '',
  designation: '',
  phone: '',
  email: '',
  date_of_joining: '',
  salary: '',
  shift: 'morning'
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// --- Helper functions ---

export const getDeptLabel = (value) => {
  const dept = DEPARTMENTS.find(d => d.value === value);
  return dept ? dept.label : capitalize((value || '').replace(/_/g, ' '));
};

export const getInitials = (firstName, lastName) => {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
};

export const getShiftLabel = (shift) => {
  const map = { morning: 'Morning Shift', afternoon: 'Afternoon Shift', night: 'Night Shift' };
  return map[shift] || capitalize(shift || '');
};

export const getShiftTime = (shift) => {
  const map = { morning: '6:00 AM - 2:00 PM', evening: '2:00 PM - 10:00 PM', afternoon: '2:00 PM - 10:00 PM', night: '10:00 PM - 6:00 AM' };
  return map[shift] || '';
};

export const getStatusLabel = (status) => {
  const map = { active: 'On Duty', on_leave: 'On Leave', inactive: 'Inactive' };
  return map[status] || capitalize(status || '');
};

export const getStatusClass = (status) => {
  const map = { active: 'active', on_leave: 'leave', inactive: 'offduty' };
  return map[status] || 'offduty';
};

export const getStatusDotClass = (status) => {
  const map = { active: 'online', on_leave: 'away', inactive: 'offline' };
  return map[status] || 'offline';
};

export const getDeptIcon = (dept) => {
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

// --- Main hook ---

const useStaff = () => {
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

  const [staffForm, setStaffForm] = useState(INITIAL_STAFF_FORM);

  const api = useApi();

  const fetchData = useCallback(async () => {
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
  }, [api]);

  useEffect(() => {
    fetchData();
  }, []);

  const resetStaffForm = useCallback(() => {
    setShowStaffModal(false);
    setEditingStaff(null);
    setStaffForm(INITIAL_STAFF_FORM);
  }, []);

  const handleCreateStaff = useCallback(async (e) => {
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
  }, [editingStaff, staffForm, api, resetStaffForm, fetchData]);

  const handleEditStaff = useCallback((staffMember) => {
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
  }, []);

  const handleViewProfile = useCallback((staffMember) => {
    setSelectedStaff(staffMember);
    setShowProfileModal(true);
  }, []);

  const handleViewSchedule = useCallback((staffMember) => {
    setSelectedStaffSchedule(staffMember);
    setShowScheduleModal(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    setShowProfileModal(false);
    setSelectedStaff(null);
  }, []);

  const closeScheduleModal = useCallback(() => {
    setShowScheduleModal(false);
    setSelectedStaffSchedule(null);
  }, []);

  const getWeekDates = useCallback(() => {
    const dates = [];
    const start = new Date(scheduleWeekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [scheduleWeekStart]);

  const getScheduleForStaffDate = useCallback((staffId, date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.find(
      s => s.staff_id === staffId && s.date === dateStr
    );
  }, [schedules]);

  const navigateWeek = useCallback((direction) => {
    const current = new Date(scheduleWeekStart);
    current.setDate(current.getDate() + direction * 7);
    setScheduleWeekStart(current.toISOString().split('T')[0]);
  }, [scheduleWeekStart]);

  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => {
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
  }, [staffList, departmentFilter, statusFilter, searchQuery]);

  const weekDates = useMemo(() => getWeekDates(), [getWeekDates]);

  const deptSummary = useMemo(() => {
    return DEPARTMENTS.map(dept => {
      const deptStaff = staffList.filter(s => (s.department || '') === dept.value);
      const onDuty = deptStaff.filter(s => s.status === 'active').length;
      return { name: dept.label, total: deptStaff.length, onDuty };
    }).filter(d => d.total > 0);
  }, [staffList]);

  const morningStaff = useMemo(() => staffList.filter(s => s.status === 'active' && s.shift === 'morning'), [staffList]);
  const afternoonStaff = useMemo(() => staffList.filter(s => s.status === 'active' && s.shift === 'afternoon'), [staffList]);
  const nightStaff = useMemo(() => staffList.filter(s => s.status === 'active' && s.shift === 'night'), [staffList]);

  return {
    // State
    staffList,
    stats,
    loading,
    showStaffModal,
    showScheduleModal,
    showProfileModal,
    editingStaff,
    selectedStaff,
    selectedStaffSchedule,
    staffForm,
    departmentFilter,
    statusFilter,
    searchQuery,
    viewMode,
    scheduleWeekStart,

    // Derived
    filteredStaff,
    weekDates,
    deptSummary,
    morningStaff,
    afternoonStaff,
    nightStaff,

    // Constants
    departments: DEPARTMENTS,
    dayNames: DAY_NAMES,

    // Setters
    setShowStaffModal,
    setShowScheduleModal,
    setStaffForm,
    setDepartmentFilter,
    setStatusFilter,
    setSearchQuery,
    setViewMode,

    // Handlers
    handleCreateStaff,
    handleEditStaff,
    handleViewProfile,
    handleViewSchedule,
    resetStaffForm,
    closeProfileModal,
    closeScheduleModal,
    navigateWeek,
    getScheduleForStaffDate,
  };
};

export default useStaff;
