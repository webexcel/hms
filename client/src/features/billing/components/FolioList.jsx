import { formatCurrency, formatDate } from '../../../utils/formatters';

export default function FolioList({
  billings, loading, currentPage, setCurrentPage, totalPages,
  getGuestName, getInitials, getStatusClass, getStatusLabel,
  getAvatarClass, getTotal, getBalance, getPaymentPercent, getProgressBarClass,
  fetchBillingDetail,
  setSelectedBilling, setGroupPaymentId, setPaymentData, setShowPaymentModal,
}) {
  if (loading) {
    return (
      <div className="bl-section">
        <div className="bl-section-header">
          <h3 className="bl-section-title"><i className="bi bi-folder-open"></i> Active Folios</h3>
        </div>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Group billings by group_id
  const grouped = [];
  const groupMap = {};
  billings.forEach((billing) => {
    const gid = billing.reservation?.group_id;
    if (gid) {
      if (!groupMap[gid]) {
        groupMap[gid] = { groupId: gid, billings: [] };
        grouped.push(groupMap[gid]);
      }
      groupMap[gid].billings.push(billing);
    } else {
      grouped.push({ groupId: null, billings: [billing] });
    }
  });

  return (
    <div className="bl-section">
      <div className="bl-section-header">
        <h3 className="bl-section-title"><i className="bi bi-folder-open"></i> Active Folios</h3>
        <span style={{ background: '#eef2ff', color: '#6366f1', padding: '5px 14px', borderRadius: 20, fontWeight: 600, fontSize: 13 }}>
          {billings.length} Records
        </span>
      </div>

      {billings.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-receipt" style={{ fontSize: 48, color: '#cbd5e1' }}></i>
          <p className="text-muted mt-2">No billing records found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {grouped.map((entry, gIdx) =>
            entry.groupId ? (
              <GroupRow
                key={`grp-${entry.groupId}`}
                entry={entry}
                gIdx={gIdx}
                getGuestName={getGuestName}
                getInitials={getInitials}
                getStatusClass={getStatusClass}
                getStatusLabel={getStatusLabel}
                getAvatarClass={getAvatarClass}
                getTotal={getTotal}
                getBalance={getBalance}
                getProgressBarClass={getProgressBarClass}
                fetchBillingDetail={fetchBillingDetail}
                setSelectedBilling={setSelectedBilling}
                setGroupPaymentId={setGroupPaymentId}
                setPaymentData={setPaymentData}
                setShowPaymentModal={setShowPaymentModal}
              />
            ) : (
              <FolioRow
                key={entry.billings[0].id || gIdx}
                billing={entry.billings[0]}
                index={gIdx}
                getGuestName={getGuestName}
                getInitials={getInitials}
                getStatusClass={getStatusClass}
                getStatusLabel={getStatusLabel}
                getAvatarClass={getAvatarClass}
                getTotal={getTotal}
                getBalance={getBalance}
                getPaymentPercent={getPaymentPercent}
                getProgressBarClass={getProgressBarClass}
                fetchBillingDetail={fetchBillingDetail}
                setSelectedBilling={setSelectedBilling}
                setGroupPaymentId={setGroupPaymentId}
                setPaymentData={setPaymentData}
                setShowPaymentModal={setShowPaymentModal}
              />
            )
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3 gap-2">
          <button className="btn btn-sm btn-outline-secondary" disabled={currentPage <= 1} onClick={() => setCurrentPage(currentPage - 1)}>
            <i className="bi bi-chevron-left"></i> Prev
          </button>
          <span className="d-flex align-items-center px-3 text-muted" style={{ fontSize: 13 }}>
            Page {currentPage} of {totalPages}
          </span>
          <button className="btn btn-sm btn-outline-secondary" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
            Next <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Status Dot ───
function StatusDot({ statusClass }) {
  const colors = { paid: '#10b981', partial: '#f59e0b', overdue: '#ef4444', open: '#3b82f6' };
  return (
    <span style={{
      width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
      background: colors[statusClass] || colors.open, flexShrink: 0,
    }} />
  );
}

// ─── Individual Folio Row ───
function FolioRow({
  billing, index,
  getGuestName, getInitials, getStatusClass, getStatusLabel,
  getAvatarClass, getTotal, getBalance, getPaymentPercent, getProgressBarClass,
  fetchBillingDetail, setSelectedBilling, setGroupPaymentId, setPaymentData, setShowPaymentModal,
}) {
  const guestName = getGuestName(billing);
  const statusClass = getStatusClass(billing.payment_status || billing.status);
  const statusLabel = getStatusLabel(billing.payment_status || billing.status);
  const total = getTotal(billing);
  const balance = getBalance(billing);
  const paid = parseFloat(billing.paid_amount) || 0;
  const payPercent = getPaymentPercent(billing);
  const progressClass = getProgressBarClass(billing.payment_status || billing.status);
  const roomNum = billing.reservation?.room?.room_number || billing.room_number || '-';
  const checkIn = billing.reservation?.check_in_date;
  const checkOut = billing.reservation?.check_out_date;
  const resStatus = billing.reservation?.status;

  return (
    <div
      onClick={() => fetchBillingDetail(billing)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px', borderRadius: 12,
        background: '#fff', border: '1px solid #f0f0f0',
        cursor: 'pointer', transition: 'all 0.15s',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; e.currentTarget.style.borderColor = '#d0d5dd'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f0f0f0'; }}
    >
      {/* Left color accent */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
        background: statusClass === 'paid' ? '#10b981' : statusClass === 'partial' ? '#f59e0b' : statusClass === 'overdue' ? '#ef4444' : '#3b82f6',
      }} />

      {/* Avatar */}
      <div className={`bl-guest-avatar ${getAvatarClass(index)}`} style={{ width: 40, height: 40, borderRadius: 10, fontSize: 14 }}>
        {getInitials(guestName)}
      </div>

      {/* Guest + Room */}
      <div style={{ flex: '1 1 180px', minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {guestName}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <i className="bi bi-door-closed" style={{ fontSize: 11 }}></i> Room {roomNum}
          {resStatus && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, marginLeft: 4,
              background: resStatus === 'checked_in' ? '#dcfce7' : resStatus === 'checked_out' ? '#f1f5f9' : '#fef3c7',
              color: resStatus === 'checked_in' ? '#166534' : resStatus === 'checked_out' ? '#64748b' : '#92400e',
            }}>
              {resStatus === 'checked_in' ? 'In-House' : resStatus === 'checked_out' ? 'Checked Out' : resStatus.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Invoice # */}
      <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>Invoice</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6366f1' }}>
          #{billing.invoice_number || billing.id}
        </div>
        {billing.gst_bill_number && (
          <div style={{ fontSize: 10, fontWeight: 600, color: '#10b981', marginTop: 2 }}>
            <i className="bi bi-receipt" style={{ fontSize: 9 }}></i> GST
          </div>
        )}
      </div>

      {/* Dates */}
      {checkIn && (
        <div style={{ flex: '0 0 auto', textAlign: 'center', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
          <span>{formatDate(checkIn, 'DD MMM')}</span>
          <i className="bi bi-arrow-right" style={{ fontSize: 10, color: '#cbd5e1' }}></i>
          <span>{formatDate(checkOut, 'DD MMM')}</span>
        </div>
      )}

      {/* Amount + Progress */}
      <div style={{ flex: '0 0 140px', textAlign: 'right' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{formatCurrency(total)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
          <div style={{ width: 60, height: 4, borderRadius: 4, background: '#f1f5f9', overflow: 'hidden' }}>
            <div className={progressClass} style={{ width: `${payPercent}%`, height: '100%', borderRadius: 4 }} />
          </div>
          <span style={{ fontSize: 11, color: '#64748b' }}>{payPercent}%</span>
        </div>
      </div>

      {/* Status badge */}
      <div style={{ flex: '0 0 auto' }}>
        <span className={`bl-folio-status ${statusClass}`} style={{ fontSize: 11, padding: '4px 10px' }}>
          {statusLabel}
        </span>
      </div>

      {/* Actions */}
      <div style={{ flex: '0 0 auto', display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
        {statusClass !== 'paid' && balance > 0 && (
          <button className="btn btn-sm btn-success" style={{ fontSize: 11, borderRadius: 6, padding: '4px 10px' }} title="Record Payment"
            onClick={() => {
              setSelectedBilling(billing);
              setGroupPaymentId(null);
              setPaymentData({ amount: (parseFloat(billing.balance_due) || 0).toFixed(2), payment_method: 'cash', payment_type: 'payment', transaction_ref: '' });
              setShowPaymentModal(true);
            }}>
            <i className="bi bi-credit-card"></i>
          </button>
        )}
        {parseFloat(billing.balance_due) < 0 && (
          <button className="btn btn-sm btn-danger" style={{ fontSize: 11, borderRadius: 6, padding: '4px 10px' }} title="Process Refund"
            onClick={() => {
              setSelectedBilling(billing);
              setGroupPaymentId(null);
              setPaymentData({ amount: Math.abs(parseFloat(billing.balance_due) || 0).toFixed(2), payment_method: 'cash', payment_type: 'refund', transaction_ref: '' });
              setShowPaymentModal(true);
            }}>
            <i className="bi bi-arrow-counterclockwise"></i>
          </button>
        )}
        <button className="btn btn-sm btn-outline-primary" style={{ fontSize: 11, borderRadius: 6, padding: '4px 10px' }}
          onClick={() => window.open(`/billing/${billing.id}/invoice`, '_blank')}>
          <i className="bi bi-file-earmark-text"></i>
        </button>
      </div>
    </div>
  );
}

// ─── Group Row ───
function GroupRow({
  entry, gIdx,
  getGuestName, getInitials, getStatusClass, getStatusLabel,
  getAvatarClass, getTotal, getBalance, getProgressBarClass,
  fetchBillingDetail, setSelectedBilling, setGroupPaymentId, setPaymentData, setShowPaymentModal,
}) {
  const groupBillings = entry.billings;
  const firstBilling = groupBillings[0];
  const guestName = getGuestName(firstBilling);
  const groupTotal = groupBillings.reduce((s, b) => s + getTotal(b), 0);
  const groupPaid = groupBillings.reduce((s, b) => s + (parseFloat(b.paid_amount) || 0), 0);
  const groupBalance = groupTotal - groupPaid;
  const groupPercent = groupTotal ? Math.min(100, Math.round((groupPaid / groupTotal) * 100)) : 0;

  const statuses = groupBillings.map(b => (b.payment_status || b.status || '').toLowerCase());
  let groupStatus = 'paid';
  if (statuses.includes('overdue')) groupStatus = 'overdue';
  else if (statuses.includes('partial')) groupStatus = 'partial';
  else if (statuses.includes('unpaid') || statuses.some(s => !s || s === 'open')) groupStatus = 'open';
  const statusClass = getStatusClass(groupStatus);
  const statusLabel = getStatusLabel(groupStatus);
  const progressClass = getProgressBarClass(groupStatus);

  return (
    <div style={{
      borderRadius: 12, border: '1px solid #fde68a', background: '#fffef5',
      overflow: 'hidden',
    }}>
      {/* Group header row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px', position: 'relative',
      }}>
        {/* Left accent */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
          background: 'linear-gradient(180deg, #f59e0b, #d97706)',
        }} />

        {/* Avatar */}
        <div className={`bl-guest-avatar ${getAvatarClass(gIdx)}`} style={{ width: 40, height: 40, borderRadius: 10, fontSize: 14 }}>
          {getInitials(guestName)}
        </div>

        {/* Guest + Group badge */}
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{guestName}</span>
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            }}>
              <i className="bi bi-people-fill me-1"></i>GROUP ({groupBillings.length})
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#92400e', marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {groupBillings.map(b => (
              <span key={b.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <i className="bi bi-door-closed" style={{ fontSize: 10 }}></i>
                {b.reservation?.room?.room_number || '-'}
              </span>
            ))}
          </div>
        </div>

        {/* Amount + Progress */}
        <div style={{ flex: '0 0 140px', textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{formatCurrency(groupTotal)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
            <div style={{ width: 60, height: 4, borderRadius: 4, background: '#fef3c7', overflow: 'hidden' }}>
              <div className={progressClass} style={{ width: `${groupPercent}%`, height: '100%', borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 11, color: '#92400e' }}>{groupPercent}%</span>
          </div>
        </div>

        {/* Status */}
        <span className={`bl-folio-status ${statusClass}`} style={{ fontSize: 11, padding: '4px 10px' }}>
          {statusLabel}
        </span>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4 }}>
          {groupStatus !== 'paid' && groupBalance > 0 && (
            <button className="btn btn-sm btn-warning" style={{ fontSize: 11, borderRadius: 6, padding: '4px 10px' }}
              onClick={() => {
                setSelectedBilling(firstBilling);
                setGroupPaymentId(entry.groupId);
                setPaymentData({ amount: groupBalance.toFixed(2), payment_method: 'cash', transaction_ref: '' });
                setShowPaymentModal(true);
              }}>
              <i className="bi bi-credit-card me-1"></i>Pay
            </button>
          )}
          <button className="btn btn-sm btn-outline-warning" style={{ fontSize: 11, borderRadius: 6, padding: '4px 10px' }}
            onClick={() => window.open(`/billing/group/${entry.groupId}/invoice`, '_blank')}>
            <i className="bi bi-file-earmark-text"></i>
          </button>
        </div>
      </div>

      {/* Expandable room sub-rows */}
      <div style={{ borderTop: '1px solid #fde68a', padding: '8px 18px 10px 60px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {groupBillings.map(b => {
          const bStatus = getStatusClass(b.payment_status || b.status);
          return (
            <div key={b.id}
              onClick={() => fetchBillingDetail(b)}
              style={{
                flex: '1 1 calc(50% - 3px)', minWidth: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 8,
                background: '#fff', border: '1px solid #f0f0f0',
                cursor: 'pointer', fontSize: 12, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; }}
            >
              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                <i className="bi bi-door-closed me-1" style={{ color: '#6366f1', fontSize: 11 }}></i>
                Room {b.reservation?.room?.room_number || '-'}
              </span>
              <span style={{ color: '#64748b' }}>{formatCurrency(getTotal(b))}</span>
              <StatusDot statusClass={bStatus} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
