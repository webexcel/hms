import { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency } from '../../../utils/formatters';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

// GST-inclusive rate helper
export const gstInclusiveRate = (baseRate) => Math.round((parseFloat(baseRate) || 0) * 1.05);

export const STATUS_OPTIONS = [
  { label: 'All Reservations', value: '' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Pending', value: 'pending' },
  { label: 'Checked In', value: 'checked_in' },
  { label: 'Cancelled', value: 'cancelled' },
];

export const SOURCE_OPTIONS = [
  { label: 'Direct Booking', value: 'direct' },
  { label: 'Booking.com', value: 'booking_com' },
  { label: 'Expedia', value: 'expedia' },
  { label: 'Agoda', value: 'agoda' },
  { label: 'MakeMyTrip', value: 'makemytrip' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Walk-in', value: 'walk_in' },
];

export const PAYMENT_OPTIONS = [
  { label: 'Pay at Hotel', value: 'pay_at_hotel' },
  { label: 'Prepaid - Card', value: 'prepaid_card' },
  { label: 'Prepaid - UPI', value: 'prepaid_upi' },
  { label: 'Corporate Credit', value: 'corporate_credit' },
];

export const GUEST_OPTIONS = [
  { label: '1 Adult', value: '1_adult' },
  { label: '2 Adults', value: '2_adults' },
  { label: '2 Adults, 1 Child', value: '2_adults_1_child' },
  { label: '3 Adults', value: '3_adults' },
];

export const initialFormData = {
  guest_id: '',
  room_id: '',
  room_type: '',
  check_in: dayjs().format('YYYY-MM-DD'),
  check_out: dayjs().add(2, 'day').format('YYYY-MM-DD'),
  guests_count: '2_adults',
  adults: 2,
  children: 0,
  rate_per_night: '',
  source: 'direct',
  payment_mode: 'pay_at_hotel',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  special_requests: '',
  send_confirmation: true,
  collect_advance: true,
  advance_amount: '0',
  advance_method: 'cash',
};

export function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function getStatusBadgeClass(status) {
  const map = {
    pending: 'pending',
    confirmed: 'confirmed',
    checked_in: 'checked-in',
    checked_out: 'checked-out',
    cancelled: 'cancelled',
  };
  return map[status] || 'pending';
}

export default function useReservations() {
  const api = useApi();
  const { user } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(dayjs().startOf('month'));
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [calendarReservations, setCalendarReservations] = useState([]);
  const [timelineStart, setTimelineStart] = useState(dayjs().startOf('week').add(1, 'day')); // Monday
  const [timelineReservations, setTimelineReservations] = useState([]);

  // Group booking state
  const [isGroupBooking, setIsGroupBooking] = useState(false);
  const [selectedGroupRooms, setSelectedGroupRooms] = useState([]);
  const [availableRoomsForGroup, setAvailableRoomsForGroup] = useState([]);
  const [selectedSingleRoom, setSelectedSingleRoom] = useState(null);
  const [omDiscount, setOmDiscount] = useState(false);
  const [omDiscountType, setOmDiscountType] = useState('percentage');
  const [omDiscountValue, setOmDiscountValue] = useState('');
  const [omDiscountReason, setOmDiscountReason] = useState('');
  const [mealPlan, setMealPlan] = useState('both');
  const [mealRates, setMealRates] = useState({ breakfast_rate: 250, dinner_rate: 400 });
  const [bookingType, setBookingType] = useState('nightly');
  const [expectedHours, setExpectedHours] = useState(2);
  const [extraBeds, setExtraBeds] = useState(0);

  // Room transfer state
  const [showRoomTransferModal, setShowRoomTransferModal] = useState(false);
  const [roomTransferData, setRoomTransferData] = useState({ reservationId: null, reservation: null, new_room_id: '', reason: '', adjust_rate: false });
  const [roomTransferLoading, setRoomTransferLoading] = useState(false);
  const [availableTransferRooms, setAvailableTransferRooms] = useState([]);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelPreview, setCancelPreview] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [overrideRefund, setOverrideRefund] = useState('');
  const [useOverride, setUseOverride] = useState(false);

  const fetchCalendarReservations = async (month) => {
    try {
      const start = month.startOf('month').subtract(7, 'day').format('YYYY-MM-DD');
      const end = month.endOf('month').add(7, 'day').format('YYYY-MM-DD');
      const res = await api.get(`/reservations?limit=500&check_in_date=${start}&check_out_date=${end}`);
      const data = res.data?.data || res.data?.reservations || res.data || [];
      const normalized = (Array.isArray(data) ? data : []).map(r => ({
        ...r,
        check_in: r.check_in_date || r.check_in,
        check_out: r.check_out_date || r.check_out,
        guest_name: r.guest ? `${r.guest.first_name || ''} ${r.guest.last_name || ''}`.trim() : (r.guest_name || 'Guest'),
      }));
      setCalendarReservations(normalized);
    } catch (err) {
      console.error('Failed to fetch calendar reservations:', err);
    }
  };

  const fetchTimelineReservations = async (start) => {
    try {
      const from = start.format('YYYY-MM-DD');
      const to = start.add(14, 'day').format('YYYY-MM-DD');
      const res = await api.get(`/reservations?limit=500&check_in_date=${from}&check_out_date=${to}`);
      const data = res.data?.data || res.data?.reservations || res.data || [];
      const normalized = (Array.isArray(data) ? data : []).map(r => ({
        ...r,
        check_in: r.check_in_date || r.check_in,
        check_out: r.check_out_date || r.check_out,
        guest_name: r.guest ? `${r.guest.first_name || ''} ${r.guest.last_name || ''}`.trim() : (r.guest_name || 'Guest'),
      }));
      setTimelineReservations(normalized);
    } catch (err) {
      console.error('Failed to fetch timeline reservations:', err);
    }
  };

  const fetchReservations = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await api.get(`/reservations?${params.toString()}`);
      const data = res.data;
      setReservations(data.reservations || data.data || data || []);
      setTotalPages(data.totalPages || data.last_page || 1);
      setCurrentPage(data.currentPage || data.current_page || page);
    } catch (err) {
      toast.error('Failed to load reservations');
      console.error('ReservationsPage fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomsAndGuests = async () => {
    try {
      const [roomsRes, guestsRes] = await Promise.all([
        api.get('/rooms?limit=200'),
        api.get('/guests?limit=100'),
      ]);
      setRooms(roomsRes.data?.rooms || roomsRes.data?.data || roomsRes.data || []);
      setGuests(guestsRes.data?.guests || guestsRes.data?.data || guestsRes.data || []);
    } catch (err) {
      console.error('Failed to load rooms/guests:', err);
    }
  };

  const fetchAvailableRoomsForGroup = async (checkIn, checkOut) => {
    if (!checkIn) return;
    const co = checkOut || checkIn;
    try {
      const res = await api.get(`/reservations/availability?check_in=${checkIn}&check_out=${co}`, { silent: true });
      const data = res.data?.available || res.data?.data || res.data || [];
      setAvailableRoomsForGroup(Array.isArray(data) ? data : []);
    } catch { setAvailableRoomsForGroup([]); }
  };

  const toggleGroupRoom = (rm) => {
    setSelectedGroupRooms(prev => {
      const exists = prev.find(r => r.room_id === rm.id);
      if (exists) return prev.filter(r => r.room_id !== rm.id);
      return [...prev, { room_id: rm.id, room_number: rm.room_number, room_type: rm.room_type || rm.type, rate: parseFloat(rm.base_rate || rm.rate || 0), hourly_rate: parseFloat(rm.hourly_rate) || Math.round((parseFloat(rm.base_rate || rm.rate || 0)) * 0.35), hourly_rates: rm.hourly_rates }];
    });
  };

  // Resolve tiered hourly rate: returns total price for the given hours
  const getHourlyTotal = (hours, room) => {
    const rates = room?.hourly_rates;
    if (rates && typeof rates === 'object') {
      const tierRate = rates[String(hours)];
      if (tierRate !== undefined) return parseFloat(tierRate);
      const tiers = Object.keys(rates).filter(k => k !== 'default').map(Number).sort((a, b) => a - b);
      const defaultPerHour = parseFloat(rates.default) || parseFloat(room?.hourly_rate) || Math.round((parseFloat(room?.base_rate || room?.rate || room?.price || 0)) * 0.35);
      const bestTier = tiers.filter(t => t <= hours).pop();
      if (bestTier) return parseFloat(rates[String(bestTier)]) + (hours - bestTier) * defaultPerHour;
      return hours * defaultPerHour;
    }
    return hours * (parseFloat(room?.hourly_rate) || Math.round((parseFloat(room?.base_rate || room?.rate || room?.price || 0)) * 0.35));
  };

  const fetchMealRates = async () => {
    try {
      const res = await api.get('/settings', { silent: true });
      const settings = res.data?.data || res.data || [];
      const arr = Array.isArray(settings) ? settings : [];
      const br = arr.find(s => s.key === 'meal_breakfast_rate');
      const dr = arr.find(s => s.key === 'meal_dinner_rate');
      if (br) setMealRates(prev => ({ ...prev, breakfast_rate: parseFloat(br.value) || 250 }));
      if (dr) setMealRates(prev => ({ ...prev, dinner_rate: parseFloat(dr.value) || 400 }));
    } catch { /* use defaults */ }
  };

  useEffect(() => {
    fetchReservations();
    fetchRoomsAndGuests();
    fetchMealRates();
    fetchCalendarReservations(calendarMonth);
    fetchTimelineReservations(timelineStart);
  }, []);

  useEffect(() => {
    fetchReservations(1);
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchCalendarReservations(calendarMonth);
  }, [calendarMonth]);

  useEffect(() => {
    fetchTimelineReservations(timelineStart);
  }, [timelineStart]);

  // Stats
  const allReservations = Array.isArray(reservations) ? reservations : [];

  // Room types for the form
  const roomTypes = [];
  const seenTypes = new Set();
  rooms.forEach((r) => {
    const type = r.type || r.room_type || 'Standard';
    if (!seenTypes.has(type)) {
      seenTypes.add(type);
      const available = rooms.filter(rm => (rm.type || rm.room_type || 'Standard') === type && rm.status === 'available').length;
      const rate = r.base_rate || r.rate || r.rate_per_night || r.price || 0;
      roomTypes.push({
        name: type, desc: r.description || '', price: rate, available,
        hourly_rates: r.hourly_rates, hourly_rate: r.hourly_rate,
        single_rate: r.single_rate, single_misc: r.single_misc,
        double_rate: r.double_rate, double_misc: r.double_misc,
        triple_rate: r.triple_rate, triple_misc: r.triple_misc,
        extra_bed_charge: r.extra_bed_charge, max_extra_beds: r.max_extra_beds,
        max_occupancy: r.max_occupancy,
      });
    }
  });

  // Form handlers
  const handleOpenNewModal = (date) => {
    const checkIn = date ? dayjs(date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    const checkOut = dayjs(checkIn).add(2, 'day').format('YYYY-MM-DD');
    setFormData({ ...initialFormData, check_in: checkIn, check_out: checkOut });
    setEditingId(null);
    setSelectedRoomType('');
    setSelectedSingleRoom(null);
    setIsGroupBooking(false);
    setSelectedGroupRooms([]);
    setAvailableRoomsForGroup([]);
    setMealPlan('none');
    setOmDiscount(false);
    setOmDiscountType('percentage');
    setOmDiscountValue('');
    setOmDiscountReason('');
    setBookingType('nightly');
    setExpectedHours(2);
    setExtraBeds(0);
    fetchAvailableRoomsForGroup(checkIn, checkOut);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setFormData(initialFormData);
    setEditingId(null);
    setSelectedRoomType('');
    setSelectedSingleRoom(null);
    setIsGroupBooking(false);
    setSelectedGroupRooms([]);
    setAvailableRoomsForGroup([]);
    setMealPlan('none');
    setOmDiscount(false);
    setOmDiscountType('percentage');
    setOmDiscountValue('');
    setOmDiscountReason('');
    setBookingType('nightly');
    setExpectedHours(3);
  };

  // Get the correct rate from a room based on adults count
  const getRateForAdults = (room, adults) => {
    if (!room) return 0;
    const a = parseInt(adults) || 1;
    if (a === 1 && room.single_rate) return parseFloat(room.single_rate);
    if (a === 2 && room.double_rate) return parseFloat(room.double_rate);
    if (a >= 3 && room.triple_rate) return parseFloat(room.triple_rate);
    // Fallback: use whichever rate exists
    return parseFloat(room.double_rate || room.base_rate || room.single_rate || room.triple_rate || 0);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // When guests_count changes, update adults and rate
      if (field === 'guests_count') {
        const adultCount = parseInt(value) || 2;
        next.adults = adultCount;
        // Use individual room if selected, else use room type data
        const rateSource = selectedSingleRoom || roomTypes.find(r => r.name === prev.room_type);
        if (rateSource) {
          next.rate_per_night = getRateForAdults(rateSource, adultCount);
        }
      }
      if (field === 'adults') {
        const rateSource = selectedSingleRoom || roomTypes.find(r => r.name === prev.room_type);
        if (rateSource) {
          next.rate_per_night = getRateForAdults(rateSource, value);
        }
      }
      return next;
    });
  };

  const handleRoomTypeSelect = (type, price) => {
    setSelectedRoomType(type);
    setSelectedSingleRoom(null);
    // Find the room type data to get correct rate based on occupancy
    const rt = roomTypes.find(r => r.name === type);
    if (rt) {
      const hasDouble = rt.double_rate;
      const hasTriple = rt.triple_rate;
      const hasSingle = rt.single_rate;
      const defaultAdults = hasDouble ? 2 : hasTriple ? 3 : hasSingle ? 1 : 2;
      const rate = getRateForAdults(rt, defaultAdults);
      const guestLabel = defaultAdults === 1 ? '1_adult' : defaultAdults === 2 ? '2_adults' : '3_adults';
      setFormData((prev) => ({ ...prev, room_type: type, rate_per_night: rate || price, adults: defaultAdults, guests_count: guestLabel }));
    } else {
      setFormData((prev) => ({ ...prev, room_type: type, rate_per_night: price || prev.rate_per_night }));
    }
  };

  // Calculate nights/hours and total for booking summary
  const isHourlyBooking = bookingType === 'hourly';
  const nights = formData.check_in && formData.check_out && !isHourlyBooking
    ? dayjs(formData.check_out).diff(dayjs(formData.check_in), 'day')
    : 0;
  const baseRate = parseFloat(formData.rate_per_night) || 0;
  const rateInclGst = gstInclusiveRate(baseRate);
  const hourlyTotalCalc = selectedSingleRoom
    ? getHourlyTotal(expectedHours, selectedSingleRoom)
    : (baseRate ? Math.round(baseRate * 0.35) * expectedHours : 0);
  const grandTotalBeforeDiscount = isHourlyBooking
    ? gstInclusiveRate(hourlyTotalCalc)
    : nights * rateInclGst;
  const extraBedTotalCalc = (!isHourlyBooking && extraBeds > 0 && selectedSingleRoom?.extra_bed_charge)
    ? nights * extraBeds * gstInclusiveRate(parseFloat(selectedSingleRoom.extra_bed_charge))
    : 0;
  // Misc charges (no GST) based on adults and room config
  const miscCalcSource = selectedSingleRoom || roomTypes.find(r => r.name === formData.room_type);
  let miscPerNightCalc = 0;
  if (!isHourlyBooking && miscCalcSource) {
    const adl = parseInt(formData.adults) || parseInt(formData.guests_count) || 2;
    if (adl === 1) miscPerNightCalc = parseFloat(miscCalcSource.single_misc) || 0;
    else if (adl === 2) miscPerNightCalc = parseFloat(miscCalcSource.double_misc) || 0;
    else if (adl >= 3) miscPerNightCalc = parseFloat(miscCalcSource.triple_misc) || 0;
  }
  const totalMiscCalc = miscPerNightCalc * nights;
  const grandTotalWithExtras = grandTotalBeforeDiscount + extraBedTotalCalc + totalMiscCalc;
  // OM Discount calculation — capped to misc total
  let omDiscountAmount = 0;
  if (omDiscount && omDiscountValue && Number(omDiscountValue) > 0 && totalMiscCalc > 0) {
    if (omDiscountType === 'percentage') {
      omDiscountAmount = Math.round(totalMiscCalc * (Number(omDiscountValue) / 100) * 100) / 100;
    } else {
      omDiscountAmount = Math.round(Number(omDiscountValue) * 100) / 100;
    }
    if (omDiscountAmount > totalMiscCalc) omDiscountAmount = totalMiscCalc;
  }
  const grandTotal = grandTotalWithExtras - omDiscountAmount;

  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setFormLoading(true);

      if (isGroupBooking && selectedGroupRooms.length < 2) {
        toast.error('Please select at least 2 rooms for group booking');
        setFormLoading(false);
        return;
      }

      // Build discount note for special_requests
      let discountNote = '';
      if (omDiscount && omDiscountValue && Number(omDiscountValue) > 0) {
        discountNote = omDiscountType === 'percentage'
          ? `OM Discount: ${omDiscountValue}%`
          : `OM Discount: ₹${omDiscountValue}`;
        if (omDiscountReason) discountNote += ` (${omDiscountReason})`;
      }
      const specialReqs = [formData.special_requests, discountNote].filter(Boolean).join(' | ');

      // Compute effective rate after discount
      let effectiveRate = parseFloat(formData.rate_per_night) || 0;
      if (omDiscount && omDiscountValue && Number(omDiscountValue) > 0) {
        if (omDiscountType === 'percentage') {
          effectiveRate = effectiveRate * (1 - Number(omDiscountValue) / 100);
        } else {
          effectiveRate = Math.max(0, effectiveRate - (Number(omDiscountValue) / (nights || 1)));
        }
        effectiveRate = Math.round(effectiveRate * 100) / 100;
      }

      const isHourly = bookingType === 'hourly';
      const advanceAmount = formData.collect_advance && formData.advance_amount ? Number(formData.advance_amount) : 0;

      const baseSubmitData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        check_in_date: formData.check_in,
        check_out_date: isHourly ? formData.check_in : formData.check_out,
        adults: formData.adults || 2,
        children: formData.children || 0,
        source: formData.source,
        special_requests: [specialReqs, isHourly ? `Short Stay: ${expectedHours}h` : ''].filter(Boolean).join(' | '),
        meal_plan: isHourly ? 'none' : mealPlan,
        booking_type: bookingType,
        ...(isHourly ? { expected_hours: expectedHours } : {}),
        ...(extraBeds > 0 && !isHourly ? { extra_beds: extraBeds } : {}),
        ...(advanceAmount > 0 ? { advance_paid: advanceAmount, payment_mode: formData.advance_method || 'cash' } : {}),
      };

      if (editingId) {
        await api.put(`/reservations/${editingId}`, { ...baseSubmitData, rate_per_night: formData.rate_per_night });
        toast.success('Reservation updated successfully');
      } else if (isGroupBooking && selectedGroupRooms.length > 1) {
        const submitData = {
          ...baseSubmitData,
          rooms: selectedGroupRooms.map(r => {
            let rate = isHourly
              ? (parseFloat(r.hourly_rate) || Math.round((r.rate || 0) * 0.35))
              : r.rate;
            if (omDiscount && omDiscountValue && Number(omDiscountValue) > 0) {
              if (omDiscountType === 'percentage') {
                rate = rate * (1 - Number(omDiscountValue) / 100);
              } else {
                // Flat: split equally across all rooms
                rate = Math.max(0, rate - (Number(omDiscountValue) / selectedGroupRooms.length));
              }
            }
            return {
              room_id: r.room_id,
              rate_per_night: isHourly ? 0 : Math.round(rate * 100) / 100,
            };
          }),
        };
        const res = await api.post('/reservations', submitData);
        const groupId = res.data?.data?.group_id || res.data?.group_id;
        toast.success(`Group booking created (${selectedGroupRooms.length} rooms)${groupId ? ` — ${groupId}` : ''}`);
      } else {
        const submitData = {
          ...baseSubmitData,
          room_type: formData.room_type,
          rate_per_night: isHourly ? 0 : effectiveRate,
          ...(selectedSingleRoom ? { room_id: selectedSingleRoom.id } : {}),
        };
        const res = await api.post('/reservations', submitData);
        const created = res.data || {};
        const roomNum = selectedSingleRoom?.room_number || created.room?.room_number || created.Room?.room_number || '';
        toast.success(`Reservation created — Room ${roomNum} allocated`);
      }
      handleCloseModal();
      fetchReservations(currentPage);
      fetchCalendarReservations(calendarMonth);
      fetchTimelineReservations(timelineStart);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to save reservation';
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAction = async (reservationId, action, reservation) => {
    // Intercept cancel to show modal with refund preview
    if (action === 'cancel') {
      setCancelTarget(reservation || { id: reservationId });
      setCancelPreview(null);
      setOverrideRefund('');
      setUseOverride(false);
      setShowCancelModal(true);
      try {
        const { data } = await api.get(`/reservations/${reservationId}/refund-preview`);
        setCancelPreview(data);
        setOverrideRefund(data.refund_amount?.toString() || '0');
      } catch {
        setCancelPreview({ error: true });
      }
      return;
    }

    const actionMap = {
      check_in: { endpoint: `/reservations/${reservationId}/check-in`, label: 'Checked in' },
      check_out: { endpoint: `/reservations/${reservationId}/check-out`, label: 'Checked out' },
      confirm: { endpoint: `/reservations/${reservationId}/confirm`, label: 'Confirmed' },
    };

    const config = actionMap[action];
    if (!config) return;

    try {
      setActionLoading(reservationId);
      await api.put(config.endpoint);
      toast.success(`${config.label} successfully`);
      fetchReservations(currentPage);
      fetchCalendarReservations(calendarMonth);
      fetchTimelineReservations(timelineStart);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action.replace('_', ' ')}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const reservationId = cancelTarget.id;
    const body = {};
    if (useOverride && cancelPreview?.can_override) {
      body.override_refund_amount = parseFloat(overrideRefund) || 0;
    }
    try {
      setCancelLoading(true);
      const res = await api.put(`/reservations/${reservationId}/cancel`, body);
      const refund = res?.data?.refund_amount;
      if (refund > 0) {
        toast.success(`Reservation cancelled. Refund of ₹${refund}${res?.data?.refund_overridden ? ' (OM override)' : ''} to be processed.`);
      } else {
        toast.success('Reservation cancelled. No refund applicable.');
      }
      setShowCancelModal(false);
      setCancelTarget(null);
      fetchReservations(currentPage);
      fetchCalendarReservations(calendarMonth);
      fetchTimelineReservations(timelineStart);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleDayClick = (date) => {
    setSelectedDay(date);
    setShowDayDetailModal(true);
  };

  const handleCloseDayDetail = () => {
    setShowDayDetailModal(false);
    setSelectedDay(null);
  };

  // Room Transfer handlers
  const openRoomTransfer = (reservation) => {
    const currentRoomId = reservation.room_id || reservation.room?.id;
    const transferRooms = rooms.filter(r => r.id !== currentRoomId && ['available', 'reserved', 'cleaning'].includes(r.status));
    setAvailableTransferRooms(transferRooms);
    setRoomTransferData({ reservationId: reservation.id, reservation, new_room_id: '', reason: '', adjust_rate: false });
    setShowRoomTransferModal(true);
  };

  const handleRoomTransfer = async () => {
    if (!roomTransferData.new_room_id) {
      toast.error('Please select a room to transfer to');
      return;
    }
    try {
      setRoomTransferLoading(true);
      const res = await api.put(`/reservations/${roomTransferData.reservationId}/room-transfer`, {
        new_room_id: roomTransferData.new_room_id,
        reason: roomTransferData.reason,
        adjust_rate: roomTransferData.adjust_rate,
      });
      toast.success(res.data?.message || 'Room transferred successfully');
      setShowRoomTransferModal(false);
      fetchReservations(currentPage);
      fetchCalendarReservations(calendarMonth);
      fetchTimelineReservations(timelineStart);
      // Refresh rooms list to update statuses
      const roomRes = await api.get('/rooms?limit=200');
      setRooms(roomRes.data?.data || roomRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transfer room');
    } finally {
      setRoomTransferLoading(false);
    }
  };

  const handleFilterSelect = (value) => {
    setStatusFilter(value);
    setShowFilterDropdown(false);
  };

  return {
    // Core data
    reservations, rooms, guests, loading, user,
    allReservations, roomTypes,

    // Tab state
    activeTab, setActiveTab,

    // Search & filter
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    showFilterDropdown, setShowFilterDropdown,
    handleFilterSelect,

    // Pagination
    currentPage, totalPages,
    fetchReservations,

    // Calendar
    calendarMonth, setCalendarMonth,
    calendarReservations,
    showDayDetailModal, selectedDay,
    handleDayClick, handleCloseDayDetail,

    // Timeline
    timelineStart, setTimelineStart,
    timelineReservations,

    // Form modal
    showFormModal, formData, formLoading, editingId,
    handleOpenNewModal, handleCloseModal,
    handleFormChange, handleRoomTypeSelect, handleFormSubmit,

    // Room selection
    selectedRoomType, selectedSingleRoom, setSelectedSingleRoom,
    isGroupBooking, setIsGroupBooking,
    selectedGroupRooms, setSelectedGroupRooms,
    availableRoomsForGroup, setAvailableRoomsForGroup,
    toggleGroupRoom, fetchAvailableRoomsForGroup,

    // Booking options
    bookingType, setBookingType,
    expectedHours, setExpectedHours,
    extraBeds, setExtraBeds,
    mealPlan, setMealPlan, mealRates,
    omDiscount, setOmDiscount,
    omDiscountType, setOmDiscountType,
    omDiscountValue, setOmDiscountValue,
    omDiscountReason, setOmDiscountReason,

    // Computed totals
    isHourlyBooking, nights, baseRate, rateInclGst,
    hourlyTotalCalc, grandTotalBeforeDiscount,
    extraBedTotalCalc, totalMiscCalc, grandTotalWithExtras,
    omDiscountAmount, grandTotal,
    getHourlyTotal,

    // Actions
    actionLoading, handleAction,

    // Room transfer
    showRoomTransferModal, setShowRoomTransferModal,
    roomTransferData, setRoomTransferData,
    roomTransferLoading, availableTransferRooms,
    openRoomTransfer, handleRoomTransfer,

    // Cancel
    showCancelModal, setShowCancelModal,
    cancelTarget, cancelPreview,
    cancelLoading, overrideRefund, setOverrideRefund,
    useOverride, setUseOverride,
    handleConfirmCancel,

    // Form data setter (for room picker)
    setFormData,
  };
}
