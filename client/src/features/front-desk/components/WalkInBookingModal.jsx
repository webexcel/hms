import { Modal } from 'react-bootstrap';
import { capitalize, formatCurrency } from '../../../utils/formatters';
import { gstInclusiveRate } from '../hooks/useFrontDesk';
import dayjs from 'dayjs';

export default function WalkInBookingModal({
  showBookingModal, setShowBookingModal, selectedRoom, bookingType, setBookingType,
  isGroupBooking, setIsGroupBooking, selectedGroupRooms, setSelectedGroupRooms,
  bookingForm, setBookingForm, expectedHours, setExpectedHours, extraBeds, setExtraBeds,
  mealPlan, setMealPlan, mealRates, getMealSurcharge,
  bookingDiscount, setBookingDiscount, bookingDiscountType, setBookingDiscountType,
  bookingDiscountValue, setBookingDiscountValue, bookingDiscountReason, setBookingDiscountReason,
  bookingSubmitting, handleCreateBooking,
  getHourlyTotal, getHourlyRate, availableRoomsForGroup, toggleGroupRoom,
}) {
  return (
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
  );
}
