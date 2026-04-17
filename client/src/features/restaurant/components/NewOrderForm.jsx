import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../../utils/formatters';

const NewOrderForm = ({
  orderForm,
  rooms,
  menuByCategory,
  menuItems,
  getItemPrice,
  calculateSubtotal,
  calculateGST,
  calculateTotal,
  isFormValid,
  handleRoomChange,
  handleAddMenuItemToCart,
  handleDecrementItem,
  handleRemoveItem,
  handleItemChange,
  handlePlaceOrder,
}) => {
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  const categories = useMemo(() => {
    const cats = [{ value: 'all', label: 'All' }];
    menuByCategory.forEach(c => cats.push({ value: c.value, label: c.label }));
    return cats;
  }, [menuByCategory]);

  const visibleItems = useMemo(() => {
    let all = [];
    menuByCategory.forEach(c => {
      if (activeCat === 'all' || activeCat === c.value) {
        c.items.forEach(mi => all.push({ ...mi, _category: c.label }));
      }
    });
    if (search) {
      const q = search.toLowerCase();
      all = all.filter(mi => mi.name.toLowerCase().includes(q));
    }
    return all;
  }, [menuByCategory, activeCat, search]);

  const cartMap = useMemo(() => {
    const m = {};
    orderForm.items.forEach(i => {
      if (i.menu_item_id) m[i.menu_item_id] = (m[i.menu_item_id] || 0) + (parseInt(i.quantity) || 0);
    });
    return m;
  }, [orderForm.items]);

  const cartItems = orderForm.items.filter(i => i.menu_item_id);

  return (
    <>
      {/* LEFT: Menu */}
      <div className="col-lg-8">
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h5 style={{ margin: 0, marginBottom: 16, fontWeight: 700 }}>
            <i className="bi bi-menu-button-wide me-2"></i>Menu
          </h5>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input type="text" placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)}
              className="form-control" style={{ borderRadius: 10 }} />
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button key={c.value}
                onClick={() => setActiveCat(c.value)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${activeCat === c.value ? '#6366f1' : '#e2e8f0'}`,
                  background: activeCat === c.value ? '#6366f1' : '#fff',
                  color: activeCat === c.value ? '#fff' : '#475569',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, maxHeight: 560, overflowY: 'auto' }}>
            {visibleItems.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: 30 }}>
                No menu items found
              </div>
            ) : visibleItems.map(mi => {
              const qty = cartMap[mi.id] || 0;
              return (
                <div key={mi.id}
                  onClick={() => handleAddMenuItemToCart(mi.id)}
                  style={{
                    padding: '14px 12px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                    border: `2px solid ${qty > 0 ? '#6366f1' : '#e2e8f0'}`,
                    background: qty > 0 ? '#eef2ff' : '#fff',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (qty === 0) e.currentTarget.style.borderColor = '#c7d2fe'; }}
                  onMouseLeave={e => { if (qty === 0) e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                  {qty > 0 && (
                    <span style={{
                      position: 'absolute', top: -8, right: -8,
                      background: '#6366f1', color: '#fff', fontSize: 11, fontWeight: 700,
                      padding: '3px 9px', borderRadius: 20, minWidth: 26, textAlign: 'center',
                      boxShadow: '0 2px 6px rgba(99,102,241,0.4)',
                    }}>{qty}</span>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 4, lineHeight: 1.3 }}>
                    {mi.name.replace(/\s*\(.*?\)/g, '')}
                    {mi.is_veg !== undefined && (
                      <span style={{
                        display: 'inline-block', marginLeft: 6, width: 10, height: 10, borderRadius: 2,
                        border: `1.5px solid ${mi.is_veg ? '#16a34a' : '#dc2626'}`, position: 'relative',
                      }}>
                        <span style={{
                          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                          width: 4, height: 4, borderRadius: '50%',
                          background: mi.is_veg ? '#16a34a' : '#dc2626',
                        }}/>
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8 }}>{mi._category}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#6366f1' }}>{formatCurrency(parseFloat(mi.price))}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT: Cart */}
      <div className="col-lg-4">
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 20 }}>
          <h5 style={{ margin: 0, marginBottom: 16, fontWeight: 700 }}>
            <i className="bi bi-cart3 me-2"></i>Order ({cartItems.length})
          </h5>

          {/* Order Type */}
          <div className="mb-3">
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Order Type</label>
            <select className="form-select form-select-sm" value={orderForm.room_id || ''}
              onChange={e => handleRoomChange(e)}
              style={{ borderRadius: 8, marginTop: 4 }}>
              <option value="">Select Room</option>
              {rooms.filter(r => r.status === 'occupied').map(room => (
                <option key={room.id} value={room.id}>
                  Room {room.room_number} - {room.guest_name || 'Guest'}
                </option>
              ))}
            </select>
          </div>

          {orderForm.room_id && orderForm.guest_name && (
            <div style={{ padding: '8px 12px', background: '#f0fdf4', borderRadius: 8, marginBottom: 12, fontSize: 12, color: '#166534', fontWeight: 600 }}>
              <i className="bi bi-person-check me-1"></i>{orderForm.guest_name}
            </div>
          )}

          {/* Cart items */}
          <div style={{ maxHeight: 360, overflowY: 'auto', marginBottom: 12 }}>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#cbd5e1', padding: 30, fontSize: 13 }}>
                <i className="bi bi-cart" style={{ fontSize: 36, display: 'block', marginBottom: 6 }}></i>
                Click menu items to add
              </div>
            ) : (
              cartItems.map((item, index) => {
                const mi = menuItems.find(m => String(m.id) === String(item.menu_item_id));
                const price = getItemPrice(item.menu_item_id);
                const qty = parseInt(item.quantity) || 0;
                const amt = price * qty;
                return (
                  <div key={`${item.menu_item_id}-${index}`} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 0', borderBottom: '1px solid #f0f0f0',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {mi?.name?.replace(/\s*\(.*?\)/g, '') || 'Item'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatCurrency(price)} x {qty}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => handleDecrementItem(item.menu_item_id)}
                        style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#64748b' }}>−</button>
                      <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{qty}</span>
                      <button
                        onClick={() => handleAddMenuItemToCart(item.menu_item_id)}
                        style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#16a34a' }}>+</button>
                    </div>
                    <div style={{ width: 70, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
                      {formatCurrency(amt)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Totals */}
          <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', padding: '4px 0' }}>
              <span>Subtotal</span>
              <span>{formatCurrency(calculateSubtotal())}</span>
            </div>
            {calculateGST() > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', padding: '4px 0' }}>
              <span>GST (5%)</span>
              <span>{formatCurrency(calculateGST())}</span>
            </div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#1a1a2e', padding: '8px 0 4px', borderTop: '1px dashed #e2e8f0', marginTop: 4 }}>
              <span>Total</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <button className="btn btn-primary w-100" disabled={!isFormValid()} onClick={handlePlaceOrder}
            style={{ borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700,
              background: isFormValid() ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#cbd5e1',
              border: 'none' }}>
            <i className="bi bi-send me-2"></i>Place Order
          </button>
        </div>
      </div>
    </>
  );
};

export default NewOrderForm;
