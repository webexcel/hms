import { formatCurrency, formatDate, capitalize } from '../../../utils/formatters';
import { PAYMENT_METHODS } from '../hooks/useBilling';

export default function PaymentModal({
  showPaymentModal, setShowPaymentModal,
  selectedBilling, setSelectedBilling,
  selectedReservation, setSelectedReservation,
  paymentData, setPaymentData,
  paymentSubmitting,
  groupPaymentId,
  allUnpaidBillings, upcomingReservations,
  handleRecordPayment, handleAdvanceFromPaymentModal,
  getGuestName, getBalance,
}) {
  if (!showPaymentModal) return null;

  return (
    <div className="modal fade show bl-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowPaymentModal(false); }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{ borderRadius: '16px', border: 'none', overflow: 'hidden' }}>
          <div className="modal-header green" style={{ background: groupPaymentId ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', padding: '20px 24px', borderBottom: 'none' }}>
            <h5 className="modal-title" style={{ fontWeight: 600, fontSize: '18px', margin: 0 }}>
              <i className={`bi ${groupPaymentId ? 'bi-people-fill' : 'bi-credit-card'} me-2`}></i>
              {groupPaymentId ? 'Record Group Payment' : 'Record Payment'}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowPaymentModal(false)}></button>
          </div>
          <div className="modal-body" style={{ padding: '24px' }}>
            <form onSubmit={(e) => e.preventDefault()}>
              {!selectedBilling && !selectedReservation && !groupPaymentId && (
                <SelectionPanel
                  paymentData={paymentData}
                  setPaymentData={setPaymentData}
                  allUnpaidBillings={allUnpaidBillings}
                  upcomingReservations={upcomingReservations}
                  setSelectedBilling={setSelectedBilling}
                  setSelectedReservation={setSelectedReservation}
                  getGuestName={getGuestName}
                  getBalance={getBalance}
                />
              )}
              {selectedBilling && (
                <SelectedBillingInfo
                  selectedBilling={selectedBilling}
                  setSelectedBilling={setSelectedBilling}
                  groupPaymentId={groupPaymentId}
                  paymentData={paymentData}
                  setPaymentData={setPaymentData}
                  getGuestName={getGuestName}
                  getBalance={getBalance}
                />
              )}
              {selectedReservation && !selectedBilling && (
                <SelectedReservationInfo
                  selectedReservation={selectedReservation}
                  setSelectedReservation={setSelectedReservation}
                  setPaymentData={setPaymentData}
                />
              )}
              <div className="mb-3">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  step="0.01"
                  placeholder="Enter amount"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData((p) => ({ ...p, amount: e.target.value }))}
                  style={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Payment Method</label>
                <div className="bl-pay-method-grid">
                  {PAYMENT_METHODS.map((method) => (
                    <div className="bl-pay-method" key={method.value}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        id={`method-${method.value}`}
                        checked={paymentData.payment_method === method.value}
                        onChange={() => setPaymentData((p) => ({ ...p, payment_method: method.value }))}
                      />
                      <label htmlFor={`method-${method.value}`}>
                        <i className={`bi ${method.icon}`}></i>
                        <span>{method.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Reference Number (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Transaction/Reference ID"
                  value={paymentData.transaction_ref}
                  onChange={(e) => setPaymentData((p) => ({ ...p, transaction_ref: e.target.value }))}
                  style={{ borderRadius: '10px', border: '1px solid #e2e8f0' }}
                />
              </div>
            </form>
          </div>
          <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
            <button className="btn btn-light" onClick={() => setShowPaymentModal(false)}>Cancel</button>
            {selectedReservation && !selectedBilling ? (
              <button
                className="btn"
                style={{ background: '#6366f1', color: '#fff', borderRadius: 10 }}
                onClick={handleAdvanceFromPaymentModal}
                disabled={paymentSubmitting || !selectedReservation}
              >
                <i className="bi bi-check-lg me-1"></i>
                {paymentSubmitting ? 'Processing...' : 'Collect Advance'}
              </button>
            ) : (
              <button
                className="btn btn-success"
                onClick={handleRecordPayment}
                disabled={paymentSubmitting || !selectedBilling}
              >
                <i className="bi bi-check-lg me-1"></i>
                {paymentSubmitting ? 'Processing...' : 'Record Payment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Selection Panel (tabs + search + list) ───

function SelectionPanel({
  paymentData, setPaymentData,
  allUnpaidBillings, upcomingReservations,
  setSelectedBilling, setSelectedReservation,
  getGuestName, getBalance,
}) {
  const q = (paymentData._search || '').toLowerCase().trim();
  const df = paymentData._dateFilter || '';
  const tab = paymentData._tab || 'billing';

  return (
    <div className="mb-3">
      {/* Tabs */}
      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3, marginBottom: 12 }}>
        <button type="button" onClick={() => setPaymentData(p => ({ ...p, _tab: 'billing' }))}
          style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: (paymentData._tab || 'billing') === 'billing' ? '#fff' : 'transparent',
            color: (paymentData._tab || 'billing') === 'billing' ? '#1a1a2e' : '#64748b',
            boxShadow: (paymentData._tab || 'billing') === 'billing' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
          <i className="bi bi-receipt me-1"></i>Active Folios ({allUnpaidBillings.length})
        </button>
        <button type="button" onClick={() => setPaymentData(p => ({ ...p, _tab: 'advance' }))}
          style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: paymentData._tab === 'advance' ? '#fff' : 'transparent',
            color: paymentData._tab === 'advance' ? '#1a1a2e' : '#64748b',
            boxShadow: paymentData._tab === 'advance' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
          <i className="bi bi-wallet2 me-1"></i>Advance ({upcomingReservations.length})
        </button>
      </div>

      {/* Search */}
      <div className="d-flex gap-2" style={{ marginBottom: 10 }}>
        <input type="text" className="form-control" placeholder="Search guest name, phone, room..."
          value={paymentData._search || ''} onChange={(e) => setPaymentData(p => ({ ...p, _search: e.target.value }))}
          style={{ borderRadius: 10, border: '1px solid #e2e8f0' }} autoFocus />
        <input type="date" className="form-control" value={paymentData._dateFilter || ''}
          onChange={(e) => setPaymentData(p => ({ ...p, _dateFilter: e.target.value }))}
          style={{ borderRadius: 10, border: '1px solid #e2e8f0', maxWidth: 160 }} />
        {paymentData._dateFilter && (
          <button type="button" onClick={() => setPaymentData(p => ({ ...p, _dateFilter: '' }))}
            style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}>
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 280, overflowY: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        {tab === 'billing' ? (
          <BillingList
            allUnpaidBillings={allUnpaidBillings}
            q={q} df={df}
            setSelectedBilling={setSelectedBilling}
            setPaymentData={setPaymentData}
            getGuestName={getGuestName}
            getBalance={getBalance}
          />
        ) : (
          <ReservationList
            upcomingReservations={upcomingReservations}
            q={q} df={df}
            setSelectedReservation={setSelectedReservation}
            setPaymentData={setPaymentData}
          />
        )}
      </div>
    </div>
  );
}

// ─── Billing List ───

function BillingList({ allUnpaidBillings, q, df, setSelectedBilling, setPaymentData, getGuestName, getBalance }) {
  const filtered = allUnpaidBillings.filter(b => {
    const name = getGuestName(b).toLowerCase();
    const room = (b.reservation?.room?.room_number || b.room_number || '').toLowerCase();
    const phone = (b.guest?.phone || '').toLowerCase();
    const checkIn = (b.reservation?.check_in_date || '').slice(0, 10);
    const textMatch = !q || name.includes(q) || room.includes(q) || phone.includes(q);
    const dateMatch = !df || checkIn === df;
    return textMatch && dateMatch;
  });

  if (filtered.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        <i className="bi bi-search me-1"></i>{q || df ? 'No matching folios' : 'No outstanding payments'}
      </div>
    );
  }

  return filtered.map(b => {
    const status = b.reservation?.status;
    const tag = status === 'checked_in' ? 'In-House' : status === 'confirmed' ? 'Upcoming' : capitalize(status || '');
    return (
      <div key={b.id} onClick={() => {
        setSelectedBilling(b);
        setPaymentData(p => ({ ...p, amount: (parseFloat(b.balance_due) || 0).toFixed(2) }));
      }}
        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{getGuestName(b)}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              <i className="bi bi-door-open me-1"></i>Room {b.reservation?.room?.room_number || b.room_number || '-'}
              <span style={{ margin: '0 6px' }}>&middot;</span>
              <i className="bi bi-receipt me-1"></i>#{b.invoice_number || b.id}
              {b.reservation?.check_in_date && <><span style={{ margin: '0 6px' }}>&middot;</span><i className="bi bi-calendar me-1"></i>{formatDate(b.reservation.check_in_date, 'DD MMM')}</>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 14 }}>{formatCurrency(getBalance(b))}</div>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
              background: status === 'checked_in' ? '#dcfce7' : '#fef3c7',
              color: status === 'checked_in' ? '#166534' : '#92400e' }}>{tag}</span>
          </div>
        </div>
      </div>
    );
  });
}

// ─── Reservation List ───

function ReservationList({ upcomingReservations, q, df, setSelectedReservation, setPaymentData }) {
  const filtered = upcomingReservations.filter(r => {
    const guest = r.guest || {};
    const name = `${guest.first_name || ''} ${guest.last_name || ''}`.toLowerCase();
    const phone = (guest.phone || '').toLowerCase();
    const room = (r.room?.room_number || '').toLowerCase();
    const checkIn = (r.check_in_date || r.check_in || '').slice(0, 10);
    const textMatch = !q || name.includes(q) || phone.includes(q) || room.includes(q);
    const dateMatch = !df || checkIn === df;
    return textMatch && dateMatch;
  });

  if (filtered.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        <i className="bi bi-search me-1"></i>{q || df ? 'No matching reservations' : 'No upcoming reservations'}
      </div>
    );
  }

  return filtered.map(r => {
    const guest = r.guest || {};
    const checkIn = r.check_in_date || r.check_in;
    const checkOut = r.check_out_date || r.check_out;
    return (
      <div key={r.id} onClick={() => {
        setSelectedReservation(r);
        setPaymentData(p => ({ ...p, amount: '' }));
      }}
        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f3ff'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{guest.first_name} {guest.last_name}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              <i className="bi bi-door-open me-1"></i>Room {r.room?.room_number || '-'}
              <span style={{ margin: '0 6px' }}>&middot;</span>
              <i className="bi bi-calendar me-1"></i>{formatDate(checkIn, 'DD MMM')}
              {r.booking_type !== 'hourly' && <> — {formatDate(checkOut, 'DD MMM')}</>}
              {r.booking_type === 'hourly' && <> ({r.expected_hours}h)</>}
              {guest.phone && <><span style={{ margin: '0 6px' }}>&middot;</span><i className="bi bi-telephone me-1"></i>{guest.phone}</>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
              background: r.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
              color: r.status === 'confirmed' ? '#166534' : '#92400e' }}>
              {capitalize(r.status)}
            </span>
            {parseFloat(r.advance_paid) > 0 && (
              <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>
                Adv: {formatCurrency(r.advance_paid)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  });
}

// ─── Selected Billing Info ───

function SelectedBillingInfo({ selectedBilling, setSelectedBilling, groupPaymentId, paymentData, setPaymentData, getGuestName, getBalance }) {
  return (
    <div className="mb-3" style={{ background: groupPaymentId ? '#fffbeb' : '#f8fafc', borderRadius: '12px', padding: '14px', border: groupPaymentId ? '1px solid #fcd34d' : '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: '#64748b' }}>Paying for</div>
        {!groupPaymentId && (
          <button type="button" onClick={() => { setSelectedBilling(null); setPaymentData(p => ({ ...p, amount: '' })); }}
            style={{ fontSize: 11, background: 'none', border: '1px solid #cbd5e1', color: '#2563eb', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}>
            Change
          </button>
        )}
      </div>
      <div style={{ fontWeight: 600, color: '#1a1a2e' }}>
        {getGuestName(selectedBilling)}
        {groupPaymentId
          ? <span style={{ background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>Group: {groupPaymentId}</span>
          : ` — #${selectedBilling.invoice_number || selectedBilling.id}`
        }
      </div>
      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
        {groupPaymentId
          ? <>Payment will be distributed across all rooms in this group</>
          : <>
              <i className="bi bi-door-open me-1"></i>Room {selectedBilling.reservation?.room?.room_number || selectedBilling.room_number || '-'}
              <span style={{ margin: '0 6px' }}>&middot;</span>
              Outstanding: <strong style={{ color: '#dc2626' }}>{formatCurrency(getBalance(selectedBilling))}</strong>
            </>
        }
      </div>
    </div>
  );
}

// ─── Selected Reservation Info ───

function SelectedReservationInfo({ selectedReservation, setSelectedReservation, setPaymentData }) {
  return (
    <div className="mb-3" style={{ background: '#f5f3ff', borderRadius: '12px', padding: '14px', border: '1px solid #e9d5ff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          <span style={{ background: '#8b5cf6', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>ADVANCE</span>
          Collecting advance for
        </div>
        <button type="button" onClick={() => { setSelectedReservation(null); setPaymentData(p => ({ ...p, amount: '' })); }}
          style={{ fontSize: 11, background: 'none', border: '1px solid #c4b5fd', color: '#7c3aed', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}>
          Change
        </button>
      </div>
      <div style={{ fontWeight: 600, color: '#1a1a2e', marginTop: 4 }}>
        {selectedReservation.guest?.first_name} {selectedReservation.guest?.last_name}
      </div>
      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
        <i className="bi bi-door-open me-1"></i>Room {selectedReservation.room?.room_number || '-'}
        <span style={{ margin: '0 6px' }}>&middot;</span>
        <i className="bi bi-calendar me-1"></i>{formatDate(selectedReservation.check_in_date || selectedReservation.check_in, 'DD MMM YYYY')}
        {selectedReservation.booking_type === 'hourly'
          ? <> ({selectedReservation.expected_hours}h Short Stay)</>
          : <> — {formatDate(selectedReservation.check_out_date || selectedReservation.check_out, 'DD MMM YYYY')}</>
        }
        {parseFloat(selectedReservation.advance_paid) > 0 && (
          <span style={{ marginLeft: 8, color: '#16a34a', fontWeight: 600 }}>
            Already paid: {formatCurrency(selectedReservation.advance_paid)}
          </span>
        )}
      </div>
    </div>
  );
}
