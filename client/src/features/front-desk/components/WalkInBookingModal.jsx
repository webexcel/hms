import { Modal } from 'react-bootstrap';
import { capitalize, formatCurrency } from '../../../utils/formatters';
import { gstInclusiveRate } from '../hooks/useFrontDesk';
import dayjs from 'dayjs';

/* ── palette ── */
const P = {
  ink: '#1b1f2b',
  slate: '#3d4455',
  muted: '#7c8294',
  light: '#b4b9c8',
  border: '#e4e6ed',
  surface: '#f6f7fa',
  card: '#ffffff',
  accent: '#c8a24e',      // warm gold
  accentLight: '#fdf8ec',
  teal: '#1a9e8f',
  tealLight: '#e6f7f5',
  hourly: '#d97706',
  hourlyLight: '#fef9ee',
  danger: '#d63939',
  dangerLight: '#fef2f2',
  green: '#0f8a65',
  greenLight: '#e8f5f0',
};

const sLabel = { fontSize: 10, fontWeight: 700, color: P.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5, display: 'block' };
const sInput = { borderRadius: 8, border: `1.5px solid ${P.border}`, fontSize: 13, fontWeight: 500, padding: '9px 12px', color: P.ink, transition: 'border-color 0.15s' };
const sSection = (color) => ({ fontSize: 10, fontWeight: 700, color: color || P.ink, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, paddingBottom: 8, borderBottom: `2px solid ${color || P.border}`, display: 'flex', alignItems: 'center', gap: 8 });

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
  const isHourly = bookingType === 'hourly';
  const accentColor = isHourly ? P.hourly : P.teal;
  const accentBg = isHourly ? P.hourlyLight : P.tealLight;

  return (
    <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} centered size="xl" dialogClassName="walkin-modal">
      <div style={{ borderRadius: 14, overflow: 'hidden', background: P.surface, fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>

        {/* ═══ HEADER ═══ */}
        <div className="walkin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Title */}
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}>
              {isGroupBooking ? 'Group Booking' : isHourly ? 'Short Stay' : 'Walk-in Registration'}
            </span>

            {/* Room badge */}
            {!isGroupBooking && (
              <span style={{ background: accentColor, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                Room {selectedRoom?.room_number}
              </span>
            )}
            {isGroupBooking && selectedGroupRooms.length > 0 && (
              <span style={{ background: P.accent, color: P.ink, fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                {selectedGroupRooms.length} Rooms
              </span>
            )}

            {/* Type toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden', marginLeft: 4 }}>
              <button type="button" onClick={() => setBookingType('nightly')}
                style={{ padding: '5px 14px', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: bookingType === 'nightly' ? P.teal : 'transparent',
                  color: bookingType === 'nightly' ? '#fff' : P.light, borderRadius: '8px 0 0 8px',
                }}>
                <i className="bi bi-moon-fill me-1" style={{ fontSize: 9 }}></i>Nightly
              </button>
              <button type="button"
                onClick={() => { if (selectedRoom?.hourly_rates) { setBookingType('hourly'); setMealPlan('none'); setExtraBeds(0); } }}
                disabled={!selectedRoom?.hourly_rates}
                title={!selectedRoom?.hourly_rates ? 'Short stay not available' : ''}
                style={{ padding: '5px 14px', fontSize: 11, fontWeight: 600, border: 'none', borderRadius: '0 8px 8px 0',
                  background: isHourly ? P.hourly : 'transparent',
                  color: isHourly ? '#fff' : P.light,
                  cursor: selectedRoom?.hourly_rates ? 'pointer' : 'not-allowed',
                  opacity: selectedRoom?.hourly_rates ? 1 : 0.35,
                }}>
                <i className="bi bi-clock-fill me-1" style={{ fontSize: 9 }}></i>Hourly
              </button>
            </div>

            {/* Group toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: isGroupBooking ? P.accent : P.light }}>Group</span>
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" checked={isGroupBooking}
                  onChange={e => {
                    setIsGroupBooking(e.target.checked);
                    if (e.target.checked && selectedRoom) {
                      setSelectedGroupRooms([{
                        room_id: selectedRoom.id, room_number: selectedRoom.room_number,
                        room_type: selectedRoom.room_type, base_rate: selectedRoom.base_rate,
                        hourly_rate: selectedRoom.hourly_rate, hourly_rates: selectedRoom.hourly_rates,
                        max_occupancy: selectedRoom.max_occupancy,
                      }]);
                    } else { setSelectedGroupRooms([]); }
                  }}
                  style={{ cursor: 'pointer' }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {!isGroupBooking && (
              <span style={{ color: P.light, fontSize: 12, fontWeight: 500 }}>
                {capitalize(selectedRoom?.room_type || '')} &middot; Max {selectedRoom?.max_occupancy || 2} &middot;
                {isHourly
                  ? ` ${formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours)))} / ${expectedHours}h`
                  : ` ${formatCurrency(gstInclusiveRate(selectedRoom?.base_rate || 0))}/night`
                }
              </span>
            )}
            <button type="button" className="btn-close btn-close-white" style={{ fontSize: 10, opacity: 0.6 }} onClick={() => setShowBookingModal(false)}></button>
          </div>
        </div>

        {/* ═══ BODY ═══ */}
        <div className="walkin-body">

          {/* ── LEFT: FORM ── */}
          <div className="walkin-form">

            {/* GUEST INFORMATION */}
            <div style={{ marginBottom: 26 }}>
              <div style={sSection(P.teal)}>
                <i className="bi bi-person" style={{ fontSize: 13 }}></i> Guest Information
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label style={sLabel}>First Name <span style={{ color: P.danger }}>*</span></label>
                  <input type="text" className="form-control form-control-sm" value={bookingForm.first_name}
                    onChange={e => setBookingForm({ ...bookingForm, first_name: e.target.value })}
                    placeholder="First name" style={sInput} />
                </div>
                <div className="col-6">
                  <label style={sLabel}>Last Name</label>
                  <input type="text" className="form-control form-control-sm" value={bookingForm.last_name}
                    onChange={e => setBookingForm({ ...bookingForm, last_name: e.target.value })}
                    placeholder="Last name" style={sInput} />
                </div>
                <div className="col-6">
                  <label style={sLabel}>Mobile <span style={{ color: P.danger }}>*</span></label>
                  <input type="tel" className="form-control form-control-sm" value={bookingForm.phone}
                    onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    placeholder="10-digit number" style={sInput} />
                </div>
                <div className="col-6">
                  <label style={sLabel}>Email</label>
                  <input type="email" className="form-control form-control-sm" value={bookingForm.email}
                    onChange={e => setBookingForm({ ...bookingForm, email: e.target.value })}
                    placeholder="Optional" style={sInput} />
                </div>
                <div className="col-6">
                  <label style={sLabel}>ID Proof Type <span style={{ color: P.danger }}>*</span></label>
                  <select className="form-select form-select-sm" value={bookingForm.id_proof_type}
                    onChange={e => setBookingForm({ ...bookingForm, id_proof_type: e.target.value })} style={sInput}>
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="passport">Passport</option>
                    <option value="driving_license">Driving License</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="pan">PAN Card</option>
                  </select>
                </div>
                <div className="col-6">
                  <label style={sLabel}>ID Number <span style={{ color: P.danger }}>*</span></label>
                  <input type="text" className="form-control form-control-sm" value={bookingForm.id_proof_number}
                    onChange={e => setBookingForm({ ...bookingForm, id_proof_number: e.target.value })}
                    placeholder="Enter ID number" style={sInput} />
                </div>
              </div>
            </div>

            {/* STAY DETAILS */}
            <div style={{ marginBottom: 26 }}>
              <div style={sSection(isHourly ? P.hourly : P.teal)}>
                <i className={`bi ${isHourly ? 'bi-clock' : 'bi-calendar-check'}`} style={{ fontSize: 13 }}></i>
                {isHourly ? 'Short Stay Details' : 'Stay Details'}
              </div>
              <div className="row g-2">
                {isHourly ? (
                  <>
                    <div className="col-6">
                      <label style={sLabel}>Date <span style={{ color: P.danger }}>*</span></label>
                      <input type="date" className="form-control form-control-sm" value={bookingForm.check_in_date}
                        min={dayjs().format('YYYY-MM-DD')}
                        onChange={e => setBookingForm({ ...bookingForm, check_in_date: e.target.value })} style={sInput} />
                    </div>
                    <div className="col-6">
                      <label style={sLabel}>Duration <span style={{ color: P.danger }}>*</span></label>
                      <select className="form-select form-select-sm" value={expectedHours}
                        onChange={e => setExpectedHours(parseInt(e.target.value))}
                        style={{ ...sInput, borderColor: P.hourly, background: P.hourlyLight, color: P.hourly, fontWeight: 700 }}>
                        {(() => {
                          const rates = selectedRoom?.hourly_rates;
                          if (rates && typeof rates === 'object') {
                            const tiers = Object.keys(rates).filter(k => k !== 'default').map(Number).sort((a, b) => a - b);
                            const maxTier = Math.max(...tiers, 3);
                            const hours = [...new Set([...tiers, maxTier + 1, maxTier + 2, maxTier + 3])].sort((a, b) => a - b);
                            return hours.map(h => <option key={h} value={h}>{h} Hrs — {formatCurrency(gstInclusiveRate(getHourlyTotal(h)))}</option>);
                          }
                          return [2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>{h} Hours</option>);
                        })()}
                      </select>
                    </div>
                    <div className="col-4">
                      <label style={sLabel}>Adults</label>
                      <input type="number" className="form-control form-control-sm" min="1" max={selectedRoom?.max_occupancy || 4} value={bookingForm.adults}
                        onChange={e => setBookingForm({ ...bookingForm, adults: parseInt(e.target.value) || 1 })} style={sInput} />
                    </div>
                    <div className="col-4">
                      <label style={sLabel}>Children</label>
                      <input type="number" className="form-control form-control-sm" min="0" value={bookingForm.children}
                        onChange={e => setBookingForm({ ...bookingForm, children: parseInt(e.target.value) || 0 })} style={sInput} />
                    </div>
                    <div className="col-4">
                      <label style={sLabel}>Total ({expectedHours}h)</label>
                      <input type="text" className="form-control form-control-sm" value={formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours)))}
                        readOnly style={{ ...sInput, borderColor: P.hourly, background: P.hourlyLight, color: P.hourly, fontWeight: 700, cursor: 'default' }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-6">
                      <label style={sLabel}>Check-in <span style={{ color: P.danger }}>*</span></label>
                      <input type="date" className="form-control form-control-sm" value={bookingForm.check_in_date}
                        min={dayjs().format('YYYY-MM-DD')}
                        onChange={e => setBookingForm({ ...bookingForm, check_in_date: e.target.value })} style={sInput} />
                    </div>
                    <div className="col-6">
                      <label style={sLabel}>Check-out <span style={{ color: P.danger }}>*</span></label>
                      <input type="date" className="form-control form-control-sm" value={bookingForm.check_out_date}
                        min={bookingForm.check_in_date}
                        onChange={e => setBookingForm({ ...bookingForm, check_out_date: e.target.value })} style={sInput} />
                    </div>
                    <div className="col-4">
                      <label style={sLabel}>Adults</label>
                      <input type="number" className="form-control form-control-sm" min="1" max={selectedRoom?.max_occupancy || 4} value={bookingForm.adults}
                        onChange={e => setBookingForm({ ...bookingForm, adults: parseInt(e.target.value) || 1 })} style={sInput} />
                    </div>
                    <div className="col-4">
                      <label style={sLabel}>Children</label>
                      <input type="number" className="form-control form-control-sm" min="0" value={bookingForm.children}
                        onChange={e => setBookingForm({ ...bookingForm, children: parseInt(e.target.value) || 0 })} style={sInput} />
                    </div>
                    <div className="col-4">
                      <label style={sLabel}>Rate/Night</label>
                      <input type="text" className="form-control form-control-sm" value={formatCurrency(gstInclusiveRate(bookingForm.rate_per_night))}
                        readOnly style={{ ...sInput, borderColor: P.teal, background: P.tealLight, color: P.teal, fontWeight: 700, cursor: 'default' }} />
                    </div>
                  </>
                )}

                {/* Extra Bed (nightly only) */}
                {bookingType === 'nightly' && selectedRoom?.extra_bed_charge > 0 && (
                  <div className="col-12 mt-2">
                    <div style={{ background: P.accentLight, border: `1.5px solid ${P.accent}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <i className="bi bi-house-add" style={{ color: P.accent, fontSize: 16 }}></i>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: P.ink }}>Extra Bed</div>
                          <div style={{ fontSize: 10, color: P.muted }}>+{formatCurrency(gstInclusiveRate(selectedRoom.extra_bed_charge))}/night</div>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button type="button" className="btn btn-sm btn-outline-secondary" style={{ width: 28, height: 28, padding: 0, borderRadius: 6 }}
                          onClick={() => setExtraBeds(Math.max(0, extraBeds - 1))} disabled={extraBeds <= 0}>−</button>
                        <span style={{ fontSize: 14, fontWeight: 800, color: P.accent, minWidth: 20, textAlign: 'center' }}>{extraBeds}</span>
                        <button type="button" className="btn btn-sm" style={{ width: 28, height: 28, padding: 0, borderRadius: 6, background: P.accent, color: '#fff', border: 'none' }}
                          onClick={() => setExtraBeds(Math.min(selectedRoom.max_extra_beds || 1, extraBeds + 1))} disabled={extraBeds >= (selectedRoom.max_extra_beds || 1)}>+</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* GROUP ROOM PICKER */}
            {isGroupBooking && (
              <div style={{ marginBottom: 26 }}>
                <div style={sSection(P.accent)}>
                  <i className="bi bi-grid-3x3-gap" style={{ fontSize: 13 }}></i> Select Rooms ({selectedGroupRooms.length})
                </div>
                {availableRoomsForGroup.length === 0 ? (
                  <p style={{ color: P.muted, textAlign: 'center', padding: '16px 0', fontSize: 13 }}>No available rooms</p>
                ) : (
                  <div className="row g-2">
                    {availableRoomsForGroup.map(rm => {
                      const isSelected = selectedGroupRooms.some(r => r.room_id === rm.id);
                      return (
                        <div className="col-4 col-lg-3" key={rm.id}>
                          <div onClick={() => toggleGroupRoom(rm)} style={{
                            cursor: 'pointer', padding: '10px', borderRadius: 8,
                            border: `1.5px solid ${isSelected ? P.teal : P.border}`,
                            background: isSelected ? P.tealLight : P.card,
                            transition: 'all 0.15s',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: 13, color: P.ink }}>{rm.room_number}</strong>
                              <input type="checkbox" className="form-check-input" checked={isSelected} readOnly style={{ pointerEvents: 'none' }} />
                            </div>
                            <div style={{ fontSize: 10, color: P.muted }}>{capitalize(rm.room_type || '')}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: accentColor }}>
                              {isHourly
                                ? `${formatCurrency(gstInclusiveRate(getHourlyTotal(expectedHours, rm)))} / ${expectedHours}h`
                                : `${formatCurrency(gstInclusiveRate(rm.base_rate || 0))}/night`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedGroupRooms.length > 0 && selectedGroupRooms.length < 2 && (
                  <div style={{ marginTop: 8, background: P.dangerLight, border: `1px solid #fca5a5`, borderRadius: 8, padding: '6px 10px', fontSize: 11, color: P.danger, fontWeight: 600 }}>
                    <i className="bi bi-exclamation-triangle me-1"></i>Select at least 2 rooms for group booking
                  </div>
                )}
              </div>
            )}

            {/* MEAL PLAN (nightly only) */}
            {bookingType !== 'hourly' && (
              <div style={{ marginBottom: 26 }}>
                <div style={sSection(P.accent)}>
                  <i className="bi bi-cup-hot" style={{ fontSize: 13 }}></i> Meal Plan
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { value: 'none', label: 'Room Only', icon: 'bi-house', desc: 'No meals', color: P.muted },
                    { value: 'breakfast', label: 'Breakfast', icon: 'bi-sunrise', desc: `+₹${mealRates.breakfast_rate}/pax`, color: P.hourly },
                    { value: 'dinner', label: 'Dinner', icon: 'bi-moon-stars', desc: `+₹${mealRates.dinner_rate}/pax`, color: '#7c3aed' },
                    { value: 'both', label: 'B + D', icon: 'bi-cup-hot', desc: `+₹${mealRates.breakfast_rate + mealRates.dinner_rate}/pax`, color: P.teal },
                  ].map(opt => {
                    const active = mealPlan === opt.value;
                    return (
                      <div key={opt.value} onClick={() => setMealPlan(opt.value)} style={{
                        border: `1.5px solid ${active ? opt.color : P.border}`,
                        background: active ? `${opt.color}0d` : P.card,
                        borderRadius: 10, padding: '12px 8px', textAlign: 'center', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                        <i className={`bi ${opt.icon}`} style={{ fontSize: 18, color: active ? opt.color : P.light, display: 'block', marginBottom: 4 }}></i>
                        <div style={{ fontSize: 11, fontWeight: 700, color: active ? opt.color : P.ink }}>{opt.label}</div>
                        <div style={{ fontSize: 9, color: P.muted }}>{opt.desc}</div>
                      </div>
                    );
                  })}
                </div>
                {mealPlan !== 'none' && (
                  <div style={{ marginTop: 8, background: P.accentLight, border: `1px solid ${P.accent}`, borderRadius: 8, padding: '6px 10px', fontSize: 11, color: P.accent, fontWeight: 600 }}>
                    <i className="bi bi-info-circle me-1"></i>
                    Meal surcharge: ₹{getMealSurcharge(bookingForm.adults)}/night for {bookingForm.adults} adult{bookingForm.adults > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}

            {/* PAYMENT */}
            <div style={{ marginBottom: 26 }}>
              <div style={sSection(P.teal)}>
                <i className="bi bi-credit-card" style={{ fontSize: 13 }}></i> Payment
              </div>
              <div className="row g-2">
                <div className="col-4">
                  <label style={sLabel}>Source</label>
                  <select className="form-select form-select-sm" value={bookingForm.source}
                    onChange={e => setBookingForm({ ...bookingForm, source: e.target.value })} style={sInput}>
                    <option value="walk_in">Walk-in</option>
                    <option value="direct">Direct</option>
                    <option value="phone">Phone</option>
                    <option value="website">Website</option>
                  </select>
                </div>
                <div className="col-4">
                  <label style={sLabel}>Mode</label>
                  <select className="form-select form-select-sm" value={bookingForm.payment_mode}
                    onChange={e => setBookingForm({ ...bookingForm, payment_mode: e.target.value })} style={sInput}>
                    <option value="Pay at Hotel">Pay at Hotel</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="col-4">
                  <label style={sLabel}>Advance (₹)</label>
                  <input type="number" className="form-control form-control-sm" min="0" value={bookingForm.advance_amount}
                    onChange={e => setBookingForm({ ...bookingForm, advance_amount: e.target.value })}
                    placeholder="0" style={sInput} />
                </div>
              </div>
            </div>

            {/* SPECIAL REQUESTS */}
            <div>
              <label style={sLabel}>Special Requests</label>
              <textarea className="form-control form-control-sm" rows="2" value={bookingForm.special_requests}
                onChange={e => setBookingForm({ ...bookingForm, special_requests: e.target.value })}
                placeholder="Any special requirements..." style={{ ...sInput, resize: 'none' }}></textarea>
            </div>
          </div>

          {/* ── RIGHT: SUMMARY ── */}
          <div className="walkin-summary">

            {/* OM Discount */}
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${P.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: bookingDiscount ? P.danger : P.muted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                  <i className="bi bi-tag-fill me-1"></i>OM Discount
                </span>
                <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" checked={bookingDiscount}
                    onChange={e => setBookingDiscount(e.target.checked)} style={{ cursor: 'pointer' }} />
                </div>
              </div>
              {bookingDiscount && (
                <div style={{ marginTop: 10 }}>
                  <div className="row g-2">
                    <div className="col-6">
                      <select className="form-select form-select-sm" value={bookingDiscountType}
                        onChange={e => setBookingDiscountType(e.target.value)}
                        style={{ ...sInput, fontSize: 11 }}>
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
                        style={{ ...sInput, fontSize: 11, color: P.danger, fontWeight: 700 }} />
                    </div>
                    <div className="col-12">
                      <select className="form-select form-select-sm" value={bookingDiscountReason}
                        onChange={e => setBookingDiscountReason(e.target.value)}
                        style={{ ...sInput, fontSize: 11 }}>
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

            {/* Billing Summary */}
            <div style={{ flex: 1, padding: '18px', overflowY: 'auto' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-receipt" style={{ fontSize: 12, color: accentColor }}></i> Billing Summary
              </div>

              {bookingForm.check_in_date && (isHourly || bookingForm.check_out_date) ? (() => {
                // ── GROUP SUMMARY ──
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
                    ? (bookingDiscountType === 'percentage' ? subtotalWithMeal * (Number(bookingDiscountValue) / 100) : Number(bookingDiscountValue)) : 0;
                  const total = Math.max(0, subtotalWithMeal - discountAmt);
                  const advance = Number(bookingForm.advance_amount) || 0;
                  const balance = total - advance;
                  return <SummaryContent {...{ roomLines, groupTotal, totalMeal, discountAmt, advance, balance, nights, isHourly, expectedHours, bookingDiscountType, bookingDiscountValue, isGroupBooking: true, selectedGroupRooms, mealPlan, bookingForm, P, accentColor }} />;
                }

                // ── HOURLY SUMMARY ──
                if (isHourly) {
                  const hTotal = getHourlyTotal(expectedHours);
                  const totalInclGst = gstInclusiveRate(hTotal);
                  const advance = Number(bookingForm.advance_amount) || 0;
                  const balance = totalInclGst - advance;
                  return <SummaryContent {...{ totalInclGst, advance, balance, isHourly: true, expectedHours, P, accentColor }} />;
                }

                // ── NIGHTLY SUMMARY ──
                const nights = Math.max(1, Math.ceil((new Date(bookingForm.check_out_date) - new Date(bookingForm.check_in_date)) / 86400000));
                const rate = Number(bookingForm.rate_per_night) || selectedRoom?.base_rate || 0;
                const rateInclGst = gstInclusiveRate(rate);
                const totalInclGst = nights * rateInclGst;
                const extraBedTotal = extraBeds > 0 ? nights * extraBeds * gstInclusiveRate(parseFloat(selectedRoom?.extra_bed_charge) || 0) : 0;
                const mealPerNight = getMealSurcharge(bookingForm.adults);
                const totalMeal = mealPerNight * nights;
                const subtotalWithMeal = totalInclGst + extraBedTotal + totalMeal;
                const discountAmt = bookingDiscount && bookingDiscountValue
                  ? (bookingDiscountType === 'percentage' ? subtotalWithMeal * (Number(bookingDiscountValue) / 100) : Number(bookingDiscountValue)) : 0;
                const total = Math.max(0, subtotalWithMeal - discountAmt);
                const advance = Number(bookingForm.advance_amount) || 0;
                const balance = total - advance;
                return <SummaryContent {...{ nights, rateInclGst, totalInclGst, extraBedTotal, extraBeds, totalMeal, discountAmt, advance, balance, mealPlan, bookingForm, bookingDiscountType, bookingDiscountValue, isHourly: false, P, accentColor }} />;
              })() : (
                <div style={{ textAlign: 'center', color: P.light, padding: '40px 0', fontSize: 13 }}>
                  <i className="bi bi-calendar3 d-block mb-2" style={{ fontSize: 22 }}></i>
                  Select dates to see pricing
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: '14px 18px', borderTop: `1px solid ${P.border}`, background: P.card }}>
              <button className="btn w-100" style={{
                background: accentColor, color: '#fff', borderRadius: 10, padding: '11px 0',
                fontWeight: 700, fontSize: 13, border: 'none', transition: 'all 0.2s', opacity: (bookingSubmitting || !bookingForm.id_proof_number?.trim()) ? 0.5 : 1,
              }}
                onClick={() => { if (bookingForm.id_proof_number?.trim()) handleCreateBooking(true); }}
                disabled={bookingSubmitting || !bookingForm.id_proof_number?.trim()}>
                {bookingSubmitting
                  ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                  : isGroupBooking
                    ? <><i className="bi bi-people-fill me-1"></i> Register Group & Check In</>
                    : <><i className="bi bi-box-arrow-in-right me-1"></i> Register & Check In</>}
              </button>
              {!bookingForm.id_proof_number?.trim() && (
                <div style={{ fontSize: 11, color: P.danger, fontWeight: 600, textAlign: 'center', marginTop: 4 }}>
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>ID proof required
                </div>
              )}
              <button className="btn w-100" style={{
                background: 'transparent', color: P.ink, borderRadius: 10, padding: '9px 0',
                fontWeight: 600, fontSize: 12, border: `1.5px solid ${P.border}`, marginTop: 8, transition: 'all 0.15s',
              }}
                onClick={() => handleCreateBooking(false)} disabled={bookingSubmitting}>
                <i className={`bi ${isGroupBooking ? 'bi-people-fill' : 'bi-bookmark-plus'} me-1`}></i>
                {isGroupBooking ? 'Register Group Only' : 'Register Only'}
              </button>
              <button type="button" className="btn w-100" style={{ color: P.muted, fontSize: 12, fontWeight: 500, background: 'transparent', border: 'none', marginTop: 4 }}
                onClick={() => setShowBookingModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ═══ Summary Content ═══ */
function SummaryContent({
  nights, rateInclGst, totalInclGst, extraBedTotal, extraBeds, totalMeal,
  discountAmt, advance, balance, isHourly, expectedHours, mealPlan, bookingForm,
  bookingDiscountType, bookingDiscountValue, roomLines, groupTotal, isGroupBooking, selectedGroupRooms,
  P, accentColor,
}) {
  const lineStyle = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${P.border}`, fontSize: 12 };

  return (
    <>
      {/* Duration badge */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ display: 'inline-flex', gap: 10 }}>
          {isGroupBooking && (
            <div>
              <span style={{ display: 'inline-block', background: P.accent, color: '#fff', fontSize: 24, fontWeight: 800, width: 50, height: 50, lineHeight: '50px', borderRadius: 10 }}>{selectedGroupRooms.length}</span>
              <div style={{ fontSize: 9, color: P.muted, marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Rooms</div>
            </div>
          )}
          <div>
            <span style={{ display: 'inline-block', background: P.ink, color: accentColor, fontSize: 24, fontWeight: 800, width: 50, height: 50, lineHeight: '50px', borderRadius: 10 }}>
              {isHourly ? expectedHours : nights}
            </span>
            <div style={{ fontSize: 9, color: P.muted, marginTop: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              {isHourly ? `Hour${expectedHours > 1 ? 's' : ''}` : `Night${nights > 1 ? 's' : ''}`}
            </div>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div>
        {isGroupBooking && roomLines ? (
          <>
            {roomLines.map((rl, i) => (
              <div key={i} style={lineStyle}>
                <span style={{ color: P.slate, fontWeight: 600 }}>
                  <strong>{rl.room_number}</strong> <small style={{ color: P.muted }}>{capitalize(rl.room_type || '')}</small>
                </span>
                <span style={{ fontWeight: 700, color: P.ink }}>{formatCurrency(rl.roomTotal)}</span>
              </div>
            ))}
            <div style={{ ...lineStyle, borderBottom: `2px solid ${P.border}`, fontWeight: 700, color: P.ink }}>
              <span>Room Total</span>
              <span>{formatCurrency(groupTotal)}</span>
            </div>
          </>
        ) : isHourly ? (
          <div style={lineStyle}>
            <span style={{ color: P.slate, fontWeight: 600 }}>{expectedHours}h stay <small style={{ color: P.muted }}>incl. GST</small></span>
            <span style={{ fontWeight: 700, color: P.ink }}>{formatCurrency(totalInclGst)}</span>
          </div>
        ) : (
          <div style={lineStyle}>
            <span style={{ color: P.slate, fontWeight: 600 }}>{nights} x {formatCurrency(rateInclGst)} <small style={{ color: P.muted }}>incl. GST</small></span>
            <span style={{ fontWeight: 700, color: P.ink }}>{formatCurrency(totalInclGst)}</span>
          </div>
        )}

        {extraBedTotal > 0 && (
          <div style={lineStyle}>
            <span style={{ color: P.accent, fontWeight: 600 }}><i className="bi bi-house-add me-1"></i>Extra Bed x{extraBeds}</span>
            <span style={{ fontWeight: 700, color: P.accent }}>{formatCurrency(extraBedTotal)}</span>
          </div>
        )}
        {totalMeal > 0 && (
          <div style={lineStyle}>
            <span style={{ color: P.hourly, fontWeight: 600, fontSize: 11 }}>
              <i className="bi bi-cup-hot me-1"></i>{mealPlan === 'both' ? 'B+D' : mealPlan === 'breakfast' ? 'Breakfast' : 'Dinner'}
              {isGroupBooking ? ` (${selectedGroupRooms.length} rooms)` : ` (${bookingForm.adults} pax)`}
            </span>
            <span style={{ fontWeight: 700, color: P.hourly }}>{formatCurrency(totalMeal)}</span>
          </div>
        )}
        {discountAmt > 0 && (
          <div style={lineStyle}>
            <span style={{ color: P.danger, fontWeight: 600, fontSize: 11 }}>
              <i className="bi bi-tag-fill me-1"></i>Discount {bookingDiscountType === 'percentage' ? `(${bookingDiscountValue}%)` : ''}
            </span>
            <span style={{ fontWeight: 700, color: P.danger }}>-{formatCurrency(discountAmt)}</span>
          </div>
        )}
        {advance > 0 && (
          <div style={lineStyle}>
            <span style={{ color: P.green, fontWeight: 600, fontSize: 11 }}>Advance</span>
            <span style={{ fontWeight: 700, color: P.green }}>-{formatCurrency(advance)}</span>
          </div>
        )}
      </div>

      {/* Balance */}
      <div style={{
        marginTop: 16, borderRadius: 10, padding: '14px 12px', textAlign: 'center',
        background: balance <= 0 ? P.greenLight : P.accentLight,
        border: `1.5px solid ${balance <= 0 ? P.green : P.accent}`,
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: balance <= 0 ? P.green : P.accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
          {isGroupBooking ? 'Group ' : ''}Balance Due
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: balance <= 0 ? P.green : P.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(balance)}
        </div>
      </div>
    </>
  );
}
