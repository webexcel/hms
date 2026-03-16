import { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import toast from 'react-hot-toast';

export const SEASONS = ['Peak Season', 'Off Season', 'Holiday'];
export const MEAL_PLANS = ['none', 'breakfast', 'half_board', 'full_board', 'all_inclusive'];

const INITIAL_RATE_PLAN_FORM = {
  room_type: '',
  season: '',
  base_rate: '',
  weekend_rate: '',
  extra_person_rate: '',
  meal_plan: 'none',
  is_active: true
};

const INITIAL_PACKAGE_FORM = {
  name: '',
  description: '',
  room_type: '',
  nights: '',
  price: '',
  inclusions: ''
};

const INITIAL_PROMO_FORM = {
  code: '',
  name: '',
  discount_type: 'percentage',
  discount_value: '',
  valid_from: '',
  valid_until: '',
  max_uses: '',
  is_active: true
};

export const getRoomTypeIcon = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('executive')) return 'bi-gem';
  if (t.includes('junior') || t.includes('suite')) return 'bi-star';
  if (t.includes('deluxe')) return 'bi-house';
  if (t.includes('superior') || t.includes('premium')) return 'bi-house-heart';
  if (t.includes('family')) return 'bi-people';
  return 'bi-house-door';
};

export const getRoomTypeClass = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('executive')) return 'executive';
  if (t.includes('junior') || t.includes('suite')) return 'suite';
  if (t.includes('deluxe')) return 'deluxe';
  if (t.includes('superior') || t.includes('premium')) return 'superior';
  if (t.includes('family')) return 'family';
  return 'standard';
};

export default function useRates() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('ratePlans');
  const [loading, setLoading] = useState(true);

  // Rate Plans state
  const [ratePlans, setRatePlans] = useState([]);
  const [showRatePlanModal, setShowRatePlanModal] = useState(false);
  const [selectedRatePlan, setSelectedRatePlan] = useState(null);
  const [ratePlanForm, setRatePlanForm] = useState(INITIAL_RATE_PLAN_FORM);

  // Packages state
  const [packages, setPackages] = useState([]);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packageForm, setPackageForm] = useState(INITIAL_PACKAGE_FORM);

  // Promotions state
  const [promotions, setPromotions] = useState([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [promoForm, setPromoForm] = useState(INITIAL_PROMO_FORM);

  // Seasonal rates modal
  const [showSeasonalModal, setShowSeasonalModal] = useState(false);

  // Season filter
  const [seasonFilter, setSeasonFilter] = useState('all');

  // Rate calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarRoomType, setCalendarRoomType] = useState('all');

  const [roomTypes, setRoomTypes] = useState([]);

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
  const resetRatePlanForm = () => {
    setSelectedRatePlan(null);
    setRatePlanForm(INITIAL_RATE_PLAN_FORM);
  };

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

  // Package handlers
  const resetPackageForm = () => {
    setSelectedPackage(null);
    setPackageForm(INITIAL_PACKAGE_FORM);
  };

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
  const resetPromoForm = () => {
    setSelectedPromo(null);
    setPromoForm(INITIAL_PROMO_FORM);
  };

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

  // Computed values
  const avgRate = ratePlans.length > 0
    ? ratePlans.reduce((sum, p) => sum + Number(p.base_rate || 0), 0) / ratePlans.length
    : 0;

  const filteredRatePlans = seasonFilter === 'all'
    ? ratePlans
    : ratePlans.filter(p => p.season === seasonFilter);

  const isInitialLoading = loading && ratePlans.length === 0 && packages.length === 0 && promotions.length === 0;

  return {
    // Tab
    activeTab, setActiveTab,
    loading, isInitialLoading,

    // Rate Plans
    ratePlans, filteredRatePlans,
    showRatePlanModal, setShowRatePlanModal,
    selectedRatePlan,
    ratePlanForm, setRatePlanForm,
    handleSaveRatePlan, openEditRatePlan, resetRatePlanForm,

    // Packages
    packages,
    showPackageModal, setShowPackageModal,
    selectedPackage,
    packageForm, setPackageForm,
    handleSavePackage, openEditPackage, resetPackageForm, handleDeletePackage,

    // Promotions
    promotions,
    showPromoModal, setShowPromoModal,
    selectedPromo,
    promoForm, setPromoForm,
    handleSavePromo, openEditPromo, resetPromoForm, togglePromoActive,

    // Seasonal modal
    showSeasonalModal, setShowSeasonalModal,

    // Season filter
    seasonFilter, setSeasonFilter,

    // Calendar
    calendarMonth, calendarRoomType, setCalendarRoomType,
    calendarMonthName, getCalendarDays, prevMonth, nextMonth,

    // Data
    roomTypes, avgRate,
  };
}
