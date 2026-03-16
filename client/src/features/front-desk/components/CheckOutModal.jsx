import { Modal } from 'react-bootstrap';
import { formatDate, formatCurrency, capitalize } from '../../../utils/formatters';
import { gstInclusiveRate } from '../hooks/useFrontDesk';
import { useApi } from '../../../hooks/useApi';
import toast from 'react-hot-toast';

export default function CheckOutModal({
  showCheckOutModal, setShowCheckOutModal, checkOutData, selectedRoom,
  coGuest, coRoom, coBilling, coNights, coRate, roomCharges,
  restaurantCharges, restaurantItems, coSubtotal, coGst, coGrandTotal,
  appliedDiscount, coTotalAfterDiscount, coAdvance, coBalance,
  applyDiscount, setApplyDiscount, discountType, setDiscountType,
  discountValue, setDiscountValue, discountReason, setDiscountReason,
  setAppliedDiscount, handleApplyDiscount,
  showTransferSection, setShowTransferSection,
  transferRoomId, setTransferRoomId, transferReason, setTransferReason,
  transferAdjustRate, setTransferAdjustRate, transferLoading,
  availableTransferRooms, selectedTransferRoom, handleRoomTransfer,
  sendInvoice, setSendInvoice,
  handleCheckOut, handleGroupCheckOut,
  navigate, fetchData,
  showRestaurantCharges, setShowRestaurantCharges,
}) {
  const { post } = useApi();

  return (
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
  );
}
