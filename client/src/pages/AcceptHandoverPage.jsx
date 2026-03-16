import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/atoms/LoadingSpinner';
import { formatCurrency, formatDate, capitalize } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function AcceptHandoverPage() {
  const navigate = useNavigate();
  const api = useApi();
  const { user } = useAuth();
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get('/shift-handover/pending');
      setHandovers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch pending handovers');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      setProcessing(true);
      await api.put(`/shift-handover/${id}/accept`);
      toast.success('Handover accepted successfully');
      navigate('/front-desk');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept handover');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason === null) return;
    try {
      setProcessing(true);
      await api.put(`/shift-handover/${id}/reject`, { reason });
      toast.success('Handover rejected');
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject handover');
    } finally {
      setProcessing(false);
    }
  };

  const getTaskIcon = (type) => {
    const map = {
      maintenance: 'bi-wrench text-danger',
      request: 'bi-chat-dots text-primary',
      vip: 'bi-star text-warning',
      checkout: 'bi-box-arrow-right text-info',
      complaint: 'bi-exclamation-triangle text-danger',
    };
    return map[type] || 'bi-circle text-secondary';
  };

  if (loading) return <LoadingSpinner />;

  // No pending handovers
  if (handovers.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="card shadow-sm" style={{ maxWidth: 500, width: '100%' }}>
          <div className="card-body text-center py-5">
            <div className="mb-3">
              <i className="bi bi-check-circle" style={{ fontSize: 48, color: '#27ae60' }}></i>
            </div>
            <h4>No Pending Handover</h4>
            <p className="text-muted mb-4">There are no shift handovers waiting for your acceptance.</p>
            <button className="btn btn-primary" onClick={() => navigate('/front-desk')}>
              <i className="bi bi-door-open me-2"></i>Go to Front Desk
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handover = handovers[0]; // Show the most recent pending handover
  const outgoing = handover.outgoingUser || {};
  const outgoingName = `${outgoing.first_name || ''} ${outgoing.last_name || ''}`.trim() || outgoing.username || 'Unknown';

  // Parse tasks_pending - it's JSON (array of objects or strings)
  let pendingTasks = [];
  if (Array.isArray(handover.tasks_pending)) {
    pendingTasks = handover.tasks_pending;
  } else if (typeof handover.tasks_pending === 'string') {
    try {
      pendingTasks = JSON.parse(handover.tasks_pending);
    } catch {
      pendingTasks = handover.tasks_pending.split('\n').filter(t => t.trim()).map(t => ({ text: t.trim() }));
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-start" style={{ minHeight: '80vh', paddingTop: 40 }}>
      <div className="card shadow" style={{ maxWidth: 750, width: '100%' }}>
        {/* Header */}
        <div className="card-header text-white text-center" style={{ background: 'linear-gradient(135deg, #2c3e50, #34495e)', padding: '20px 25px' }}>
          <h4 className="mb-1">
            <i className="bi bi-arrow-left-right me-2"></i>Shift Handover
          </h4>
          <small className="opacity-75">Review and accept the handover from the outgoing operator</small>
        </div>

        <div className="card-body p-4">
          {/* Outgoing Operator Info */}
          <div className="d-flex align-items-center mb-4 p-3 bg-light rounded">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
              style={{ width: 50, height: 50, fontSize: 18, fontWeight: 600 }}>
              {(outgoing.first_name || 'U')[0]}{(outgoing.last_name || '')[0] || ''}
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-0">{outgoingName}</h6>
              <small className="text-muted">{capitalize(outgoing.role || '')} - {capitalize(handover.shift || '')} Shift</small>
            </div>
            <div className="text-end">
              <small className="text-muted d-block">{formatDate(handover.shift_date)}</small>
              <small className="text-muted">{formatDate(handover.created_at, 'hh:mm A')}</small>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <small className="text-muted d-block">Cash in Hand</small>
                <h5 className="mb-0 text-success">{formatCurrency(handover.cash_in_hand)}</h5>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <small className="text-muted d-block">Total Collections</small>
                <h5 className="mb-0 text-primary">{formatCurrency(handover.total_collections)}</h5>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <small className="text-muted d-block">Pending Checkouts</small>
                <h5 className="mb-0 text-warning">{handover.pending_checkouts || 0}</h5>
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-exclamation-circle me-2 text-warning"></i>
                Pending Issues / Tasks ({pendingTasks.length})
              </h6>
              <div className="list-group">
                {pendingTasks.map((task, index) => {
                  const taskText = typeof task === 'string' ? task : task.text || task.description || '';
                  const taskType = typeof task === 'object' ? task.type : '';
                  return (
                    <div key={index} className="list-group-item d-flex align-items-center">
                      <i className={`bi ${getTaskIcon(taskType)} me-3`} style={{ fontSize: 18 }}></i>
                      <span>{taskText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {handover.notes && (
            <div className="mb-4">
              <h6 className="fw-bold mb-2">
                <i className="bi bi-chat-left-text me-2"></i>Notes from Outgoing Operator
              </h6>
              <div className="p-3 bg-light rounded border-start border-4 border-primary">
                {handover.notes}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-top pt-4 mt-2">
            <div className="d-flex gap-3 justify-content-center">
              <button
                className="btn btn-success btn-lg px-4"
                onClick={() => handleAccept(handover.id)}
                disabled={processing}
              >
                {processing ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                ) : (
                  <><i className="bi bi-check-lg me-2"></i>Accept & Start Shift</>
                )}
              </button>
              <button
                className="btn btn-outline-danger btn-lg px-4"
                onClick={() => handleReject(handover.id)}
                disabled={processing}
              >
                <i className="bi bi-x-lg me-2"></i>Reject
              </button>
            </div>
          </div>

          {/* Skip option */}
          <div className="text-center mt-3">
            <button className="btn btn-link text-muted" onClick={() => navigate('/front-desk')}>
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
