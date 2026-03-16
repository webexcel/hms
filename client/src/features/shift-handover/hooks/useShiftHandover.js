import { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import { capitalize } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

const INITIAL_FORM = {
  shift: 'morning',
  cash_in_hand: '',
  total_collections: '',
  pending_checkouts: '',
  notes: '',
  tasks_pending: ''
};

const SHIFTS = ['morning', 'afternoon', 'night'];

const SHIFT_LABELS = {
  morning: 'Morning Shift (6 AM - 2 PM)',
  afternoon: 'Afternoon Shift (2 PM - 10 PM)',
  night: 'Night Shift (10 PM - 6 AM)'
};

export const useShiftHandover = () => {
  const api = useApi();
  const { user } = useAuth();

  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDiscountsModal, setShowDiscountsModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [rooms, setRooms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState('');
  const [outgoingConfirm, setOutgoingConfirm] = useState(false);
  const [incomingConfirm, setIncomingConfirm] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    fetchHandovers();
    fetchStats();
  }, []);

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shift-handovers');
      setHandovers(res.data?.data || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch handovers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/shift-handovers/stats');
      setStats(res.data || { total: 0, pending: 0, accepted: 0, rejected: 0 });
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setNotes('');
  };

  const handleCreateHandover = async () => {
    try {
      await api.post('/shift-handovers', formData);
      toast.success('Handover created successfully');
      setShowModal(false);
      resetForm();
      fetchHandovers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create handover');
    }
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/shift-handovers/${id}/accept`);
      toast.success('Handover accepted');
      fetchHandovers();
      fetchStats();
    } catch (err) {
      toast.error('Failed to accept handover');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await api.put(`/shift-handovers/${id}/reject`, { reason });
      toast.success('Handover rejected');
      fetchHandovers();
      fetchStats();
    } catch (err) {
      toast.error('Failed to reject handover');
    }
  };

  const handleCompleteHandover = async () => {
    try {
      await api.post('/shift-handovers', { ...formData, notes });
      toast.success('Handover completed successfully');
      setShowConfirmModal(false);
      resetForm();
      fetchHandovers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete handover');
    }
  };

  const openNewShiftModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeNewShiftModal = () => {
    setShowModal(false);
    resetForm();
  };

  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helpers
  const getShiftLabel = (shift) => SHIFT_LABELS[shift] || capitalize(shift);

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadgeClass = (status) => {
    const map = { pending: 'warning', accepted: 'success', rejected: 'danger' };
    return map[status] || 'secondary';
  };

  const getRoomStatusClass = (status) => {
    const map = { available: 'available', occupied: 'occupied', reserved: 'reserved', maintenance: 'maintenance', arriving: 'arriving', departing: 'departing' };
    return map[status] || '';
  };

  const getTaskTypeClass = (type) => {
    const map = { maintenance: 'maintenance', request: 'request', vip: 'vip', info: 'info' };
    return map[type] || 'info';
  };

  const getTaskIcon = (type) => {
    const map = { maintenance: 'bi-tools', request: 'bi-clock-history', vip: 'bi-star', info: 'bi-people' };
    return map[type] || 'bi-info-circle';
  };

  const latestHandover = handovers.length > 0 ? handovers[0] : null;

  return {
    // State
    user,
    handovers,
    loading,
    showModal,
    showConfirmModal,
    showDiscountsModal,
    stats,
    rooms,
    tasks,
    notes,
    outgoingConfirm,
    incomingConfirm,
    formData,
    latestHandover,
    shifts: SHIFTS,

    // Setters
    setShowModal,
    setShowConfirmModal,
    setShowDiscountsModal,
    setNotes,
    setOutgoingConfirm,
    setIncomingConfirm,

    // Handlers
    handleCreateHandover,
    handleAccept,
    handleReject,
    handleCompleteHandover,
    openNewShiftModal,
    closeNewShiftModal,
    updateFormField,
    resetForm,

    // Helpers
    getShiftLabel,
    getUserInitials,
    getStatusBadgeClass,
    getRoomStatusClass,
    getTaskTypeClass,
    getTaskIcon,
  };
};
