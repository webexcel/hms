import React from 'react';
import { formatCurrency, capitalize } from '../../../utils/formatters';

const getStatusBadgeClass = (s) =>
  ({
    posted: 'posted',
    completed: 'posted',
    served: 'posted',
    pending: 'pending',
    preparing: 'preparing',
    ready: 'ready',
    cancelled: 'cancelled',
  }[s] || '');

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const OrdersList = ({ filteredOrders, activeFilter, setActiveFilter }) => (
  <div className="col-lg-7">
    <div className="orders-panel">
      <div className="orders-panel-header">
        <h3>
          <i className="bi bi-list-ul"></i> Today's Orders
        </h3>
        <div className="orders-filter">
          {['all', 'pending', 'preparing', 'served', 'cancelled'].map((filter) => (
            <button
              key={filter}
              className={`filter-btn${activeFilter === filter ? ' active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {capitalize(filter)}
            </button>
          ))}
        </div>
      </div>
      <div className="orders-list">
        {filteredOrders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <i
              className="bi bi-receipt"
              style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }}
            ></i>
            <p>No orders found</p>
          </div>
        )}
        {filteredOrders.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-card-header">
              <div>
                <div className="order-id">
                  #{order.order_number || (order.id ? `ORD-${String(order.id).padStart(3, '0')}` : '')}
                </div>
              </div>
              {order.room?.room_number && (
                <div className="order-room">Room {order.room.room_number}</div>
              )}
            </div>
            {order.guest?.first_name && (
              <div className="order-guest">
                {order.guest.first_name} {order.guest.last_name || ''}
              </div>
            )}
            {order.items && order.items.length > 0 && (
              <div style={{ padding: '6px 0', fontSize: 12, color: '#475569' }}>
                {order.items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}
                  >
                    <span>
                      {it.item_name || 'Item'} x{it.quantity}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {formatCurrency(parseFloat(it.amount) || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="order-meta">
              <span>
                <i className="bi bi-basket"></i> {order.items?.length || 0} items
              </span>
              <span>
                <i className="bi bi-clock"></i> {formatTime(order.created_at || order.createdAt)}
              </span>
            </div>
            <div className="order-card-footer">
              <div className="order-amount">{formatCurrency(order.total)}</div>
              <span className={`order-status ${getStatusBadgeClass(order.status)}`}>
                {capitalize(order.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default OrdersList;
