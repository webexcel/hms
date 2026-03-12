import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

const ReconciliationPage = () => {
  useDocumentTitle('OTA Reconciliation');

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    try {
      const { data } = await api.get('/channels');
      setChannels(data);
      if (data.length > 0) setSelectedChannel(data[0].id);
    } catch (err) {
      toast.error('Failed to load channels');
    }
  }, []);

  const fetchReports = useCallback(async (channelId) => {
    if (!channelId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/channels/${channelId}/reconciliation`);
      setReports(data.data || []);
    } catch (err) {
      toast.error('Failed to load reconciliation reports');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (selectedChannel) fetchReports(selectedChannel);
  }, [selectedChannel, fetchReports]);

  const statusBadge = (status) => {
    const colors = {
      draft: 'bg-secondary', generated: 'bg-primary', matched: 'bg-success',
      discrepancy: 'bg-danger', resolved: 'bg-info',
    };
    return <span className={`badge ${colors[status] || 'bg-secondary'}`}>{status}</span>;
  };

  // Summary stats
  const totalRevenue = reports.reduce((s, r) => s + parseFloat(r.total_revenue || 0), 0);
  const totalCommission = reports.reduce((s, r) => s + parseFloat(r.total_commission || 0), 0);
  const totalBookings = reports.reduce((s, r) => s + (r.total_bookings || 0), 0);
  const discrepancies = reports.filter((r) => r.status === 'discrepancy').length;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-clipboard-data me-2" />Reconciliation</h2>
        <select className="form-select" style={{ maxWidth: 250 }}
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}>
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>{ch.name}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="text-muted small">Total Bookings</div>
              <div className="h3 mb-0">{totalBookings}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="text-muted small">Total Revenue</div>
              <div className="h3 mb-0 text-success">{formatCurrency(totalRevenue)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="text-muted small">Total Commission</div>
              <div className="h3 mb-0 text-danger">{formatCurrency(totalCommission)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="text-muted small">Discrepancies</div>
              <div className={`h3 mb-0 ${discrepancies > 0 ? 'text-danger' : 'text-success'}`}>
                {discrepancies}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center p-5"><div className="spinner-border" /></div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Period</th><th>Bookings</th><th>Cancellations</th>
                <th>Revenue</th><th>Commission</th><th>Net</th>
                <th>OTA Payout</th><th>Discrepancy</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.period_start} to {r.period_end}</td>
                  <td>{r.total_bookings}</td>
                  <td>{r.cancellations}</td>
                  <td>{formatCurrency(r.total_revenue)}</td>
                  <td className="text-danger">{formatCurrency(r.total_commission)}</td>
                  <td className="text-success">{formatCurrency(r.net_amount)}</td>
                  <td>{r.ota_payout_amount ? formatCurrency(r.ota_payout_amount) : '—'}</td>
                  <td className={parseFloat(r.discrepancy_amount || 0) !== 0 ? 'text-danger fw-bold' : ''}>
                    {r.discrepancy_amount ? formatCurrency(r.discrepancy_amount) : '—'}
                  </td>
                  <td>{statusBadge(r.status)}</td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-5">
                    <i className="bi bi-clipboard-x display-4 d-block mb-2" />
                    No reconciliation reports. Reports are generated weekly automatically.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReconciliationPage;
