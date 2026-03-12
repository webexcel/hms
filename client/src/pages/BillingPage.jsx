import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate, capitalize } from '../utils/formatters';
import { toast } from 'react-hot-toast';

const BillingPage = () => {
  const api = useApi();

  const [billings, setBillings] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, pendingPayments: 0, todayCollections: 0, overdueAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState('');

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [billingItems, setBillingItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add item form
  const [newItem, setNewItem] = useState({ description: '', amount: '', quantity: 1 });

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: '', payment_method: 'cash', transaction_ref: '' });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [groupPaymentId, setGroupPaymentId] = useState(null); // group_id when paying for group

  const fetchBillings = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 10 };
      if (searchTerm) params.search = searchTerm;
      if (activeFilter) params.status = activeFilter;
      const response = await api.get('/billing', { params });
      setBillings(response.data.billings || response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch billing records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/billing/stats');
      const d = response.data;
      setStats({
        totalRevenue: d.totalRevenue || d.total_revenue || 0,
        pendingPayments: d.pendingPayments || d.pending_payments || 0,
        todayCollections: d.todayCollections || d.today_collections || 0,
        overdueAmount: d.overdueAmount || d.overdue_amount || 0,
      });
    } catch (error) {
      console.error('Failed to fetch billing stats:', error);
    }
  };

  const fetchBillingDetail = async (billing) => {
    try {
      setDetailLoading(true);
      setSelectedBilling(billing);
      setShowDetailModal(true);
      const response = await api.get(`/billing/${billing.id}`);
      const detail = response.data.billing || response.data;
      setSelectedBilling(detail);
      setBillingItems(detail.items || []);
    } catch (error) {
      toast.error('Failed to fetch billing details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm]);

  useEffect(() => {
    fetchBillings();
  }, [currentPage, activeFilter, searchTerm]);

  const handleAddItem = async () => {
    if (!newItem.description || !newItem.amount) {
      toast.error('Please fill in description and amount');
      return;
    }
    try {
      await api.post(`/billing/${selectedBilling.id}/items`, {
        description: newItem.description,
        amount: parseFloat(newItem.amount),
        quantity: parseInt(newItem.quantity) || 1,
      });
      toast.success('Item added successfully');
      setNewItem({ description: '', amount: '', quantity: 1 });
      fetchBillingDetail(selectedBilling);
      fetchBillings();
      fetchStats();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      setPaymentSubmitting(true);
      const url = groupPaymentId
        ? `/billing/group/${groupPaymentId}/payments`
        : `/billing/${selectedBilling.id}/payments`;
      await api.post(url, {
        amount: parseFloat(paymentData.amount),
        payment_method: paymentData.payment_method,
        reference_number: paymentData.transaction_ref,
      });
      toast.success(groupPaymentId ? 'Group payment recorded successfully' : 'Payment recorded successfully');
      setShowPaymentModal(false);
      setPaymentData({ amount: '', payment_method: 'cash', transaction_ref: '' });
      setGroupPaymentId(null);
      if (selectedBilling) fetchBillingDetail(selectedBilling);
      fetchBillings();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const getGuestName = (billing) => {
    return billing.guest_name || `${billing.guest?.first_name || ''} ${billing.guest?.last_name || ''}`.trim() || 'Unknown';
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'paid';
    if (s === 'partial') return 'partial';
    if (s === 'overdue') return 'overdue';
    return 'open';
  };

  const getStatusLabel = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'Paid';
    if (s === 'partial') return 'Partial';
    if (s === 'overdue') return 'Overdue';
    if (s === 'unpaid') return 'Open';
    return capitalize(status || 'Open');
  };

  const getAvatarClass = (index) => {
    const classes = ['av1', 'av2', 'av3', 'av4'];
    return classes[index % classes.length];
  };

  const getTotal = (billing) => {
    return parseFloat(billing.grand_total) || parseFloat(billing.total_amount) || 0;
  };

  const getBalance = (billing) => {
    if (billing.balance_due != null && parseFloat(billing.balance_due) !== 0) return parseFloat(billing.balance_due);
    if (billing.balance != null) return parseFloat(billing.balance);
    return getTotal(billing) - (parseFloat(billing.paid_amount) || 0);
  };

  const getPaymentPercent = (billing) => {
    const total = getTotal(billing);
    if (!total) return 0;
    return Math.min(100, Math.round(((parseFloat(billing.paid_amount) || 0) / total) * 100));
  };

  const getProgressBarClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'bg-success';
    if (s === 'overdue') return 'bg-danger';
    if (s === 'partial') return 'bg-warning';
    return 'bg-success';
  };

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Billing & Invoices</h1>
          <p>Manage guest folios, generate invoices, and record payments</p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              setSelectedBilling(null);
              setPaymentData({ amount: '', payment_method: 'cash', transaction_ref: '' });
              setShowPaymentModal(true);
            }}
          >
            <i className="bi bi-credit-card me-2"></i>Record Payment
          </button>
        </div>
      </div>

      {/* Billing Stats */}
      <div className="bl-stats">
        <div className="bl-stat">
          <div className="bl-stat-icon revenue">
            <i className="bi bi-wallet2"></i>
          </div>
          <div className="bl-stat-content">
            <h3>{formatCurrency(stats.todayCollections)}</h3>
            <p>Today's Revenue</p>
          </div>
        </div>
        <div className="bl-stat">
          <div className="bl-stat-icon collected">
            <i className="bi bi-check-circle"></i>
          </div>
          <div className="bl-stat-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="bl-stat">
          <div className="bl-stat-icon pending">
            <i className="bi bi-hourglass-split"></i>
          </div>
          <div className="bl-stat-content">
            <h3>{formatCurrency(stats.pendingPayments)}</h3>
            <p>Pending Payments</p>
          </div>
        </div>
        <div className="bl-stat">
          <div className="bl-stat-icon overdue">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
          <div className="bl-stat-content">
            <h3>{formatCurrency(stats.overdueAmount)}</h3>
            <p>Overdue Amount</p>
          </div>
        </div>
      </div>

      {/* Main Billing Content */}
      <div className="row g-4">
        {/* Left Column - Active Folios */}
        <div className="col-xl-8">
          {/* Action Bar */}
          <div className="bl-action-bar">
            <div className="bl-search">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search by invoice #, guest name, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="unpaid">Open</option>
              <option value="paid">Paid</option>
              <option value="partial">Partially Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Active Folios Section */}
          <div className="bl-section">
            <div className="bl-section-header">
              <h3 className="bl-section-title"><i className="bi bi-folder-open"></i> Active Folios</h3>
              <span className="badge" style={{ background: '#eef2ff', color: '#6366f1', padding: '6px 12px', borderRadius: '20px', fontWeight: 600 }}>
                {billings.length} Records
              </span>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-2">Loading billing records...</p>
              </div>
            ) : billings.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-receipt" style={{ fontSize: '48px', color: '#cbd5e1' }}></i>
                <p className="text-muted mt-2">No billing records found</p>
              </div>
            ) : (
              (() => {
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

                return grouped.map((entry, gIdx) => {
                  if (entry.groupId) {
                    // ─── Group Booking Card ───
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
                      <div className="bl-folio" key={`grp-${entry.groupId}`}>
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
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => {
                              setSelectedBilling(firstBilling);
                              setGroupPaymentId(entry.groupId);
                              setPaymentData({ amount: '', payment_method: 'cash', transaction_ref: '' });
                              setShowPaymentModal(true);
                            }}
                          >
                            <i className="bi bi-people-fill"></i> <span>Group Payment</span>
                          </button>
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

                  // ─── Individual (non-group) Billing Card ───
                  const billing = entry.billings[0];
                  const index = gIdx;
                  const guestName = getGuestName(billing);
                  const statusClass = getStatusClass(billing.payment_status || billing.status);
                  const statusLabel = getStatusLabel(billing.payment_status || billing.status);
                  const balance = getBalance(billing);
                  const payPercent = getPaymentPercent(billing);
                  const progressClass = getProgressBarClass(billing.payment_status || billing.status);

                  return (
                    <div className="bl-folio" key={billing.id || index}>
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
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => {
                            setSelectedBilling(billing);
                            setGroupPaymentId(null);
                            setPaymentData({ amount: '', payment_method: 'cash', transaction_ref: '' });
                            setShowPaymentModal(true);
                          }}
                        >
                          <i className="bi bi-credit-card"></i> <span>Record Payment</span>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => window.open(`/billing/${billing.id}/invoice`, '_blank')}
                        >
                          <i className="bi bi-file-earmark-text"></i> <span>Invoice</span>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()
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
        </div>

        {/* Right Column - Quick Actions & Summary */}
        <div className="col-xl-4">
          {/* Quick Actions */}
          <div className="bl-quick-actions">
            <h5><i className="bi bi-lightning"></i> Quick Actions</h5>
            <div className="bl-action-grid">
              <button className="bl-action-btn" onClick={() => {
                setSelectedBilling(null);
                setPaymentData({ amount: '', payment_method: 'cash', transaction_ref: '' });
                setShowPaymentModal(true);
              }}>
                <i className="bi bi-cash-stack"></i>
                <span>Record Payment</span>
              </button>
              <button className="bl-action-btn" onClick={() => toast('Feature coming soon')}>
                <i className="bi bi-file-earmark-text"></i>
                <span>GST Invoice</span>
              </button>
              <button className="bl-action-btn" onClick={() => toast('Feature coming soon')}>
                <i className="bi bi-receipt"></i>
                <span>Generate Report</span>
              </button>
              <button className="bl-action-btn" onClick={() => {
                setSearchTerm('');
                setActiveFilter('');
                fetchBillings();
                fetchStats();
              }}>
                <i className="bi bi-arrow-clockwise"></i>
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Outstanding Summary */}
          <div className="bl-outstanding-card">
            <div className="bl-card-header">
              <h5><i className="bi bi-pie-chart"></i> Billing Summary</h5>
            </div>
            <div className="bl-category-item">
              <div>
                <div className="bl-category-info">
                  <span className="name">Total Revenue</span>
                </div>
              </div>
              <div className="bl-category-amount">{formatCurrency(stats.totalRevenue)}</div>
            </div>
            <div className="bl-category-item">
              <div>
                <div className="bl-category-info">
                  <span className="name">Pending Payments</span>
                </div>
              </div>
              <div className="bl-category-amount">{formatCurrency(stats.pendingPayments)}</div>
            </div>
            <div className="bl-category-item">
              <div>
                <div className="bl-category-info">
                  <span className="name">Today's Collections</span>
                </div>
              </div>
              <div className="bl-category-amount">{formatCurrency(stats.todayCollections)}</div>
            </div>
            <div className="bl-category-total">
              <span>Total Outstanding</span>
              <span>{formatCurrency(stats.pendingPayments)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Folio Detail Modal */}
      {showDetailModal && (
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
                    <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                      {getStatusLabel(selectedBilling.payment_status || selectedBilling.status)}
                    </span>
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
                      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                        <h6><i className="bi bi-person me-2"></i>Guest Information</h6>
                        <div style={{ marginTop: '12px' }}>
                          <h5 style={{ fontWeight: 600, marginBottom: '8px' }}>{getGuestName(selectedBilling)}</h5>
                          <p className="text-muted mb-1" style={{ fontSize: '13px' }}>
                            <i className="bi bi-door-open me-1"></i> Room {selectedBilling.room_number || '-'}
                          </p>
                        </div>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px' }}>
                        <h6><i className="bi bi-credit-card me-2"></i>Payment Summary</h6>
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <span className="text-muted">Total</span>
                            <span style={{ fontWeight: 600 }}>{formatCurrency(getTotal(selectedBilling))}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <span className="text-muted">Paid</span>
                            <span style={{ fontWeight: 600, color: '#16a34a' }}>{formatCurrency(selectedBilling.paid_amount)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700 }}>
                            <span>Balance Due</span>
                            <span style={{ color: getBalance(selectedBilling) > 0 ? '#dc2626' : '#16a34a' }}>
                              {formatCurrency(getBalance(selectedBilling))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Charges Breakdown */}
                    <div className="col-md-8">
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
                              </tr>
                            </thead>
                            <tbody>
                              {billingItems.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="text-center text-muted py-3">No items</td>
                                </tr>
                              ) : (
                                billingItems.map((item, idx) => (
                                  <tr key={item.id || idx}>
                                    <td>{item.description}</td>
                                    <td className="text-center">{item.quantity || 1}</td>
                                    <td className="text-end">{formatCurrency(item.rate || item.amount)}</td>
                                    <td className="text-end">{formatCurrency((item.rate || item.amount) * (item.quantity || 1))}</td>
                                  </tr>
                                ))
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
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => window.open(`/billing/${selectedBilling?.id}/invoice`, '_blank')}
                  >
                    <i className="bi bi-file-earmark-text me-1"></i>Invoice
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => window.open(`/billing/${selectedBilling?.id}/invoice`, '_blank')}
                  >
                    <i className="bi bi-printer me-1"></i>Print
                  </button>
                </div>
                <div className="d-flex gap-2 ms-auto">
                  <button className="btn btn-light" onClick={() => setShowDetailModal(false)}>Close</button>
                  <button
                    className="btn btn-success"
                    onClick={() => {
                      setPaymentData({ amount: '', payment_method: 'cash', transaction_ref: '' });
                      setShowPaymentModal(true);
                    }}
                  >
                    <i className="bi bi-credit-card me-1"></i>Record Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="modal fade show bl-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowPaymentModal(false); }}>
          <div className="modal-dialog">
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
                  {selectedBilling && (
                    <div className="mb-3" style={{ background: groupPaymentId ? '#fffbeb' : '#f8fafc', borderRadius: '12px', padding: '14px', border: groupPaymentId ? '1px solid #fcd34d' : 'none' }}>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>Paying for</div>
                      <div style={{ fontWeight: 600, color: '#1a1a2e' }}>
                        {getGuestName(selectedBilling)}
                        {groupPaymentId
                          ? <span style={{ background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>Group: {groupPaymentId}</span>
                          : ` - #${selectedBilling.invoice_number || selectedBilling.id}`
                        }
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        {groupPaymentId
                          ? <>Payment will be distributed across all rooms in this group</>
                          : <>Room {selectedBilling.reservation?.room?.room_number || '-'} &middot; Outstanding: <strong style={{ color: '#dc2626' }}>{formatCurrency(getBalance(selectedBilling))}</strong></>
                        }
                      </div>
                    </div>
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
                      {[
                        { value: 'cash', icon: 'bi-cash', label: 'Cash' },
                        { value: 'card', icon: 'bi-credit-card', label: 'Card' },
                        { value: 'upi', icon: 'bi-phone', label: 'UPI' },
                        { value: 'bank_transfer', icon: 'bi-bank', label: 'Bank Transfer' },
                      ].map((method) => (
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
                <button
                  className="btn btn-success"
                  onClick={handleRecordPayment}
                  disabled={paymentSubmitting}
                >
                  <i className="bi bi-check-lg me-1"></i>
                  {paymentSubmitting ? 'Processing...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BillingPage;
