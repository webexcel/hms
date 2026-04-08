import { ITEM_CATEGORIES, SERVICE_TYPES } from '../hooks/useLaundry';

export default function NewLaundryOrderForm({
  orderForm,
  rooms,
  handleRoomChange,
  handleFormChange,
  handleAddItem,
  handleRemoveItem,
  handleItemChange,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  isFormValid,
  handleCreateOrder,
}) {
  return (
    <div className="col-lg-5">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom">
          <h6 className="mb-0"><i className="bi bi-plus-circle me-2"></i>New Laundry Order</h6>
        </div>
        <div className="card-body">
          {/* Room & Service Type */}
          <div className="row g-2 mb-3">
            <div className="col-7">
              <label className="form-label small">Room</label>
              <select className="form-select form-select-sm" value={orderForm.room_id} onChange={handleRoomChange}>
                <option value="">Select Room</option>
                {rooms.filter((r) => r.status === 'occupied').map((r) => (
                  <option key={r.id} value={r.id}>Room {r.room_number}</option>
                ))}
              </select>
            </div>
            <div className="col-5">
              <label className="form-label small">Service</label>
              <select
                className="form-select form-select-sm"
                value={orderForm.service_type}
                onChange={(e) => handleFormChange('service_type', e.target.value)}
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Items */}
          <label className="form-label small fw-semibold">Items</label>
          {orderForm.items.map((item, idx) => (
            <div key={idx} className="border rounded p-2 mb-2 bg-light">
              <div className="row g-2">
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Item name"
                    value={item.item_name}
                    onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <select
                    className="form-select form-select-sm"
                    value={item.category}
                    onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                  >
                    {ITEM_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-4">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Qty"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  />
                </div>
                <div className="col-5">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    placeholder="Price ₹"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                  />
                </div>
                <div className="col-3 d-flex align-items-center justify-content-end">
                  <span className="small fw-bold me-2">
                    ₹{((parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0)).toFixed(0)}
                  </span>
                  {orderForm.items.length > 1 && (
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveItem(idx)}>
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button className="btn btn-sm btn-outline-primary mb-3" onClick={handleAddItem}>
            <i className="bi bi-plus me-1"></i>Add Item
          </button>

          {/* Notes & Expected Delivery */}
          <div className="mb-3">
            <label className="form-label small">Notes</label>
            <textarea
              className="form-control form-control-sm"
              rows="2"
              value={orderForm.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              placeholder="Special instructions..."
            />
          </div>
          <div className="mb-3">
            <label className="form-label small">Expected Delivery</label>
            <input
              type="datetime-local"
              className="form-control form-control-sm"
              value={orderForm.expected_delivery}
              onChange={(e) => handleFormChange('expected_delivery', e.target.value)}
            />
          </div>

          {/* Totals */}
          <div className="border-top pt-3">
            <div className="d-flex justify-content-between small">
              <span>Subtotal</span><span>₹{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between small text-muted">
              <span>GST (18%)</span><span>₹{calculateTax().toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold mt-1">
              <span>Total</span><span>₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <button
            className="btn btn-primary w-100 mt-3"
            disabled={!isFormValid()}
            onClick={handleCreateOrder}
          >
            <i className="bi bi-check-circle me-1"></i>Create Order
          </button>
        </div>
      </div>
    </div>
  );
}
