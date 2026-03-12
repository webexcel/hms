import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate, capitalize } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ShiftHandoverPage = () => {
  const api = useApi();
  const { user } = useAuth();
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDiscountsModal, setShowDiscountsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });
  const [shiftData, setShiftData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState('');
  const [outgoingConfirm, setOutgoingConfirm] = useState(false);
  const [incomingConfirm, setIncomingConfirm] = useState(false);

  const [formData, setFormData] = useState({
    shift: 'morning',
    cash_in_hand: '',
    total_collections: '',
    pending_checkouts: '',
    notes: '',
    tasks_pending: ''
  });

  const shifts = ['morning', 'afternoon', 'night'];

  useEffect(() => {
    fetchHandovers();
    fetchStats();
  }, []);

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shift-handovers');
      setHandovers(res.data?.data || res.data || []);
    } catch (err) {
      toast.error('Failed to fetch handovers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/shift-handovers/stats');
      setStats(res.data || { total: 0, pending: 0, accepted: 0, rejected: 0 });
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const handleCreateHandover = async () => {
    try {
      await api.post('/shift-handovers', formData);
      toast.success('Handover created successfully');
      setShowModal(false);
      resetForm();
      fetchHandovers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create handover');
    }
  };

  const handleAccept = async (id) => {
    try {
      await api.put(`/shift-handovers/${id}/accept`);
      toast.success('Handover accepted');
      fetchHandovers();
      fetchStats();
    } catch (err) {
      toast.error('Failed to accept handover');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await api.put(`/shift-handovers/${id}/reject`, { reason });
      toast.success('Handover rejected');
      fetchHandovers();
      fetchStats();
    } catch (err) {
      toast.error('Failed to reject handover');
    }
  };

  const handleCompleteHandover = async () => {
    try {
      await api.post('/shift-handovers', { ...formData, notes });
      toast.success('Handover completed successfully');
      setShowConfirmModal(false);
      resetForm();
      fetchHandovers();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete handover');
    }
  };

  const resetForm = () => {
    setFormData({
      shift: 'morning',
      cash_in_hand: '',
      total_collections: '',
      pending_checkouts: '',
      notes: '',
      tasks_pending: ''
    });
    setNotes('');
  };

  const getShiftLabel = (shift) => {
    const labels = {
      morning: 'Morning Shift (6 AM - 2 PM)',
      afternoon: 'Afternoon Shift (2 PM - 10 PM)',
      night: 'Night Shift (10 PM - 6 AM)'
    };
    return labels[shift] || capitalize(shift);
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusBadgeClass = (status) => {
    const map = { pending: 'warning', accepted: 'success', rejected: 'danger' };
    return map[status] || 'secondary';
  };

  const getRoomStatusClass = (status) => {
    const map = {
      available: 'available',
      occupied: 'occupied',
      reserved: 'reserved',
      maintenance: 'maintenance',
      arriving: 'arriving',
      departing: 'departing'
    };
    return map[status] || '';
  };

  const getTaskTypeClass = (type) => {
    const map = {
      maintenance: 'maintenance',
      request: 'request',
      vip: 'vip',
      info: 'info'
    };
    return map[type] || 'info';
  };

  const getTaskIcon = (type) => {
    const map = {
      maintenance: 'bi-tools',
      request: 'bi-clock-history',
      vip: 'bi-star',
      info: 'bi-people'
    };
    return map[type] || 'bi-info-circle';
  };

  // Get the latest handover for display
  const latestHandover = handovers.length > 0 ? handovers[0] : null;

  if (loading && handovers.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header Actions */}
      <div className="sh-header">
        <h2 className="sh-title">Shift Handover Report</h2>
        <div className="sh-actions">
          <button className="btn-print" onClick={() => window.print()}>
            <i className="bi bi-printer me-2"></i>Print Report
          </button>
          <button className="btn-start-shift" onClick={() => { resetForm(); setShowModal(true); }}>
            <i className="bi bi-play-fill me-2"></i>Start New Shift
          </button>
        </div>
      </div>

      {/* Current Shift Info Banner */}
      <div className="sh-info-banner">
        <div className="sh-info-left">
          <div className="sh-avatar">
            {getUserInitials(user?.full_name || user?.username)}
          </div>
          <div className="sh-info-text">
            <h3>{user?.full_name || user?.username || 'Staff'} - {latestHandover ? capitalize(latestHandover.shift) : 'Morning'} Shift</h3>
            <p>
              <i className="bi bi-clock me-1"></i>
              {' '}{latestHandover ? getShiftLabel(latestHandover.shift) : 'Morning Shift (6 AM - 2 PM)'} | {formatDate(new Date())}
            </p>
          </div>
        </div>
        <div className="sh-info-stats">
          <div className="sh-info-stat">
            <span className="sh-info-stat-value">{stats.total}</span>
            <span className="sh-info-stat-label">Total Handovers</span>
          </div>
          <div className="sh-info-stat">
            <span className="sh-info-stat-value">{stats.pending}</span>
            <span className="sh-info-stat-label">Pending</span>
          </div>
          <div className="sh-info-stat">
            <span className="sh-info-stat-value">{stats.accepted}</span>
            <span className="sh-info-stat-label">Accepted</span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column */}
        <div className="col-lg-8">
          {/* Financial Summary */}
          <div className="sh-section">
            <div className="sh-section-header">
              <h2 className="sh-section-title">
                <i className="bi bi-currency-rupee financial"></i>
                Financial Summary
              </h2>
            </div>
            <div className="sh-section-body">
              <table className="sh-financial-table">
                <tbody>
                  <tr>
                    <td>Opening Cash Balance</td>
                    <td>{formatCurrency(latestHandover?.cash_in_hand || 0)}</td>
                  </tr>
                  <tr className="subtotal">
                    <td><strong>Collections</strong></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>&nbsp;&nbsp;&nbsp;&nbsp;Room Charges</td>
                    <td>{formatCurrency(latestHandover?.room_charges || 0)}</td>
                  </tr>
                  <tr>
                    <td>&nbsp;&nbsp;&nbsp;&nbsp;Advance Payments</td>
                    <td>{formatCurrency(latestHandover?.advance_payments || 0)}</td>
                  </tr>
                  <tr>
                    <td>&nbsp;&nbsp;&nbsp;&nbsp;Restaurant &amp; Services</td>
                    <td>{formatCurrency(latestHandover?.restaurant_services || 0)}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Collections</strong></td>
                    <td className="text-success"><strong>{formatCurrency(latestHandover?.total_collections || 0)}</strong></td>
                  </tr>
                  <tr>
                    <td>Refunds Issued</td>
                    <td className="text-danger">- {formatCurrency(latestHandover?.refunds || 0)}</td>
                  </tr>
                  <tr>
                    <td>
                      <span
                        style={{ cursor: 'pointer', borderBottom: '1px dashed #64748b' }}
                        onClick={() => setShowDiscountsModal(true)}
                      >
                        Discounts Given <i className="bi bi-info-circle" style={{ fontSize: '12px', color: '#64748b' }}></i>
                      </span>
                    </td>
                    <td className="text-danger">- {formatCurrency(latestHandover?.discounts || 0)}</td>
                  </tr>
                  <tr className="total">
                    <td>Closing Cash Balance</td>
                    <td>{formatCurrency(latestHandover?.closing_balance || 0)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Payment Breakdown */}
              <div className="sh-payment-grid">
                <div className="sh-payment-item cash">
                  <i className="bi bi-cash-stack"></i>
                  <span className="sh-payment-item-value">{formatCurrency(latestHandover?.cash_payments || 0)}</span>
                  <span className="sh-payment-item-label">Cash</span>
                </div>
                <div className="sh-payment-item card">
                  <i className="bi bi-credit-card"></i>
                  <span className="sh-payment-item-value">{formatCurrency(latestHandover?.card_payments || 0)}</span>
                  <span className="sh-payment-item-label">Card</span>
                </div>
                <div className="sh-payment-item upi">
                  <i className="bi bi-phone"></i>
                  <span className="sh-payment-item-value">{formatCurrency(latestHandover?.upi_payments || 0)}</span>
                  <span className="sh-payment-item-label">UPI</span>
                </div>
                <div className="sh-payment-item bank">
                  <i className="bi bi-bank"></i>
                  <span className="sh-payment-item-value">{formatCurrency(latestHandover?.bank_payments || 0)}</span>
                  <span className="sh-payment-item-label">Bank Transfer</span>
                </div>
              </div>
            </div>
          </div>

          {/* Operations Summary */}
          <div className="sh-section">
            <div className="sh-section-header">
              <h2 className="sh-section-title">
                <i className="bi bi-clipboard-data operations"></i>
                Operations Summary
              </h2>
            </div>
            <div className="sh-section-body">
              <div className="sh-ops-grid">
                <div className="sh-ops-item success">
                  <span className="sh-ops-item-value">{latestHandover?.checkins_completed || 0}</span>
                  <div className="sh-ops-item-label">Check-ins Completed</div>
                </div>
                <div className="sh-ops-item info">
                  <span className="sh-ops-item-value">{latestHandover?.checkouts_completed || 0}</span>
                  <div className="sh-ops-item-label">Check-outs Completed</div>
                </div>
                <div className="sh-ops-item warning">
                  <span className="sh-ops-item-value">{latestHandover?.pending_checkins || 0}</span>
                  <div className="sh-ops-item-label">Pending Check-ins</div>
                </div>
                <div className="sh-ops-item danger">
                  <span className="sh-ops-item-value">{latestHandover?.pending_checkouts || 0}</span>
                  <div className="sh-ops-item-label">Overdue Check-outs</div>
                </div>
                <div className="sh-ops-item">
                  <span className="sh-ops-item-value">{latestHandover?.new_reservations || 0}</span>
                  <div className="sh-ops-item-label">New Reservations</div>
                </div>
                <div className="sh-ops-item">
                  <span className="sh-ops-item-value">{latestHandover?.cancellations || 0}</span>
                  <div className="sh-ops-item-label">Cancellations</div>
                </div>
              </div>
            </div>
          </div>

          {/* Room Status at Handover */}
          <div className="sh-section">
            <div className="sh-section-header">
              <h2 className="sh-section-title">
                <i className="bi bi-grid-3x3-gap rooms"></i>
                Room Status at Handover
              </h2>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Snapshot at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="sh-section-body">
              {/* Legend */}
              <div className="sh-room-legend">
                <div className="sh-room-legend-item">
                  <div className="sh-room-legend-dot available"></div>
                  Available
                </div>
                <div className="sh-room-legend-item">
                  <div className="sh-room-legend-dot occupied"></div>
                  Occupied
                </div>
                <div className="sh-room-legend-item">
                  <div className="sh-room-legend-dot reserved"></div>
                  Reserved
                </div>
                <div className="sh-room-legend-item">
                  <div className="sh-room-legend-dot arriving"></div>
                  Arriving
                </div>
                <div className="sh-room-legend-item">
                  <div className="sh-room-legend-dot departing"></div>
                  Departing
                </div>
                <div className="sh-room-legend-item">
                  <div className="sh-room-legend-dot maintenance"></div>
                  Maintenance
                </div>
              </div>

              {/* Room Grid */}
              <div className="sh-rooms">
                {(latestHandover?.rooms || rooms || []).map((room) => (
                  <div
                    key={room.id || room.room_number}
                    className={`sh-room ${getRoomStatusClass(room.status)}`}
                    title={`Room ${room.room_number} - ${capitalize(room.status || 'available')}`}
                  >
                    {room.room_number}
                  </div>
                ))}
                {(!latestHandover?.rooms && rooms.length === 0) && (
                  <p className="text-muted" style={{ fontSize: '14px', gridColumn: '1 / -1', textAlign: 'center', padding: '20px 0' }}>
                    No room data available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-lg-4">
          {/* Pending Tasks & Issues */}
          <div className="sh-section">
            <div className="sh-section-header">
              <h2 className="sh-section-title">
                <i className="bi bi-exclamation-triangle tasks"></i>
                Pending Tasks &amp; Issues
              </h2>
            </div>
            <div className="sh-section-body">
              {(latestHandover?.tasks || tasks || []).length > 0 ? (
                (latestHandover?.tasks || tasks || []).map((task, idx) => (
                  <div key={task.id || idx} className={`sh-task ${getTaskTypeClass(task.type)}`}>
                    <div className="sh-task-icon">
                      <i className={`bi ${getTaskIcon(task.type)}`}></i>
                    </div>
                    <div className="sh-task-content">
                      <p className="sh-task-title">{task.title}</p>
                      <p className="sh-task-meta">{task.description || task.meta}</p>
                    </div>
                    <span className="sh-task-badge">{task.priority || task.badge || 'Info'}</span>
                  </div>
                ))
              ) : (
                latestHandover?.tasks_pending ? (
                  <div className="sh-task info">
                    <div className="sh-task-icon">
                      <i className="bi bi-info-circle"></i>
                    </div>
                    <div className="sh-task-content">
                      <p className="sh-task-title">Pending Tasks</p>
                      <p className="sh-task-meta">{latestHandover.tasks_pending}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted" style={{ fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                    No pending tasks
                  </p>
                )
              )}
            </div>
          </div>

          {/* Handover Notes */}
          <div className="sh-section">
            <div className="sh-section-header">
              <h2 className="sh-section-title">
                <i className="bi bi-journal-text notes"></i>
                Handover Notes
              </h2>
            </div>
            <div className="sh-section-body">
              {latestHandover?.notes && (
                <div className="sh-notes-previous">
                  <span className="sh-notes-previous-label">
                    Previous Shift Notes ({latestHandover.from_user?.full_name || latestHandover.from_user?.username || 'Previous Staff'})
                  </span>
                  <p className="sh-notes-previous-text">{latestHandover.notes}</p>
                </div>
              )}
              <label className="sh-notes-previous-label">Your Notes for Incoming OM</label>
              <textarea
                className="sh-notes-textarea"
                placeholder="Add any important notes, observations, or instructions for the incoming Operations Manager..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Signature / Confirmation Section */}
          <div className="sh-section">
            <div className="sh-section-header">
              <h2 className="sh-section-title">
                <i className="bi bi-pen signature"></i>
                Handover Confirmation
              </h2>
            </div>
            <div className="sh-section-body">
              <div className="sh-signature-grid">
                <div className="sh-signature-card outgoing">
                  <div className="sh-signature-label">Outgoing OM</div>
                  <input
                    type="text"
                    className="sh-signature-input"
                    value={user?.full_name || user?.username || ''}
                    readOnly
                  />
                  <div className="sh-signature-time">
                    Time: <strong>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                  </div>
                  <div className="sh-signature-checkbox">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="outgoingConfirm"
                        checked={outgoingConfirm}
                        onChange={(e) => setOutgoingConfirm(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="outgoingConfirm" style={{ fontSize: '12px' }}>
                        I confirm all details are accurate
                      </label>
                    </div>
                  </div>
                </div>
                <div className="sh-signature-card incoming">
                  <div className="sh-signature-label">Incoming OM</div>
                  <input
                    type="text"
                    className="sh-signature-input"
                    placeholder="Enter name"
                  />
                  <div className="sh-signature-time">
                    Time: <strong>--:-- --</strong>
                  </div>
                  <div className="sh-signature-checkbox">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="incomingConfirm"
                        checked={incomingConfirm}
                        onChange={(e) => setIncomingConfirm(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="incomingConfirm" style={{ fontSize: '12px' }}>
                        I accept this handover
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sh-handover-actions">
                <button className="btn-print-report" onClick={() => window.print()}>
                  <i className="bi bi-printer me-2"></i>Print Report
                </button>
                <button className="btn-complete-handover" onClick={() => setShowConfirmModal(true)}>
                  <i className="bi bi-check-lg me-2"></i>Complete Handover
                </button>
              </div>
            </div>
          </div>

          {/* Handover History */}
          <div className="sh-section">
            <div className="sh-section-header">
              <h2 className="sh-section-title">
                <i className="bi bi-clock-history notes"></i>
                Recent Handovers
              </h2>
            </div>
            <div className="sh-section-body">
              {handovers.length > 0 ? handovers.slice(0, 5).map((h) => (
                <div key={h.id} className={`sh-task ${h.status === 'pending' ? 'request' : h.status === 'accepted' ? 'info' : 'maintenance'}`}>
                  <div className="sh-task-icon">
                    <i className={`bi ${h.status === 'pending' ? 'bi-clock' : h.status === 'accepted' ? 'bi-check-circle' : 'bi-x-circle'}`}></i>
                  </div>
                  <div className="sh-task-content">
                    <p className="sh-task-title">
                      {h.from_user?.full_name || h.from_user?.username || 'Unknown'} → {h.to_user?.full_name || h.to_user?.username || 'Unknown'}
                    </p>
                    <p className="sh-task-meta">
                      {capitalize(h.shift)} | {formatDate(h.created_at)} | {formatCurrency(h.cash_in_hand)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <span className="sh-task-badge">{capitalize(h.status)}</span>
                    {h.status === 'pending' && h.to_user_id === user?.id && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button
                          className="btn btn-sm btn-success"
                          style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}
                          onClick={() => handleAccept(h.id)}
                        >
                          Accept
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}
                          onClick={() => handleReject(h.id)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-muted" style={{ fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                  No handover history
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Start New Shift Modal */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetForm(); } }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
                <h5 className="modal-title"><i className="bi bi-play-fill me-2"></i>Start New Shift</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowModal(false); resetForm(); }}></button>
              </div>
              <div className="modal-body" style={{ padding: '24px' }}>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Your Name</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ borderRadius: '10px', padding: '12px' }}
                    placeholder="Enter your name"
                    value={user?.full_name || user?.username || ''}
                    readOnly
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Shift Type</label>
                  <select
                    className="form-select"
                    style={{ borderRadius: '10px', padding: '12px' }}
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  >
                    {shifts.map(s => (
                      <option key={s} value={s}>{getShiftLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Opening Cash Balance</label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ borderRadius: '10px 0 0 10px' }}>Rs</span>
                    <input
                      type="number"
                      className="form-control"
                      style={{ borderRadius: '0 10px 10px 0', padding: '12px' }}
                      min="0"
                      step="0.01"
                      value={formData.cash_in_hand}
                      onChange={(e) => setFormData({ ...formData, cash_in_hand: e.target.value })}
                      required
                    />
                  </div>
                  <small className="text-muted">Carried forward from previous shift</small>
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Total Collections</label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ borderRadius: '10px 0 0 10px' }}>Rs</span>
                    <input
                      type="number"
                      className="form-control"
                      style={{ borderRadius: '0 10px 10px 0', padding: '12px' }}
                      min="0"
                      step="0.01"
                      value={formData.total_collections}
                      onChange={(e) => setFormData({ ...formData, total_collections: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Pending Checkouts</label>
                  <input
                    type="number"
                    className="form-control"
                    style={{ borderRadius: '10px', padding: '12px' }}
                    min="0"
                    value={formData.pending_checkouts}
                    onChange={(e) => setFormData({ ...formData, pending_checkouts: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Notes</label>
                  <textarea
                    className="form-control"
                    style={{ borderRadius: '10px', padding: '12px' }}
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any important notes for the incoming shift..."
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>Tasks Pending</label>
                  <textarea
                    className="form-control"
                    style={{ borderRadius: '10px', padding: '12px' }}
                    rows={3}
                    value={formData.tasks_pending}
                    onChange={(e) => setFormData({ ...formData, tasks_pending: e.target.value })}
                    placeholder="List any pending tasks..."
                  ></textarea>
                </div>
                <div className="form-check mb-3">
                  <input className="form-check-input" type="checkbox" id="reviewedHandover" />
                  <label className="form-check-label" htmlFor="reviewedHandover">
                    I have reviewed the previous shift handover report
                  </label>
                </div>
              </div>
              <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
                <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: '10px' }} onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="button" className="btn" style={{ background: '#10b981', color: '#fff', borderRadius: '10px', padding: '10px 24px' }} onClick={handleCreateHandover}>
                  <i className="bi bi-play-fill me-1"></i> Start Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Handover Modal */}
      {showConfirmModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowConfirmModal(false); }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
                <h5 className="modal-title"><i className="bi bi-check-circle me-2"></i>Confirm Handover</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirmModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '24px' }}>
                <div className="text-center mb-4">
                  <div style={{ width: '80px', height: '80px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <i className="bi bi-arrow-left-right" style={{ fontSize: '32px', color: '#10b981' }}></i>
                  </div>
                  <h4 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Complete Shift Handover?</h4>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>Please ensure both parties have reviewed and confirmed the handover details.</p>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Outgoing OM</span>
                    <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{user?.full_name || user?.username || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Incoming OM</span>
                    <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{latestHandover?.to_user?.full_name || latestHandover?.to_user?.username || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Cash Handover</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(latestHandover?.cash_in_hand || 0)}</span>
                  </div>
                </div>

                <div className="alert alert-warning" style={{ borderRadius: '10px', fontSize: '13px' }}>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  This action cannot be undone. A record will be created for audit purposes.
                </div>
              </div>
              <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
                <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: '10px' }} onClick={() => setShowConfirmModal(false)}>Cancel</button>
                <button type="button" className="btn" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', borderRadius: '10px', padding: '10px 24px' }} onClick={handleCompleteHandover}>
                  <i className="bi bi-check-lg me-1"></i> Confirm Handover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discounts Detail Modal */}
      {showDiscountsModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) setShowDiscountsModal(false); }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
                <h5 className="modal-title"><i className="bi bi-percent me-2"></i>Discounts Given This Shift</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDiscountsModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  {(latestHandover?.discount_details || []).length > 0 ? (
                    latestHandover.discount_details.map((d, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8fafc', borderRadius: '10px', marginBottom: '10px' }}>
                        <div>
                          <strong style={{ color: '#1a1a2e' }}>{d.room} - {d.guest}</strong>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>{d.reason}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: '#7c3aed' }}>- {formatCurrency(d.amount)}</span>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>{d.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted" style={{ fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                      No discount details available
                    </p>
                  )}
                </div>
                <div style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#6d28d9' }}>Total Discounts</span>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#7c3aed' }}>{formatCurrency(latestHandover?.discounts || 0)}</span>
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px', textAlign: 'center' }}>
                  <i className="bi bi-shield-check me-1"></i>All discounts authorized by: {user?.full_name || user?.username || 'Operations Manager'}
                </p>
              </div>
              <div className="modal-footer" style={{ border: 'none', padding: '12px 24px' }}>
                <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: '10px' }} onClick={() => setShowDiscountsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShiftHandoverPage;
