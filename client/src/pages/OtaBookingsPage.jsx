import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import useDocumentTitle from '../hooks/useDocumentTitle';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';

const OtaBookingsPage = () => {
  useDocumentTitle('OTA Bookings');

  const [reservations, setReservations] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ channel_id: '', status: '' });

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      // Only include OTA bookings (source not 'direct')
      if (filters.channel_id) params.channel_id = filters.channel_id;
      if (filters.status) params.status = filters.status;

      const { data } = await api.get('/reservations', { params });
      // Filter to show only OTA bookings
      const otaBookings = (data.data || []).filter((r) => r.channel_id || (r.source && r.source !== 'direct'));
      setReservations(otaBookings);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load OTA bookings');
    }
    setLoading(false);
  }, [page, filters]);

  const fetchChannels = useCallback(async () => {
    try {
      const { data } = await api.get('/channels');
      setChannels(data);
    } catch (err) { /* channels may not be loaded */ }
  }, []);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const statusBadge = (status) => {
    const colors = {
      pending: 'bg-warning', confirmed: 'bg-primary', checked_in: 'bg-success',
      checked_out: 'bg-secondary', cancelled: 'bg-danger', no_show: 'bg-dark',
    };
    return <span className={`badge ${colors[status] || 'bg-secondary'}`}>{status?.replace('_', ' ')}</span>;
  };

  const settlementBadge = (status) => {
    const colors = { na: 'bg-secondary', pending: 'bg-warning', settled: 'bg-success', disputed: 'bg-danger' };
    return <span className={`badge ${colors[status] || 'bg-secondary'}`}>{status || 'n/a'}</span>;
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-globe me-2" />OTA Bookings</h2>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        <div className="col-auto">
          <select className="form-select" value={filters.channel_id}
            onChange={(e) => { setFilters({ ...filters, channel_id: e.target.value }); setPage(1); }}>
            <option value="">All Channels</option>
            {channels.map((ch) => (
              <option key={ch.id} value={ch.id}>{ch.name}</option>
            ))}
          </select>
        </div>
        <div className="col-auto">
          <select className="form-select" value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
            <option value="">All Statuses</option>
            {['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center p-5"><div className="spinner-border" /></div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Reservation #</th><th>OTA Source</th><th>OTA Booking ID</th>
                  <th>Guest</th><th>Check-in</th><th>Check-out</th>
                  <th>Amount</th><th>Commission</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td><code>{r.reservation_number}</code></td>
                    <td>
                      <span className="badge bg-info">{r.otaChannel?.name || r.source}</span>
                    </td>
                    <td className="small"><code>{r.ota_booking_id || '—'}</code></td>
                    <td>{r.guest ? `${r.guest.first_name} ${r.guest.last_name}` : '—'}</td>
                    <td>{r.check_in_date}</td>
                    <td>{r.check_out_date}</td>
                    <td>{formatCurrency(r.total_amount)}</td>
                    <td className="text-danger">{r.ota_commission ? formatCurrency(r.ota_commission) : '—'}</td>
                    <td>{statusBadge(r.status)}</td>
                  </tr>
                ))}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-5">
                      <i className="bi bi-inbox display-4 d-block mb-2" />
                      No OTA bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav>
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(page - 1)}>Previous</button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(page + 1)}>Next</button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default OtaBookingsPage;
