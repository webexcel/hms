import { useState, useEffect, useRef } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import dayjs from 'dayjs';
import { formatDate, formatCurrency, capitalize } from '../../../utils/formatters';
import {
  gstInclusiveRate, SOURCE_OPTIONS, PAYMENT_OPTIONS, GUEST_OPTIONS,
} from '../hooks/useReservations';

function parseToDate(val) {
  if (!val) return new Date();
  if (val instanceof Date && !isNaN(val)) return val;
  const d = typeof val === 'string' ? new Date(val + (val.length === 10 ? 'T00:00:00' : '')) : new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

function DateRangePickerInput({ checkIn, checkOut, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const startDate = parseToDate(checkIn);
  const endDate = parseToDate(checkOut);

  const [range, setRange] = useState([{ startDate, endDate, key: 'selection' }]);

  useEffect(() => {
    setRange([{ startDate: parseToDate(checkIn), endDate: parseToDate(checkOut), key: 'selection' }]);
  }, [checkIn, checkOut]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ciDisplay = dayjs(startDate).isValid() ? dayjs(startDate).format('DD MMM YYYY') : '—';
  const coDisplay = dayjs(endDate).isValid() ? dayjs(endDate).format('DD MMM YYYY') : '—';
  const nights = dayjs(endDate).isValid() && dayjs(startDate).isValid() ? dayjs(endDate).diff(dayjs(startDate), 'day') : 0;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className="form-control form-control-custom d-flex align-items-center justify-content-between"
        style={{ cursor: 'pointer', minHeight: 38 }}
        onClick={() => setOpen(!open)}
      >
        <span>
          <i className="bi bi-box-arrow-in-right text-success me-1"></i>
          {ciDisplay}
          <span className="mx-2 text-muted">—</span>
          <i className="bi bi-box-arrow-right text-danger me-1"></i>
          {coDisplay}
          {nights > 0 && <span className="badge bg-primary-subtle text-primary ms-2">{nights} night{nights > 1 ? 's' : ''}</span>}
        </span>
        <i className="bi bi-calendar-range text-muted"></i>
      </div>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 1050, top: '100%', left: 0, marginTop: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', borderRadius: 12, overflow: 'hidden',
          border: '1px solid #e2e8f0', background: '#fff',
        }}>
          <DateRange
            ranges={range}
            onChange={(item) => {
              const sel = item.selection;
              setRange([sel]);
              const s = dayjs(sel.startDate);
              const e = dayjs(sel.endDate);
              if (s.isValid() && e.isValid()) {
                const startStr = s.format('YYYY-MM-DD');
                const endStr = e.format('YYYY-MM-DD');
                onChange(startStr, endStr);
              }
            }}
            moveRangeOnFirstSelection={false}
            months={2}
            direction="horizontal"
            minDate={new Date()}
            rangeColors={['#4f46e5']}
            showDateDisplay={false}
          />
          <div className="d-flex justify-content-end p-2 border-top">
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReservationFormModal({
  showFormModal, formData, formLoading, editingId,
  handleCloseModal, handleFormChange, handleRoomTypeSelect, handleFormSubmit,
  selectedRoomType, selectedSingleRoom, setSelectedSingleRoom,
  isGroupBooking, setIsGroupBooking,
  selectedGroupRooms, setSelectedGroupRooms,
  availableRoomsForGroup, toggleGroupRoom, fetchAvailableRoomsForGroup,
  bookingType, setBookingType, expectedHours, setExpectedHours,
  extraBeds, setExtraBeds,
  mealPlan, setMealPlan, mealRates,
  omDiscount, setOmDiscount, omDiscountType, setOmDiscountType,
  omDiscountValue, setOmDiscountValue, omDiscountReason, setOmDiscountReason,
  isHourlyBooking, nights, baseRate, rateInclGst,
  hourlyTotalCalc, grandTotalBeforeDiscount, extraBedTotalCalc, totalMiscCalc,
  grandTotalWithExtras, omDiscountAmount, grandTotal,
  getHourlyTotal, roomTypes, rooms,
  setFormData,
}) {
  if (!showFormModal) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={handleCloseModal}>
      <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
      <div className="modal-dialog modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header modal-header-custom">
            <h5 className="modal-title d-flex align-items-center gap-2" style={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              <i className={`bi ${isGroupBooking ? 'bi-people-fill' : 'bi-calendar-plus'} me-1`}></i>
              {editingId ? 'Edit Reservation' : isGroupBooking ? 'Group Booking' : 'New Reservation'}
              {isGroupBooking && selectedGroupRooms.length > 0 && (
                <span className="badge bg-warning text-dark ms-2">{selectedGroupRooms.length} Rooms</span>
              )}
            </h5>
            <div className="d-flex align-items-center" style={{ flex: '0 0 auto', gap: 12 }}>
              {!editingId && (
                <label className="d-flex align-items-center" style={{ gap: 8, cursor: 'pointer', margin: 0 }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: isGroupBooking ? '#f59e0b' : '#94a3b8', whiteSpace: 'nowrap' }}>Group Bookings</span>
                  <div className="form-check form-switch" style={{ margin: 0, padding: 0, minHeight: 'auto' }}>
                    <input className="form-check-input" type="checkbox" role="switch" checked={isGroupBooking}
                      onChange={(e) => {
                        setIsGroupBooking(e.target.checked);
                        setSelectedGroupRooms([]);
                        if (formData.check_in && formData.check_out) {
                          fetchAvailableRoomsForGroup(formData.check_in, formData.check_out);
                        }
                      }} style={{ width: 36, height: 18, margin: 0, float: 'none', cursor: 'pointer' }} />
                  </div>
                </label>
              )}
              <button type="button" className="btn-close" onClick={handleCloseModal}></button>
            </div>
          </div>
          <div className="modal-body modal-body-custom">
            <div className="row g-4">
              {/* Left Column - Form */}
              <div className="col-lg-8">
                {/* Dates Section */}
                <div className="form-section border rounded mb-3">
                  <div className="form-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><i className="bi bi-calendar-range"></i> Stay Details</span>
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2 }}>
                      <button type="button" onClick={() => { setBookingType('nightly'); }}
                        style={{ padding: '4px 12px', borderRadius: 5, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          background: bookingType === 'nightly' ? '#2dd4bf' : 'transparent',
                          color: bookingType === 'nightly' ? '#0f172a' : '#64748b' }}>
                        <i className="bi bi-moon me-1"></i>Nightly
                      </button>
                      <button type="button" onClick={() => {
                        setBookingType('hourly');
                        setMealPlan('none');
                        const today = dayjs().format('YYYY-MM-DD');
                        handleFormChange('check_in', today);
                        handleFormChange('check_out', today);
                        fetchAvailableRoomsForGroup(today, today);
                      }}
                        style={{ padding: '4px 12px', borderRadius: 5, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          background: bookingType === 'hourly' ? '#f59e0b' : 'transparent',
                          color: bookingType === 'hourly' ? '#0f172a' : '#64748b' }}>
                        <i className="bi bi-clock me-1"></i>Short Stay
                      </button>
                    </div>
                  </div>
                  <div className="row g-3">
                    {bookingType === 'hourly' && (
                      <div className="col-12">
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <i className="bi bi-clock-fill" style={{ color: '#f59e0b', fontSize: 18 }}></i>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Short Stay Duration</div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              {(() => {
                                const src = selectedSingleRoom || rooms.find(r => r.hourly_rates);
                                const rates = src?.hourly_rates;
                                if (rates && typeof rates === 'object') {
                                  const tiers = Object.keys(rates).filter(k => k !== 'default').map(Number).sort((a, b) => a - b);
                                  const maxTier = Math.max(...tiers, 3);
                                  return [...new Set([...tiers, maxTier + 1, maxTier + 2, maxTier + 3])].sort((a, b) => a - b).map(h => (
                                    <button key={h} type="button" onClick={() => setExpectedHours(h)}
                                      style={{ padding: '4px 10px', borderRadius: 6, border: `2px solid ${expectedHours === h ? '#f59e0b' : '#e2e8f0'}`,
                                        background: expectedHours === h ? '#fef3c7' : '#fff', fontSize: 12, fontWeight: 700,
                                        color: expectedHours === h ? '#92400e' : '#64748b', cursor: 'pointer' }}>
                                      {h}h
                                    </button>
                                  ));
                                }
                                return [2, 3, 4, 5, 6, 8].map(h => (
                                  <button key={h} type="button" onClick={() => setExpectedHours(h)}
                                    style={{ padding: '4px 10px', borderRadius: 6, border: `2px solid ${expectedHours === h ? '#f59e0b' : '#e2e8f0'}`,
                                      background: expectedHours === h ? '#fef3c7' : '#fff', fontSize: 12, fontWeight: 700,
                                      color: expectedHours === h ? '#92400e' : '#64748b', cursor: 'pointer' }}>
                                    {h}h
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className={bookingType === 'hourly' ? 'col-12' : 'col-md-8'}>
                      <label className="form-label-custom">{bookingType === 'hourly' ? 'Check-in Date *' : 'Check-in & Check-out Dates *'}</label>
                      {bookingType === 'hourly' ? (
                        <input
                          type="date"
                          className="form-control"
                          value={formData.check_in}
                          min={dayjs().format('YYYY-MM-DD')}
                          onChange={(e) => {
                            const d = e.target.value;
                            handleFormChange('check_in', d);
                            handleFormChange('check_out', d);
                            fetchAvailableRoomsForGroup(d, d);
                          }}
                          style={{ borderRadius: 10, border: '1px solid #e2e8f0' }}
                        />
                      ) : (
                      <DateRangePickerInput
                        checkIn={formData.check_in}
                        checkOut={formData.check_out}
                        onChange={(startDate, endDate) => {
                          handleFormChange('check_in', startDate);
                          handleFormChange('check_out', endDate);
                          fetchAvailableRoomsForGroup(startDate, endDate);
                        }}
                      />
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label-custom">Number of Guests</label>
                      <select
                        className="form-select form-select-custom"
                        value={formData.guests_count}
                        onChange={(e) => handleFormChange('guests_count', e.target.value)}
                      >
                        {GUEST_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Meal Plan - hidden (meals included in misc) */}

                {/* Extra Bed Option (nightly, single room) */}
                {bookingType !== 'hourly' && !isGroupBooking && selectedSingleRoom?.extra_bed_charge > 0 && (
                  <div className="form-section border rounded mb-3">
                    <div className="d-flex align-items-center justify-content-between" style={{ padding: '10px 14px' }}>
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-house-add" style={{ color: '#92400e', fontSize: 16 }}></i>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Extra Bed</div>
                          <div style={{ fontSize: 11, color: '#92400e' }}>+{formatCurrency(gstInclusiveRate(selectedSingleRoom.extra_bed_charge))}/night <span style={{ color: '#94a3b8' }}>incl. GST</span></div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-sm btn-outline-secondary" style={{ width: 30, height: 30, padding: 0, borderRadius: 8 }}
                          onClick={() => setExtraBeds(Math.max(0, extraBeds - 1))} disabled={extraBeds <= 0}>−</button>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#92400e', minWidth: 24, textAlign: 'center' }}>{extraBeds}</span>
                        <button type="button" className="btn btn-sm btn-outline-warning" style={{ width: 30, height: 30, padding: 0, borderRadius: 8 }}
                          onClick={() => setExtraBeds(Math.min(selectedSingleRoom.max_extra_beds || 1, extraBeds + 1))} disabled={extraBeds >= (selectedSingleRoom.max_extra_beds || 1)}>+</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Group Room Picker */}
                {isGroupBooking && (
                  <div className="form-section border rounded mb-3">
                    <div className="form-section-title">
                      <i className="bi bi-grid-3x3-gap"></i> Select Rooms ({selectedGroupRooms.length} selected)
                    </div>
                    {availableRoomsForGroup.length === 0 ? (
                      <p className="text-muted text-center py-3">Select check-in & check-out dates to see available rooms</p>
                    ) : (
                      <div className="row g-2">
                        {availableRoomsForGroup.filter(rm => bookingType !== 'hourly' || rm.hourly_rates).map(rm => {
                          const isSelected = selectedGroupRooms.some(r => r.room_id === rm.id);
                          return (
                            <div className="col-md-4 col-lg-3" key={rm.id}>
                              <div onClick={() => toggleGroupRoom(rm)} style={{
                                cursor: 'pointer', padding: '10px 12px', borderRadius: 8,
                                border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                                background: isSelected ? '#f0fdf4' : '#fff',
                              }}>
                                <div className="d-flex justify-content-between align-items-center">
                                  <strong style={{ fontSize: 14 }}>{rm.room_number}</strong>
                                  <input type="checkbox" className="form-check-input" checked={isSelected} readOnly style={{ pointerEvents: 'none' }} />
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{capitalize(rm.room_type || rm.type || '')}</div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: bookingType === 'hourly' ? '#92400e' : '#1a1a2e' }}>
                                  {bookingType === 'hourly'
                                    ? `${formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours, rm)))} / ${expectedHours}h`
                                    : `${formatCurrency(gstInclusiveRate(rm.base_rate || rm.rate || 0))}/night`
                                  }
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Room Type Selection - Single booking only */}
                {!isGroupBooking && (
                <div className="form-section border rounded mb-3">
                  <div className="form-section-title">
                    <i className="bi bi-door-open"></i> Select Room Type
                  </div>
                  <div className="row g-3">
                    {roomTypes.length > 0 ? roomTypes.filter(rt => bookingType !== 'hourly' || rt.hourly_rates).map((rt) => (
                      <div className="col-md-6 col-lg-3" key={rt.name}>
                        <div
                          className={`room-type-card${selectedRoomType === rt.name ? ' selected' : ''}`}
                          onClick={() => handleRoomTypeSelect(rt.name, rt.price)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="room-type-name">{capitalize(rt.name)}</div>
                          <div className="room-type-desc">{rt.desc || 'Standard amenities'}</div>
                          <div className="room-type-price">
                            {(() => {
                              if (bookingType === 'hourly') {
                                return <>{formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours, rt)))} <small>/ {expectedHours}h <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST</span></small></>;
                              }
                              const defaultRate = parseFloat(rt.double_rate || rt.single_rate || rt.triple_rate || rt.price);
                              const defaultMisc = parseFloat(rt.double_rate ? rt.double_misc : rt.single_rate ? rt.single_misc : rt.triple_misc) || 0;
                              return (
                                <>
                                  {formatCurrency(gstInclusiveRate(defaultRate) + defaultMisc)}
                                  <small>/night <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST + Misc</span></small>
                                </>
                              );
                            })()}
                          </div>
                          <div className={`availability${rt.available <= 2 ? ' low' : ''}`}>{rt.available} room{rt.available !== 1 ? 's' : ''} available</div>
                        </div>
                      </div>
                    )) : (
                      <>
                        <div className="col-md-6 col-lg-3">
                          <div
                            className={`room-type-card${selectedRoomType === 'standard' ? ' selected' : ''}`}
                            onClick={() => handleRoomTypeSelect('standard', 2500)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="room-type-name">Standard</div>
                            <div className="room-type-desc">Basic amenities, 1 King bed</div>
                            <div className="room-type-price">{formatCurrency(gstInclusiveRate(2500))} <small>/night <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST</span></small></div>
                            <div className="availability">8 rooms available</div>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3">
                          <div
                            className={`room-type-card${selectedRoomType === 'deluxe' ? ' selected' : ''}`}
                            onClick={() => handleRoomTypeSelect('deluxe', 3500)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="room-type-name">Deluxe</div>
                            <div className="room-type-desc">City view, 1 King bed</div>
                            <div className="room-type-price">{formatCurrency(gstInclusiveRate(3500))} <small>/night <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST</span></small></div>
                            <div className="availability">5 rooms available</div>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3">
                          <div
                            className={`room-type-card${selectedRoomType === 'suite' ? ' selected' : ''}`}
                            onClick={() => handleRoomTypeSelect('suite', 5500)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="room-type-name">Suite</div>
                            <div className="room-type-desc">Living area, 1 King bed</div>
                            <div className="room-type-price">{formatCurrency(gstInclusiveRate(5500))} <small>/night <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST</span></small></div>
                            <div className="availability low">2 rooms available</div>
                          </div>
                        </div>
                        <div className="col-md-6 col-lg-3">
                          <div
                            className={`room-type-card${selectedRoomType === 'premium' ? ' selected' : ''}`}
                            onClick={() => handleRoomTypeSelect('premium', 8500)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="room-type-name">Premium</div>
                            <div className="room-type-desc">Luxury suite, 2 beds</div>
                            <div className="room-type-price">{formatCurrency(gstInclusiveRate(8500))} <small>/night <span style={{ fontSize: '0.7em', opacity: 0.7 }}>incl. GST</span></small></div>
                            <div className="availability low">1 room available</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Room Picker for single booking */}
                  {selectedRoomType && availableRoomsForGroup.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                        <i className="bi bi-grid-3x3-gap me-1"></i> Select Room ({availableRoomsForGroup.filter(rm => (rm.room_type || rm.type || '').toLowerCase() === selectedRoomType.toLowerCase()).length} available)
                      </div>
                      <div className="row g-2">
                        {availableRoomsForGroup
                          .filter(rm => (rm.room_type || rm.type || '').toLowerCase() === selectedRoomType.toLowerCase())
                          .map(rm => {
                            const isSelected = selectedSingleRoom?.id === rm.id;
                            return (
                              <div className="col-md-4 col-lg-3" key={rm.id}>
                                <div onClick={() => {
                                  setSelectedSingleRoom(isSelected ? null : rm);
                                  if (!isSelected) {
                                    // Set default adults based on room's available rates
                                    const hasDouble = rm.double_rate;
                                    const hasTriple = rm.triple_rate;
                                    const hasSingle = rm.single_rate;
                                    const defaultAdults = hasDouble ? 2 : hasTriple ? 3 : hasSingle ? 1 : 2;
                                    const rate = (defaultAdults === 1 && hasSingle) ? parseFloat(rm.single_rate)
                                      : (defaultAdults === 2 && hasDouble) ? parseFloat(rm.double_rate)
                                      : (defaultAdults >= 3 && hasTriple) ? parseFloat(rm.triple_rate)
                                      : parseFloat(rm.double_rate || rm.base_rate || rm.single_rate || rm.triple_rate || 0);
                                    const guestLabel = defaultAdults === 1 ? '1_adult' : defaultAdults === 2 ? '2_adults' : '3_adults';
                                    setFormData(prev => ({ ...prev, rate_per_night: rate, adults: defaultAdults, guests_count: guestLabel }));
                                  }
                                }} style={{
                                  cursor: 'pointer', padding: '10px 12px', borderRadius: 8,
                                  border: `2px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                                  background: isSelected ? '#f0fdf4' : '#fff',
                                  transition: 'all 0.15s',
                                }}>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <strong style={{ fontSize: 14 }}>{rm.room_number}</strong>
                                    {isSelected && <i className="bi bi-check-circle-fill" style={{ color: '#10b981' }}></i>}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#64748b' }}>Floor {rm.floor} &middot; Max {rm.max_occupancy || 2} guests</div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: bookingType === 'hourly' ? '#92400e' : '#1a1a2e' }}>
                                    {bookingType === 'hourly'
                                      ? `${formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours, rm)))} / ${expectedHours}h`
                                      : `${formatCurrency(gstInclusiveRate(rm.base_rate || rm.rate || 0))}/night`
                                    }
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        {availableRoomsForGroup.filter(rm => (rm.room_type || rm.type || '').toLowerCase() === selectedRoomType.toLowerCase()).length === 0 && (
                          <div className="col-12">
                            <p className="text-muted text-center py-2" style={{ fontSize: 13 }}>No {selectedRoomType} rooms available for selected dates</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                )}

                {/* Guest Information */}
                <div className="form-section border rounded">
                  <div className="form-section-title">
                    <i className="bi bi-person"></i> Guest Information
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label-custom">First Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        placeholder="Enter first name"
                        value={formData.first_name}
                        onChange={(e) => handleFormChange('first_name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label-custom">Last Name</label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        placeholder="Enter last name"
                        value={formData.last_name}
                        onChange={(e) => handleFormChange('last_name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label-custom">Phone Number *</label>
                      <input
                        type="tel"
                        className="form-control form-control-custom"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label-custom">Email</label>
                      <input
                        type="email"
                        className="form-control form-control-custom"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label-custom">Booking Source</label>
                      <select
                        className="form-select form-select-custom"
                        value={formData.source}
                        onChange={(e) => handleFormChange('source', e.target.value)}
                      >
                        {SOURCE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label-custom">Payment Mode</label>
                      <select
                        className="form-select form-select-custom"
                        value={formData.payment_mode}
                        onChange={(e) => handleFormChange('payment_mode', e.target.value)}
                      >
                        {PAYMENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label-custom">Special Requests</label>
                      <textarea
                        className="form-control form-control-custom"
                        rows="2"
                        placeholder="Any special requests or notes..."
                        value={formData.special_requests}
                        onChange={(e) => handleFormChange('special_requests', e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Summary */}
              <div className="col-lg-4">
                <div className="booking-summary">
                  <h6 className="mb-3"><i className="bi bi-receipt me-2"></i>Booking Summary</h6>
                  <div className="date-range-display mb-3">
                    <div className="date-box">
                      <div className="label">Check-in</div>
                      <div className="date">{formatDate(formData.check_in, 'MMM DD, YYYY')}</div>
                    </div>
                    <div className="date-arrow">
                      <i className="bi bi-arrow-right"></i>
                    </div>
                    <div className="date-box">
                      <div className="label">Check-out</div>
                      <div className="date">{formatDate(formData.check_out, 'MMM DD, YYYY')}</div>
                    </div>
                  </div>
                  <div className="text-center mb-3">
                    <span className="nights-badge">{nights} Night{nights !== 1 ? 's' : ''}</span>
                  </div>
                  <hr />
                  {isGroupBooking && selectedGroupRooms.length > 0 ? (
                    <>
                      <div className="summary-row">
                        <span className="label">Rooms</span>
                        <span className="value">{selectedGroupRooms.length} rooms</span>
                      </div>
                      {selectedGroupRooms.map(r => {
                        const hrTotal = getHourlyTotal(expectedHours, r);
                        return (
                          <div className="summary-row" key={r.room_id} style={{ fontSize: 12 }}>
                            <span className="label">{r.room_number} ({capitalize(r.room_type || '')})</span>
                            <span className="value">{isHourlyBooking ? `${formatCurrency(gstInclusiveRate(hrTotal))} / ${expectedHours}h` : `${formatCurrency(gstInclusiveRate(r.rate))}/n`}</span>
                          </div>
                        );
                      })}
                      <hr className="my-2" />
                      <div className="summary-row">
                        <span className="label">Room Total</span>
                        <span className="value">{formatCurrency(isHourlyBooking
                          ? selectedGroupRooms.reduce((s, r) => s + gstInclusiveRate(getHourlyTotal(expectedHours, r)), 0)
                          : selectedGroupRooms.reduce((s, r) => s + gstInclusiveRate(r.rate) * nights, 0))}</span>
                      </div>
                      {mealPlan !== 'none' && (() => {
                        const mealPerNight = mealPlan === 'both' ? mealRates.breakfast_rate + mealRates.dinner_rate : mealRates[`${mealPlan}_rate`] || 0;
                        const totalMeal = mealPerNight * nights * selectedGroupRooms.length * (formData.adults || 2);
                        return (
                          <div className="summary-row" style={{ color: '#f59e0b' }}>
                            <span className="label"><i className="bi bi-cup-hot me-1"></i>{mealPlan === 'both' ? 'B+D' : capitalize(mealPlan)}</span>
                            <span className="value">{formatCurrency(totalMeal)}</span>
                          </div>
                        );
                      })()}
                      {(() => {
                        const roomTotal = isHourlyBooking
                          ? selectedGroupRooms.reduce((s, r) => s + gstInclusiveRate(getHourlyTotal(expectedHours, r)), 0)
                          : selectedGroupRooms.reduce((s, r) => s + gstInclusiveRate(r.rate) * nights, 0);
                        const mealPerNight = (!isHourlyBooking && mealPlan !== 'none') ? (mealPlan === 'both' ? mealRates.breakfast_rate + mealRates.dinner_rate : mealRates[`${mealPlan}_rate`] || 0) : 0;
                        const totalMeal = mealPerNight * nights * selectedGroupRooms.length * (formData.adults || 2);
                        const groupGrandTotal = roomTotal + totalMeal;
                        let groupDiscountAmt = 0;
                        if (omDiscount && omDiscountValue && Number(omDiscountValue) > 0) {
                          groupDiscountAmt = omDiscountType === 'percentage'
                            ? Math.round(groupGrandTotal * (Number(omDiscountValue) / 100) * 100) / 100
                            : Math.round(Number(omDiscountValue) * 100) / 100;
                        }
                        return (
                          <>
                            <div className="summary-row total">
                              <span className="label">Total ({isHourlyBooking ? `${expectedHours}h` : `${nights}N`})</span>
                              <span className="value">{formatCurrency(groupGrandTotal)}</span>
                            </div>
                            {groupDiscountAmt > 0 && (
                              <>
                                <div className="summary-row" style={{ color: '#8b5cf6' }}>
                                  <span className="label"><i className="bi bi-tag me-1"></i>OM Discount</span>
                                  <span className="value">- {formatCurrency(groupDiscountAmt)}</span>
                                </div>
                                <div className="summary-row total" style={{ background: '#f5f3ff', borderRadius: 6, padding: '6px 8px', marginTop: 4 }}>
                                  <span className="label">After Discount</span>
                                  <span className="value">{formatCurrency(groupGrandTotal - groupDiscountAmt)}</span>
                                </div>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <>
                      {selectedRoomType && (
                        <div className="summary-row">
                          <span className="label">Room Type</span>
                          <span className="value">{capitalize(selectedRoomType)}</span>
                        </div>
                      )}
                      {selectedSingleRoom && (
                        <div className="summary-row">
                          <span className="label">Room</span>
                          <span className="value" style={{ fontWeight: 700, color: '#10b981' }}>
                            <i className="bi bi-door-closed me-1"></i>{selectedSingleRoom.room_number}
                          </span>
                        </div>
                      )}
                      {isHourlyBooking ? (
                        <>
                          <div className="summary-row">
                            <span className="label">Total for {expectedHours}h <small style={{ opacity: 0.6 }}>(incl. GST)</small></span>
                            <span className="value" style={{ color: '#f59e0b' }}>{formatCurrency(gstInclusiveRate(hourlyTotalCalc))}</span>
                          </div>
                          <div className="summary-row">
                            <span className="label">Duration</span>
                            <span className="value">{expectedHours} hours</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="summary-row">
                            <span className="label">Rate/Night <small style={{ opacity: 0.6 }}>(incl. GST)</small></span>
                            <span className="value">{formatCurrency(rateInclGst)}</span>
                          </div>
                          {totalMiscCalc > 0 && (
                            <div className="summary-row" style={{ color: '#7c3aed' }}>
                              <span className="label"><i className="bi bi-basket me-1"></i>Misc Charges ({formData.adults || parseInt(formData.guests_count) || 2} pax)</span>
                              <span className="value">{formatCurrency(totalMiscCalc)}</span>
                            </div>
                          )}
                          {extraBedTotalCalc > 0 && (
                            <div className="summary-row" style={{ color: '#92400e' }}>
                              <span className="label"><i className="bi bi-house-add me-1"></i>Extra Bed x{extraBeds}</span>
                              <span className="value">{formatCurrency(extraBedTotalCalc)}</span>
                            </div>
                          )}
                          {mealPlan !== 'none' && (() => {
                            const mealPerNight = mealPlan === 'both' ? mealRates.breakfast_rate + mealRates.dinner_rate : mealRates[`${mealPlan}_rate`] || 0;
                            const totalMeal = mealPerNight * nights * (formData.adults || 2);
                            return (
                              <div className="summary-row" style={{ color: '#f59e0b' }}>
                                <span className="label"><i className="bi bi-cup-hot me-1"></i>{mealPlan === 'both' ? 'B+D' : capitalize(mealPlan)}</span>
                                <span className="value">{formatCurrency(totalMeal)}</span>
                              </div>
                            );
                          })()}
                        </>
                      )}
                      <div className="summary-row total">
                        <span className="label">Total ({isHourlyBooking ? `${expectedHours}h` : `${nights} night${nights !== 1 ? 's' : ''}`})</span>
                        <span className="value">{formatCurrency(grandTotalWithExtras)}</span>
                      </div>

                      {/* OM Discount */}
                      {omDiscount && omDiscountAmount > 0 && (
                        <>
                          <div className="summary-row" style={{ color: '#8b5cf6' }}>
                            <span className="label"><i className="bi bi-tag me-1"></i>OM Discount</span>
                            <span className="value">- {formatCurrency(omDiscountAmount)}</span>
                          </div>
                          <div className="summary-row total" style={{ background: '#f5f3ff', borderRadius: 6, padding: '6px 8px', marginTop: 4 }}>
                            <span className="label">After Discount</span>
                            <span className="value">{formatCurrency(grandTotal)}</span>
                          </div>
                        </>
                      )}

                      {/* Advance Payment in summary */}
                      {formData.collect_advance && Number(formData.advance_amount) > 0 && (
                        <>
                          <div className="summary-row" style={{ color: '#10b981' }}>
                            <span className="label"><i className="bi bi-cash me-1"></i>Advance ({capitalize(formData.advance_method || 'cash')})</span>
                            <span className="value">- {formatCurrency(Number(formData.advance_amount))}</span>
                          </div>
                          <div className="summary-row" style={{ fontWeight: 700 }}>
                            <span className="label">Balance Due</span>
                            <span className="value" style={{ color: '#dc2626' }}>{formatCurrency(Math.max(0, grandTotal - Number(formData.advance_amount)))}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* OM Discount Section */}
                <div style={{ marginTop: 12, background: '#faf5ff', borderRadius: 10, padding: '10px 14px', border: '1px solid #e9d5ff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: omDiscount ? '#7c3aed' : '#64748b', letterSpacing: 1, textTransform: 'uppercase' }}>
                      <i className="bi bi-tag-fill me-1"></i>OM Discount
                    </span>
                    <input className="form-check-input" type="checkbox" checked={omDiscount}
                      onChange={(e) => { setOmDiscount(e.target.checked); if (!e.target.checked) { setOmDiscountValue(''); setOmDiscountReason(''); } }}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                      disabled={totalMiscCalc <= 0 && !isHourlyBooking} />
                  </label>
                  {totalMiscCalc <= 0 && !isHourlyBooking && (
                    <div style={{ fontSize: 10, color: '#dc2626', marginTop: 4 }}>
                      <i className="bi bi-info-circle me-1"></i>No misc charges — discount not available
                    </div>
                  )}
                  {omDiscount && totalMiscCalc > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div className="d-flex gap-2 mb-2">
                        <select className="form-select form-select-sm" value={omDiscountType}
                          onChange={(e) => { setOmDiscountType(e.target.value); setOmDiscountValue(''); }}
                          style={{ width: 90, borderRadius: 6, fontSize: 12 }}>
                          <option value="percentage">%</option>
                          <option value="flat">₹ Flat</option>
                        </select>
                        <input type="number" className="form-control form-control-sm"
                          placeholder={omDiscountType === 'percentage' ? 'Max 100%' : `Max ${totalMiscCalc}`}
                          min="0" max={omDiscountType === 'percentage' ? 100 : totalMiscCalc}
                          value={omDiscountValue} onChange={(e) => setOmDiscountValue(e.target.value)}
                          style={{ borderRadius: 6, fontSize: 12 }} />
                      </div>
                      <input type="text" className="form-control form-control-sm" placeholder="Reason (optional)"
                        value={omDiscountReason} onChange={(e) => setOmDiscountReason(e.target.value)}
                        style={{ borderRadius: 6, fontSize: 12 }} />
                      <div style={{ fontSize: 10, color: '#7c3aed', marginTop: 6 }}>
                        <i className="bi bi-info-circle me-1"></i>Max discount: {formatCurrency(totalMiscCalc)} (Misc charges only)
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="sendConfirmation"
                      checked={formData.send_confirmation}
                      onChange={(e) => handleFormChange('send_confirmation', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="sendConfirmation">
                      Send confirmation email to guest
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="collectAdvance"
                      checked={formData.collect_advance}
                      onChange={(e) => handleFormChange('collect_advance', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="collectAdvance">
                      Collect advance payment
                    </label>
                  </div>
                  {formData.collect_advance && (
                    <div style={{ marginTop: 8, marginLeft: 24 }}>
                      <div className="d-flex gap-2 align-items-center">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Advance amount"
                          min="0"
                          value={formData.advance_amount || ''}
                          onChange={(e) => handleFormChange('advance_amount', e.target.value)}
                          style={{ borderRadius: 8, maxWidth: 160 }}
                        />
                        <select
                          className="form-select form-select-sm"
                          value={formData.advance_method || 'cash'}
                          onChange={(e) => handleFormChange('advance_method', e.target.value)}
                          style={{ borderRadius: 8, maxWidth: 130 }}
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="card">Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                      </div>
                      {formData.advance_amount && Number(formData.advance_amount) > 0 && (
                        <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                          <i className="bi bi-check-circle me-1"></i>₹{Number(formData.advance_amount).toFixed(2)} will be collected
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer modal-footer-custom">
            <button type="button" className="btn btn-outline-secondary" onClick={handleCloseModal}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
              onClick={handleFormSubmit}
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-1"></i>
                  {editingId ? 'Update Reservation' : 'Create Reservation'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
