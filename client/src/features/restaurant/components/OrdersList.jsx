import React from 'react';
import { formatCurrency, capitalize } from '../../../utils/formatters';

const statusBadge = (s, posted) => {
  if (posted) return { bg: '#dbeafe', fg: '#1e40af', label: 'POSTED' };
  const key = (s || '').toLowerCase();
  if (key === 'pending') return { bg: '#fef3c7', fg: '#92400e', label: 'PENDING' };
  if (key === 'served') return { bg: '#dcfce7', fg: '#166534', label: 'SERVED' };
  if (key === 'completed') return { bg: '#dbeafe', fg: '#1e40af', label: 'COMPLETED' };
  if (key === 'cancelled') return { bg: '#fecaca', fg: '#991b1b', label: 'CANCELLED' };
  return { bg: '#f3f4f6', fg: '#374151', label: (s || '').toUpperCase() };
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const OrdersList = ({ filteredOrders, activeFilter, setActiveFilter, handleUpdateOrderStatus, handlePostToRoom }) => (
  <div className="col-12">
    <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h6 className="mb-0 fw-bold">
          <i className="bi bi-list-ul me-2"></i>Today's Orders to Room ({filteredOrders.length})
        </h6>
        <div className="btn-group btn-group-sm">
          {['all', 'pending', 'served', 'cancelled'].map((filter) => (
            <button key={filter}
              className={`btn ${activeFilter === filter ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveFilter(filter)}
              style={{ textTransform: 'capitalize', fontSize: 11 }}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-4 text-muted">
          <i className="bi bi-receipt" style={{ fontSize: 28, opacity: 0.4 }}></i>
          <div className="mt-2" style={{ fontSize: 13 }}>No orders found</div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-hover mb-0" style={{ fontSize: 12 }}>
            <thead style={{ background: '#f9fafb', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              <tr>
                <th>Time</th>
                <th>Order #</th>
                <th>Room</th>
                <th>Guest</th>
                <th>Items</th>
                <th className="text-end">Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const badge = statusBadge(order.status, order.posted_to_room);
                return (
                  <tr key={order.id}>
                    <td style={{ fontSize: 10, color: '#94a3b8' }}>{formatTime(order.created_at || order.createdAt)}</td>
                    <td><strong style={{ fontSize: 11 }}>{order.order_number || `ORD-${order.id}`}</strong></td>
                    <td><strong>{order.room?.room_number || '—'}</strong></td>
                    <td style={{ fontSize: 11 }}>{order.guest ? `${order.guest.first_name} ${order.guest.last_name || ''}`.trim() : '—'}</td>
                    <td style={{ fontSize: 10, maxWidth: 260, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {(order.items || []).map(it => `${it.item_name} ×${it.quantity}`).join(', ') || '—'}
                    </td>
                    <td className="text-end fw-bold">{formatCurrency(parseFloat(order.total) || 0)}</td>
                    <td>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: badge.bg, color: badge.fg }}>
                        {badge.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {order.status === 'pending' && handleUpdateOrderStatus && (
                          <>
                            <button className="btn btn-sm btn-success" style={{ fontSize: 10, padding: '2px 8px' }}
                              onClick={() => handleUpdateOrderStatus(order.id, 'served')} title="Mark as Served">
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" style={{ fontSize: 10, padding: '2px 8px' }}
                              onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} title="Cancel">
                              <i className="bi bi-x"></i>
                            </button>
                          </>
                        )}
                        {order.status === 'served' && !order.posted_to_room && handlePostToRoom && (
                          <button className="btn btn-sm btn-primary" style={{ fontSize: 10, padding: '2px 8px' }}
                            onClick={() => handlePostToRoom(order.id)} title="Post to Room Billing">
                            <i className="bi bi-receipt me-1"></i>Post
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);

export default OrdersList;
