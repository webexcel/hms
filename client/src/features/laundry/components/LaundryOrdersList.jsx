import { STATUS_OPTIONS } from '../hooks/useLaundry';

const statusBadge = (status) => {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || { label: status, color: 'secondary' };
  return <span className={`badge bg-${opt.color}`}>{opt.label}</span>;
};

const serviceLabel = (type) => {
  const map = { regular: 'Regular', express: 'Express', dry_clean: 'Dry Clean' };
  return map[type] || type;
};

export default function LaundryOrdersList({
  filteredOrders,
  activeFilter,
  setActiveFilter,
  handleUpdateStatus,
  handlePostToRoom,
}) {
  const filterButtons = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="col-lg-7">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
          <h6 className="mb-0"><i className="bi bi-list-ul me-2"></i>Orders ({filteredOrders.length})</h6>
        </div>
        <div className="card-body p-0">
          {/* Filter pills */}
          <div className="d-flex gap-1 flex-wrap p-3 border-bottom">
            {filterButtons.map((f) => (
              <button
                key={f.value}
                className={`btn btn-sm ${activeFilter === f.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-inbox fs-1 d-block mb-2"></i>
              No orders found
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Order</th>
                    <th>Room</th>
                    <th>Service</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="fw-semibold small">{order.order_number}</span>
                        <br />
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {new Date(order.createdAt || order.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td>{order.room ? order.room.room_number : '—'}</td>
                      <td>
                        <span className={`badge bg-${order.service_type === 'express' ? 'danger' : order.service_type === 'dry_clean' ? 'purple' : 'secondary'} bg-opacity-75`}>
                          {serviceLabel(order.service_type)}
                        </span>
                      </td>
                      <td>{order.items?.length || 0}</td>
                      <td className="fw-semibold">₹{parseFloat(order.total).toFixed(0)}</td>
                      <td>{statusBadge(order.status)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          {order.status === 'pending' && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              title="Mark as Delivered"
                              onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            >
                              <i className="bi bi-check-lg"></i> Delivered
                            </button>
                          )}
                          {order.room_id && !order.posted_to_room && order.status === 'delivered' && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              title="Post to Room Bill"
                              onClick={() => handlePostToRoom(order.id)}
                            >
                              <i className="bi bi-receipt me-1"></i>Post to Bill
                            </button>
                          )}
                          {order.posted_to_room && (
                            <span className="badge bg-success bg-opacity-10 text-success">
                              <i className="bi bi-check-circle me-1"></i>Billed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
