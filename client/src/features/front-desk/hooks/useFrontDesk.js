import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

// GST-inclusive rate helper: base rate → display rate (incl. 12% GST)
export const gstInclusiveRate = (baseRate) => Math.round((parseFloat(baseRate) || 0) * 1.05);

export const STATUS_FILTERS = ['all', 'available', 'occupied', 'reserved', 'maintenance', 'cleaning'];
export const LEGEND_ITEMS = [
  { cls: 'available', label: 'Available' },
  { cls: 'occupied', label: 'Occupied' },
  { cls: 'reserved', label: 'Reserved' },
  { cls: 'maintenance', label: 'Maintenance' },
  { cls: 'cleaning', label: 'Dirty / Cleaning' },
];

export default function useFrontDesk() {
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
  const [mealPlan, setMealPlan] = useState('both'); // none, breakfast, dinner, both
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
      rate_per_night: rm?.single_rate || rm?.base_rate || selectedRoom?.single_rate || selectedRoom?.base_rate || '',
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
    setMealPlan('both');
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
    const specialReqs = [bookingForm.special_requests, isHourly ? `Short Stay: ${expectedHours}h` : ''].filter(Boolean).join(' | ');

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
      ...(extraBeds > 0 && !isHourly ? { extra_beds: extraBeds, extra_bed_charge: parseFloat(selectedRoom?.extra_bed_charge) || 0 } : {}),
      // OM Discount fields (applied to billing at check-in, not baked into rate)
      ...(!isHourly && bookingDiscount && bookingDiscountValue && Number(bookingDiscountValue) > 0 ? {
        discount_type: bookingDiscountType,
        discount_value: Number(bookingDiscountValue),
        discount_reason: bookingDiscountReason || '',
      } : {}),
    };

    if (isGroupBooking && selectedGroupRooms.length > 1) {
      return {
        ...base,
        rooms: selectedGroupRooms.map(r => {
          const rate = isHourly
            ? getHourlyRate(r)
            : (parseFloat(r.base_rate) || 0);
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
      rate_per_night: Math.round(baseRate * 100) / 100,
    };
  };

  const handleCreateBooking = async (autoCheckIn = false) => {
    const isHourly = bookingType === 'hourly';
    if (!bookingForm.first_name || !bookingForm.phone || !bookingForm.check_in_date) {
      toast.error('Please fill in guest name, phone, and date');
      return;
    }
    if (!/^\d{10}$/.test(bookingForm.phone)) {
      toast.error('Phone must be exactly 10 digits');
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
      });
      toast.success('All group rooms checked out!');
      setShowCheckOutModal(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Group check-out failed');
    }
  };

  // Convert hourly booking to nightly stay
  const handleConvertToNightly = async (checkOutDate, ratePerNight) => {
    if (!checkOutData) return;
    try {
      await put(`/reservations/${checkOutData.id}/convert-to-nightly`, {
        check_out_date: checkOutDate,
        rate_per_night: ratePerNight,
      });
      toast.success('Converted to nightly stay!');
      setShowCheckOutModal(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to convert booking');
    }
  };

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
  const roomGst = coBilling ? (parseFloat(coBilling.cgst_amount) || 0) + (parseFloat(coBilling.sgst_amount) || 0) + (parseFloat(coBilling.igst_amount) || 0) : roomCharges * 0.05;
  const coGst = coBilling ? roomGst : coSubtotal * 0.05;
  const coGrandTotal = coBilling ? parseFloat(coBilling.grand_total) || (coSubtotal + coGst) : coSubtotal + coGst;
  const coAdvance = coBilling ? parseFloat(coBilling.paid_amount) || 0 : (parseFloat(checkOutData?.advance_paid) || 0);
  const coBalance = coGrandTotal - coAdvance;

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

  return {
    // Navigation
    navigate,
    // Auth
    user,
    // Loading
    loading,
    // State values and setters
    rooms, setRooms,
    dashboard, setDashboard,
    arrivals, setArrivals,
    departures, setDepartures,
    activeReservations, setActiveReservations,
    activeFilter, setActiveFilter,
    selectedRoom, setSelectedRoom,
    showRoomModal, setShowRoomModal,
    showCheckInModal, setShowCheckInModal,
    showCheckOutModal, setShowCheckOutModal,
    showBanquetModal, setShowBanquetModal,
    panelTab, setPanelTab,
    checkInData, setCheckInData,
    checkOutData, setCheckOutData,
    // Cancel modal state
    showCancelModal, setShowCancelModal,
    cancelData, setCancelData,
    refundPreview, setRefundPreview,
    refundMethod, setRefundMethod,
    refundRef, setRefundRef,
    cancelLoading, setCancelLoading,
    useOverrideRefund, setUseOverrideRefund,
    overrideRefundAmount, setOverrideRefundAmount,
    // Check-in form state
    idType, setIdType,
    idNumber, setIdNumber,
    depositAmount, setDepositAmount,
    paymentMode, setPaymentMode,
    paymentRef, setPaymentRef,
    // Check-in: Adjust Room Rate
    adjustRate, setAdjustRate,
    newRate, setNewRate,
    rateReason, setRateReason,
    otherRateReason, setOtherRateReason,
    appliedRate, setAppliedRate,
    showRestaurantCharges, setShowRestaurantCharges,
    sendInvoice, setSendInvoice,
    // Check-out: Room Transfer
    showTransferSection, setShowTransferSection,
    transferRoomId, setTransferRoomId,
    transferReason, setTransferReason,
    transferAdjustRate, setTransferAdjustRate,
    transferLoading, setTransferLoading,
    // Banquet booking form state
    banquetForm, setBanquetForm,
    adjustHallRate, setAdjustHallRate,
    newHallRate, setNewHallRate,
    hallRateReason, setHallRateReason,
    otherHallReason, setOtherHallReason,
    // Walk-in booking form state
    showBookingModal, setShowBookingModal,
    bookingType, setBookingType,
    expectedHours, setExpectedHours,
    extraBeds, setExtraBeds,
    isGroupBooking, setIsGroupBooking,
    selectedGroupRooms, setSelectedGroupRooms,
    bookingForm, setBookingForm,
    bookingSubmitting, setBookingSubmitting,
    bookingDiscount, setBookingDiscount,
    bookingDiscountType, setBookingDiscountType,
    bookingDiscountValue, setBookingDiscountValue,
    bookingDiscountReason, setBookingDiscountReason,
    // Meal plan state
    mealPlan, setMealPlan,
    mealRates, setMealRates,
    // Computed values
    filteredRooms, roomsByFloor, sortedFloors, occupancyRate,
    bs,
    guest, room, originalRate, effectiveRate, totalNights, totalAmountBase, totalAmount, advancePaid, balanceDue,
    coGuest, coRoom, coBilling, coNights, coRate, roomCharges, restaurantCharges, restaurantItems,
    coSubtotal, restaurantGst, roomGst, coGst, coGrandTotal, coAdvance, coBalance,
    roomReservation, rmGuest, rmBalance,
    sessionRates, decorationRates, hallBaseRate, effectiveHallRate, decorationCost, banquetGst, banquetTotal,
    availableRoomsForGroup, availableTransferRooms, selectedTransferRoom,
    // Handler functions
    fetchData, handleRoomClick, handleCreateBooking, handleCheckIn, handleCheckOut,
    handleApplyRate, handleRoomTransfer, handleGroupCheckIn, handleGroupCheckOut, handleConvertToNightly,
    resetBookingForm, resetCheckInForm, resetCheckOutForm,
    toggleGroupRoom, createReservationData,
    // Utility functions
    gstInclusiveRate, getMealSurcharge, getHourlyTotal, getHourlyRate,
    // API helpers (for components that need direct API access)
    get, put, post,
  };
}
