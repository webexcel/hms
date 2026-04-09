import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const NewOrderForm = ({
  orderForm,
  rooms,
  menuByCategory,
  getItemPrice,
  calculateSubtotal,
  calculateGST,
  calculateTotal,
  isFormValid,
  handleRoomChange,
  handleAddItem,
  handleRemoveItem,
  handleItemChange,
  handlePlaceOrder,
}) => (
  <div className="col-lg-5">
    <div className="new-order-card">
      <h3>
        <i className="bi bi-plus-circle"></i> New Order
      </h3>

      {/* Order Type */}
      <div className="mb-3">
        <label className="form-label-custom">Order Type</label>
        <select className="form-control-custom" value={orderForm.room_id || 'walkin'} onChange={(e) => {
          if (e.target.value === 'walkin') {
            handleRoomChange({ target: { value: '' } });
          } else {
            handleRoomChange(e);
          }
        }}>
          <option value="walkin">Walk-in / Dine-in (No Room)</option>
          {rooms
            .filter((r) => r.status === 'occupied')
            .map((room) => (
              <option key={room.id} value={room.id}>
                Room {room.room_number} - {room.guest_name || 'Guest'} ({room.room_type || ''})
              </option>
            ))}
        </select>
      </div>

      {orderForm.room_id && orderForm.guest_name && (
        <div className="guest-display">
          <div className="guest-display-label">Guest</div>
          <div className="guest-display-name">{orderForm.guest_name}</div>
        </div>
      )}
      {!orderForm.room_id && (
        <div className="guest-display" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <div className="guest-display-label" style={{ color: '#92400e' }}>Walk-in Customer</div>
          <div className="guest-display-name" style={{ color: '#92400e', fontSize: 12 }}>Bill will be paid directly at restaurant</div>
        </div>
      )}

      {/* Order Items */}
      <div className="order-items-container">
        <div className="order-items-header">
          <span>Menu Item</span>
          <span>Qty</span>
          <span>Rate</span>
          <span>Amt</span>
          <span></span>
        </div>
        <div>
          {orderForm.items.map((item, index) => {
            const price = getItemPrice(item.menu_item_id);
            const qty = parseInt(item.quantity) || 0;
            const amt = price * qty;
            return (
              <div
                className="order-item-row"
                key={index}
                style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}
              >
                <select
                  className="item-name"
                  value={item.menu_item_id}
                  onChange={(e) => handleItemChange(index, 'menu_item_id', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    fontSize: 13,
                  }}
                >
                  <option value="">Select item...</option>
                  {menuByCategory.map((cat) => (
                    <optgroup label={cat.label} key={cat.value}>
                      {cat.items.map((mi) => (
                        <option key={mi.id} value={mi.id}>
                          {mi.name.replace(/\s*\(.*?\)/g, '')} - Rs.{mi.price}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  className="item-qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  style={{
                    width: 50,
                    padding: '6px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    textAlign: 'center',
                    fontSize: 13,
                  }}
                />
                <span
                  style={{ width: 60, textAlign: 'right', fontSize: 12, color: '#64748b', fontWeight: 600 }}
                >
                  {price > 0 ? `\u20B9${price}` : '-'}
                </span>
                <span
                  style={{ width: 70, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}
                >
                  {amt > 0 ? formatCurrency(amt) : '-'}
                </span>
                <button
                  className="btn-remove-item"
                  onClick={() => handleRemoveItem(index)}
                  style={{
                    visibility: orderForm.items.length > 1 ? 'visible' : 'hidden',
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
            );
          })}
        </div>
        <button className="btn-add-item" onClick={handleAddItem}>
          <i className="bi bi-plus"></i> Add Item
        </button>
      </div>

      {/* Order Summary */}
      <div className="order-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{formatCurrency(calculateSubtotal())}</span>
        </div>
        <div className="summary-row">
          <span>GST (5%)</span>
          <span>{formatCurrency(calculateGST())}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span>{formatCurrency(calculateTotal())}</span>
        </div>
      </div>

      <button className="btn-post-room" disabled={!isFormValid()} onClick={handlePlaceOrder}>
        <i className="bi bi-send"></i> Place Order
      </button>
    </div>
  </div>
);

export default NewOrderForm;
