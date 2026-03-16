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
          <p className="text-muted mt-2">Loading billing records...</p>
        </div>
      </div>
    );
  }

  // Group billings by group_id; non-group billings remain individual
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
        <span className="badge" style={{ background: '#eef2ff', color: '#6366f1', padding: '6px 12px', borderRadius: '20px', fontWeight: 600 }}>
          {billings.length} Records
        </span>
      </div>

      {billings.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-receipt" style={{ fontSize: '48px', color: '#cbd5e1' }}></i>
          <p className="text-muted mt-2">No billing records found</p>
        </div>
      ) : (
        grouped.map((entry, gIdx) => {
          if (entry.groupId) {
            return (
              <GroupFolioCard
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
            );
          }

          return (
            <IndividualFolioCard
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
          );
        })
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-3 gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <i className="bi bi-chevron-left"></i> Previous
          </button>
          <span className="d-flex align-items-center px-3 text-muted" style={{ fontSize: '13px' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Group Folio Card ───

function GroupFolioCard({
  entry, gIdx,
  getGuestName, getInitials, getStatusClass, getStatusLabel,
  getAvatarClass, getTotal, getBalance, getProgressBarClass,
  fetchBillingDetail,
  setSelectedBilling, setGroupPaymentId, setPaymentData, setShowPaymentModal,
}) {
  const groupBillings = entry.billings;
  const firstBilling = groupBillings[0];
  const guestName = getGuestName(firstBilling);
  const groupTotal = groupBillings.reduce((s, b) => s + getTotal(b), 0);
  const groupPaid = groupBillings.reduce((s, b) => s + (parseFloat(b.paid_amount) || 0), 0);
  const groupBalance = groupTotal - groupPaid;
  const groupPercent = groupTotal ? Math.min(100, Math.round((groupPaid / groupTotal) * 100)) : 0;
  // Determine worst status across group
  const statuses = groupBillings.map(b => (b.payment_status || b.status || '').toLowerCase());
  let groupStatus = 'paid';
  if (statuses.includes('overdue')) groupStatus = 'overdue';
  else if (statuses.includes('partial')) groupStatus = 'partial';
  else if (statuses.includes('unpaid') || statuses.some(s => !s || s === 'open')) groupStatus = 'open';
  const statusClass = getStatusClass(groupStatus);
  const statusLabel = getStatusLabel(groupStatus);
  const progressClass = getProgressBarClass(groupStatus);

  return (
    <div className="bl-folio">
      <div className={`bl-folio-topbar ${statusClass}`}></div>
      <div className="bl-folio-header">
        <div className="bl-folio-info">
          <span className="bl-folio-number" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
              <i className="bi bi-people-fill me-1"></i>GROUP
            </span>
            {groupBillings.map(b => `#${b.invoice_number || `INV-${b.id}`}`).join(' / ')}
          </span>
          <div className="bl-folio-guest">
            <div className={`bl-guest-avatar ${getAvatarClass(gIdx)}`}>
              {getInitials(guestName)}
            </div>
            <div className="bl-guest-details">
              <span className="name">{guestName}</span>
              <span className="room">
                <i className="bi bi-building"></i> {groupBillings.length} Rooms
              </span>
            </div>
          </div>
        </div>
        <span className={`bl-folio-status ${statusClass}`}>{statusLabel}</span>
      </div>

      {/* Room breakdown inside group card */}
      <div className="bl-folio-body">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {groupBillings.map((b) => {
            const roomNum = b.reservation?.room?.room_number || b.room_number || '-';
            const bStatus = getStatusClass(b.payment_status || b.status);
            return (
              <div
                key={b.id}
                style={{
                  flex: '1 1 calc(50% - 4px)',
                  minWidth: 180,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>
                    <i className="bi bi-door-closed me-1" style={{ color: '#6366f1' }}></i>Room {roomNum}
                  </span>
                  <span className={`bl-folio-status ${bStatus}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                    {getStatusLabel(b.payment_status || b.status)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 12 }}>
                  <span>Total: {formatCurrency(getTotal(b))}</span>
                  <span>Balance: {formatCurrency(getBalance(b))}</span>
                </div>
                <div className="mt-1">
                  <button
                    className="btn btn-sm btn-link p-0"
                    style={{ fontSize: 11 }}
                    onClick={() => fetchBillingDetail(b)}
                  >
                    <i className="bi bi-eye me-1"></i>View Details
                  </button>
                  <button
                    className="btn btn-sm btn-link p-0 ms-2"
                    style={{ fontSize: 11 }}
                    onClick={() => window.open(`/billing/${b.id}/invoice`, '_blank')}
                  >
                    <i className="bi bi-file-earmark-text me-1"></i>Invoice
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {(firstBilling.check_in || firstBilling.check_out) && (
          <div className="bl-folio-dates">
            <div className="date-item">
              <span className="label">Check-in</span>
              <span className="value">{formatDate(firstBilling.check_in, 'MMM D, YYYY')}</span>
            </div>
            <span className="separator"><i className="bi bi-arrow-right"></i></span>
            <div className="date-item">
              <span className="label">Check-out</span>
              <span className="value">{formatDate(firstBilling.check_out, 'MMM D, YYYY')}</span>
            </div>
            {firstBilling.nights && (
              <span className="nights"><i className="bi bi-moon"></i> {firstBilling.nights} Nights</span>
            )}
          </div>
        )}
        <div className="bl-folio-charges">
          <div className="bl-charge-row total">
            <span>Group Total ({groupBillings.length} rooms)</span>
            <span>{formatCurrency(groupTotal)}</span>
          </div>
        </div>
        <div className="bl-folio-progress">
          <div className="progress">
            <div className={`progress-bar ${progressClass}`} style={{ width: `${groupPercent}%` }}></div>
          </div>
          <div className="bl-payment-details">
            <span>Paid: {formatCurrency(groupPaid)}</span>
            <span className={statusClass === 'overdue' ? 'balance overdue' : ''}>
              Balance: {formatCurrency(groupBalance)}
            </span>
          </div>
        </div>
      </div>
      <div className="bl-folio-footer">
        {groupStatus !== 'paid' && groupBalance > 0 && (
          <button
            className="btn btn-sm btn-warning"
            onClick={() => {
              setSelectedBilling(firstBilling);
              setGroupPaymentId(entry.groupId);
              setPaymentData({ amount: groupBalance.toFixed(2), payment_method: 'cash', transaction_ref: '' });
              setShowPaymentModal(true);
            }}
          >
            <i className="bi bi-people-fill"></i> <span>Group Payment</span>
          </button>
        )}
        <button
          className="btn btn-sm btn-outline-warning"
          onClick={() => window.open(`/billing/group/${entry.groupId}/invoice`, '_blank')}
        >
          <i className="bi bi-file-earmark-text"></i> <span>Group Invoice</span>
        </button>
      </div>
    </div>
  );
}

// ─── Individual (non-group) Folio Card ───

function IndividualFolioCard({
  billing, index,
  getGuestName, getInitials, getStatusClass, getStatusLabel,
  getAvatarClass, getTotal, getBalance, getPaymentPercent, getProgressBarClass,
  fetchBillingDetail,
  setSelectedBilling, setGroupPaymentId, setPaymentData, setShowPaymentModal,
}) {
  const guestName = getGuestName(billing);
  const statusClass = getStatusClass(billing.payment_status || billing.status);
  const statusLabel = getStatusLabel(billing.payment_status || billing.status);
  const balance = getBalance(billing);
  const payPercent = getPaymentPercent(billing);
  const progressClass = getProgressBarClass(billing.payment_status || billing.status);

  return (
    <div className="bl-folio">
      <div className={`bl-folio-topbar ${statusClass}`}></div>
      <div className="bl-folio-header">
        <div className="bl-folio-info">
          <span className="bl-folio-number">#{billing.invoice_number || `INV-${billing.id}`}</span>
          <div className="bl-folio-guest">
            <div className={`bl-guest-avatar ${getAvatarClass(index)}`}>
              {getInitials(guestName)}
            </div>
            <div className="bl-guest-details">
              <span className="name">{guestName}</span>
              <span className="room">
                <i className="bi bi-door-closed"></i> Room {billing.reservation?.room?.room_number || billing.room_number || '-'}
              </span>
            </div>
          </div>
        </div>
        <span className={`bl-folio-status ${statusClass}`}>{statusLabel}</span>
      </div>
      <div className="bl-folio-body">
        {(billing.check_in || billing.check_out) && (
          <div className="bl-folio-dates">
            <div className="date-item">
              <span className="label">Check-in</span>
              <span className="value">{formatDate(billing.check_in, 'MMM D, YYYY')}</span>
            </div>
            <span className="separator"><i className="bi bi-arrow-right"></i></span>
            <div className="date-item">
              <span className="label">Check-out</span>
              <span className="value">{formatDate(billing.check_out, 'MMM D, YYYY')}</span>
            </div>
            {billing.nights && (
              <span className="nights"><i className="bi bi-moon"></i> {billing.nights} Nights</span>
            )}
          </div>
        )}
        <div className="bl-folio-charges">
          <div className="bl-charge-row total">
            <span>Total</span>
            <span>{formatCurrency(getTotal(billing))}</span>
          </div>
        </div>
        <div className="bl-folio-progress">
          <div className="progress">
            <div className={`progress-bar ${progressClass}`} style={{ width: `${payPercent}%` }}></div>
          </div>
          <div className="bl-payment-details">
            <span>Paid: {formatCurrency(billing.paid_amount)}</span>
            <span className={statusClass === 'overdue' ? 'balance overdue' : ''}>
              Balance: {formatCurrency(balance)}
            </span>
          </div>
        </div>
      </div>
      <div className="bl-folio-footer">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => fetchBillingDetail(billing)}
        >
          <i className="bi bi-eye"></i> <span>View Details</span>
        </button>
        {(billing.payment_status || billing.status) !== 'paid' && parseFloat(billing.balance_due) > 0 && (
          <button
            className="btn btn-sm btn-success"
            onClick={() => {
              setSelectedBilling(billing);
              setGroupPaymentId(null);
              setPaymentData({ amount: (parseFloat(billing.balance_due) || 0).toFixed(2), payment_method: 'cash', transaction_ref: '' });
              setShowPaymentModal(true);
            }}
          >
            <i className="bi bi-credit-card"></i> <span>Record Payment</span>
          </button>
        )}
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => window.open(`/billing/${billing.id}/invoice`, '_blank')}
        >
          <i className="bi bi-file-earmark-text"></i> <span>Invoice</span>
        </button>
      </div>
    </div>
  );
}
