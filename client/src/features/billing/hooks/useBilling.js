import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { formatCurrency, capitalize } from '../../../utils/formatters';
import { toast } from 'react-hot-toast';

export const PAYMENT_METHODS = [
  { value: 'cash', icon: 'bi-cash', label: 'Cash' },
  { value: 'card', icon: 'bi-credit-card', label: 'Card' },
  { value: 'upi', icon: 'bi-phone', label: 'UPI' },
  { value: 'bank_transfer', icon: 'bi-bank', label: 'Bank Transfer' },
];

export default function useBilling() {
  const navigate = useNavigate();
  const api = useApi();

  const [billings, setBillings] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingPayments: 0, todayCollections: 0, overdueAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState('');

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [billingItems, setBillingItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add item form
  const [newItem, setNewItem] = useState({ description: '', amount: '', quantity: 1 });

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: '', payment_method: 'cash', transaction_ref: '' });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [groupPaymentId, setGroupPaymentId] = useState(null);
  const [allUnpaidBillings, setAllUnpaidBillings] = useState([]);

  // Advance payment modal
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [advanceData, setAdvanceData] = useState({ amount: '', payment_method: 'cash', reference: '' });
  const [advanceSubmitting, setAdvanceSubmitting] = useState(false);

  // ─── Fetch functions ───

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 10 };
      if (searchTerm) params.search = searchTerm;
      if (activeFilter) params.status = activeFilter;
      const response = await api.get('/billing', { params });
      setBillings(response.data.billings || response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch billing records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUnpaid = async () => {
    try {
      const res = await api.get('/billing', { params: { status: 'unpaid', limit: 100 }, silent: true });
      const unpaid = res.data.billings || res.data.data || [];
      const res2 = await api.get('/billing', { params: { status: 'partial', limit: 100 }, silent: true });
      const partial = res2.data.billings || res2.data.data || [];
      setAllUnpaidBillings([...unpaid, ...partial]);
    } catch { setAllUnpaidBillings([]); }
  };

  const fetchUpcomingReservations = async () => {
    try {
      const res = await api.get('/reservations', { params: { status: 'confirmed', limit: 50 }, silent: true });
      const confirmed = res.data?.data || [];
      const res2 = await api.get('/reservations', { params: { status: 'pending', limit: 50 }, silent: true });
      const pending = res2.data?.data || [];
      setUpcomingReservations([...confirmed, ...pending]);
    } catch { setUpcomingReservations([]); }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/billing/stats');
      const d = response.data;
      setStats({
        totalRevenue: d.totalRevenue || d.total_revenue || 0,
        pendingPayments: d.pendingPayments || d.pending_payments || 0,
        todayCollections: d.todayCollections || d.today_collections || 0,
        overdueAmount: d.overdueAmount || d.overdue_amount || 0,
      });
    } catch (error) {
      console.error('Failed to fetch billing stats:', error);
    }
  };

  const fetchBillingDetail = async (billing) => {
    try {
      setDetailLoading(true);
      setSelectedBilling(billing);
      setShowDetailModal(true);
      const response = await api.get(`/billing/${billing.id}`);
      const detail = response.data.billing || response.data;
      setSelectedBilling(detail);
      setBillingItems(detail.items || []);
    } catch (error) {
      toast.error('Failed to fetch billing details');
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Effects ───

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm]);

  useEffect(() => {
    fetchBillings();
  }, [currentPage, activeFilter, searchTerm]);

  // ─── Handlers ───

  const handleAddItem = async () => {
    if (!newItem.description || !newItem.amount) {
      toast.error('Please fill in description and amount');
      return;
    }
    try {
      await api.post(`/billing/${selectedBilling.id}/items`, {
        description: newItem.description,
        amount: parseFloat(newItem.amount),
        quantity: parseInt(newItem.quantity) || 1,
      });
      toast.success('Item added successfully');
      setNewItem({ description: '', amount: '', quantity: 1 });
      fetchBillingDetail(selectedBilling);
      fetchBillings();
      fetchStats();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      setPaymentSubmitting(true);
      const url = groupPaymentId
        ? `/billing/group/${groupPaymentId}/payments`
        : `/billing/${selectedBilling.id}/payments`;
      await api.post(url, {
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.payment_method,
        reference_number: paymentData.transaction_ref,
      });
      toast.success(groupPaymentId ? 'Group payment recorded successfully' : 'Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentData({ amount: '', payment_method: 'cash', transaction_ref: '' });
      setGroupPaymentId(null);

      // Check if bill is now fully paid — close modal and redirect to front desk
      const paidSoFar = (parseFloat(selectedBilling.paid_amount) || 0) + parseFloat(paymentData.amount);
      const grandTotal = parseFloat(selectedBilling.grand_total) || 0;
      if (paidSoFar >= grandTotal && grandTotal > 0) {
        setShowDetailModal(false);
        toast.success('Bill fully settled! Redirecting to Front Desk...');
        setTimeout(() => navigate('/front-desk'), 800);
        return;
      }

      if (selectedBilling) fetchBillingDetail(selectedBilling);
      fetchBillings();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleCollectAdvance = async () => {
    if (!selectedReservation || !advanceData.amount || Number(advanceData.amount) <= 0) {
      toast.error('Please select a reservation and enter an amount');
      return;
    }
    try {
      setAdvanceSubmitting(true);
      await api.put(`/reservations/${selectedReservation.id}`, {
        advance_paid: (parseFloat(selectedReservation.advance_paid) || 0) + Number(advanceData.amount),
      });
      toast.success(`Advance of ${formatCurrency(Number(advanceData.amount))} collected for Room ${selectedReservation.room?.room_number || '-'}`);
      setShowAdvanceModal(false);
      setSelectedReservation(null);
      setAdvanceData({ amount: '', payment_method: 'cash', reference: '' });
      fetchBillings();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record advance');
    } finally {
      setAdvanceSubmitting(false);
    }
  };

  const handleAdvanceFromPaymentModal = async () => {
    if (!paymentData.amount || Number(paymentData.amount) <= 0) {
      toast.error('Please enter an amount');
      return;
    }
    setPaymentSubmitting(true);
    try {
      await api.put(`/reservations/${selectedReservation.id}`, {
        advance_paid: (parseFloat(selectedReservation.advance_paid) || 0) + Number(paymentData.amount),
      });
      toast.success(`Advance of ${formatCurrency(Number(paymentData.amount))} collected for Room ${selectedReservation.room?.room_number || '-'}`);
      setShowPaymentModal(false);
      setSelectedReservation(null);
      fetchBillings();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record advance');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const openQuickPayment = () => {
    setSelectedBilling(null);
    setSelectedReservation(null);
    setPaymentData({ amount: '', payment_method: 'cash', transaction_ref: '', _search: '', _dateFilter: '', _tab: 'billing' });
    fetchAllUnpaid();
    fetchUpcomingReservations();
    setShowPaymentModal(true);
  };

  const openRecordPaymentAction = () => {
    setSelectedBilling(null);
    setPaymentData({ amount: '', payment_method: 'cash', transaction_ref: '' });
    setShowPaymentModal(true);
  };

  const refreshData = () => {
    setSearchTerm('');
    setActiveFilter('');
    fetchBillings();
    fetchStats();
  };

  // ─── Computed / helpers ───

  const getGuestName = (billing) => {
    return billing.guest_name || `${billing.guest?.first_name || ''} ${billing.guest?.last_name || ''}`.trim() || 'Unknown';
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'paid';
    if (s === 'partial') return 'partial';
    if (s === 'overdue') return 'overdue';
    return 'open';
  };

  const getStatusLabel = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'Paid';
    if (s === 'partial') return 'Partial';
    if (s === 'overdue') return 'Overdue';
    if (s === 'unpaid') return 'Open';
    return capitalize(status || 'Open');
  };

  const getAvatarClass = (index) => {
    const classes = ['av1', 'av2', 'av3', 'av4'];
    return classes[index % classes.length];
  };

  const getTotal = (billing) => {
    return parseFloat(billing.grand_total) || parseFloat(billing.total_amount) || 0;
  };

  const getBalance = (billing) => {
    if (billing.balance_due != null && parseFloat(billing.balance_due) !== 0) return parseFloat(billing.balance_due);
    if (billing.balance != null) return parseFloat(billing.balance);
    return getTotal(billing) - (parseFloat(billing.paid_amount) || 0);
  };

  const getPaymentPercent = (billing) => {
    const total = getTotal(billing);
    if (!total) return 0;
    return Math.min(100, Math.round(((parseFloat(billing.paid_amount) || 0) / total) * 100));
  };

  const getProgressBarClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'bg-success';
    if (s === 'overdue') return 'bg-danger';
    if (s === 'partial') return 'bg-warning';
    return 'bg-success';
  };

  return {
    // State
    billings, stats, loading, searchTerm, setSearchTerm,
    currentPage, setCurrentPage, totalPages, activeFilter, setActiveFilter,
    showDetailModal, setShowDetailModal, selectedBilling, setSelectedBilling,
    billingItems, detailLoading,
    newItem, setNewItem,
    showPaymentModal, setShowPaymentModal, paymentData, setPaymentData,
    paymentSubmitting, setPaymentSubmitting, groupPaymentId, setGroupPaymentId,
    allUnpaidBillings, upcomingReservations,
    selectedReservation, setSelectedReservation,
    showAdvanceModal, setShowAdvanceModal, advanceData, setAdvanceData, advanceSubmitting,

    // Handlers
    fetchBillings, fetchStats, fetchBillingDetail, fetchAllUnpaid, fetchUpcomingReservations,
    handleAddItem, handleRecordPayment, handleCollectAdvance, handleAdvanceFromPaymentModal,
    openQuickPayment, openRecordPaymentAction, refreshData,

    // Helpers
    getGuestName, getInitials, getStatusClass, getStatusLabel,
    getAvatarClass, getTotal, getBalance, getPaymentPercent, getProgressBarClass,

    // API (for inline handlers in components)
    api,
  };
}
