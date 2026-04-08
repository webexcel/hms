import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { roomTypeData, roomTypeOrder } from '../data/roomTypes';
import { checkAvailability, createBooking } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const STEPS = [
  { num: 1, label: 'Dates & Room' },
  { num: 2, label: 'Select Room' },
  { num: 3, label: 'Guest Details' },
  { num: 4, label: 'Confirm' },
];

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 state
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || dayjs().add(2, 'day').format('YYYY-MM-DD'));
  const [roomTypeFilter, setRoomTypeFilter] = useState(searchParams.get('room_type') || '');
  const [mealPlan, setMealPlan] = useState('none');

  // Step 2 state
  const [availability, setAvailability] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  // Step 3 state
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Step 4 state
  const [guestData, setGuestData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-search if URL has params
  useEffect(() => {
    if (searchParams.get('check_in') && searchParams.get('check_out')) {
      handleCheckAvailability();
    }
  }, []); // eslint-disable-line

  const nights = dayjs(checkOut).diff(dayjs(checkIn), 'day');

  const handleCheckAvailability = async () => {
    if (!checkIn || !checkOut || nights <= 0) {
      toast.error('Please select valid dates');
      return;
    }
    setLoading(true);
    try {
      const res = await checkAvailability(checkIn, checkOut, roomTypeFilter || undefined);
      setAvailability(res.data);
      if (roomTypeFilter) {
        const match = res.data.room_types.find(r => r.type === roomTypeFilter && r.available > 0);
        if (match) setSelectedType(match);
      }
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (roomType) => {
    setSelectedType(roomType);
    setStep(3);
  };

  const onGuestSubmit = (data) => {
    setGuestData(data);
    setStep(4);
  };

  const handleConfirmBooking = async () => {
    setSubmitting(true);
    try {
      const res = await createBooking({
        first_name: guestData.first_name,
        last_name: guestData.last_name,
        email: guestData.email,
        phone: guestData.phone,
        room_type: selectedType.type,
        check_in: checkIn,
        check_out: checkOut,
        adults: parseInt(guestData.adults) || 1,
        children: parseInt(guestData.children) || 0,
        meal_plan: mealPlan,
        special_requests: guestData.special_requests || '',
      });
      navigate(`/booking/confirmation/${res.data.booking_reference}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-page">
      <div className="container-site">
        <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-heading)', marginBottom: 8 }}>Book Your Stay</h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-light)', marginBottom: 32 }}>
          Complete the steps below to reserve your room
        </p>

        {/* Steps */}
        <div className="booking-steps">
          {STEPS.map(s => (
            <div key={s.num} className={`booking-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>
              <span className="step-num">
                {step > s.num ? <i className="bi bi-check"></i> : s.num}
              </span>
              {s.label}
            </div>
          ))}
        </div>

        <div className="row g-4">
          <div className={step === 4 ? 'col-lg-8' : 'col-lg-8 mx-auto'}>

            {/* Step 1: Dates */}
            {step === 1 && (
              <div className="booking-card">
                <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Select Dates & Room Type</h4>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Check In</label>
                    <input type="date" className="form-control" value={checkIn}
                      min={dayjs().format('YYYY-MM-DD')}
                      onChange={e => setCheckIn(e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Check Out</label>
                    <input type="date" className="form-control" value={checkOut}
                      min={checkIn || dayjs().format('YYYY-MM-DD')}
                      onChange={e => setCheckOut(e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Room Type</label>
                    <select className="form-select" value={roomTypeFilter} onChange={e => setRoomTypeFilter(e.target.value)}>
                      <option value="">All Types</option>
                      {roomTypeOrder.map(t => (
                        <option key={t} value={t}>{roomTypeData[t].name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Complimentary Meal Plan</label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      { value: 'none', label: 'No Meals', icon: 'bi-x-circle' },
                      { value: 'breakfast', label: 'Breakfast', icon: 'bi-sunrise' },
                      { value: 'dinner', label: 'Dinner', icon: 'bi-moon' },
                      { value: 'both', label: 'Breakfast & Dinner', icon: 'bi-star' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMealPlan(opt.value)}
                        style={{
                          padding: '10px 20px',
                          borderRadius: 'var(--radius-sm)',
                          border: '2px solid',
                          borderColor: mealPlan === opt.value ? 'var(--color-primary)' : 'var(--color-border)',
                          background: mealPlan === opt.value ? '#eff6ff' : '#fff',
                          color: mealPlan === opt.value ? 'var(--color-primary)' : 'var(--color-text)',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <i className={`bi ${opt.icon}`}></i> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {nights > 0 && (
                  <p style={{ color: 'var(--color-text-light)', marginTop: 12, fontSize: '0.9rem' }}>
                    <i className="bi bi-moon me-1"></i> {nights} night{nights > 1 ? 's' : ''}
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <i className="bi bi-calendar me-1"></i> {dayjs(checkIn).format('DD MMM')} - {dayjs(checkOut).format('DD MMM YYYY')}
                  </p>
                )}
                <button className="btn-primary-custom mt-4" onClick={handleCheckAvailability} disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Checking...</> : <>Check Availability <i className="bi bi-search ms-1"></i></>}
                </button>
              </div>
            )}

            {/* Step 2: Room Selection */}
            {step === 2 && availability && (
              <div className="booking-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Available Rooms</h4>
                  <button className="btn-outline-custom" style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                    onClick={() => setStep(1)}>
                    <i className="bi bi-arrow-left me-1"></i> Change Dates
                  </button>
                </div>
                <p style={{ color: 'var(--color-text-light)', marginBottom: 24, fontSize: '0.9rem' }}>
                  {dayjs(checkIn).format('DD MMM')} - {dayjs(checkOut).format('DD MMM YYYY')} ({nights} night{nights > 1 ? 's' : ''})
                </p>

                {availability.room_types.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-light)' }}>
                    <i className="bi bi-emoji-frown" style={{ fontSize: '2rem', display: 'block', marginBottom: 12 }}></i>
                    No rooms available for the selected dates. Please try different dates.
                  </div>
                ) : (
                  <div className="row g-3">
                    {availability.room_types.map(rt => {
                      const roomData = roomTypeData[rt.type];
                      return (
                        <div key={rt.type} className="col-md-6">
                          <div
                            className={`avail-card ${selectedType?.type === rt.type ? 'selected' : ''} ${rt.available === 0 ? 'opacity-50' : ''}`}
                            onClick={() => rt.available > 0 && handleSelectRoom(rt)}
                            style={{ cursor: rt.available > 0 ? 'pointer' : 'not-allowed' }}
                          >
                            {roomData && (
                              <img src={roomData.photos[0]} alt={rt.name}
                                style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
                            )}
                            <div className="avail-type">{rt.name}</div>
                            <div className="avail-meta">
                              Up to {rt.max_occupancy} guests
                              {roomData && <> &middot; {roomData.size}</>}
                            </div>
                            <div className="avail-price">
                              {formatCurrency(rt.min_rate)} <small>/ night</small>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: 4 }}>
                              Total: <strong>{formatCurrency(rt.total_for_stay)}</strong> for {nights} night{nights > 1 ? 's' : ''}
                            </div>
                            <div className={`avail-rooms ${rt.available <= 3 ? 'low' : ''}`}>
                              {rt.available > 0 ? `${rt.available} room${rt.available > 1 ? 's' : ''} available` : 'Sold out'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Guest Details */}
            {step === 3 && (
              <div className="booking-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Guest Details</h4>
                  <button className="btn-outline-custom" style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                    onClick={() => setStep(2)}>
                    <i className="bi bi-arrow-left me-1"></i> Change Room
                  </button>
                </div>
                <form onSubmit={handleSubmit(onGuestSubmit)}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>First Name *</label>
                      <input className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                        {...register('first_name', { required: 'First name is required' })} />
                      {errors.first_name && <div className="invalid-feedback">{errors.first_name.message}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Last Name</label>
                      <input className="form-control" {...register('last_name')} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Email *</label>
                      <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        {...register('email', { required: 'Email is required' })} />
                      {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Phone *</label>
                      <input type="tel" className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                        {...register('phone', { required: 'Phone is required', minLength: { value: 10, message: 'Enter a valid phone number' } })} />
                      {errors.phone && <div className="invalid-feedback">{errors.phone.message}</div>}
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Adults</label>
                      <select className="form-select" {...register('adults')}>
                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Children</label>
                      <select className="form-select" {...register('children')}>
                        {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Special Requests</label>
                      <input className="form-control" placeholder="e.g., Early check-in, extra pillows"
                        {...register('special_requests')} />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary-custom mt-4">
                    Continue to Review <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </form>
              </div>
            )}

            {/* Step 4: Review & Confirm */}
            {step === 4 && selectedType && guestData && (
              <div className="booking-card">
                <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>Review Your Booking</h4>

                <div className="row g-4">
                  <div className="col-md-6">
                    <h6 style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Stay Details</h6>
                    <div style={{ fontSize: '0.9rem', lineHeight: 2 }}>
                      <div><strong>Room:</strong> {selectedType.name}</div>
                      <div><strong>Check-in:</strong> {dayjs(checkIn).format('DD MMM YYYY')} (12:00 PM)</div>
                      <div><strong>Check-out:</strong> {dayjs(checkOut).format('DD MMM YYYY')} (12:00 PM)</div>
                      <div><strong>Duration:</strong> {nights} night{nights > 1 ? 's' : ''}</div>
                      <div><strong>Meal Plan:</strong> {mealPlan === 'none' ? 'No Meals' : mealPlan === 'both' ? 'Breakfast & Dinner' : mealPlan.charAt(0).toUpperCase() + mealPlan.slice(1)}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Guest Information</h6>
                    <div style={{ fontSize: '0.9rem', lineHeight: 2 }}>
                      <div><strong>Name:</strong> {guestData.first_name} {guestData.last_name}</div>
                      <div><strong>Email:</strong> {guestData.email}</div>
                      <div><strong>Phone:</strong> {guestData.phone}</div>
                      <div><strong>Guests:</strong> {guestData.adults} adult{guestData.adults > 1 ? 's' : ''}{guestData.children > 0 ? `, ${guestData.children} child${guestData.children > 1 ? 'ren' : ''}` : ''}</div>
                    </div>
                  </div>
                </div>

                {guestData.special_requests && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--color-bg-soft)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                    <strong>Special Requests:</strong> {guestData.special_requests}
                  </div>
                )}

                <div style={{ marginTop: 24, padding: 16, background: '#fffbeb', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: '#92400e' }}>
                  <i className="bi bi-info-circle me-2"></i>
                  Your booking will be confirmed by our team. No payment is required at this time — pay at the hotel during check-in.
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button className="btn-outline-custom" onClick={() => setStep(3)}>
                    <i className="bi bi-arrow-left me-1"></i> Edit Details
                  </button>
                  <button className="btn-primary-custom" onClick={handleConfirmBooking} disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Booking...</> : <>Confirm Booking <i className="bi bi-check-lg ms-1"></i></>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary Sidebar (steps 2-4) */}
          {step >= 2 && selectedType && (
            <div className="col-lg-4">
              <div className="booking-summary">
                <h4>Booking Summary</h4>
                {roomTypeData[selectedType.type] && (
                  <img src={roomTypeData[selectedType.type].photos[0]} alt={selectedType.name}
                    style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
                )}
                <div className="summary-row"><span>{selectedType.name}</span></div>
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-light)' }}>
                    {dayjs(checkIn).format('DD MMM')} - {dayjs(checkOut).format('DD MMM')}
                  </span>
                  <span>{nights} night{nights > 1 ? 's' : ''}</span>
                </div>
                <div className="summary-row">
                  <span style={{ color: 'var(--color-text-light)' }}>Rate per night</span>
                  <span>{formatCurrency(selectedType.min_rate)}</span>
                </div>
                {mealPlan !== 'none' && (
                  <div className="summary-row">
                    <span style={{ color: 'var(--color-text-light)' }}>Meal Plan</span>
                    <span>{mealPlan === 'both' ? 'Breakfast & Dinner' : mealPlan.charAt(0).toUpperCase() + mealPlan.slice(1)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatCurrency(selectedType.total_for_stay)}</span>
                </div>
                <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  * Taxes will be calculated at check-in
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
