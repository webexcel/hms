import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import dayjs from 'dayjs';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/atoms/LoadingSpinner';
import { formatCurrency, capitalize, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

// GST-inclusive rate helper: base rate → display rate (incl. 12% GST)
const gstInclusiveRate = (baseRate) => Math.round((parseFloat(baseRate) || 0) * 1.12);

const STATUS_FILTERS = ['all', 'available', 'occupied', 'reserved', 'maintenance', 'cleaning'];
const LEGEND_ITEMS = [
  { cls: 'available', label: 'Available' },
  { cls: 'occupied', label: 'Occupied' },
  { cls: 'reserved', label: 'Reserved' },
  { cls: 'maintenance', label: 'Maintenance' },
  { cls: 'cleaning', label: 'Dirty / Cleaning' },
];

export default function FrontDeskPage() {
  const navigate = useNavigate();
  const { get, post, put } = useApi();
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [dashboard, setDashboard] = useState({ total: 0, byStatus: {}, byType: {} });
  const [arrivals, setArrivals] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [activeReservations, setActiveReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showBanquetModal, setShowBanquetModal] = useState(false);
  const [panelTab, setPanelTab] = useState('arrivals');
  const [checkInData, setCheckInData] = useState(null);
  const [checkOutData, setCheckOutData] = useState(null);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelData, setCancelData] = useState(null);
  const [refundPreview, setRefundPreview] = useState(null);
  const [refundMethod, setRefundMethod] = useState('cash');
  const [refundRef, setRefundRef] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [useOverrideRefund, setUseOverrideRefund] = useState(false);
  const [overrideRefundAmount, setOverrideRefundAmount] = useState('');

  // Check-in form state
  const [idType, setIdType] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  // Check-in: Adjust Room Rate
  const [adjustRate, setAdjustRate] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [rateReason, setRateReason] = useState('');
  const [otherRateReason, setOtherRateReason] = useState('');
  const [appliedRate, setAppliedRate] = useState(null);

  // Check-out: OM Discount
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountType, setDiscountType] = useState('amount');
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [showRestaurantCharges, setShowRestaurantCharges] = useState(false);
  const [sendInvoice, setSendInvoice] = useState(true);

  // Check-out: Room Transfer
  const [showTransferSection, setShowTransferSection] = useState(false);
  const [transferRoomId, setTransferRoomId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferAdjustRate, setTransferAdjustRate] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // Banquet booking form state
  const [banquetForm, setBanquetForm] = useState({
    customer_name: '',
    contact_number: '',
    event_date: '',
    session: '',
    event_type: '',
    expected_guests: '',
    catering: 'no',
    decoration: 'no',
    special_requests: '',
    advance_amount: '',
    payment_mode: '',
    payment_ref: ''
  });
  const [adjustHallRate, setAdjustHallRate] = useState(false);
  const [newHallRate, setNewHallRate] = useState('');
  const [hallRateReason, setHallRateReason] = useState('');
  const [otherHallReason, setOtherHallReason] = useState('');

  // Walk-in booking form state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingType, setBookingType] = useState('nightly'); // 'nightly' or 'hourly'
  const [expectedHours, setExpectedHours] = useState(2);
  const [extraBeds, setExtraBeds] = useState(0);
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [selectedGroupRooms, setSelectedGroupRooms] = useState([]);
  const [bookingForm, setBookingForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    id_proof_type: 'aadhaar',
    id_proof_number: '',
    check_in_date: '',
    check_out_date: '',
    adults: 1,
    children: 0,
    rate_per_night: '',
    source: 'walk_in',
    payment_mode: 'Pay at Hotel',
    advance_amount: '',
    special_requests: '',
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingDiscount, setBookingDiscount] = useState(false);
  const [bookingDiscountType, setBookingDiscountType] = useState('percentage');
  const [bookingDiscountValue, setBookingDiscountValue] = useState('');
  const [bookingDiscountReason, setBookingDiscountReason] = useState('');


  // Meal plan state
  const [mealPlan, setMealPlan] = useState('none'); // none, breakfast, dinner, both
  const [mealRates, setMealRates] = useState({ breakfast_rate: 250, dinner_rate: 400 });

  const resetBookingForm = (room) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const rm = room || selectedRoom;
    setBookingForm({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      id_proof_type: 'aadhaar',
      id_proof_number: '',
      check_in_date: today,
      check_out_date: tomorrow,
      adults: 1,
      children: 0,
      rate_per_night: rm?.base_rate || selectedRoom?.base_rate || '',
      source: 'walk_in',
      payment_mode: 'Pay at Hotel',
      advance_amount: '',
      special_requests: '',
    });
    setBookingType('nightly');
    setExpectedHours(2);
    setExtraBeds(0);
    setBookingDiscount(false);
    setBookingDiscountType('percentage');
    setBookingDiscountValue('');
    setBookingDiscountReason('');
    setMealPlan('none');
    setIsGroupBooking(false);
    setSelectedGroupRooms([]);
  };


  // Meal surcharge per night (for all adults in the room)
  const getMealSurcharge = (adults = 1) => {
    const pax = Math.max(1, adults);
    let perPerson = 0;
    if (mealPlan === 'breakfast') perPerson = mealRates.breakfast_rate;
    else if (mealPlan === 'dinner') perPerson = mealRates.dinner_rate;
    else if (mealPlan === 'both') perPerson = mealRates.breakfast_rate + mealRates.dinner_rate;
    return perPerson * pax;
  };

  // Resolve tiered hourly rate: returns total price for the given hours
  const getHourlyTotal = (hours, room) => {
    const rm = room || selectedRoom;
    const rates = rm?.hourly_rates;
    if (rates && typeof rates === 'object') {
      const tierRate = rates[String(hours)];
      if (tierRate !== undefined) return parseFloat(tierRate);
      const tiers = Object.keys(rates).filter(k => k !== 'default').map(Number).sort((a, b) => a - b);
      const defaultPerHour = parseFloat(rates.default) || parseFloat(rm?.hourly_rate) || Math.round((parseFloat(rm?.base_rate) || 0) * 0.35);
      const bestTier = tiers.filter(t => t <= hours).pop();
      if (bestTier) return parseFloat(rates[String(bestTier)]) + (hours - bestTier) * defaultPerHour;
      return hours * defaultPerHour;
    }
    return hours * (parseFloat(rm?.hourly_rate) || Math.round((parseFloat(rm?.base_rate) || 0) * 0.35));
  };

  // Per-hour average rate (for display)
  const getHourlyRate = (room) => {
    const total = getHourlyTotal(expectedHours, room);
    return Math.round(total / expectedHours);
  };

  const availableRoomsForGroup = rooms.filter(r => r.status === 'available' && (bookingType !== 'hourly' || r.hourly_rates));

  const toggleGroupRoom = (room) => {
    setSelectedGroupRooms(prev => {
      const exists = prev.find(r => r.room_id === room.id);
      if (exists) return prev.filter(r => r.room_id !== room.id);
      return [...prev, {
        room_id: room.id,
        room_number: room.room_number,
        room_type: room.room_type,
        base_rate: room.base_rate,
        hourly_rate: room.hourly_rate,
        hourly_rates: room.hourly_rates,
        max_occupancy: room.max_occupancy,
      }];
    });
  };

  const createReservationData = () => {
    const isHourly = bookingType === 'hourly';
    const baseRate = Number(bookingForm.rate_per_night) || selectedRoom.base_rate;
    let effectiveRate = baseRate;
    let discountNote = '';
    if (!isHourly && bookingDiscount && bookingDiscountValue) {
      const discVal = Number(bookingDiscountValue);
      if (bookingDiscountType === 'percentage') {
        effectiveRate = baseRate * (1 - discVal / 100);
        discountNote = `OM Discount: ${discVal}%`;
      } else {
        const nights = Math.max(1, Math.ceil((new Date(bookingForm.check_out_date) - new Date(bookingForm.check_in_date)) / 86400000));
        effectiveRate = Math.max(0, baseRate - (discVal / nights));
        discountNote = `OM Discount: ₹${discVal}`;
      }
      if (bookingDiscountReason) discountNote += ` (${bookingDiscountReason})`;
    }
    const specialReqs = [bookingForm.special_requests, discountNote, isHourly ? `Short Stay: ${expectedHours}h` : ''].filter(Boolean).join(' | ');

    const base = {
      first_name: bookingForm.first_name,
      last_name: bookingForm.last_name,
      phone: bookingForm.phone,
      email: bookingForm.email,
      id_proof_type: bookingForm.id_proof_type,
      id_proof_number: bookingForm.id_proof_number,
      check_in_date: bookingForm.check_in_date,
      check_out_date: isHourly ? bookingForm.check_in_date : bookingForm.check_out_date,
      adults: bookingForm.adults,
      children: bookingForm.children,
      source: bookingForm.source,
      payment_mode: bookingForm.payment_mode,
      advance_paid: bookingForm.advance_amount ? Number(bookingForm.advance_amount) : 0,
      special_requests: specialReqs,
      meal_plan: mealPlan,
      ...(extraBeds > 0 && !isHourly ? { extra_beds: extraBeds } : {}),
    };

    if (isGroupBooking && selectedGroupRooms.length > 1) {
      return {
        ...base,
        rooms: selectedGroupRooms.map(r => {
          let rate = isHourly
            ? getHourlyRate(r)
            : (parseFloat(r.base_rate) || 0);
          // Apply discount per room
          if (!isHourly && bookingDiscount && bookingDiscountValue) {
            const discVal = Number(bookingDiscountValue);
            if (bookingDiscountType === 'percentage') {
              rate = rate * (1 - discVal / 100);
            } else {
              rate = Math.max(0, rate - (discVal / selectedGroupRooms.length));
            }
          }
          return {
            room_id: r.room_id,
            rate_per_night: isHourly ? 0 : Math.round(rate * 100) / 100,
          };
        }),
        ...(isHourly ? { booking_type: 'hourly', expected_hours: expectedHours, meal_plan: 'none' } : {}),
      };
    }

    if (isHourly) {
      return {
        ...base,
        room_id: selectedRoom.id,
        rate_per_night: 0,
        booking_type: 'hourly',
        expected_hours: expectedHours,
        meal_plan: 'none',
      };
    }

    return {
      ...base,
      room_id: selectedRoom.id,
      rate_per_night: Math.round(effectiveRate * 100) / 100,
    };
  };

  const handleCreateBooking = async (autoCheckIn = false) => {
    const isHourly = bookingType === 'hourly';
    if (!bookingForm.first_name || !bookingForm.phone || !bookingForm.check_in_date) {
      toast.error('Please fill in guest name, phone, and date');
      return;
    }
    if (!isHourly && !bookingForm.check_out_date) {
      toast.error('Please select a check-out date');
      return;
    }
    if (isGroupBooking && selectedGroupRooms.length < 2) {
      toast.error('Select at least 2 rooms for group booking');
      return;
    }
    setBookingSubmitting(true);
    try {
      const resResponse = await post('/reservations', createReservationData());

      if (isGroupBooking) {
        const groupId = resResponse.data?.data?.group_id || resResponse.data?.group_id;
        if (autoCheckIn && groupId) {
          try {
            await put(`/reservations/group/${groupId}/check-in`, {});
            toast.success(`Group (${selectedGroupRooms.length} rooms) registered & checked in!`);
          } catch (ciErr) {
            console.error('Group check-in failed:', ciErr);
            toast.success(`Group booking created (${selectedGroupRooms.length} rooms) — check in from arrivals`);
          }
        } else {
          toast.success(`Group booking created (${selectedGroupRooms.length} rooms)${groupId ? ` — ${groupId}` : ''}`);
        }
      } else if (autoCheckIn) {
        const reservationId = resResponse.data?.id;
        if (reservationId) {
          try {
            await put(`/reservations/${reservationId}/check-in`, {});
            toast.success('Guest registered & checked in successfully!');
          } catch (ciErr) {
            console.error('Auto check-in failed:', ciErr);
            toast.success('Reservation created (check-in manually from arrivals)');
          }
        }
      } else {
        toast.success('Reservation registered successfully!');
      }
      setShowBookingModal(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create reservation');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [dashRes, roomsRes, arrivalsRes, departuresRes, settingsRes, activeRes] = await Promise.all([
        get('/rooms/dashboard'),
        get('/rooms?limit=100'),
        get('/reservations/arrivals', { silent: true }).catch(() => ({ data: [] })),
        get('/reservations/departures', { silent: true }).catch(() => ({ data: [] })),
        get('/settings', { silent: true }).catch(() => ({ data: {} })),
        get('/reservations?status=checked_in&limit=200', { silent: true }).catch(() => ({ data: [] })),
      ]);
      setDashboard(dashRes.data);
      setRooms(roomsRes.data?.data || []);
      setArrivals(arrivalsRes.data?.data || arrivalsRes.data || []);
      setDepartures(departuresRes.data?.data || departuresRes.data || []);
      const activeData = activeRes.data?.data || activeRes.data?.reservations || activeRes.data || [];
      setActiveReservations(Array.isArray(activeData) ? activeData : []);

      // Load meal rates from settings
      const flat = {};
      Object.values(settingsRes.data || {}).forEach(arr => {
        if (Array.isArray(arr)) arr.forEach(s => { flat[s.key] = s.value; });
      });
      if (flat.breakfast_rate || flat.dinner_rate) {
        setMealRates({
          breakfast_rate: parseFloat(flat.breakfast_rate) || 250,
          dinner_rate: parseFloat(flat.dinner_rate) || 400,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredRooms = activeFilter === 'all'
    ? rooms
    : rooms.filter(r => r.status === activeFilter);

  const roomsByFloor = {};
  filteredRooms.forEach(room => {
    const f = room.floor || 1;
    if (!roomsByFloor[f]) roomsByFloor[f] = [];
    roomsByFloor[f].push(room);
  });
  const sortedFloors = Object.keys(roomsByFloor).map(Number).sort((a, b) => a - b);

  const bs = dashboard.byStatus || {};
  const occupancyRate = dashboard.total > 0 ? Math.round(((bs.occupied || 0) / dashboard.total) * 100) : 0;

  const handleRoomClick = async (room) => {
    setSelectedRoom(room);
    if (room.status === 'reserved') {
      let reservation = arrivals.find(a => a.room_id === room.id || a.Room?.id === room.id);
      if (!reservation) {
        try {
          const res = await get(`/reservations?status=confirmed&room_id=${room.id}&limit=1`, { silent: true });
          const data = res.data?.data || res.data?.reservations || res.data || [];
          reservation = Array.isArray(data) ? data[0] : null;
        } catch { /* ignore */ }
        if (!reservation) {
          try {
            const res = await get(`/reservations?status=pending&room_id=${room.id}&limit=1`, { silent: true });
            const data = res.data?.data || res.data?.reservations || res.data || [];
            reservation = Array.isArray(data) ? data[0] : null;
          } catch { /* ignore */ }
        }
      }
      setCheckInData(reservation || null);
      resetCheckInForm(reservation);
      setShowCheckInModal(true);
    } else if (room.status === 'occupied') {
      // Try departures list first, then fetch active reservation from API
      let reservation = departures.find(d => (d.room_id || d.Room?.id) === room.id);
      if (!reservation) {
        try {
          const res = await get(`/reservations/departures`, { silent: true });
          const allDeps = res.data?.data || res.data || [];
          reservation = (Array.isArray(allDeps) ? allDeps : []).find(d => (d.room_id || d.room?.id) === room.id);
        } catch (err) { /* ignore */ }
      }
      if (!reservation) {
        try {
          const res = await get(`/reservations?status=checked_in&room_id=${room.id}&limit=1`, { silent: true });
          const data = res.data?.data || res.data || [];
          reservation = Array.isArray(data) ? data[0] : null;
        } catch (err) {
          console.error('Failed to fetch reservation for room', room.id, err);
        }
      }
      if (reservation) {
        setCheckOutData(reservation);
        resetCheckOutForm();
        setShowCheckOutModal(true);
      } else {
        setShowRoomModal(true);
      }
    } else if (room.status === 'available') {
      resetBookingForm(room);
      setShowBookingModal(true);
    } else {
      setShowRoomModal(true);
    }
  };

  const resetCheckInForm = (reservation) => {
    const g = reservation?.guest || reservation?.Guest || {};
    setIdType(g.id_proof_type || 'aadhaar');
    setIdNumber(g.id_proof_number || '');
    setDepositAmount(0);
    setPaymentMode('');
    setPaymentRef('');
    setAdjustRate(false);
    setNewRate('');
    setRateReason('');
    setOtherRateReason('');
    setAppliedRate(null);
  };

  const resetCheckOutForm = () => {
    setApplyDiscount(false);
    setDiscountType('amount');
    setDiscountValue('');
    setDiscountReason('');
    setAppliedDiscount(0);
    setShowRestaurantCharges(false);
    setSendInvoice(true);
    setShowTransferSection(false);
    setTransferRoomId('');
    setTransferReason('');
    setTransferAdjustRate(false);
    setTransferLoading(false);
  };

  const handleCheckIn = async () => {
    if (!checkInData) return;
    try {
      await put(`/reservations/${checkInData.id}/check-in`, {
        id_proof_type: idType,
        id_proof_number: idNumber,
        deposit_amount: depositAmount,
        payment_method: paymentMode,
        payment_ref: paymentRef,
        ...(appliedRate != null && { adjusted_rate: appliedRate, rate_reason: rateReason === 'Other' ? otherRateReason : rateReason }),
      });
      toast.success('Check-in completed successfully!');
      setShowCheckInModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckOut = async () => {
    if (!checkOutData) return;

    // Block checkout if billing is not settled
    if (coBilling && coBilling.payment_status !== 'paid') {
      toast.error('Please complete billing before checkout. Go to Billing section to settle the bill.');
      return;
    }
    if (!coBilling) {
      toast.error('No billing record found. Please create billing first.');
      return;
    }

    try {
      await put(`/reservations/${checkOutData.id}/check-out`, {
        send_invoice: sendInvoice,
        ...(appliedDiscount > 0 && {
          discount_type: discountType,
          discount_value: discountValue,
          discount_reason: discountReason
        }),
      });
      toast.success('Check-out completed successfully!');
      setShowCheckOutModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyRate = () => {
    if (newRate && Number(newRate) > 0) {
      setAppliedRate(Number(newRate));
    }
  };

  const handleApplyDiscount = () => {
    if (!discountValue || Number(discountValue) <= 0 || !checkOutData) return;
    if (discountType === 'percent') {
      // Compute grand total for percentage calculation
      const nights = checkOutData?.nights || checkOutData?.total_nights || (checkOutData?.check_in_date && checkOutData?.check_out_date ? Math.max(1, Math.ceil((new Date(checkOutData.check_out_date) - new Date(checkOutData.check_in_date)) / 86400000)) : 0);
      const rate = parseFloat(checkOutData?.rate_per_night) || 0;
      const billing = checkOutData?.billing || null;
      const roomTotal = nights * rate;
      const grandTotal = billing ? (parseFloat(billing.grand_total) || roomTotal * 1.12) : (roomTotal * 1.12);
      const discountAmt = grandTotal * (Number(discountValue) / 100);
      setAppliedDiscount(Math.round(discountAmt * 100) / 100);
    } else {
      setAppliedDiscount(Number(discountValue));
    }
  };

  // Room transfer (from check-out modal)
  const availableTransferRooms = rooms.filter(r =>
    r.id !== (checkOutData?.room_id || checkOutData?.room?.id || checkOutData?.Room?.id) &&
    ['available', 'reserved', 'cleaning'].includes(r.status)
  );

  const selectedTransferRoom = availableTransferRooms.find(r => r.id === Number(transferRoomId));

  const handleRoomTransfer = async () => {
    if (!transferRoomId) {
      toast.error('Please select a room to transfer to');
      return;
    }
    try {
      setTransferLoading(true);
      const res = await put(`/reservations/${checkOutData.id}/room-transfer`, {
        new_room_id: Number(transferRoomId),
        reason: transferReason,
        adjust_rate: transferAdjustRate,
      });
      toast.success(res.data?.message || 'Room transferred successfully');
      setShowCheckOutModal(false);
      resetCheckOutForm();
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to transfer room');
    } finally {
      setTransferLoading(false);
    }
  };

  // Group check-in handler
  const handleGroupCheckIn = async (groupId) => {
    try {
      await put(`/reservations/group/${groupId}/check-in`, {});
      toast.success('All group rooms checked in!');
      setShowCheckInModal(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Group check-in failed');
    }
  };

  // Group check-out handler
  const handleGroupCheckOut = async (groupId) => {
    if (!coBilling || coBilling.payment_status !== 'paid') {
      toast.error('Please complete billing for all group rooms before checkout. Go to Billing section to settle the bill.');
      return;
    }
    try {
      await put(`/reservations/group/${groupId}/check-out`, {
        send_invoice: sendInvoice,
        ...(appliedDiscount > 0 && {
          discount_type: discountType,
          discount_value: discountValue,
          discount_reason: discountReason,
        }),
      });
      toast.success('All group rooms checked out!');
      setShowCheckOutModal(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Group check-out failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  // Check-in computed values
  const guest = checkInData?.guest || checkInData?.Guest || {};
  const room = checkInData?.room || checkInData?.Room || selectedRoom || {};
  const originalRate = checkInData?.rate_per_night || room.base_rate || 0;
  const effectiveRate = appliedRate != null ? appliedRate : originalRate;
  const totalNights = checkInData?.total_nights || (() => {
    if (checkInData?.check_in_date && checkInData?.check_out_date) {
      const diff = new Date(checkInData.check_out_date) - new Date(checkInData.check_in_date);
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return 1;
  })();
  const totalAmountBase = appliedRate != null ? effectiveRate * totalNights : (checkInData?.total_amount || 0);
  const totalAmount = Math.round(totalAmountBase * 1.12);
  const advancePaid = parseFloat(checkInData?.advance_paid) || 0;
  const balanceDue = totalAmount - advancePaid;

  // Check-out computed values
  const coGuest = checkOutData?.guest || checkOutData?.Guest || {};
  const coRoom = checkOutData?.room || checkOutData?.Room || selectedRoom || {};
  const coBilling = checkOutData?.billing || null;
  const coNights = checkOutData?.nights || checkOutData?.total_nights || (checkOutData?.check_in_date && checkOutData?.check_out_date ? Math.max(1, Math.ceil((new Date(checkOutData.check_out_date) - new Date(checkOutData.check_in_date)) / 86400000)) : 0);
  const coRate = parseFloat(checkOutData?.rate_per_night) || 0;
  const roomCharges = coNights * coRate;
  const restaurantCharges = checkOutData?.restaurant_charges || (coBilling ? parseFloat(coBilling.restaurant_total) || 0 : 0);
  const restaurantItems = checkOutData?.restaurant_items || coBilling?.restaurant_items || [];

  // Use billing data if available (billing subtotal already includes room + restaurant)
  const coSubtotal = coBilling ? parseFloat(coBilling.subtotal) || roomCharges + restaurantCharges : roomCharges + restaurantCharges;
  const restaurantGst = restaurantCharges * 0.05;
  const roomGst = coBilling ? (parseFloat(coBilling.cgst_amount) || 0) + (parseFloat(coBilling.sgst_amount) || 0) + (parseFloat(coBilling.igst_amount) || 0) : roomCharges * 0.12;
  const coGst = coBilling ? roomGst : coSubtotal * 0.12;
  const coGrandTotal = coBilling ? parseFloat(coBilling.grand_total) || (coSubtotal + coGst) : coSubtotal + coGst;
  const coTotalAfterDiscount = coGrandTotal - appliedDiscount;
  const coAdvance = coBilling ? parseFloat(coBilling.paid_amount) || 0 : (parseFloat(checkOutData?.advance_paid) || 0);
  const coBalance = coTotalAfterDiscount - coAdvance;

  // Room modal: find current reservation for occupied room
  const roomReservation = checkOutData && selectedRoom?.status === 'occupied'
    ? checkOutData
    : (selectedRoom?.status === 'occupied' ? departures.find(d => (d.room_id || d.Room?.id) === selectedRoom?.id) : null);
  const rmGuest = roomReservation?.guest || roomReservation?.Guest || {};
  const rmBalance = roomReservation ? (roomReservation.total_amount || 0) - (roomReservation.advance_paid || 0) : 0;

  // Banquet pricing
  const sessionRates = { morning: 15000, afternoon: 15000, evening: 20000, fullday: 45000 };
  const decorationRates = { no: 0, basic: 5000, premium: 15000 };
  const hallBaseRate = sessionRates[banquetForm.session] || 0;
  const effectiveHallRate = adjustHallRate && newHallRate ? Number(newHallRate) : hallBaseRate;
  const decorationCost = decorationRates[banquetForm.decoration] || 0;
  const banquetGst = (effectiveHallRate + decorationCost) * 0.18;
  const banquetTotal = effectiveHallRate + decorationCost + banquetGst;

  return (
    <>
      {/* Stats */}
      <div className="fd-stats">
        <div className="fd-stat">
          <div className="fd-stat-icon arrivals"><i className="bi bi-box-arrow-in-right"></i></div>
          <div className="fd-stat-content">
            <h3>{arrivals.length}</h3>
            <p>Arrivals Today</p>
          </div>
        </div>
        <div className="fd-stat">
          <div className="fd-stat-icon departures"><i className="bi bi-box-arrow-right"></i></div>
          <div className="fd-stat-content">
            <h3>{departures.length}</h3>
            <p>Departures Today</p>
          </div>
        </div>
        <div className="fd-stat">
          <div className="fd-stat-icon available"><i className="bi bi-door-open"></i></div>
          <div className="fd-stat-content">
            <h3>{bs.available || 0}</h3>
            <p>Available Rooms</p>
          </div>
        </div>
        <div className="fd-stat">
          <div className="fd-stat-icon occupied"><i className="bi bi-door-closed"></i></div>
          <div className="fd-stat-content">
            <h3>{bs.occupied || 0}</h3>
            <p>Occupied Rooms</p>
          </div>
        </div>
        <div className="fd-stat">
          <div className="fd-stat-icon occupancy"><i className="bi bi-pie-chart"></i></div>
          <div className="fd-stat-content">
            <h3>{occupancyRate}%</h3>
            <p>Occupancy Rate</p>
          </div>
        </div>
        <div className="fd-stat">
          <div className="fd-stat-icon revenue"><i className="bi bi-currency-rupee"></i></div>
          <div className="fd-stat-content">
            <h3>{dashboard.total}</h3>
            <p>Total Rooms</p>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Room Grid */}
        <div className="col-lg-8">
          <div className="fd-section">
            <div className="fd-section-header">
              <h2 className="fd-section-title">
                <i className="bi bi-grid-3x3-gap"></i> Room Status
              </h2>
              <div className="fd-filters">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f}
                    className={`fd-filter ${activeFilter === f ? 'active' : ''}`}
                    onClick={() => setActiveFilter(f)}
                  >
                    {capitalize(f)}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="fd-legend">
              {LEGEND_ITEMS.map(item => (
                <div key={item.cls} className="fd-legend-item">
                  <div className={`fd-legend-dot ${item.cls}`}></div>
                  {item.label}
                </div>
              ))}
            </div>

            {/* Floor Sections */}
            {sortedFloors.map(floor => (
              <div key={floor} className="fd-floor">
                <div className="fd-floor-title">Floor {floor}</div>
                <div className="fd-rooms">
                  {roomsByFloor[floor]
                    .sort((a, b) => a.room_number.localeCompare(b.room_number))
                    .map(rm => (
                      <div
                        key={rm.id}
                        className={`fd-room ${rm.status}${rm.cleanliness_status === 'dirty' || rm.status === 'cleaning' ? ' fd-dirty' : ''}${rm.cleanliness_status === 'out_of_order' ? ' fd-out-of-order' : ''}${(() => { const res = [...activeReservations, ...arrivals, ...departures].find(r => (r.room_id || r.room?.id) === rm.id); return res?.booking_type === 'hourly' && res?.expected_checkout_time && new Date(res.expected_checkout_time) <= new Date() ? ' fd-overdue' : ''; })()}`}
                        onClick={() => handleRoomClick(rm)}
                      >
                        <div className="fd-room-number">{rm.room_number}</div>
                        <div className="fd-room-type">{capitalize(rm.room_type)}</div>
                        {/* Stay info for occupied/reserved rooms */}
                        {(() => {
                          const res = [...activeReservations, ...arrivals, ...departures].find(r => (r.room_id || r.room?.id) === rm.id);
                          if (!res || (rm.status !== 'occupied' && rm.status !== 'reserved')) return null;
                          const isHourlyRes = res.booking_type === 'hourly';
                          if (isHourlyRes) {
                            const hours = res.expected_hours || 3;
                            let hoursLeft = '';
                            let isOverdue = false;
                            if (res.expected_checkout_time) {
                              const diffMs = new Date(res.expected_checkout_time) - new Date();
                              const diff = Math.max(0, Math.ceil(diffMs / 3600000));
                              isOverdue = diffMs <= 0;
                              hoursLeft = diff > 0 ? `${diff}h left` : 'OVERDUE';
                            }
                            return (
                              <>
                                <div style={{ fontSize: 8, fontWeight: 700, color: isOverdue ? '#dc2626' : '#f59e0b', marginTop: 2 }}>
                                  {hours}H{hoursLeft ? ` · ${hoursLeft}` : ''}
                                </div>
                                <span className={isOverdue ? 'fd-overdue-badge' : ''} style={{ position: 'absolute', top: 4, right: 4, background: isOverdue ? '#dc2626' : '#f59e0b', color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3, letterSpacing: 0.3 }}>
                                  <i className={`bi ${isOverdue ? 'bi-exclamation-triangle-fill' : 'bi-clock-fill'}`} style={{ fontSize: 7 }}></i> {isOverdue ? 'OVERDUE' : 'SHORT'}
                                </span>
                              </>
                            );
                          }
                          const coDate = res.check_out_date;
                          const nights = res.nights || (res.check_in_date && coDate ? Math.max(1, Math.ceil((new Date(coDate) - new Date(res.check_in_date)) / 86400000)) : 0);
                          const daysLeft = coDate ? Math.max(0, Math.ceil((new Date(coDate) - new Date()) / 86400000)) : 0;
                          return (
                            <>
                              <div style={{ fontSize: 8, fontWeight: 700, color: '#64748b', marginTop: 2 }}>
                                {nights}N{daysLeft > 0 ? ` · ${daysLeft}d left` : ' · Today'}
                              </div>
                              {res.group_id && (
                                <span style={{ position: 'absolute', top: 4, right: 4, background: '#f59e0b', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, letterSpacing: 0.5 }}>GRP</span>
                              )}
                            </>
                          );
                        })()}
                        {(rm.cleanliness_status === 'dirty' || rm.status === 'cleaning') && (
                          <span className="fd-cleanliness-badge dirty">
                            <i className="bi bi-brush-fill"></i> Dirty
                          </span>
                        )}
                        {rm.cleanliness_status === 'in_progress' && (
                          <span className="fd-cleanliness-badge in-progress">
                            <i className="bi bi-arrow-repeat"></i> Cleaning
                          </span>
                        )}
                        {rm.cleanliness_status === 'awaiting_verification' && (
                          <span className="fd-cleanliness-badge awaiting-verify">
                            <i className="bi bi-hourglass-split"></i> Awaiting Verify
                          </span>
                        )}
                        {rm.cleanliness_status === 'out_of_order' && (
                          <span className="fd-cleanliness-badge out-of-order">
                            <i className="bi bi-wrench-adjustable"></i> Out of Order
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Arrivals / Departures */}
        <div className="col-lg-4">
          <div className="fd-panel">
            <div className="fd-panel-tabs">
              <button
                className={`fd-panel-tab ${panelTab === 'arrivals' ? 'active' : ''}`}
                onClick={() => setPanelTab('arrivals')}
              >
                <i className="bi bi-box-arrow-in-right"></i> Arrivals ({arrivals.length})
              </button>
              <button
                className={`fd-panel-tab ${panelTab === 'departures' ? 'active' : ''}`}
                onClick={() => setPanelTab('departures')}
              >
                <i className="bi bi-box-arrow-right"></i> Departures ({departures.length})
              </button>
            </div>
            <div className="fd-panel-content">
              {(panelTab === 'arrivals' ? arrivals : departures).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No {panelTab} today
                </div>
              ) : (
                (panelTab === 'arrivals' ? arrivals : departures).map((item, i) => {
                  const g = item.guest || item.Guest || {};
                  const r = item.room || item.Room || {};
                  return (
                    <div key={i} className="fd-guest" onClick={() => {
                      setSelectedRoom(r);
                      if (panelTab === 'arrivals') {
                        setCheckInData(item);
                        resetCheckInForm(item);
                        setShowCheckInModal(true);
                      } else {
                        setCheckOutData(item);
                        resetCheckOutForm();
                        setShowCheckOutModal(true);
                      }
                    }} style={{ cursor: 'pointer' }}>
                      <div className="fd-guest-avatar">
                        {(g.first_name?.[0] || 'G')}{(g.last_name?.[0] || '')}
                      </div>
                      <div className="fd-guest-info">
                        <p className="fd-guest-name">{g.first_name} {g.last_name}</p>
                        <p className="fd-guest-meta">{capitalize(r.room_type)} &middot; {item.source || 'Walk-in'}{item.group_id ? ' · GRP' : ''}</p>
                      </div>
                      <div className="fd-guest-room">
                        <div className="fd-guest-room-num">{r.room_number}</div>
                        <div className="fd-guest-room-type">
                          {panelTab === 'arrivals' ? (
                            <button className="btn btn-checkin btn-sm" onClick={(e) => { e.stopPropagation(); setCheckInData(item); setSelectedRoom(r); resetCheckInForm(item); setShowCheckInModal(true); }}>Check In</button>
                          ) : (
                            <button className="btn btn-checkout btn-sm" onClick={(e) => { e.stopPropagation(); setCheckOutData(item); setSelectedRoom(r); resetCheckOutForm(); setShowCheckOutModal(true); }}>Check Out</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== Room Details Modal ========== */}
      <Modal show={showRoomModal} onHide={() => setShowRoomModal(false)} centered>
        <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
            <h5 className="modal-title"><i className="bi bi-door-open me-2"></i>Room {selectedRoom?.room_number}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowRoomModal(false)}></button>
          </div>
          {selectedRoom && (
            <div className="modal-body" style={{ padding: 24 }}>
              <div className="row g-3">
                <div className="col-6">
                  <div style={{ background: selectedRoom.status === 'occupied' ? '#fce4ec' : selectedRoom.status === 'available' ? '#e8f5e9' : '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                    <small style={{ color: selectedRoom.status === 'occupied' ? '#c2185b' : selectedRoom.status === 'available' ? '#2e7d32' : '#64748b', display: 'block' }}>Status</small>
                    <strong style={{ color: selectedRoom.status === 'occupied' ? '#c2185b' : selectedRoom.status === 'available' ? '#2e7d32' : '#1a1a2e' }}>{capitalize(selectedRoom.status)}</strong>
                  </div>
                </div>
                <div className="col-6">
                  <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                    <small style={{ color: '#64748b', display: 'block' }}>Room Type</small>
                    <strong style={{ color: '#1a1a2e' }}>{capitalize(selectedRoom.room_type)}</strong>
                  </div>
                </div>

                {/* Show guest info for occupied rooms */}
                {selectedRoom.status === 'occupied' && roomReservation && (
                  <>
                    <div className="col-12">
                      <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                        <small style={{ color: '#64748b', display: 'block' }}>Guest</small>
                        <strong style={{ color: '#1a1a2e' }}>{rmGuest.first_name} {rmGuest.last_name}</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                        <small style={{ color: '#64748b', display: 'block' }}>Check-in</small>
                        <strong style={{ color: '#1a1a2e' }}>{formatDate(roomReservation.check_in_date)}</strong>
                      </div>
                    </div>
                    <div className="col-6">
                      <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                        <small style={{ color: '#64748b', display: 'block' }}>Check-out</small>
                        <strong style={{ color: '#1a1a2e' }}>{formatDate(roomReservation.check_out_date)}</strong>
                      </div>
                    </div>
                    <div className="col-12">
                      <div style={{ background: '#fff7ed', padding: '12px 16px', borderRadius: 10, border: '1px solid #fed7aa' }}>
                        <small style={{ color: '#9a3412', display: 'block' }}>Balance Due</small>
                        <strong style={{ color: '#9a3412', fontSize: 18 }}>{formatCurrency(rmBalance)}</strong>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 10 }} onClick={() => setShowRoomModal(false)}>Close</button>
            {selectedRoom?.status === 'occupied' && roomReservation && (
              <button className="btn" style={{ background: '#f97316', color: '#fff', borderRadius: 10, padding: '10px 24px' }}
                onClick={() => { setShowRoomModal(false); setCheckOutData(roomReservation); resetCheckOutForm(); setShowCheckOutModal(true); }}>
                <i className="bi bi-box-arrow-right me-1"></i> Check Out
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* ========== New Booking Modal (Walk-in) ========== */}
      <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered size="xl" dialogClassName="walkin-modal">
        <div className="modal-content" style={{ borderRadius: 6, border: '2px solid #1a1a2e', overflow: 'hidden', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

          {/* Header bar */}
          <div style={{ background: '#1a1a2e', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <i className={`bi ${isGroupBooking ? 'bi-people-fill' : bookingType === 'hourly' ? 'bi-clock-fill' : 'bi-person-plus-fill'}`} style={{ color: isGroupBooking ? '#f59e0b' : bookingType === 'hourly' ? '#f59e0b' : '#2dd4bf', fontSize: 20 }}></i>
              <span style={{ color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {isGroupBooking ? 'Group Booking' : bookingType === 'hourly' ? 'Short Stay' : 'Walk-in Registration'}
              </span>
              {!isGroupBooking && (
                <span style={{ background: bookingType === 'hourly' ? '#f59e0b' : '#2dd4bf', color: '#0f172a', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 3, letterSpacing: 0.5 }}>
                  ROOM {selectedRoom?.room_number}
                </span>
              )}
              {isGroupBooking && selectedGroupRooms.length > 0 && (
                <span style={{ background: '#f59e0b', color: '#0f172a', fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 3, letterSpacing: 0.5 }}>
                  {selectedGroupRooms.length} ROOMS
                </span>
              )}
              {/* Booking type toggle */}
              <div style={{ display: 'flex', background: '#0f172a', borderRadius: 4, overflow: 'hidden', marginLeft: 8 }}>
                <button type="button" onClick={() => setBookingType('nightly')}
                  style={{ padding: '5px 14px', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', letterSpacing: 0.5,
                    background: bookingType === 'nightly' ? '#2dd4bf' : 'transparent',
                    color: bookingType === 'nightly' ? '#0f172a' : '#64748b',
                  }}>
                  <i className="bi bi-moon-fill me-1" style={{ fontSize: 10 }}></i>NIGHTLY
                </button>
                <button type="button"
                  onClick={() => { if (selectedRoom?.hourly_rates) { setBookingType('hourly'); setMealPlan('none'); setExtraBeds(0); } }}
                  disabled={!selectedRoom?.hourly_rates}
                  title={!selectedRoom?.hourly_rates ? 'Short stay not available for this room type' : ''}
                  style={{ padding: '5px 14px', fontSize: 11, fontWeight: 800, border: 'none', letterSpacing: 0.5,
                    background: bookingType === 'hourly' ? '#f59e0b' : 'transparent',
                    color: bookingType === 'hourly' ? '#0f172a' : '#64748b',
                    cursor: selectedRoom?.hourly_rates ? 'pointer' : 'not-allowed',
                    opacity: selectedRoom?.hourly_rates ? 1 : 0.4,
                  }}>
                  <i className="bi bi-clock-fill me-1" style={{ fontSize: 10 }}></i>SHORT STAY
                </button>
              </div>
              {/* Group booking toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: isGroupBooking ? '#f59e0b' : '#64748b', letterSpacing: 0.5 }}>GROUP</span>
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" checked={isGroupBooking}
                    onChange={e => {
                      setIsGroupBooking(e.target.checked);
                      if (e.target.checked && selectedRoom) {
                        setSelectedGroupRooms([{
                          room_id: selectedRoom.id,
                          room_number: selectedRoom.room_number,
                          room_type: selectedRoom.room_type,
                          base_rate: selectedRoom.base_rate,
                          hourly_rate: selectedRoom.hourly_rate,
                          hourly_rates: selectedRoom.hourly_rates,
                          max_occupancy: selectedRoom.max_occupancy,
                        }]);
                      } else {
                        setSelectedGroupRooms([]);
                      }
                    }}
                    style={{ cursor: 'pointer' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {!isGroupBooking && (
                <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                  {capitalize(selectedRoom?.room_type || '')} &middot; Max {selectedRoom?.max_occupancy || 2} pax &middot;
                  {bookingType === 'hourly'
                    ? ` ${formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours)))} for ${expectedHours}h`
                    : ` ${formatCurrency(gstInclusiveRate(selectedRoom?.base_rate || 0))}/night`
                  } <small style={{ opacity: 0.7 }}>(incl. GST)</small>
                </span>
              )}
              <button type="button" className="btn-close btn-close-white" style={{ fontSize: 10 }} onClick={() => setShowBookingModal(false)}></button>
            </div>
          </div>

          <div style={{ display: 'flex', minHeight: 480 }}>
            {/* ---- Left Column: Form ---- */}
            <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', maxHeight: '70vh', background: '#fff' }}>

              {/* Guest */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1a1a2e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-person-fill" style={{ color: '#2dd4bf', fontSize: 14 }}></i>
                  Guest Information
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control form-control-sm" value={bookingForm.first_name}
                      onChange={e => setBookingForm({ ...bookingForm, first_name: e.target.value })}
                      placeholder="First name" style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, padding: '8px 12px' }} />
                  </div>
                  <div className="col-6">
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Last Name</label>
                    <input type="text" className="form-control form-control-sm" value={bookingForm.last_name}
                      onChange={e => setBookingForm({ ...bookingForm, last_name: e.target.value })}
                      placeholder="Last name" style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, padding: '8px 12px' }} />
                  </div>
                  <div className="col-6">
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Mobile <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="tel" className="form-control form-control-sm" value={bookingForm.phone}
                      onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      placeholder="10-digit number" style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, padding: '8px 12px' }} />
                  </div>
                  <div className="col-6">
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Email</label>
                    <input type="email" className="form-control form-control-sm" value={bookingForm.email}
                      onChange={e => setBookingForm({ ...bookingForm, email: e.target.value })}
                      placeholder="Optional" style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, padding: '8px 12px' }} />
                  </div>
                  <div className="col-6">
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>ID Proof Type <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="form-select form-select-sm" value={bookingForm.id_proof_type}
                      onChange={e => setBookingForm({ ...bookingForm, id_proof_type: e.target.value })}
                      style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, padding: '8px 12px' }}>
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="passport">Passport</option>
                      <option value="driving_license">Driving License</option>
                      <option value="voter_id">Voter ID</option>
                      <option value="pan">PAN Card</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>ID Number <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="form-control form-control-sm" value={bookingForm.id_proof_number}
                      onChange={e => setBookingForm({ ...bookingForm, id_proof_number: e.target.value })}
                      placeholder="Enter ID number" style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, padding: '8px 12px' }} />
                  </div>
                </div>
              </div>

              {/* Stay */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1a1a2e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className={`bi ${bookingType === 'hourly' ? 'bi-clock-fill' : 'bi-calendar-check-fill'}`} style={{ color: bookingType === 'hourly' ? '#f59e0b' : '#2dd4bf', fontSize: 14 }}></i>
                  {bookingType === 'hourly' ? 'Short Stay Details' : 'Stay Details'}
                </div>
                <div className="row g-2">
                  {bookingType === 'hourly' ? (
                    <>
                      <div className="col-6">
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Date <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="date" className="form-control form-control-sm" value={bookingForm.check_in_date}
                          min={dayjs().format('YYYY-MM-DD')}
                          onChange={e => setBookingForm({ ...bookingForm, check_in_date: e.target.value })}
                          style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, padding: '8px 12px' }} />
                      </div>
                      <div className="col-6">
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Duration (Hours) <span style={{ color: '#ef4444' }}>*</span></label>
                        <select className="form-select form-select-sm" value={expectedHours}
                          onChange={e => setExpectedHours(parseInt(e.target.value))}
                          style={{ borderRadius: 4, border: '2px solid #f59e0b', fontSize: 13, fontWeight: 800, padding: '8px 12px', background: '#fffbeb', color: '#92400e' }}>
                          {(() => {
                            const rates = selectedRoom?.hourly_rates;
                            if (rates && typeof rates === 'object') {
                              const tiers = Object.keys(rates).filter(k => k !== 'default').map(Number).sort((a, b) => a - b);
                              const maxTier = Math.max(...tiers, 3);
                              const hours = [...new Set([...tiers, maxTier + 1, maxTier + 2, maxTier + 3])].sort((a, b) => a - b);
                              return hours.map(h => (
                                <option key={h} value={h}>{h} Hours — {formatCurrency(gstInclusiveRate(getHourlyTotal(h)))}</option>
                              ));
                            }
                            return [2, 3, 4, 5, 6, 7, 8].map(h => (
                              <option key={h} value={h}>{h} Hours</option>
                            ));
                          })()}
                        </select>
                      </div>
                      <div className="col-4">
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Adults</label>
                        <input type="number" className="form-control form-control-sm" min="1" max={selectedRoom?.max_occupancy || 4} value={bookingForm.adults}
                          onChange={e => setBookingForm({ ...bookingForm, adults: parseInt(e.target.value) || 1 })}
                          style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 700, padding: '8px 12px' }} />
                      </div>
                      <div className="col-4">
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Children</label>
                        <input type="number" className="form-control form-control-sm" min="0" value={bookingForm.children}
                          onChange={e => setBookingForm({ ...bookingForm, children: parseInt(e.target.value) || 0 })}
                          style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 700, padding: '8px 12px' }} />
                      </div>
                      <div className="col-4">
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Total for {expectedHours}h <span style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }}>(incl. GST)</span></label>
                        <input type="text" className="form-control form-control-sm" value={formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours)))}
                          readOnly
                          style={{ borderRadius: 4, border: '2px solid #f59e0b', fontSize: 13, fontWeight: 800, padding: '8px 12px', background: '#fffbeb', color: '#92400e', cursor: 'default' }} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-6">
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Check-in <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="date" className="form-control form-control-sm" value={bookingForm.check_in_date}
                          min={dayjs().format('YYYY-MM-DD')}
                          onChange={e => setBookingForm({ ...bookingForm, check_in_date: e.target.value })}
                          style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, padding: '8px 12px' }} />
                      </div>
                      <div className="col-6">
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Check-out <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="date" className="form-control form-control-sm" value={bookingForm.check_out_date}
                          min={bookingForm.check_in_date}
                          onChange={e => setBookingForm({ ...bookingForm, check_out_date: e.target.value })}
                          style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, padding: '8px 12px' }} />
                      </div>
                      <div className="col-4">
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Adults</label>
                        <input type="number" className="form-control form-control-sm" min="1" max={selectedRoom?.max_occupancy || 4} value={bookingForm.adults}
                          onChange={e => setBookingForm({ ...bookingForm, adults: parseInt(e.target.value) || 1 })}
                          style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 700, padding: '8px 12px' }} />
                      </div>
                      <div className="col-4">
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Children</label>
                        <input type="number" className="form-control form-control-sm" min="0" value={bookingForm.children}
                          onChange={e => setBookingForm({ ...bookingForm, children: parseInt(e.target.value) || 0 })}
                          style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 700, padding: '8px 12px' }} />
                      </div>
                      <div className="col-4">
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Rate/Night <span style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }}>(incl. GST)</span></label>
                        <input type="text" className="form-control form-control-sm" value={formatCurrency(gstInclusiveRate(bookingForm.rate_per_night))}
                          readOnly
                          style={{ borderRadius: 4, border: '2px solid #2dd4bf', fontSize: 13, fontWeight: 800, padding: '8px 12px', background: '#f0fdfa', color: '#0f766e', cursor: 'default' }} />
                      </div>
                    </>
                  )}

                  {/* Extra Bed Option (nightly only) */}
                  {bookingType === 'nightly' && selectedRoom?.extra_bed_charge > 0 && (
                    <div className="col-12 mt-2">
                      <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className="bi bi-house-add" style={{ color: '#92400e', fontSize: 16 }}></i>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>Extra Bed</div>
                            <div style={{ fontSize: 10, color: '#b45309' }}>+{formatCurrency(gstInclusiveRate(selectedRoom.extra_bed_charge))}/night (incl. GST)</div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button type="button" className="btn btn-sm btn-outline-secondary" style={{ width: 28, height: 28, padding: 0, borderRadius: 6 }}
                            onClick={() => setExtraBeds(Math.max(0, extraBeds - 1))} disabled={extraBeds <= 0}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#92400e', minWidth: 20, textAlign: 'center' }}>{extraBeds}</span>
                          <button type="button" className="btn btn-sm btn-outline-warning" style={{ width: 28, height: 28, padding: 0, borderRadius: 6 }}
                            onClick={() => setExtraBeds(Math.min(selectedRoom.max_extra_beds || 1, extraBeds + 1))} disabled={extraBeds >= (selectedRoom.max_extra_beds || 1)}>+</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Group Room Picker */}
              {isGroupBooking && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#1a1a2e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-grid-3x3-gap" style={{ color: '#f59e0b', fontSize: 14 }}></i>
                    Select Rooms ({selectedGroupRooms.length} selected)
                  </div>
                  {availableRoomsForGroup.length === 0 ? (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '16px 0', fontSize: 13, fontWeight: 600 }}>No available rooms</p>
                  ) : (
                    <div className="row g-2">
                      {availableRoomsForGroup.map(rm => {
                        const isSelected = selectedGroupRooms.some(r => r.room_id === rm.id);
                        return (
                          <div className="col-4 col-lg-3" key={rm.id}>
                            <div onClick={() => toggleGroupRoom(rm)} style={{
                              cursor: 'pointer', padding: '8px 10px', borderRadius: 6,
                              border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                              background: isSelected ? '#f0fdf4' : '#fff',
                              transition: 'all 0.15s',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: 13 }}>{rm.room_number}</strong>
                                <input type="checkbox" className="form-check-input" checked={isSelected} readOnly style={{ pointerEvents: 'none' }} />
                              </div>
                              <div style={{ fontSize: 10, color: '#64748b' }}>{capitalize(rm.room_type || '')}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e' }}>
                                {bookingType === 'hourly'
                                  ? `${formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours, rm)))} / ${expectedHours}h`
                                  : `${formatCurrency(gstInclusiveRate(rm.base_rate || 0))}/night`
                                }
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {selectedGroupRooms.length > 0 && selectedGroupRooms.length < 2 && (
                    <div style={{ marginTop: 8, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 4, padding: '6px 10px', fontSize: 11, color: '#92400e', fontWeight: 600 }}>
                      <i className="bi bi-exclamation-triangle me-1"></i>Select at least 2 rooms for group booking
                    </div>
                  )}
                </div>
              )}

              {/* Meal Plan (hidden for hourly bookings) */}
              {bookingType !== 'hourly' && <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1a1a2e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-cup-hot-fill" style={{ color: '#f59e0b', fontSize: 14 }}></i>
                  Meal Plan
                </div>
                <div className="row g-2">
                  {[
                    { value: 'none', label: 'Room Only', icon: 'bi-house', desc: 'No meals', color: '#64748b' },
                    { value: 'breakfast', label: 'Breakfast', icon: 'bi-sunrise', desc: `+₹${mealRates.breakfast_rate}/person`, color: '#f59e0b' },
                    { value: 'dinner', label: 'Dinner', icon: 'bi-moon-stars', desc: `+₹${mealRates.dinner_rate}/person`, color: '#8b5cf6' },
                    { value: 'both', label: 'B + D', icon: 'bi-cup-hot', desc: `+₹${mealRates.breakfast_rate + mealRates.dinner_rate}/person`, color: '#10b981' },
                  ].map(opt => (
                    <div className="col-3" key={opt.value}>
                      <div
                        onClick={() => setMealPlan(opt.value)}
                        style={{
                          border: `2px solid ${mealPlan === opt.value ? opt.color : '#e2e8f0'}`,
                          background: mealPlan === opt.value ? `${opt.color}10` : '#fff',
                          borderRadius: 6, padding: '10px 8px', textAlign: 'center', cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <i className={`bi ${opt.icon}`} style={{ fontSize: 16, color: mealPlan === opt.value ? opt.color : '#94a3b8', display: 'block', marginBottom: 4 }}></i>
                        <div style={{ fontSize: 11, fontWeight: 800, color: mealPlan === opt.value ? opt.color : '#1a1a2e' }}>{opt.label}</div>
                        <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {mealPlan !== 'none' && (
                  <div style={{ marginTop: 8, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 4, padding: '6px 10px', fontSize: 11, color: '#92400e', fontWeight: 600 }}>
                    <i className="bi bi-info-circle me-1"></i>
                    Meal surcharge: ₹{getMealSurcharge(bookingForm.adults)}/night for {bookingForm.adults} adult{bookingForm.adults > 1 ? 's' : ''}
                  </div>
                )}
              </div>}

              {/* Payment */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1a1a2e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-credit-card-fill" style={{ color: '#2dd4bf', fontSize: 14 }}></i>
                  Payment
                </div>
                <div className="row g-2">
                  <div className="col-4">
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Source</label>
                    <select className="form-select form-select-sm" value={bookingForm.source}
                      onChange={e => setBookingForm({ ...bookingForm, source: e.target.value })}
                      style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, padding: '8px 12px' }}>
                      <option value="walk_in">Walk-in</option>
                      <option value="direct">Direct</option>
                      <option value="phone">Phone</option>
                      <option value="website">Website</option>
                    </select>
                  </div>
                  <div className="col-4">
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Mode</label>
                    <select className="form-select form-select-sm" value={bookingForm.payment_mode}
                      onChange={e => setBookingForm({ ...bookingForm, payment_mode: e.target.value })}
                      style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, padding: '8px 12px' }}>
                      <option value="Pay at Hotel">Pay at Hotel</option>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div className="col-4">
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Advance (₹)</label>
                    <input type="number" className="form-control form-control-sm" min="0" value={bookingForm.advance_amount}
                      onChange={e => setBookingForm({ ...bookingForm, advance_amount: e.target.value })}
                      placeholder="0" style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 700, padding: '8px 12px' }} />
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' }}>Special Requests</label>
                <textarea className="form-control form-control-sm" rows="2" value={bookingForm.special_requests}
                  onChange={e => setBookingForm({ ...bookingForm, special_requests: e.target.value })}
                  placeholder="Any special requirements..." style={{ borderRadius: 4, border: '2px solid #e2e8f0', fontSize: 13, fontWeight: 600, resize: 'none', padding: '8px 12px' }}></textarea>
              </div>
            </div>

            {/* ---- Right Column: Summary ---- */}
            <div style={{ width: 320, background: '#f8fafc', borderLeft: '2px solid #1a1a2e', display: 'flex', flexDirection: 'column' }}>

              {/* OM Discount Toggle */}
              <div style={{ padding: '16px 20px', borderBottom: '2px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: bookingDiscount ? '#dc2626' : '#64748b', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    <i className="bi bi-tag-fill me-1"></i>OM Discount
                  </span>
                  <div className="form-check form-switch mb-0">
                    <input className="form-check-input" type="checkbox" id="bookingDiscountToggle2" checked={bookingDiscount}
                      onChange={e => setBookingDiscount(e.target.checked)} style={{ cursor: 'pointer' }} />
                  </div>
                </div>
                {bookingDiscount && (
                  <div style={{ marginTop: 12 }}>
                    <div className="row g-2">
                      <div className="col-6">
                        <select className="form-select form-select-sm" value={bookingDiscountType}
                          onChange={e => setBookingDiscountType(e.target.value)}
                          style={{ borderRadius: 4, fontSize: 12, border: '2px solid #e2e8f0', fontWeight: 700, color: '#1a1a2e' }}>
                          <option value="percentage">Percentage</option>
                          <option value="fixed">Fixed ₹</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <input type="number" className="form-control form-control-sm" min="0"
                          max={bookingDiscountType === 'percentage' ? 100 : undefined}
                          value={bookingDiscountValue}
                          onChange={e => setBookingDiscountValue(e.target.value)}
                          placeholder={bookingDiscountType === 'percentage' ? '%' : '₹'}
                          style={{ borderRadius: 4, fontSize: 12, border: '2px solid #e2e8f0', color: '#0f766e', fontWeight: 800 }} />
                      </div>
                      <div className="col-12">
                        <select className="form-select form-select-sm" value={bookingDiscountReason}
                          onChange={e => setBookingDiscountReason(e.target.value)}
                          style={{ borderRadius: 4, fontSize: 12, border: '2px solid #e2e8f0', fontWeight: 600, color: '#1a1a2e' }}>
                          <option value="">Reason...</option>
                          <option value="OM Instruction">OM Instruction</option>
                          <option value="Repeat Guest">Repeat Guest</option>
                          <option value="Corporate">Corporate Rate</option>
                          <option value="Long Stay">Long Stay</option>
                          <option value="Complimentary">Complimentary</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div style={{ flex: 1, padding: '20px 20px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1a1a2e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="bi bi-receipt" style={{ color: '#2dd4bf', fontSize: 14 }}></i>
                  Billing Summary
                </div>

                {bookingForm.check_in_date && (bookingType === 'hourly' || bookingForm.check_out_date) ? (() => {
                  const isHourly = bookingType === 'hourly';

                  // Group booking summary
                  if (isGroupBooking && selectedGroupRooms.length > 0) {
                    const nights = isHourly ? 0 : Math.max(1, Math.ceil((new Date(bookingForm.check_out_date) - new Date(bookingForm.check_in_date)) / 86400000));
                    const mealPerNight = isHourly ? 0 : getMealSurcharge(bookingForm.adults);
                    let groupTotal = 0;
                    const roomLines = selectedGroupRooms.map(r => {
                      const rate = isHourly ? getHourlyTotal(expectedHours, r) : (parseFloat(r.base_rate) || 0);
                      const rateGst = gstInclusiveRate(rate);
                      const roomTotal = isHourly ? rateGst : nights * rateGst;
                      groupTotal += roomTotal;
                      return { room_number: r.room_number, room_type: r.room_type, rateGst, roomTotal };
                    });
                    const totalMeal = mealPerNight * nights * selectedGroupRooms.length;
                    const subtotalWithMeal = groupTotal + totalMeal;
                    const discountAmt = bookingDiscount && bookingDiscountValue
                      ? (bookingDiscountType === 'percentage' ? subtotalWithMeal * (Number(bookingDiscountValue) / 100) : Number(bookingDiscountValue))
                      : 0;
                    const total = Math.max(0, subtotalWithMeal - discountAmt);
                    const advance = Number(bookingForm.advance_amount) || 0;
                    const balance = total - advance;
                    return (
                      <>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                            <div>
                              <span style={{ display: 'inline-block', background: '#f59e0b', color: '#0f172a', fontSize: 28, fontWeight: 900, width: 52, height: 52, lineHeight: '52px', borderRadius: 6 }}>{selectedGroupRooms.length}</span>
                              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Rooms</div>
                            </div>
                            <div>
                              <span style={{ display: 'inline-block', background: '#1a1a2e', color: isHourly ? '#fbbf24' : '#2dd4bf', fontSize: 28, fontWeight: 900, width: 52, height: 52, lineHeight: '52px', borderRadius: 6 }}>{isHourly ? expectedHours : nights}</span>
                              <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{isHourly ? 'Hours' : `Night${nights > 1 ? 's' : ''}`}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12 }}>
                          {roomLines.map((rl, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                              <span style={{ color: '#475569', fontWeight: 600 }}>
                                <strong>{rl.room_number}</strong> <small style={{ color: '#94a3b8' }}>{capitalize(rl.room_type || '')}</small>
                              </span>
                              <span style={{ fontWeight: 700, color: '#1a1a2e' }}>{formatCurrency(rl.roomTotal)}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid #e2e8f0', borderTop: '2px solid #e2e8f0', marginTop: 4 }}>
                            <span style={{ fontWeight: 800, color: '#1a1a2e' }}>Room Total</span>
                            <span style={{ fontWeight: 800, color: '#1a1a2e' }}>{formatCurrency(groupTotal)}</span>
                          </div>
                          {totalMeal > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid #e2e8f0', color: '#f59e0b' }}>
                              <span style={{ fontWeight: 700, fontSize: 11 }}>
                                <i className="bi bi-cup-hot me-1"></i>Meals ({selectedGroupRooms.length} rooms)
                              </span>
                              <span style={{ fontWeight: 800 }}>{formatCurrency(totalMeal)}</span>
                            </div>
                          )}
                          {discountAmt > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid #e2e8f0', color: '#dc2626' }}>
                              <span style={{ fontWeight: 700, fontSize: 11 }}>
                                <i className="bi bi-tag-fill me-1"></i>Discount {bookingDiscountType === 'percentage' ? `(${bookingDiscountValue}%)` : ''}
                              </span>
                              <span style={{ fontWeight: 800 }}>-{formatCurrency(discountAmt)}</span>
                            </div>
                          )}
                          {advance > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid #e2e8f0', color: '#059669' }}>
                              <span style={{ fontWeight: 700, fontSize: 11 }}>Advance received</span>
                              <span style={{ fontWeight: 800 }}>-{formatCurrency(advance)}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: 16, background: balance <= 0 ? '#ecfdf5' : '#fef3c7', border: `2px solid ${balance <= 0 ? '#10b981' : '#f59e0b'}`, borderRadius: 6, padding: '14px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: balance <= 0 ? '#059669' : '#b45309', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Group Balance Due</div>
                          <div style={{ fontSize: 26, fontWeight: 900, color: balance <= 0 ? '#047857' : '#92400e', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(balance)}</div>
                        </div>
                      </>
                    );
                  }

                  if (isHourly) {
                    const hTotal = getHourlyTotal(expectedHours);
                    const totalInclGst = gstInclusiveRate(hTotal);
                    const advance = Number(bookingForm.advance_amount) || 0;
                    const balance = totalInclGst - advance;
                    return (
                      <>
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                          <span style={{ display: 'inline-block', background: '#92400e', color: '#fbbf24', fontSize: 32, fontWeight: 900, width: 60, height: 60, lineHeight: '60px', borderRadius: 6 }}>{expectedHours}</span>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Hour{expectedHours > 1 ? 's' : ''}</div>
                        </div>
                        <div style={{ fontSize: 13 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #e2e8f0' }}>
                            <span style={{ color: '#475569', fontWeight: 700 }}>{expectedHours}h short stay <small style={{ color: '#94a3b8', fontSize: 10 }}>incl. GST</small></span>
                            <span style={{ fontWeight: 800, color: '#1a1a2e' }}>{formatCurrency(totalInclGst)}</span>
                          </div>
                          {advance > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #e2e8f0', color: '#059669' }}>
                              <span style={{ fontSize: 12, fontWeight: 700 }}>Advance received</span>
                              <span style={{ fontWeight: 800 }}>-{formatCurrency(advance)}</span>
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: 20, background: balance <= 0 ? '#ecfdf5' : '#fef3c7', border: `2px solid ${balance <= 0 ? '#10b981' : '#f59e0b'}`, borderRadius: 6, padding: '16px 14px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: balance <= 0 ? '#059669' : '#b45309', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Balance Due</div>
                          <div style={{ fontSize: 30, fontWeight: 900, color: balance <= 0 ? '#047857' : '#92400e', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(balance)}</div>
                        </div>
                      </>
                    );
                  }
                  const nights = Math.max(1, Math.ceil((new Date(bookingForm.check_out_date) - new Date(bookingForm.check_in_date)) / 86400000));
                  const rate = Number(bookingForm.rate_per_night) || selectedRoom?.base_rate || 0;
                  const rateInclGst = gstInclusiveRate(rate);
                  const totalInclGst = nights * rateInclGst;
                  const extraBedTotal = extraBeds > 0 ? nights * extraBeds * gstInclusiveRate(parseFloat(selectedRoom?.extra_bed_charge) || 0) : 0;
                  const mealPerNight = getMealSurcharge(bookingForm.adults);
                  const totalMeal = mealPerNight * nights;
                  const subtotalWithMeal = totalInclGst + extraBedTotal + totalMeal;
                  const discountAmt = bookingDiscount && bookingDiscountValue
                    ? (bookingDiscountType === 'percentage' ? subtotalWithMeal * (Number(bookingDiscountValue) / 100) : Number(bookingDiscountValue))
                    : 0;
                  const total = Math.max(0, subtotalWithMeal - discountAmt);
                  const advance = Number(bookingForm.advance_amount) || 0;
                  const balance = total - advance;
                  return (
                    <>
                      {/* Night count badge */}
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <span style={{ display: 'inline-block', background: '#1a1a2e', color: '#2dd4bf', fontSize: 32, fontWeight: 900, width: 60, height: 60, lineHeight: '60px', borderRadius: 6 }}>{nights}</span>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Night{nights > 1 ? 's' : ''}</div>
                      </div>

                      {/* Line items */}
                      <div style={{ fontSize: 13 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #e2e8f0' }}>
                          <span style={{ color: '#475569', fontWeight: 700 }}>{nights} x {formatCurrency(rateInclGst)} <small style={{ color: '#94a3b8', fontSize: 10 }}>incl. GST</small></span>
                          <span style={{ fontWeight: 800, color: '#1a1a2e' }}>{formatCurrency(totalInclGst)}</span>
                        </div>
                        {extraBedTotal > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #e2e8f0' }}>
                            <span style={{ color: '#92400e', fontWeight: 700 }}><i className="bi bi-house-add me-1"></i>Extra Bed x{extraBeds} ({nights}N)</span>
                            <span style={{ fontWeight: 800, color: '#92400e' }}>{formatCurrency(extraBedTotal)}</span>
                          </div>
                        )}

                        {totalMeal > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #e2e8f0', color: '#f59e0b' }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>
                              <i className="bi bi-cup-hot me-1"></i>{mealPlan === 'both' ? 'B+D' : mealPlan === 'breakfast' ? 'Breakfast' : 'Dinner'} ({bookingForm.adults} pax x {nights}N)
                            </span>
                            <span style={{ fontWeight: 800 }}>{formatCurrency(totalMeal)}</span>
                          </div>
                        )}

                        {discountAmt > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #e2e8f0', color: '#dc2626' }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>
                              <i className="bi bi-tag-fill me-1"></i>Discount {bookingDiscountType === 'percentage' ? `(${bookingDiscountValue}%)` : ''}
                            </span>
                            <span style={{ fontWeight: 800 }}>-{formatCurrency(discountAmt)}</span>
                          </div>
                        )}

                        {advance > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #e2e8f0', color: '#059669' }}>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>Advance received</span>
                            <span style={{ fontWeight: 800 }}>-{formatCurrency(advance)}</span>
                          </div>
                        )}
                      </div>

                      {/* Balance */}
                      <div style={{ marginTop: 20, background: balance <= 0 ? '#ecfdf5' : '#fef3c7', border: `2px solid ${balance <= 0 ? '#10b981' : '#f59e0b'}`, borderRadius: 6, padding: '16px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: balance <= 0 ? '#059669' : '#b45309', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Balance Due</div>
                        <div style={{ fontSize: 30, fontWeight: 900, color: balance <= 0 ? '#047857' : '#92400e', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(balance)}</div>
                      </div>
                    </>
                  );
                })() : (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 13, fontWeight: 600 }}>
                    <i className="bi bi-calendar3 d-block mb-2" style={{ fontSize: 24, color: '#cbd5e1' }}></i>
                    Select dates to see pricing
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ padding: '16px 20px', borderTop: '2px solid #e2e8f0' }}>
                <button className="btn w-100" style={{
                  background: '#1a1a2e', color: '#2dd4bf', borderRadius: 4, padding: '12px 0',
                  fontWeight: 800, fontSize: 13, letterSpacing: 1, border: 'none',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2dd4bf'; e.currentTarget.style.color = '#0f172a'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#1a1a2e'; e.currentTarget.style.color = '#2dd4bf'; }}
                  onClick={() => {
                    if (!bookingForm.id_proof_number || !bookingForm.id_proof_number.trim()) {
                      toast.error('ID proof is required for check-in');
                      return;
                    }
                    handleCreateBooking(true);
                  }} disabled={bookingSubmitting || !bookingForm.id_proof_number?.trim()}>
                  {bookingSubmitting
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>PROCESSING...</>
                    : isGroupBooking
                      ? <><i className="bi bi-people-fill me-1"></i> REGISTER GROUP &amp; CHECK IN</>
                      : <><i className="bi bi-box-arrow-in-right me-1"></i> REGISTER &amp; CHECK IN</>}
                </button>
                {!bookingForm.id_proof_number?.trim() && (
                  <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, textAlign: 'center', marginTop: 4 }}>
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>ID proof required for check-in
                  </div>
                )}
                <button className="btn w-100" style={{
                  background: 'transparent', color: '#1a1a2e', borderRadius: 4, padding: '10px 0',
                  fontWeight: 700, fontSize: 12, letterSpacing: 0.5, border: '2px solid #e2e8f0',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  marginTop: 8,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a1a2e'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  onClick={() => handleCreateBooking(false)} disabled={bookingSubmitting}>
                  <i className={`bi ${isGroupBooking ? 'bi-people-fill' : 'bi-bookmark-plus'} me-1`}></i> {isGroupBooking ? 'REGISTER GROUP ONLY' : 'REGISTER ONLY'}
                </button>
                <button type="button" className="btn w-100" style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, background: 'transparent', border: 'none', marginTop: 6, letterSpacing: 0.5 }}
                  onClick={() => setShowBookingModal(false)}>
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========== Check-In Modal ========== */}
      <Modal show={showCheckInModal} onHide={() => setShowCheckInModal(false)} centered size="lg">
        <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
            <h5 className="modal-title"><i className="bi bi-box-arrow-in-right me-2"></i>Guest Check-In</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowCheckInModal(false)}></button>
          </div>
          <div className="modal-body" style={{ padding: 24 }}>
            <div className="row g-3">
              {/* Group Banner */}
              {checkInData?.group_id && (
                <div className="col-12">
                  <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #f59e0b', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                      <i className="bi bi-people-fill me-2"></i>Group Booking: {checkInData.group_id}
                    </span>
                    <button className="btn btn-sm" style={{ background: '#f59e0b', color: '#fff', fontWeight: 700, borderRadius: 6, fontSize: 12 }}
                      onClick={() => handleGroupCheckIn(checkInData.group_id)}>
                      <i className="bi bi-check-all me-1"></i>Check In All Group Rooms
                    </button>
                  </div>
                </div>
              )}
              {/* Meal Plan Badge */}
              {checkInData?.meal_plan && checkInData.meal_plan !== 'none' && (
                <div className="col-12">
                  <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-cup-hot-fill" style={{ color: '#f59e0b' }}></i>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                      Meal Plan: {checkInData.meal_plan === 'both' ? 'Breakfast + Dinner' : checkInData.meal_plan === 'breakfast' ? 'Breakfast Only' : 'Dinner Only'}
                    </span>
                  </div>
                </div>
              )}
              {/* Booking Info */}
              <div className="col-md-6">
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                  <small style={{ color: '#64748b', display: 'block' }}>Booking ID</small>
                  <strong style={{ color: '#1a1a2e' }}>#{checkInData?.reservation_number || 'N/A'}</strong>
                </div>
              </div>
              <div className="col-md-6">
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                  <small style={{ color: '#64748b', display: 'block' }}>Room Assigned</small>
                  <strong style={{ color: '#1a1a2e' }}>{room.room_number} - {capitalize(room.room_type)}</strong>
                </div>
              </div>
              <div className="col-md-6">
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                  <small style={{ color: '#64748b', display: 'block' }}>Check-in Date</small>
                  <strong style={{ color: '#1a1a2e' }}>{formatDate(checkInData?.check_in_date)}</strong>
                </div>
              </div>
              <div className="col-md-6">
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                  <small style={{ color: '#64748b', display: 'block' }}>Check-out Date</small>
                  <strong style={{ color: '#1a1a2e' }}>{formatDate(checkInData?.check_out_date)}</strong>
                </div>
              </div>

              <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

              {/* Guest Details */}
              <div className="col-md-6">
                <label className="fd-form-label">Full Name *</label>
                <input type="text" className="fd-form-control" defaultValue={`${guest.first_name || ''} ${guest.last_name || ''}`} readOnly />
              </div>
              <div className="col-md-6">
                <label className="fd-form-label">Phone Number *</label>
                <input type="tel" className="fd-form-control" defaultValue={guest.phone || ''} readOnly />
              </div>
              <div className="col-md-6">
                <label className="fd-form-label">ID Type *</label>
                <select className="fd-form-control" value={idType} onChange={e => setIdType(e.target.value)}>
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="pan">PAN Card</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="fd-form-label">ID Number *</label>
                <input type="text" className="fd-form-control" placeholder="Enter ID number" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
              </div>

              <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

              {/* Room Rate Adjustment Section */}
              <div className="col-12">
                <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #fbbf24', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="bi bi-currency-rupee"></i> Adjust Room Rate
                    </label>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="enableRateAdjust" style={{ width: 40, height: 20 }} checked={adjustRate} onChange={e => { setAdjustRate(e.target.checked); if (!e.target.checked) { setAppliedRate(null); setNewRate(''); } }} />
                    </div>
                  </div>

                  {adjustRate && (
                    <>
                      <div className="row g-2 align-items-end">
                        <div className="col-md-4">
                          <label style={{ fontSize: 12, color: '#92400e', display: 'block', marginBottom: 4 }}>Standard Rate</label>
                          <div style={{ background: '#fff', padding: '10px 12px', borderRadius: 8, fontWeight: 600, color: '#64748b', textDecoration: 'line-through' }}>
                            {formatCurrency(gstInclusiveRate(originalRate))}/night
                          </div>
                        </div>
                        <div className="col-md-4">
                          <label style={{ fontSize: 12, color: '#92400e', display: 'block', marginBottom: 4 }}>New Rate/Night *</label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text" style={{ borderRadius: '8px 0 0 8px' }}>Rs</span>
                            <input type="number" className="form-control" value={newRate} onChange={e => setNewRate(e.target.value)} min="0" style={{ borderRadius: '0 8px 8px 0' }} />
                          </div>
                        </div>
                        <div className="col-md-4">
                          <button type="button" className="btn btn-sm w-100" style={{ background: '#d97706', color: '#fff', borderRadius: 8, padding: 8 }} onClick={handleApplyRate}>
                            <i className="bi bi-check-lg me-1"></i>Apply Rate
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <label style={{ fontSize: 12, color: '#92400e', display: 'block', marginBottom: 4 }}>Reason for Rate Change *</label>
                        <select className="form-select form-select-sm" value={rateReason} onChange={e => setRateReason(e.target.value)} style={{ borderRadius: 8 }}>
                          <option value="">Select reason...</option>
                          <option value="walkin">Walk-in Negotiation</option>
                          <option value="corporate">Corporate Rate</option>
                          <option value="loyalty">Loyalty/Repeat Guest</option>
                          <option value="longstay">Long Stay Discount</option>
                          <option value="offseason">Off-Season Rate</option>
                          <option value="upgrade">Complimentary Upgrade</option>
                          <option value="complaint">Service Recovery</option>
                          <option value="other">Other (specify below)</option>
                        </select>
                      </div>
                      {rateReason === 'other' && (
                        <div className="mt-2">
                          <input type="text" className="form-control form-control-sm" value={otherRateReason} onChange={e => setOtherRateReason(e.target.value)} placeholder="Specify reason..." style={{ borderRadius: 8 }} />
                        </div>
                      )}

                      <div style={{ marginTop: 12, padding: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ color: '#92400e' }}>Original Total ({totalNights} nights):</span>
                          <span style={{ color: '#64748b', textDecoration: 'line-through' }}>{formatCurrency(gstInclusiveRate(originalRate) * totalNights)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
                          <span style={{ color: '#92400e' }}>New Total (incl. GST):</span>
                          <span style={{ color: '#d97706' }}>{formatCurrency(gstInclusiveRate(appliedRate != null ? appliedRate : originalRate) * totalNights)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                          <span style={{ color: '#92400e' }}>You Save Guest:</span>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(appliedRate != null ? gstInclusiveRate(originalRate - appliedRate) * totalNights : 0)}</span>
                        </div>
                      </div>
                      <small style={{ color: '#92400e', fontSize: 11, marginTop: 8, display: 'block' }}>
                        <i className="bi bi-shield-check me-1"></i>Rate change will be logged with OM authorization for audit
                      </small>
                    </>
                  )}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="col-md-4">
                <div style={{ background: '#f0fdf4', padding: '12px 16px', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                  <small style={{ color: '#166534', display: 'block' }}>Total Amount</small>
                  <strong style={{ color: '#166534', fontSize: 18 }}>{formatCurrency(totalAmount)}</strong>
                </div>
              </div>
              <div className="col-md-4">
                <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: 10, border: '1px solid #bfdbfe' }}>
                  <small style={{ color: '#1e40af', display: 'block' }}>Advance Paid</small>
                  <strong style={{ color: '#1e40af', fontSize: 18 }}>{formatCurrency(advancePaid)}</strong>
                </div>
              </div>
              <div className="col-md-4">
                <div style={{ background: '#fef3c7', padding: '12px 16px', borderRadius: 10, border: '1px solid #fbbf24' }}>
                  <small style={{ color: '#92400e', display: 'block' }}>Balance Due</small>
                  <strong style={{ color: '#92400e', fontSize: 18 }}>{formatCurrency(balanceDue)}</strong>
                </div>
              </div>

              {/* Deposit Collection Section */}
              <div className="col-12">
                <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1px solid #6ee7b7', borderRadius: 12, padding: 16 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: '#065f46', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <i className="bi bi-cash-stack"></i> Collect Deposit
                  </label>
                  <div className="row g-2 align-items-end">
                    <div className="col-md-4">
                      <label style={{ fontSize: 12, color: '#065f46', display: 'block', marginBottom: 4 }}>Deposit Amount *</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text" style={{ borderRadius: '8px 0 0 8px' }}>Rs</span>
                        <input type="number" className="form-control" value={depositAmount} onChange={e => setDepositAmount(Number(e.target.value))} min="0" style={{ borderRadius: '0 8px 8px 0' }} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label style={{ fontSize: 12, color: '#065f46', display: 'block', marginBottom: 4 }}>Payment Mode *</label>
                      <select className="form-select form-select-sm" value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{ borderRadius: 8 }}>
                        <option value="">Select mode...</option>
                        <option value="cash">Cash</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="upi">UPI</option>
                        <option value="netbanking">Net Banking</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label style={{ fontSize: 12, color: '#065f46', display: 'block', marginBottom: 4 }}>Reference No. (Optional)</label>
                      <input type="text" className="form-control form-control-sm" placeholder="Transaction ID / Cheque No." value={paymentRef} onChange={e => setPaymentRef(e.target.value)} style={{ borderRadius: 8 }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12, padding: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#065f46' }}>Total Amount:</span>
                      <span style={{ color: '#065f46' }}>{formatCurrency(totalAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#065f46' }}>Advance Paid:</span>
                      <span style={{ color: '#10b981' }}>- {formatCurrency(advancePaid)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: '#065f46' }}>Deposit Now:</span>
                      <span style={{ color: '#10b981' }}>- {formatCurrency(depositAmount)}</span>
                    </div>
                    <hr style={{ margin: '8px 0', borderColor: '#6ee7b7' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
                      <span style={{ color: '#065f46' }}>Remaining Balance:</span>
                      <span style={{ color: '#065f46' }}>{formatCurrency(Math.max(0, balanceDue - depositAmount))}</span>
                    </div>
                  </div>
                  <small style={{ color: '#065f46', fontSize: 11, marginTop: 8, display: 'block' }}>
                    <i className="bi bi-info-circle me-1"></i>Receipt will be generated after check-in completion
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 10 }} onClick={() => setShowCheckInModal(false)}>Close</button>
            {checkInData?.id && ['pending', 'confirmed'].includes(checkInData?.status) && (
              <button type="button" className="btn btn-outline-danger" style={{ borderRadius: 10 }}
                onClick={async () => {
                  setCancelData(checkInData);
                  setRefundMethod('cash');
                  setRefundRef('');
                  setRefundPreview(null);
                  setUseOverrideRefund(false);
                  setOverrideRefundAmount('');
                  setShowCheckInModal(false);
                  setShowCancelModal(true);
                  try {
                    const res = await get(`/reservations/${checkInData.id}/refund-preview`, { silent: true });
                    setRefundPreview(res.data);
                  } catch { /* no advance */ }
                }}>
                <i className="bi bi-x-circle me-1"></i>Cancel Reservation
              </button>
            )}
            {(() => {
              const roomDirty = selectedRoom && !['clean', 'inspected'].includes(selectedRoom.cleanliness_status);
              const missingId = !idNumber || !idNumber.trim();
              const blocked = roomDirty || missingId;
              return (
                <>
                  {roomDirty && (
                    <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>Room is {selectedRoom.cleanliness_status === 'dirty' ? 'dirty' : selectedRoom.cleanliness_status === 'in_progress' ? 'being cleaned' : selectedRoom.cleanliness_status?.replace('_', ' ')}
                    </span>
                  )}
                  {!roomDirty && missingId && (
                    <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>ID proof is required for check-in
                    </span>
                  )}
                  <button type="button" className="btn" style={{ background: blocked ? '#9ca3af' : '#10b981', color: '#fff', borderRadius: 10, padding: '10px 24px', cursor: blocked ? 'not-allowed' : 'pointer' }} onClick={handleCheckIn} disabled={blocked}>
                    <i className="bi bi-check-lg me-1"></i> Complete Check-In
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </Modal>

      {/* ========== Check-Out Modal ========== */}
      <Modal show={showCheckOutModal} onHide={() => setShowCheckOutModal(false)} centered size="lg">
        <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
            <h5 className="modal-title"><i className="bi bi-box-arrow-right me-2"></i>Guest Check-Out</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowCheckOutModal(false)}></button>
          </div>
          <div className="modal-body" style={{ padding: 24 }}>
            <div className="row g-3">
              {/* Group Banner */}
              {checkOutData?.group_id && (
                <div className="col-12">
                  <div style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '2px solid #f59e0b', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                      <i className="bi bi-people-fill me-2"></i>Group Booking: {checkOutData.group_id}
                    </span>
                    <button className="btn btn-sm" style={{ background: (!coBilling || coBilling.payment_status !== 'paid') ? '#9ca3af' : '#f59e0b', color: '#fff', fontWeight: 700, borderRadius: 6, fontSize: 12, cursor: (!coBilling || coBilling.payment_status !== 'paid') ? 'not-allowed' : 'pointer' }}
                      onClick={() => handleGroupCheckOut(checkOutData.group_id)}
                      disabled={!coBilling || coBilling.payment_status !== 'paid'}>
                      <i className="bi bi-check-all me-1"></i>Check Out Entire Group
                    </button>
                  </div>
                </div>
              )}
              {/* Meal Plan Badge */}
              {checkOutData?.meal_plan && checkOutData.meal_plan !== 'none' && (
                <div className="col-12">
                  <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="bi bi-cup-hot-fill" style={{ color: '#f59e0b' }}></i>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                      Meal Plan: {checkOutData.meal_plan === 'both' ? 'Breakfast + Dinner' : checkOutData.meal_plan === 'breakfast' ? 'Breakfast Only' : 'Dinner Only'}
                    </span>
                  </div>
                </div>
              )}
              {/* Guest & Room Info */}
              <div className="col-md-6">
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                  <small style={{ color: '#64748b', display: 'block' }}>Guest Name</small>
                  <strong style={{ color: '#1a1a2e' }}>{coGuest.first_name} {coGuest.last_name}</strong>
                </div>
              </div>
              <div className="col-md-6">
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                  <small style={{ color: '#64748b', display: 'block' }}>Room</small>
                  <strong style={{ color: '#1a1a2e' }}>{coRoom.room_number} - {capitalize(coRoom.room_type)}</strong>
                </div>
              </div>

              {/* Itemized Billing Table */}
              <div className="col-12">
                <table className="table table-sm mb-0" style={{ fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th className="text-end">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Room Charges */}
                    <tr>
                      <td>Room Charges ({coNights} night{coNights !== 1 ? 's' : ''} x {formatCurrency(coRate)})</td>
                      <td className="text-end">{formatCurrency(roomCharges)}</td>
                    </tr>

                    {/* Restaurant Charges - Itemized */}
                    {restaurantCharges > 0 && (
                      <>
                        <tr style={{ background: '#fff7ed' }}>
                          <td colSpan="2" style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, color: '#9a3412' }}>
                                <i className="bi bi-cup-hot me-1"></i> Restaurant Charges
                              </span>
                              <span style={{ fontWeight: 600, color: '#9a3412' }}>{formatCurrency(restaurantCharges)}</span>
                            </div>
                          </td>
                        </tr>
                        {restaurantItems.map((item, idx) => (
                            <tr key={idx} style={{ background: '#fffbeb' }}>
                              <td style={{ paddingLeft: 28, color: '#92400e', fontSize: 13 }}>
                                <i className="bi bi-cup-hot me-1" style={{ fontSize: 11 }}></i> {item.description}
                                {item.date && <span style={{ fontSize: 11, color: '#a16207', marginLeft: 6 }}>({item.date})</span>}
                              </td>
                              <td className="text-end" style={{ color: '#92400e', fontSize: 13 }}>{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                      </>
                    )}

                    {/* Service/Extra Charges (extra bed, laundry, etc.) */}
                    {coBilling?.items?.filter(i => !['room_charge', 'restaurant', 'tax', 'discount'].includes(i.item_type)).length > 0 && (
                      <>
                        {coBilling.items.filter(i => !['room_charge', 'restaurant', 'tax', 'discount'].includes(i.item_type)).map((item, idx) => (
                          <tr key={`svc-${idx}`} style={{ background: '#fef3c7' }}>
                            <td style={{ color: '#92400e', fontSize: 13 }}>
                              <i className="bi bi-house-add me-1" style={{ fontSize: 11 }}></i> {item.description}
                            </td>
                            <td className="text-end" style={{ color: '#92400e', fontSize: 13 }}>{formatCurrency(parseFloat(item.amount))}</td>
                          </tr>
                        ))}
                      </>
                    )}

                    {/* Subtotal */}
                    {coBilling && parseFloat(coBilling.subtotal) !== roomCharges && (
                      <tr>
                        <td>Subtotal</td>
                        <td className="text-end">{formatCurrency(coSubtotal)}</td>
                      </tr>
                    )}

                    {/* GST Breakdown */}
                    {coBilling ? (
                      <>
                        {parseFloat(coBilling.cgst_amount) > 0 && (
                          <tr><td>CGST</td><td className="text-end">{formatCurrency(parseFloat(coBilling.cgst_amount))}</td></tr>
                        )}
                        {parseFloat(coBilling.sgst_amount) > 0 && (
                          <tr><td>SGST</td><td className="text-end">{formatCurrency(parseFloat(coBilling.sgst_amount))}</td></tr>
                        )}
                        {parseFloat(coBilling.igst_amount) > 0 && (
                          <tr><td>IGST</td><td className="text-end">{formatCurrency(parseFloat(coBilling.igst_amount))}</td></tr>
                        )}
                      </>
                    ) : (
                      <tr><td>GST (12%)</td><td className="text-end">{formatCurrency(coGst)}</td></tr>
                    )}

                    <tr style={{ background: '#f0fdf4' }}>
                      <td><strong>Grand Total</strong></td>
                      <td className="text-end"><strong>{formatCurrency(coGrandTotal)}</strong></td>
                    </tr>

                    {/* OM Discount Row */}
                    {appliedDiscount > 0 && (
                      <tr style={{ color: '#8b5cf6' }}>
                        <td><i className="bi bi-tag me-1"></i>OM Discount</td>
                        <td className="text-end">- {formatCurrency(appliedDiscount)}</td>
                      </tr>
                    )}

                    {appliedDiscount > 0 && (
                      <tr style={{ background: '#f0fdf4' }}>
                        <td><strong>Total After Discount</strong></td>
                        <td className="text-end"><strong>{formatCurrency(coTotalAfterDiscount)}</strong></td>
                      </tr>
                    )}
                    {coAdvance > 0 && (
                      <tr style={{ color: '#10b981' }}>
                        <td>{coBilling ? 'Paid Amount' : 'Advance Paid'}</td>
                        <td className="text-end">- {formatCurrency(coAdvance)}</td>
                      </tr>
                    )}
                    <tr style={{ background: coBalance < 0 ? '#f0fdf4' : '#eff6ff' }}>
                      <td><strong>{coBalance < 0 ? 'Refundable Amount' : 'Balance Due'}</strong></td>
                      <td className="text-end"><strong style={{ color: coBalance < 0 ? '#16a34a' : coBalance > 0 ? '#dc2626' : '#1a1a2e' }}>{coBalance < 0 ? formatCurrency(Math.abs(coBalance)) : formatCurrency(coBalance)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* OM Discount Section */}
              <div className="col-12">
                <div style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #c4b5fd', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="bi bi-percent"></i> Apply OM Discount
                    </label>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="enableDiscount" style={{ width: 40, height: 20 }} checked={applyDiscount} onChange={e => { setApplyDiscount(e.target.checked); if (!e.target.checked) { setAppliedDiscount(0); setDiscountValue(''); } }} />
                    </div>
                  </div>

                  {applyDiscount && (
                    <>
                      <div className="row g-2">
                        <div className="col-md-4">
                          <select className="form-select form-select-sm" value={discountType} onChange={e => setDiscountType(e.target.value)} style={{ borderRadius: 8 }}>
                            <option value="amount">Fixed Amount (Rs)</option>
                            <option value="percent">Percentage (%)</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <input type="number" className="form-control form-control-sm" value={discountValue} onChange={e => setDiscountValue(e.target.value)} min="0" placeholder="Enter value" style={{ borderRadius: 8 }} />
                        </div>
                        <div className="col-md-4">
                          <button type="button" className="btn btn-sm w-100" style={{ background: '#7c3aed', color: '#fff', borderRadius: 8 }} onClick={handleApplyDiscount}>
                            Apply
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <input type="text" className="form-control form-control-sm" value={discountReason} onChange={e => setDiscountReason(e.target.value)} placeholder="Reason for discount (e.g., Guest complaint, Loyalty, etc.)" style={{ borderRadius: 8 }} />
                      </div>
                      <small style={{ color: '#7c3aed', fontSize: 11, marginTop: 8, display: 'block' }}>
                        <i className="bi bi-info-circle me-1"></i>Discount will be logged with OM name and timestamp for audit
                      </small>
                    </>
                  )}
                </div>
              </div>

              {/* Room Transfer Section */}
              <div className="col-12">
                <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #93c5fd', borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showTransferSection ? 12 : 0 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="bi bi-arrow-left-right"></i> Room Transfer
                    </label>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="enableTransfer" style={{ width: 40, height: 20 }}
                        checked={showTransferSection}
                        onChange={e => { setShowTransferSection(e.target.checked); if (!e.target.checked) { setTransferRoomId(''); setTransferReason(''); setTransferAdjustRate(false); } }}
                      />
                    </div>
                  </div>

                  {showTransferSection && (
                    <>
                      {/* Current Room Info */}
                      <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #e2e8f0' }}>
                        <i className="bi bi-door-open-fill" style={{ fontSize: 20, color: '#64748b' }}></i>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Current: Room {coRoom.room_number}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{capitalize(coRoom.room_type)} &middot; Floor {coRoom.floor} &middot; {formatCurrency(coRate)}/night</div>
                        </div>
                      </div>

                      {/* Transfer Reason */}
                      <div className="mb-2">
                        <select className="form-select form-select-sm" value={transferReason} onChange={e => setTransferReason(e.target.value)} style={{ borderRadius: 8 }}>
                          <option value="">Select reason for transfer...</option>
                          <option value="AC/Heating not working">AC/Heating not working</option>
                          <option value="Plumbing issue">Plumbing issue</option>
                          <option value="Noise complaint">Noise complaint</option>
                          <option value="Room upgrade request">Room upgrade request</option>
                          <option value="Room downgrade request">Room downgrade request</option>
                          <option value="Electrical issue">Electrical issue</option>
                          <option value="Cleanliness issue">Cleanliness issue</option>
                          <option value="Guest preference">Guest preference</option>
                          <option value="Maintenance required">Maintenance required</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Available Rooms */}
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Select New Room:</div>
                      <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
                        {availableTransferRooms.length === 0 ? (
                          <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No available rooms for transfer</div>
                        ) : (
                          availableTransferRooms.map(r => (
                            <div key={r.id}
                              onClick={() => setTransferRoomId(String(r.id))}
                              style={{
                                padding: '8px 14px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                                background: transferRoomId === String(r.id) ? '#eff6ff' : '#fff',
                                border: transferRoomId === String(r.id) ? '2px solid #3b82f6' : '2px solid transparent',
                                borderRadius: transferRoomId === String(r.id) ? 8 : 0,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{r.room_number}</span>
                                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>{capitalize(r.room_type)} &middot; Floor {r.floor}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>{formatCurrency(r.base_rate)}</span>
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                  background: r.status === 'available' ? '#dcfce7' : '#fef9c3',
                                  color: r.status === 'available' ? '#166534' : '#854d0e',
                                }}>{capitalize(r.status)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Rate Adjustment */}
                      {selectedTransferRoom && (
                        <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
                          <div className="form-check" style={{ marginBottom: 4 }}>
                            <input className="form-check-input" type="checkbox" id="adjustTransferRate" checked={transferAdjustRate} onChange={e => setTransferAdjustRate(e.target.checked)} />
                            <label className="form-check-label" htmlFor="adjustTransferRate" style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                              Adjust rate to new room ({formatCurrency(selectedTransferRoom.base_rate)}/night)
                            </label>
                          </div>
                          {selectedTransferRoom.base_rate !== coRate && (
                            <small style={{ color: selectedTransferRoom.base_rate > coRate ? '#dc2626' : '#16a34a', fontSize: 12, marginLeft: 24 }}>
                              {selectedTransferRoom.base_rate > coRate ? '+' : ''}{formatCurrency(selectedTransferRoom.base_rate - coRate)} difference per night
                            </small>
                          )}
                        </div>
                      )}

                      {/* Transfer Button */}
                      <button type="button" className="btn btn-sm w-100 mt-3"
                        style={{ background: '#2563eb', color: '#fff', borderRadius: 8, fontWeight: 600, padding: '8px 0' }}
                        disabled={!transferRoomId || transferLoading}
                        onClick={handleRoomTransfer}
                      >
                        {transferLoading ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span>Transferring...</>
                        ) : (
                          <><i className="bi bi-arrow-left-right me-2"></i>Transfer to Room {selectedTransferRoom?.room_number || ''}</>
                        )}
                      </button>
                      <small style={{ color: '#64748b', fontSize: 11, marginTop: 6, display: 'block', textAlign: 'center' }}>
                        <i className="bi bi-info-circle me-1"></i>Transfer will move the guest without checking out. Old room will be sent for cleaning.
                      </small>
                    </>
                  )}
                </div>
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="sendInvoice" checked={sendInvoice} onChange={e => setSendInvoice(e.target.checked)} />
                  <label className="form-check-label" htmlFor="sendInvoice">Send invoice via email</label>
                </div>
              </div>

              {/* Add Extra Bed Charge */}
              {coBilling?.id && selectedRoom?.extra_bed_charge > 0 && (
                <div className="col-12">
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="bi bi-house-add" style={{ color: '#92400e', fontSize: 18 }}></i>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Extra Bed</div>
                        <div style={{ fontSize: 11, color: '#b45309' }}>{formatCurrency(parseFloat(selectedRoom.extra_bed_charge))}/night + GST</div>
                      </div>
                    </div>
                    <button type="button" className="btn btn-sm" style={{ background: '#f59e0b', color: '#fff', fontWeight: 700, borderRadius: 8, fontSize: 12 }}
                      onClick={async () => {
                        try {
                          const nights = checkOutData?.nights || 1;
                          const charge = parseFloat(selectedRoom.extra_bed_charge) || 0;
                          await post(`/billing/${coBilling.id}/items`, {
                            description: `Extra Bed (${nights} night${nights > 1 ? 's' : ''} x ${formatCurrency(charge)})`,
                            amount: charge * nights,
                            quantity: 1,
                            item_type: 'service',
                          });
                          toast.success(`Extra bed charge of ${formatCurrency(charge * nights)} added to bill`);
                          fetchData();
                          setShowCheckOutModal(false);
                        } catch (err) {
                          toast.error(err?.response?.data?.message || 'Failed to add extra bed charge');
                        }
                      }}>
                      <i className="bi bi-plus-lg me-1"></i>Add to Bill
                    </button>
                  </div>
                </div>
              )}

              {/* Unpaid balance warning */}
              {(!coBilling || (coBilling && coBilling.payment_status !== 'paid')) && (
                <div className="col-12">
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ color: '#dc2626', fontSize: 20 }}></i>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 14 }}>
                        {!coBilling ? 'No Billing Record' : `Unsettled Balance: ${formatCurrency(coBalance)}`}
                      </div>
                      <div style={{ fontSize: 12, color: '#991b1b' }}>
                        {!coBilling ? 'Billing must be created before checkout.' : 'Please settle the bill in the Billing section before checkout.'}
                      </div>
                    </div>
                    {coBilling?.id && (
                      <button type="button" className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', borderRadius: 8, fontWeight: 600, whiteSpace: 'nowrap' }}
                        onClick={() => { setShowCheckOutModal(false); navigate(`/billing?reservation=${checkOutData.id}`); }}>
                        <i className="bi bi-receipt me-1"></i>Go to Billing
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 10 }} onClick={() => setShowCheckOutModal(false)}>Cancel</button>
            {checkOutData?.group_id ? (
              <button type="button" className="btn btn-outline-warning" style={{ borderRadius: 10 }}
                onClick={() => window.open(`/billing/group/${checkOutData.group_id}/invoice`, '_blank')}>
                <i className="bi bi-people-fill me-1"></i> Group Invoice
              </button>
            ) : coBilling?.id && (
              <button type="button" className="btn btn-outline-primary" style={{ borderRadius: 10 }}
                onClick={() => window.open(`/billing/${coBilling.id}/invoice`, '_blank')}>
                <i className="bi bi-file-earmark-text me-1"></i> Invoice
              </button>
            )}
            <button type="button" className="btn" style={{ background: (!coBilling || coBilling.payment_status !== 'paid') ? '#9ca3af' : '#f97316', color: '#fff', borderRadius: 10, padding: '10px 24px', cursor: (!coBilling || coBilling.payment_status !== 'paid') ? 'not-allowed' : 'pointer' }} onClick={handleCheckOut} disabled={!coBilling || coBilling.payment_status !== 'paid'}>
              <i className="bi bi-check-lg me-1"></i> Complete Check-Out
            </button>
          </div>
        </div>
      </Modal>

      {/* ========== Cancel Reservation Modal ========== */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: '#fff', borderRadius: '16px 16px 0 0', padding: '20px 24px' }}>
            <h5 className="modal-title"><i className="bi bi-x-circle me-2"></i>Cancel Reservation</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowCancelModal(false)}></button>
          </div>
          <div className="modal-body" style={{ padding: 24 }}>
            {cancelData && (
              <>
                <div style={{ background: '#fef2f2', borderRadius: 10, padding: '12px 16px', marginBottom: 16, border: '1px solid #fca5a5' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>
                    Room {cancelData.room?.room_number || selectedRoom?.room_number || ''} — {cancelData.reservation_number || ''}
                  </div>
                  <div style={{ fontSize: 12, color: '#7f1d1d' }}>
                    {cancelData.guest?.first_name} {cancelData.guest?.last_name} &middot; {cancelData.booking_type === 'hourly' ? `${cancelData.expected_hours}h Short Stay` : `${cancelData.nights || 0} Night(s)`}
                  </div>
                </div>

                {/* Refund Rules */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                    <i className="bi bi-info-circle me-1"></i>Cancellation Policy
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    {(refundPreview?.rules || [
                      { minHours: 72, refundPercent: 100, label: '72+ hours before check-in — Full refund' },
                      { minHours: 48, refundPercent: 75, label: '48–72 hours — 75% refund' },
                      { minHours: 24, refundPercent: 50, label: '24–48 hours — 50% refund' },
                      { minHours: 0, refundPercent: 0, label: 'Less than 24 hours — No refund' },
                    ]).map((rule, i) => (
                      <div key={i} style={{
                        padding: '8px 14px', fontSize: 12, borderBottom: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: refundPreview && refundPreview.refund_percent === rule.refundPercent ? '#eff6ff' : 'transparent',
                        fontWeight: refundPreview && refundPreview.refund_percent === rule.refundPercent ? 700 : 400,
                      }}>
                        <span>{rule.label}</span>
                        {refundPreview && refundPreview.refund_percent === rule.refundPercent && (
                          <i className="bi bi-arrow-left" style={{ color: '#2563eb', fontSize: 14 }}></i>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refund Calculation */}
                {refundPreview && refundPreview.advance_paid > 0 ? (
                  <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px', border: '1px solid #bbf7d0', marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 8 }}>Refund Calculation</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                      <span>Advance Paid</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(refundPreview.advance_paid)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                      <span>Hours Until Check-in</span>
                      <span style={{ fontWeight: 600 }}>{refundPreview.hours_until_checkin}h</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, color: '#dc2626' }}>
                      <span>Cancellation Deduction ({100 - refundPreview.refund_percent}%)</span>
                      <span style={{ fontWeight: 600 }}>- {formatCurrency(refundPreview.deduction)}</span>
                    </div>
                    <hr style={{ margin: '8px 0', borderColor: '#86efac' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 15, fontWeight: 700, color: '#166534' }}>
                      <span>Refund Amount ({refundPreview.refund_percent}%)</span>
                      <span>{formatCurrency(refundPreview.refund_amount)}</span>
                    </div>
                  </div>
                ) : refundPreview ? (
                  <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1px solid #e2e8f0', marginBottom: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                    No advance payment — no refund applicable
                  </div>
                ) : null}

                {/* Refund Method */}
                {refundPreview && (refundPreview.refund_amount > 0 || useOverrideRefund) && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' }}>Refund Method</label>
                    <div className="d-flex gap-2">
                      <select className="form-select form-select-sm" value={refundMethod} onChange={e => setRefundMethod(e.target.value)} style={{ borderRadius: 8, maxWidth: 160 }}>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                      <input type="text" className="form-control form-control-sm" placeholder="Reference (optional)"
                        value={refundRef} onChange={e => setRefundRef(e.target.value)} style={{ borderRadius: 8 }} />
                    </div>
                  </div>
                )}

                {/* OM Override Refund */}
                {refundPreview?.can_override && refundPreview.advance_paid > 0 && (
                  <div style={{ background: '#fefce8', borderRadius: 10, padding: '14px 16px', border: '1px solid #fde68a', marginBottom: 16 }}>
                    <div className="form-check mb-2">
                      <input className="form-check-input" type="checkbox" id="omOverrideRefund"
                        checked={useOverrideRefund}
                        onChange={(e) => {
                          setUseOverrideRefund(e.target.checked);
                          if (e.target.checked) setOverrideRefundAmount(refundPreview.refund_amount?.toString() || '0');
                        }}
                      />
                      <label className="form-check-label" htmlFor="omOverrideRefund" style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                        <i className="bi bi-shield-lock me-1"></i>Override Refund Amount (OM)
                      </label>
                    </div>
                    {useOverrideRefund && (
                      <div className="input-group input-group-sm mt-2">
                        <span className="input-group-text">₹</span>
                        <input type="number" className="form-control" value={overrideRefundAmount}
                          onChange={e => setOverrideRefundAmount(e.target.value)}
                          min="0" max={refundPreview.advance_paid} step="0.01" style={{ borderRadius: '0 8px 8px 0' }}
                        />
                        <span className="input-group-text" style={{ borderRadius: '0 8px 8px 0' }}>/ {formatCurrency(refundPreview.advance_paid)}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 10 }} onClick={() => setShowCancelModal(false)}>Go Back</button>
            <button type="button" className="btn btn-danger" style={{ borderRadius: 10, padding: '10px 24px' }} disabled={cancelLoading}
              onClick={async () => {
                setCancelLoading(true);
                try {
                  const cancelBody = { refund_method: refundMethod, refund_reference: refundRef };
                  if (useOverrideRefund && refundPreview?.can_override) {
                    cancelBody.override_refund_amount = parseFloat(overrideRefundAmount) || 0;
                  }
                  const res = await put(`/reservations/${cancelData.id}/cancel`, cancelBody);
                  const d = res?.data;
                  if (d?.refund_amount > 0) {
                    toast.success(`Reservation cancelled. Refund of ${formatCurrency(d.refund_amount)}${d.refund_overridden ? ' (OM override)' : ` (${d.refund_percent}%)`} processed via ${refundMethod}.`);
                  } else if (d?.advance_paid_amount > 0) {
                    toast.success(`Reservation cancelled. No refund per cancellation policy.`);
                  } else {
                    toast.success('Reservation cancelled');
                  }
                  setShowCancelModal(false);
                  fetchData();
                } catch (err) {
                  toast.error(err?.response?.data?.message || 'Failed to cancel reservation');
                } finally {
                  setCancelLoading(false);
                }
              }}>
              {cancelLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</> : <><i className="bi bi-x-circle me-1"></i>Confirm Cancellation</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========== Banquet Booking Modal ========== */}
      <Modal show={showBanquetModal} onHide={() => setShowBanquetModal(false)} centered size="lg">
        <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
            <h5 className="modal-title"><i className="bi bi-building me-2"></i>Book Banquet Hall - Grand Hall</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowBanquetModal(false)}></button>
          </div>
          <div className="modal-body" style={{ padding: 24 }}>
            <div className="row g-3">
              {/* Hall Info */}
              <div className="col-md-6">
                <div style={{ background: '#fef9c3', padding: '12px 16px', borderRadius: 10, border: '1px solid #fde047' }}>
                  <small style={{ color: '#854d0e', display: 'block' }}>Hall</small>
                  <strong style={{ color: '#854d0e' }}>Grand Hall</strong>
                </div>
              </div>
              <div className="col-md-6">
                <div style={{ background: '#fef9c3', padding: '12px 16px', borderRadius: 10, border: '1px solid #fde047' }}>
                  <small style={{ color: '#854d0e', display: 'block' }}>Capacity</small>
                  <strong style={{ color: '#854d0e' }}>200 Guests</strong>
                </div>
              </div>

              <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

              {/* Customer Details */}
              <div className="col-md-6">
                <label className="fd-form-label">Customer / Company Name *</label>
                <input type="text" className="fd-form-control" value={banquetForm.customer_name} onChange={e => setBanquetForm({ ...banquetForm, customer_name: e.target.value })} placeholder="Enter name" required />
              </div>
              <div className="col-md-6">
                <label className="fd-form-label">Contact Number *</label>
                <input type="tel" className="fd-form-control" value={banquetForm.contact_number} onChange={e => setBanquetForm({ ...banquetForm, contact_number: e.target.value })} placeholder="Enter phone number" required />
              </div>

              <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

              {/* Event Details */}
              <div className="col-md-6">
                <label className="fd-form-label">Event Date *</label>
                <input type="date" className="fd-form-control" value={banquetForm.event_date} onChange={e => setBanquetForm({ ...banquetForm, event_date: e.target.value })} required />
              </div>
              <div className="col-md-6">
                <label className="fd-form-label">Session *</label>
                <select className="fd-form-control" value={banquetForm.session} onChange={e => setBanquetForm({ ...banquetForm, session: e.target.value })} required>
                  <option value="">Select session...</option>
                  <option value="morning">Morning (9 AM - 1 PM) - Rs 15,000</option>
                  <option value="afternoon">Afternoon (2 PM - 6 PM) - Rs 15,000</option>
                  <option value="evening">Evening (7 PM - 11 PM) - Rs 20,000</option>
                  <option value="fullday">Full Day (9 AM - 11 PM) - Rs 45,000</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="fd-form-label">Event Type *</label>
                <select className="fd-form-control" value={banquetForm.event_type} onChange={e => setBanquetForm({ ...banquetForm, event_type: e.target.value })} required>
                  <option value="">Select event type...</option>
                  <option value="wedding">Wedding / Reception</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="birthday">Birthday Party</option>
                  <option value="conference">Conference / Seminar</option>
                  <option value="engagement">Engagement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="fd-form-label">Expected Guests *</label>
                <input type="number" className="fd-form-control" value={banquetForm.expected_guests} onChange={e => setBanquetForm({ ...banquetForm, expected_guests: e.target.value })} min="1" max="200" placeholder="Enter number" required />
              </div>

              {/* Additional Options */}
              <div className="col-md-6">
                <label className="fd-form-label">Catering Required</label>
                <select className="fd-form-control" value={banquetForm.catering} onChange={e => setBanquetForm({ ...banquetForm, catering: e.target.value })}>
                  <option value="no">No</option>
                  <option value="yes">Yes (Charges Extra)</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="fd-form-label">Decoration Required</label>
                <select className="fd-form-control" value={banquetForm.decoration} onChange={e => setBanquetForm({ ...banquetForm, decoration: e.target.value })}>
                  <option value="no">No</option>
                  <option value="basic">Basic (Rs 5,000)</option>
                  <option value="premium">Premium (Rs 15,000)</option>
                </select>
              </div>

              <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

              {/* Adjust Hall Rate Section */}
              <div className="col-12">
                <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: 16 }}>
                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="adjustHallRateToggle" checked={adjustHallRate} onChange={e => { setAdjustHallRate(e.target.checked); if (!e.target.checked) setNewHallRate(''); }} />
                    <label className="form-check-label fw-semibold" htmlFor="adjustHallRateToggle" style={{ color: '#6b21a8' }}>
                      <i className="bi bi-pencil-square me-1"></i> Adjust Hall Rate
                    </label>
                  </div>

                  {adjustHallRate && (
                    <>
                      <div className="row g-2 mb-3">
                        <div className="col-md-4">
                          <label style={{ fontSize: 12, color: '#6b21a8', display: 'block', marginBottom: 4 }}>Standard Rate</label>
                          <div style={{ textDecoration: newHallRate ? 'line-through' : 'none', color: '#9ca3af', fontSize: 16, fontWeight: 600 }}>
                            {formatCurrency(hallBaseRate)}
                          </div>
                        </div>
                        <div className="col-md-4">
                          <label style={{ fontSize: 12, color: '#6b21a8', display: 'block', marginBottom: 4 }}>New Hall Rate</label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text" style={{ borderRadius: '8px 0 0 8px' }}>Rs</span>
                            <input type="number" className="form-control" value={newHallRate} onChange={e => setNewHallRate(e.target.value)} min="0" style={{ borderRadius: '0 8px 8px 0' }} />
                          </div>
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                          <button className="btn btn-sm w-100" style={{ background: '#7c3aed', color: '#fff', borderRadius: 8 }}>
                            Apply Rate
                          </button>
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-md-6">
                          <label style={{ fontSize: 12, color: '#6b21a8', display: 'block', marginBottom: 4 }}>Reason for Rate Change *</label>
                          <select className="form-select form-select-sm" value={hallRateReason} onChange={e => setHallRateReason(e.target.value)} style={{ borderRadius: 8 }}>
                            <option value="">Select reason...</option>
                            <option>Customer Negotiation</option>
                            <option>Corporate Rate</option>
                            <option>Repeat Customer</option>
                            <option>Off-Season Discount</option>
                            <option>Bulk Booking Discount</option>
                            <option>Referral Discount</option>
                            <option>Other</option>
                          </select>
                        </div>
                        {hallRateReason === 'Other' && (
                          <div className="col-md-6">
                            <label style={{ fontSize: 12, color: '#6b21a8', display: 'block', marginBottom: 4 }}>Specify Reason</label>
                            <input type="text" className="form-control form-control-sm" value={otherHallReason} onChange={e => setOtherHallReason(e.target.value)} placeholder="Enter reason" style={{ borderRadius: 8 }} />
                          </div>
                        )}
                      </div>

                      {newHallRate && (
                        <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                            <span style={{ color: '#6b21a8' }}>Original Hall Rate:</span>
                            <span style={{ textDecoration: 'line-through', color: '#9ca3af' }}>{formatCurrency(hallBaseRate)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                            <span style={{ color: '#6b21a8' }}>Adjusted Rate:</span>
                            <span style={{ color: '#6b21a8', fontWeight: 600 }}>{formatCurrency(Number(newHallRate))}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                            <span>Discount Given:</span>
                            <span>{formatCurrency(hallBaseRate - Number(newHallRate))}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="col-12"><hr style={{ margin: '8px 0' }} /></div>

              {/* Pricing Summary */}
              <div className="col-12">
                <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16 }}>
                  <h6 style={{ color: '#166534', marginBottom: 12, fontWeight: 600 }}><i className="bi bi-calculator me-2"></i>Booking Summary</h6>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                    <span style={{ color: '#166534' }}>Hall Charges:</span>
                    <span style={{ color: '#166534' }}>{formatCurrency(effectiveHallRate)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                    <span style={{ color: '#166534' }}>Decoration:</span>
                    <span style={{ color: '#166534' }}>{formatCurrency(decorationCost)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                    <span style={{ color: '#166534' }}>GST (18%):</span>
                    <span style={{ color: '#166534' }}>{formatCurrency(banquetGst)}</span>
                  </div>
                  <hr style={{ borderColor: '#bbf7d0', margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                    <span style={{ color: '#166534' }}>Total Amount:</span>
                    <span style={{ color: '#166534' }}>{formatCurrency(banquetTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Advance Payment */}
              <div className="col-12">
                <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #93c5fd', borderRadius: 12, padding: 16 }}>
                  <h6 style={{ color: '#1e40af', marginBottom: 12, fontWeight: 600 }}><i className="bi bi-cash-stack me-2"></i>Advance Payment</h6>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label style={{ fontSize: 12, color: '#1e40af', display: 'block', marginBottom: 4 }}>Advance Amount *</label>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text" style={{ borderRadius: '8px 0 0 8px' }}>Rs</span>
                        <input type="number" className="form-control" value={banquetForm.advance_amount} onChange={e => setBanquetForm({ ...banquetForm, advance_amount: e.target.value })} min="0" style={{ borderRadius: '0 8px 8px 0' }} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label style={{ fontSize: 12, color: '#1e40af', display: 'block', marginBottom: 4 }}>Payment Mode *</label>
                      <select className="form-select form-select-sm" value={banquetForm.payment_mode} onChange={e => setBanquetForm({ ...banquetForm, payment_mode: e.target.value })} style={{ borderRadius: 8 }}>
                        <option value="">Select...</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="netbanking">Net Banking</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label style={{ fontSize: 12, color: '#1e40af', display: 'block', marginBottom: 4 }}>Reference No.</label>
                      <input type="text" className="form-control form-control-sm" value={banquetForm.payment_ref} onChange={e => setBanquetForm({ ...banquetForm, payment_ref: e.target.value })} placeholder="Transaction ID" style={{ borderRadius: 8 }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div className="col-12">
                <label className="fd-form-label">Special Requests / Notes</label>
                <textarea className="fd-form-control" rows="2" value={banquetForm.special_requests} onChange={e => setBanquetForm({ ...banquetForm, special_requests: e.target.value })} placeholder="Any special arrangements..."></textarea>
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
            <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 10 }} onClick={() => setShowBanquetModal(false)}>Cancel</button>
            <button type="button" className="btn" style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#fff', borderRadius: 10, padding: '10px 24px' }}>
              <i className="bi bi-check-lg me-1"></i> Confirm Booking
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
