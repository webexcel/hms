import { useState } from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import toast from 'react-hot-toast';

export default function FolioDetailModal({
  showDetailModal, setShowDetailModal,
  selectedBilling, billingItems, detailLoading,
  newItem, setNewItem, handleAddItem,
  getGuestName, getStatusLabel, getTotal, getBalance,
  setPaymentData, setShowPaymentModal,
  onApplyDiscount, api, fetchBillingDetail,
}) {
  const [gstToggling, setGstToggling] = useState(false);

  const handleToggleGst = async () => {
    if (!selectedBilling) return;
    setGstToggling(true);
    try {
      const res = await api.post(`/billing/${selectedBilling.id}/toggle-gst`);
      toast.success(res.data.message);
      if (fetchBillingDetail) fetchBillingDetail(selectedBilling);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update GST mark');
    } finally {
      setGstToggling(false);
    }
  };

  if (!showDetailModal) return null;

  return (
    <div className="modal fade show bl-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowDetailModal(false); }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content" style={{ borderRadius: '16px', border: 'none', overflow: 'hidden' }}>
          <div className="modal-header blue" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', padding: '20px 24px', borderBottom: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h5 className="modal-title" style={{ fontWeight: 600, fontSize: '18px', margin: 0 }}>
                <i className="bi bi-folder2-open me-2"></i>
                {selectedBilling ? `Folio #${selectedBilling.invoice_number || selectedBilling.id}` : 'Folio Details'}
              </h5>
              {selectedBilling && (
                <>
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                    {getStatusLabel(selectedBilling.payment_status || selectedBilling.status)}
                  </span>
                  {selectedBilling.gst_bill_number && (
                    <span style={{ background: 'rgba(16,185,129,0.3)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                      <i className="bi bi-receipt me-1"></i>GST
                    </span>
                  )}
                </>
              )}
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
          </div>
          <div className="modal-body" style={{ padding: '24px' }}>
            {detailLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : selectedBilling ? (
              <div className="row">
                {/* Guest & Stay Info */}
                <div className="col-md-4">
                  <GuestInfoPanel selectedBilling={selectedBilling} getGuestName={getGuestName} />
                  <PaymentSummaryPanel
                    selectedBilling={selectedBilling}
                    billingItems={billingItems}
                    getTotal={getTotal}
                    getBalance={getBalance}
                  />
                  <DiscountPanel
                    selectedBilling={selectedBilling}
                    billingItems={billingItems}
                    onApplyDiscount={onApplyDiscount}
                  />
                </div>

                {/* Charges Breakdown */}
                <div className="col-md-8">
                  <ChargesBreakdown
                    billingItems={billingItems}
                    newItem={newItem}
                    setNewItem={setNewItem}
                    handleAddItem={handleAddItem}
                  />
                  <PaymentHistory payments={selectedBilling?.payments || []} />
                </div>
              </div>
            ) : null}
          </div>
          <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-outline-primary"
                onClick={() => window.open(`/billing/${selectedBilling?.id}/invoice`, '_blank')}
              >
                <i className="bi bi-file-earmark-text me-1"></i>Invoice
              </button>
              <button
                className={`btn ${selectedBilling?.gst_bill_number ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={handleToggleGst}
                disabled={gstToggling}
              >
                {gstToggling ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : selectedBilling?.gst_bill_number ? (
                  <><i className="bi bi-check-circle me-1"></i>GST</>
                ) : (
                  <><i className="bi bi-receipt me-1"></i>Mark GST</>
                )}
              </button>
              {selectedBilling?.reservation_id && (
                <>
                  <button className="btn btn-outline-success" onClick={async () => {
                    try {
                      const res = await api.get(`/reservations/${selectedBilling.reservation_id}/check-in-summary`, { responseType: 'blob', silent: true });
                      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                      window.open(url, '_blank');
                    } catch { toast.error('Failed to generate check-in summary'); }
                  }}>
                    <i className="bi bi-box-arrow-in-right me-1"></i>Check-in Card
                  </button>
                  <button className="btn btn-outline-warning" onClick={async () => {
                    try {
                      const res = await api.get(`/reservations/${selectedBilling.reservation_id}/check-out-summary`, { responseType: 'blob', silent: true });
                      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                      window.open(url, '_blank');
                    } catch { toast.error('Failed to generate check-out summary'); }
                  }}>
                    <i className="bi bi-box-arrow-right me-1"></i>Checkout Summary
                  </button>
                </>
              )}
            </div>
            <div className="d-flex gap-2 ms-auto">
              <button className="btn btn-light" onClick={() => setShowDetailModal(false)}>Close</button>
              {(selectedBilling?.payment_status || selectedBilling?.status) !== 'paid' && parseFloat(selectedBilling?.balance_due) > 0 && (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    setPaymentData({ amount: (parseFloat(selectedBilling?.balance_due) || 0).toFixed(2), payment_method: 'cash', payment_type: 'payment', transaction_ref: '' });
                    setShowDetailModal(false);
                    setShowPaymentModal(true);
                  }}
                >
                  <i className="bi bi-credit-card me-1"></i>Record Payment
                </button>
              )}
              {selectedBilling && parseFloat(selectedBilling?.balance_due) < 0 && (
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    const refundable = Math.abs(parseFloat(selectedBilling?.balance_due) || 0);
                    setPaymentData({ amount: refundable > 0 ? refundable.toFixed(2) : '', payment_method: 'cash', payment_type: 'refund', transaction_ref: '' });
                    setShowDetailModal(false);
                    setShowPaymentModal(true);
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Guest Info Panel ───

function GuestInfoPanel({ selectedBilling, getGuestName }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
      <h6><i className="bi bi-person me-2"></i>Guest Information</h6>
      <div style={{ marginTop: '12px' }}>
        <h5 style={{ fontWeight: 600, marginBottom: '8px' }}>{getGuestName(selectedBilling)}</h5>
        <p className="text-muted mb-1" style={{ fontSize: '13px' }}>
          <i className="bi bi-door-open me-1"></i> Room {selectedBilling.room_number || '-'}
        </p>
      </div>
    </div>
  );
}

// ─── OM Discount Panel ───

function DiscountPanel({ selectedBilling, billingItems, onApplyDiscount }) {
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState('amount');
  const [discountValue, setDiscountValue] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [applying, setApplying] = useState(false);

  const hasDiscount = parseFloat(selectedBilling?.discount_amount) > 0;

  // Calculate max discount from misc items only
  const miscTotal = (billingItems || [])
    .filter(i => i.item_type === 'service' && i.description && i.description.toLowerCase().includes('misc'))
    .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const handleApply = async () => {
    if (!discountValue || Number(discountValue) <= 0) return;
    if (miscTotal <= 0) {
      toast.error('No misc charges to apply discount on');
      return;
    }
    const effectiveDiscount = discountType === 'percent'
      ? miscTotal * (Number(discountValue) / 100)
      : Number(discountValue);
    if (effectiveDiscount > miscTotal) {
      toast.error(`Max discount is ${formatCurrency(miscTotal)} (Misc charges only)`);
      return;
    }
    setApplying(true);
    try {
      await onApplyDiscount(selectedBilling.id, {
        discount_type: discountType,
        discount_value: discountValue,
        discount_reason: discountReason,
      });
      setShowDiscount(false);
      setDiscountValue('');
      setDiscountReason('');
    } finally {
      setApplying(false);
    }
  };

  const handleRemove = async () => {
    setApplying(true);
    try {
      await onApplyDiscount(selectedBilling.id, {
        discount_type: 'amount',
        discount_value: 0,
        discount_reason: '',
      });
      setShowDiscount(false);
      setDiscountValue('');
      setDiscountReason('');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #c4b5fd', borderRadius: 12, padding: 16, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showDiscount ? 12 : 0 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: '#6d28d9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-percent"></i> OM Discount
        </label>
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" style={{ width: 40, height: 20 }}
            checked={showDiscount}
            onChange={e => setShowDiscount(e.target.checked)}
          />
        </div>
      </div>

      {/* Show existing discount info */}
      {hasDiscount && !showDiscount && (
        <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff', borderRadius: 8, border: '1px solid #ddd6fe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#6d28d9', fontWeight: 600 }}>
              <i className="bi bi-tag me-1"></i>
              {formatCurrency(parseFloat(selectedBilling.discount_amount))} discount applied
            </span>
            <button className="btn btn-sm" style={{ fontSize: 11, color: '#dc2626', padding: '2px 8px' }}
              onClick={handleRemove} disabled={applying}>
              <i className="bi bi-x-lg me-1"></i>Remove
            </button>
          </div>
          {selectedBilling.notes && (
            <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 4 }}>{selectedBilling.notes}</div>
          )}
        </div>
      )}

      {showDiscount && (
        <>
          <div className="row g-2">
            <div className="col-md-6">
              <select className="form-select form-select-sm" value={discountType}
                onChange={e => setDiscountType(e.target.value)} style={{ borderRadius: 8 }}>
                <option value="amount">Fixed Amount (Rs)</option>
                <option value="percent">Percentage (%)</option>
              </select>
            </div>
            <div className="col-md-6">
              <input type="number" className="form-control form-control-sm"
                value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                min="0" max={discountType === 'percent' ? 100 : miscTotal}
                placeholder={discountType === 'percent' ? 'Max 100%' : `Max ${miscTotal}`}
                style={{ borderRadius: 8 }} />
            </div>
          </div>
          <div className="mt-2">
            <select className="form-select form-select-sm" value={discountReason}
              onChange={e => setDiscountReason(e.target.value)} style={{ borderRadius: 8 }}>
              <option value="">Select reason...</option>
              <option value="OM Instruction">OM Instruction</option>
              <option value="Guest Complaint">Guest Complaint</option>
              <option value="Repeat Guest">Repeat Guest</option>
              <option value="Corporate Rate">Corporate Rate</option>
              <option value="Long Stay">Long Stay</option>
              <option value="Complimentary">Complimentary</option>
              <option value="Service Issue">Service Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <button type="button" className="btn btn-sm w-100 mt-2"
            style={{ background: '#7c3aed', color: '#fff', borderRadius: 8, fontWeight: 600 }}
            onClick={handleApply} disabled={applying || !discountValue || miscTotal <= 0}>
            {applying ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Applying...</>
            ) : (
              <><i className="bi bi-check-lg me-1"></i>Apply Discount</>
            )}
          </button>
          <small style={{ color: miscTotal > 0 ? '#7c3aed' : '#dc2626', fontSize: 11, marginTop: 8, display: 'block' }}>
            <i className="bi bi-info-circle me-1"></i>
            {miscTotal > 0
              ? `Max discount: ${formatCurrency(miscTotal)} (Misc charges only)`
              : 'No misc charges — discount not available'}
          </small>
        </>
      )}
    </div>
  );
}

// ─── Payment Summary Panel ───

function PaymentSummaryPanel({ selectedBilling, billingItems, getTotal, getBalance }) {
  const roomItems = billingItems.filter(i => i.item_type === 'room_charge');
  const restItems = billingItems.filter(i => i.item_type === 'restaurant');
  const otherItems = billingItems.filter(i => i.item_type !== 'room_charge' && i.item_type !== 'restaurant');
  const roomTotal = roomItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const restTotal = restItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const otherTotal = otherItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const roomGstPct = roomItems[0] ? (parseFloat(roomItems[0].gst_rate) || 5) : 5;
  const roomGst = roomTotal * roomGstPct / 100;
  const restGst = restTotal * 0.05;
  const otherGst = otherItems.reduce((s, i) => s + ((parseFloat(i.amount) || 0) * (parseFloat(i.gst_rate) || 0) / 100), 0);
  const balance = getBalance(selectedBilling);

  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
      <h6><i className="bi bi-credit-card me-2"></i>Payment Summary</h6>
      <div style={{ marginTop: '12px' }}>
        {/* Room Charges */}
        {roomTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span className="text-muted"><i className="bi bi-door-open me-1"></i>Room Charges</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(roomTotal)}</span>
          </div>
        )}

        {/* Restaurant Charges */}
        {restTotal > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', color: '#9a3412' }}>
              <span><i className="bi bi-cup-hot me-1"></i>Restaurant Charges</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(restTotal)}</span>
            </div>
            {restItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 20px', fontSize: '12px', color: '#92400e' }}>
                <span><i className="bi bi-cup-hot me-1" style={{ fontSize: 10 }}></i>{item.description}{item.date && <span style={{ color: '#a16207', marginLeft: 4 }}>({item.date})</span>}</span>
                <span>{formatCurrency(parseFloat(item.amount) || 0)}</span>
              </div>
            ))}
          </>
        )}

        {/* Other Charges */}
        {otherTotal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span className="text-muted"><i className="bi bi-tag me-1"></i>Other Charges</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(otherTotal)}</span>
          </div>
        )}

        {/* Subtotal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
          <span className="text-muted">Subtotal</span>
          <span style={{ fontWeight: 600 }}>{formatCurrency(parseFloat(selectedBilling.subtotal) || 0)}</span>
        </div>

        {/* GST Breakdown */}
        {roomGst > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
            <span className="text-muted">CGST (Room {roomGstPct / 2}%)</span>
            <span style={{ fontWeight: 500 }}>{formatCurrency(roomGst / 2)}</span>
          </div>
        )}
        {roomGst > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
            <span className="text-muted">SGST (Room {roomGstPct / 2}%)</span>
            <span style={{ fontWeight: 500 }}>{formatCurrency(roomGst / 2)}</span>
          </div>
        )}
        {restGst > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px', color: '#9a3412' }}>
            <span>GST (Restaurant 5%)</span>
            <span style={{ fontWeight: 500 }}>{formatCurrency(restGst)}</span>
          </div>
        )}
        {otherGst > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
            <span className="text-muted">GST (Other)</span>
            <span style={{ fontWeight: 500 }}>{formatCurrency(otherGst)}</span>
          </div>
        )}

        {/* Discount */}
        {parseFloat(selectedBilling.discount_amount) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px', color: '#8b5cf6' }}>
            <span><i className="bi bi-tag me-1"></i>OM Discount</span>
            <span style={{ fontWeight: 500 }}>- {formatCurrency(parseFloat(selectedBilling.discount_amount))}</span>
          </div>
        )}

        {/* Grand Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '2px solid #e2e8f0', background: '#f0fdf4', margin: '4px -20px', paddingLeft: 20, paddingRight: 20 }}>
          <span style={{ fontWeight: 700 }}>Grand Total</span>
          <span style={{ fontWeight: 700 }}>{formatCurrency(getTotal(selectedBilling))}</span>
        </div>

        {/* Paid */}
        {parseFloat(selectedBilling.paid_amount) > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', color: '#10b981' }}>
            <span>Paid Amount</span>
            <span style={{ fontWeight: 600 }}>- {formatCurrency(selectedBilling.paid_amount)}</span>
          </div>
        )}

        {/* Balance Due */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 700, background: balance > 0 ? '#fef2f2' : '#f0fdf4', margin: '4px -20px', paddingLeft: 20, paddingRight: 20, borderRadius: '0 0 8px 8px' }}>
          <span>{balance < 0 ? 'Refundable Amount' : 'Balance Due'}</span>
          <span style={{ color: balance > 0 ? '#dc2626' : '#16a34a' }}>
            {formatCurrency(Math.abs(balance))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Charges Breakdown Table ───

function ChargesBreakdown({ billingItems, newItem, setNewItem, handleAddItem }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h6 style={{ margin: 0 }}><i className="bi bi-list-check me-2"></i>Charges Breakdown</h6>
      </div>
      <div className="table-responsive">
        <table className="table table-sm" style={{ fontSize: '13px' }}>
          <thead>
            <tr>
              <th>Description</th>
              <th className="text-center">Qty</th>
              <th className="text-end">Rate</th>
              <th className="text-end">Amount</th>
              <th className="text-center">GST %</th>
              <th className="text-end">GST</th>
            </tr>
          </thead>
          <tbody>
            {billingItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-3">No items</td>
              </tr>
            ) : (
              <>
                {billingItems.map((item, idx) => {
                  const amt = parseFloat(item.amount) || 0;
                  const gstPct = parseFloat(item.gst_rate) || 0;
                  const gstAmt = amt * gstPct / 100;
                  return (
                    <tr key={item.id || idx}>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: item.item_type === 'restaurant' ? '#9a3412' : item.item_type === 'room_charge' ? '#1e40af' : '#334155', background: item.item_type === 'restaurant' ? '#fff7ed' : item.item_type === 'room_charge' ? '#eff6ff' : '#f8fafc', padding: '1px 6px', borderRadius: 4, marginRight: 6 }}>
                          {item.item_type === 'room_charge' ? 'ROOM' : item.item_type === 'restaurant' ? 'F&B' : (item.item_type || 'OTHER').toUpperCase()}
                        </span>
                        {item.description}
                        {item.hsn_code && <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 4 }}>HSN: {item.hsn_code}</span>}
                      </td>
                      <td className="text-center">{item.quantity || 1}</td>
                      <td className="text-end">{formatCurrency(parseFloat(item.unit_price) || amt)}</td>
                      <td className="text-end">{formatCurrency(amt)}</td>
                      <td className="text-center">{gstPct}%</td>
                      <td className="text-end">{formatCurrency(gstAmt)}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#f0f9ff', fontWeight: 600 }}>
                  <td colSpan={3} className="text-end">Total</td>
                  <td className="text-end">{formatCurrency(billingItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0))}</td>
                  <td></td>
                  <td className="text-end">{formatCurrency(billingItems.reduce((s, i) => s + ((parseFloat(i.amount) || 0) * (parseFloat(i.gst_rate) || 0) / 100), 0))}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
        <h6 className="section-title" style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          <i className="bi bi-plus-circle me-2"></i>Add Item
        </h6>
        <div className="row g-2 align-items-end">
          <div className="col-md-5">
            <input
              type="text"
              className="form-control"
              placeholder="Description"
              value={newItem.description}
              onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
              style={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
            />
          </div>
          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Qty"
              value={newItem.quantity}
              onChange={(e) => setNewItem((p) => ({ ...p, quantity: e.target.value }))}
              style={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
            />
          </div>
          <div className="col-md-3">
            <input
              type="number"
              className="form-control"
              placeholder="Amount"
              value={newItem.amount}
              onChange={(e) => setNewItem((p) => ({ ...p, amount: e.target.value }))}
              style={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
            />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" onClick={handleAddItem} style={{ borderRadius: '10px' }}>
              <i className="bi bi-plus me-1"></i>Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment History ───

function PaymentHistory({ payments }) {
  if (!payments || payments.length === 0) {
    return (
      <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20 }}>
        <h6><i className="bi bi-clock-history me-2"></i>Payment History</h6>
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 16 }}>
          No payments recorded yet
        </div>
      </div>
    );
  }

  const totalPayments = payments.filter(p => p.payment_type !== 'refund').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const totalRefunds = payments.filter(p => p.payment_type === 'refund').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h6 style={{ margin: 0 }}><i className="bi bi-clock-history me-2"></i>Payment History ({payments.length})</h6>
        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
          {totalPayments > 0 && <span style={{ color: '#16a34a', fontWeight: 600 }}>Paid: {formatCurrency(totalPayments)}</span>}
          {totalRefunds > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>Refunded: {formatCurrency(totalRefunds)}</span>}
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-sm" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Method</th>
              <th>Reference</th>
              <th className="text-end">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p, i) => {
              const isRefund = p.payment_type === 'refund';
              return (
                <tr key={p.id || i} style={{ background: isRefund ? '#fef2f2' : 'transparent' }}>
                  <td>{formatDate(p.payment_date || p.created_at || p.createdAt, 'DD MMM YYYY hh:mm A')}</td>
                  <td>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: isRefund ? '#fecaca' : '#dcfce7',
                      color: isRefund ? '#991b1b' : '#166534',
                    }}>
                      {isRefund ? 'REFUND' : 'PAYMENT'}
                    </span>
                  </td>
                  <td style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>
                    {(p.payment_method || 'cash').replace('_', ' ')}
                  </td>
                  <td style={{ fontSize: 12, color: '#64748b' }}>
                    {p.transaction_ref || p.reference_number || '—'}
                  </td>
                  <td className="text-end" style={{ fontWeight: 600, color: isRefund ? '#dc2626' : '#16a34a' }}>
                    {isRefund ? '- ' : '+ '}{formatCurrency(parseFloat(p.amount) || 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
