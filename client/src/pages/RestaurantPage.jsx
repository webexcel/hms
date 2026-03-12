import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate, capitalize } from '../utils/formatters';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'starters', label: 'Starters' },
  { value: 'soups', label: 'Soups' },
  { value: 'main_course', label: 'Main Course' },
  { value: 'desserts', label: 'Desserts' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'snacks', label: 'Snacks' },
];

const RestaurantPage = () => {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalPosted: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu'

  // New order form state
  const [orderForm, setOrderForm] = useState({
    room_id: '',
    items: [{ menu_item_id: '', quantity: 1 }],
    guest_name: ''
  });

  // Menu master form state
  const [menuForm, setMenuForm] = useState({
    name: '', category: 'main_course', price: '', is_veg: true, description: ''
  });
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuFilter, setMenuFilter] = useState('all');

  const api = useApi();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, menuRes, roomsRes] = await Promise.all([
        api.get('/restaurant/orders'),
        api.get('/restaurant/menu'),
        api.get('/rooms')
      ]);
      const ordersList = ordersRes.data?.data || ordersRes.data || [];
      setOrders(ordersList);
      setMenuItems(menuRes.data?.data || menuRes.data || []);
      setRooms(roomsRes.data?.data || roomsRes.data || []);

      const todayOrders = ordersList.filter(o => {
        const orderDate = new Date(o.created_at || o.createdAt).toDateString();
        return orderDate === new Date().toDateString();
      });
      const revenue = todayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      const active = ordersList.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));

      setStats({
        totalOrders: todayOrders.length,
        totalPosted: revenue,
        pendingOrders: active.length
      });
    } catch (error) {
      toast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  // ---- Order Form ----
  const handleRoomChange = (e) => {
    const roomId = e.target.value;
    const room = rooms.find(r => String(r.id) === roomId);
    setOrderForm({ ...orderForm, room_id: roomId, guest_name: room?.guest_name || '' });
  };

  const handleAddItem = () => {
    setOrderForm({ ...orderForm, items: [...orderForm.items, { menu_item_id: '', quantity: 1 }] });
  };

  const handleRemoveItem = (index) => {
    if (orderForm.items.length <= 1) return;
    setOrderForm({ ...orderForm, items: orderForm.items.filter((_, i) => i !== index) });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setOrderForm({ ...orderForm, items: updated });
  };

  const getItemPrice = (menuItemId) => {
    const mi = menuItems.find(m => String(m.id) === String(menuItemId));
    return mi ? parseFloat(mi.price) : 0;
  };

  const getItemName = (menuItemId) => {
    const mi = menuItems.find(m => String(m.id) === String(menuItemId));
    return mi?.name || '';
  };

  const calculateSubtotal = () => {
    return orderForm.items.reduce((sum, item) => {
      return sum + (getItemPrice(item.menu_item_id) * (parseInt(item.quantity) || 0));
    }, 0);
  };

  const calculateGST = () => Math.round(calculateSubtotal() * 0.05);
  const calculateTotal = () => calculateSubtotal() + calculateGST();

  const isFormValid = () => {
    return !!orderForm.room_id &&
      orderForm.items.some(item => item.menu_item_id && (parseInt(item.quantity) || 0) > 0);
  };

  const handlePostToRoom = async () => {
    if (!isFormValid()) { toast.error('Please fill in all required fields'); return; }
    try {
      const validItems = orderForm.items.filter(item => item.menu_item_id && (parseInt(item.quantity) || 0) > 0);
      // 1. Create the order
      const res = await api.post('/restaurant/orders', {
        room_id: orderForm.room_id,
        order_type: 'room_service',
        items: validItems.map(item => ({
          menu_item_id: parseInt(item.menu_item_id),
          quantity: parseInt(item.quantity),
        })),
      });
      const orderId = res.data?.data?.id;
      // 2. Post the order to room billing
      if (orderId) {
        await api.put(`/restaurant/orders/${orderId}/post-to-room`);
      }
      toast.success('Order posted to Room successfully!');
      setOrderForm({ room_id: '', items: [{ menu_item_id: '', quantity: 1 }], guest_name: '' });
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to post order');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/restaurant/orders/${orderId}/status`, { status });
      toast.success(`Order status updated to ${capitalize(status)}`);
      fetchData();
    } catch { toast.error('Failed to update order status'); }
  };

  // ---- Menu Master ----
  const handleSaveMenuItem = async () => {
    if (!menuForm.name || !menuForm.price || !menuForm.category) {
      toast.error('Name, category and price are required');
      return;
    }
    try {
      if (editingMenuId) {
        await api.put(`/restaurant/menu/${editingMenuId}`, menuForm);
        toast.success('Menu item updated');
      } else {
        await api.post('/restaurant/menu', menuForm);
        toast.success('Menu item added');
      }
      setMenuForm({ name: '', category: 'main_course', price: '', is_veg: true, description: '' });
      setEditingMenuId(null);
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleEditMenuItem = (item) => {
    setMenuForm({ name: item.name, category: item.category, price: item.price, is_veg: item.is_veg, description: item.description || '' });
    setEditingMenuId(item.id);
  };

  const handleDeleteMenuItem = async (id) => {
    try {
      await api.del(`/restaurant/menu/${id}`);
      toast.success('Menu item deleted');
      fetchData();
    } catch { toast.error('Failed to delete menu item'); }
  };

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      await api.put(`/restaurant/menu/${itemId}`, { is_available: !currentStatus });
      toast.success('Availability updated');
      fetchData();
    } catch { toast.error('Failed to update availability'); }
  };

  // ---- Helpers ----
  const getStatusBadgeClass = (s) => ({ posted: 'posted', completed: 'posted', served: 'posted', pending: 'pending', preparing: 'preparing', ready: 'ready', cancelled: 'cancelled' }[s] || '');

  const filteredOrders = activeFilter === 'all' ? orders : orders.filter(o => o.status === activeFilter);
  const filteredMenuItems = menuFilter === 'all' ? menuItems : menuItems.filter(m => m.category === menuFilter);

  // Group available menu items by category for the dropdown
  const availableMenuItems = menuItems.filter(m => m.is_available);
  const menuByCategory = CATEGORIES.reduce((acc, cat) => {
    const items = availableMenuItems.filter(m => m.category === cat.value);
    if (items.length > 0) acc.push({ ...cat, items });
    return acc;
  }, []);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="rest-stats">
        <div className="rest-stat">
          <div className="rest-stat-icon orders"><i className="bi bi-receipt"></i></div>
          <div className="rest-stat-content"><h3>{stats.totalOrders}</h3><p>Today's Orders</p></div>
        </div>
        <div className="rest-stat">
          <div className="rest-stat-icon posted"><i className="bi bi-check-circle"></i></div>
          <div className="rest-stat-content"><h3>{formatCurrency(stats.totalPosted)}</h3><p>Total Posted</p></div>
        </div>
        <div className="rest-stat">
          <div className="rest-stat-icon pending"><i className="bi bi-clock"></i></div>
          <div className="rest-stat-content"><h3>{stats.pendingOrders}</h3><p>Pending Orders</p></div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('orders')}
          style={{ borderRadius: 8, fontWeight: 700, fontSize: 13, padding: '8px 20px' }}
        >
          <i className="bi bi-receipt me-1"></i> Orders
        </button>
        <button
          className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('menu')}
          style={{ borderRadius: 8, fontWeight: 700, fontSize: 13, padding: '8px 20px' }}
        >
          <i className="bi bi-journal-text me-1"></i> Menu Master
        </button>
      </div>

      {/* ========== ORDERS TAB ========== */}
      {activeTab === 'orders' && (
        <div className="row g-4">
          {/* New Order Form */}
          <div className="col-lg-5">
            <div className="new-order-card">
              <h3><i className="bi bi-plus-circle"></i> New Order</h3>

              {/* Room Selection */}
              <div className="mb-3">
                <label className="form-label-custom">Room Number *</label>
                <select className="form-control-custom" value={orderForm.room_id} onChange={handleRoomChange}>
                  <option value="">Select occupied room...</option>
                  {rooms.filter(r => r.status === 'occupied').map(room => (
                    <option key={room.id} value={room.id}>
                      {room.room_number} - {room.guest_name || 'Guest'} ({room.room_type || ''})
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

              {/* Order Items - Dropdown based */}
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
                      <div className="order-item-row" key={index} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                        <select
                          className="item-name"
                          value={item.menu_item_id}
                          onChange={(e) => handleItemChange(index, 'menu_item_id', e.target.value)}
                          style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
                        >
                          <option value="">Select item...</option>
                          {menuByCategory.map(cat => (
                            <optgroup label={cat.label} key={cat.value}>
                              {cat.items.map(mi => (
                                <option key={mi.id} value={mi.id}>
                                  {mi.is_veg ? '🟢' : '🔴'} {mi.name} - ₹{mi.price}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <input
                          type="number" min="1" className="item-qty" value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          style={{ width: 50, padding: '6px', borderRadius: 6, border: '1px solid #d1d5db', textAlign: 'center', fontSize: 13 }}
                        />
                        <span style={{ width: 60, textAlign: 'right', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                          {price > 0 ? `₹${price}` : '-'}
                        </span>
                        <span style={{ width: 70, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
                          {amt > 0 ? formatCurrency(amt) : '-'}
                        </span>
                        <button className="btn-remove-item" onClick={() => handleRemoveItem(index)}
                          style={{ visibility: orderForm.items.length > 1 ? 'visible' : 'hidden', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>
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
                <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(calculateSubtotal())}</span></div>
                <div className="summary-row"><span>GST (5%)</span><span>{formatCurrency(calculateGST())}</span></div>
                <div className="summary-row total"><span>Total</span><span>{formatCurrency(calculateTotal())}</span></div>
              </div>

              <button className="btn-post-room" disabled={!isFormValid()} onClick={handlePostToRoom}>
                <i className="bi bi-send"></i> Post to Room
              </button>
            </div>
          </div>

          {/* Orders List */}
          <div className="col-lg-7">
            <div className="orders-panel">
              <div className="orders-panel-header">
                <h3><i className="bi bi-list-ul"></i> Today's Orders</h3>
                <div className="orders-filter">
                  {['all', 'pending', 'preparing', 'served', 'cancelled'].map(filter => (
                    <button key={filter} className={`filter-btn${activeFilter === filter ? ' active' : ''}`}
                      onClick={() => setActiveFilter(filter)}>
                      {capitalize(filter)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="orders-list">
                {filteredOrders.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <i className="bi bi-receipt" style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }}></i>
                    <p>No orders found</p>
                  </div>
                )}
                {filteredOrders.map(order => {
                  return (
                    <div className="order-card" key={order.id}>
                      <div className="order-card-header">
                        <div>
                          <div className="order-id">#{order.order_number || (order.id ? `ORD-${String(order.id).padStart(3, '0')}` : '')}</div>
                        </div>
                        {order.room?.room_number && (
                          <div className="order-room">Room {order.room.room_number}</div>
                        )}
                      </div>
                      {order.guest?.first_name && (
                        <div className="order-guest">{order.guest.first_name} {order.guest.last_name || ''}</div>
                      )}
                      {/* Show order items */}
                      {order.items && order.items.length > 0 && (
                        <div style={{ padding: '6px 0', fontSize: 12, color: '#475569' }}>
                          {order.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>{it.item_name || 'Item'} x{it.quantity}</span>
                              <span style={{ fontWeight: 600 }}>{formatCurrency(parseFloat(it.amount) || 0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="order-meta">
                        <span><i className="bi bi-basket"></i> {order.items?.length || 0} items</span>
                        <span><i className="bi bi-clock"></i> {formatTime(order.created_at || order.createdAt)}</span>
                      </div>
                      <div className="order-card-footer">
                        <div className="order-amount">{formatCurrency(order.total)}</div>
                        <span className={`order-status ${getStatusBadgeClass(order.status)}`}>
                          {capitalize(order.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MENU MASTER TAB ========== */}
      {activeTab === 'menu' && (
        <div className="row g-4">
          {/* Add/Edit Form */}
          <div className="col-lg-4">
            <div className="card" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <div className="card-header" style={{ background: '#1a1a2e', color: '#fff', borderRadius: '12px 12px 0 0', fontWeight: 700 }}>
                <i className={`bi ${editingMenuId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                {editingMenuId ? 'Edit Menu Item' : 'Add Menu Item'}
              </div>
              <div className="card-body" style={{ padding: 20 }}>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>Item Name *</label>
                  <input type="text" className="form-control form-control-sm" value={menuForm.name}
                    onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} placeholder="e.g. Chicken Biryani" />
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>Category *</label>
                    <select className="form-select form-select-sm" value={menuForm.category}
                      onChange={e => setMenuForm({ ...menuForm, category: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>Price (₹) *</label>
                    <input type="number" className="form-control form-control-sm" min="0" value={menuForm.price}
                      onChange={e => setMenuForm({ ...menuForm, price: e.target.value })} placeholder="0" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>Description</label>
                  <input type="text" className="form-control form-control-sm" value={menuForm.description}
                    onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} placeholder="Optional" />
                </div>
                <div className="form-check form-switch mb-3">
                  <input className="form-check-input" type="checkbox" checked={menuForm.is_veg}
                    onChange={e => setMenuForm({ ...menuForm, is_veg: e.target.checked })} id="vegToggle" />
                  <label className="form-check-label" htmlFor="vegToggle" style={{ fontSize: 13, fontWeight: 600 }}>
                    {menuForm.is_veg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ borderRadius: 8, fontWeight: 700, flex: 1 }} onClick={handleSaveMenuItem}>
                    <i className={`bi ${editingMenuId ? 'bi-check-lg' : 'bi-plus'} me-1`}></i>
                    {editingMenuId ? 'Update' : 'Add Item'}
                  </button>
                  {editingMenuId && (
                    <button className="btn btn-outline-secondary btn-sm" style={{ borderRadius: 8 }}
                      onClick={() => { setEditingMenuId(null); setMenuForm({ name: '', category: 'main_course', price: '', is_veg: true, description: '' }); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items List */}
          <div className="col-lg-8">
            <div className="card" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <div className="card-header d-flex justify-content-between align-items-center" style={{ background: '#f8fafc', borderRadius: '12px 12px 0 0' }}>
                <h5 className="mb-0" style={{ fontWeight: 700, fontSize: 15 }}>
                  <i className="bi bi-journal-text me-2"></i>Menu Items ({menuItems.length})
                </h5>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button className={`btn btn-sm ${menuFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: 6, fontSize: 11, fontWeight: 700 }} onClick={() => setMenuFilter('all')}>All</button>
                  {CATEGORIES.map(c => (
                    <button key={c.value} className={`btn btn-sm ${menuFilter === c.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ borderRadius: 6, fontSize: 11, fontWeight: 700 }} onClick={() => setMenuFilter(c.value)}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 30 }}></th>
                        <th>Name</th>
                        <th>Category</th>
                        <th className="text-end">Price</th>
                        <th className="text-center">Available</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMenuItems.length === 0 && (
                        <tr><td colSpan="6" className="text-center text-muted py-4">No menu items found. Add your first item!</td></tr>
                      )}
                      {filteredMenuItems.map(item => (
                        <tr key={item.id} style={{ opacity: item.is_available ? 1 : 0.5 }}>
                          <td style={{ fontSize: 16 }}>{item.is_veg ? '🟢' : '🔴'}</td>
                          <td>
                            <strong>{item.name}</strong>
                            {item.description && <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.description}</div>}
                          </td>
                          <td><span className="badge bg-light text-dark" style={{ fontSize: 11 }}>{capitalize(item.category?.replace('_', ' '))}</span></td>
                          <td className="text-end" style={{ fontWeight: 700 }}>{formatCurrency(item.price)}</td>
                          <td className="text-center">
                            <div className="form-check form-switch d-flex justify-content-center mb-0">
                              <input className="form-check-input" type="checkbox" checked={item.is_available}
                                onChange={() => handleToggleAvailability(item.id, item.is_available)} style={{ cursor: 'pointer' }} />
                            </div>
                          </td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-outline-primary me-1" style={{ borderRadius: 6, fontSize: 11, padding: '2px 8px' }}
                              onClick={() => handleEditMenuItem(item)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: 6, fontSize: 11, padding: '2px 8px' }}
                              onClick={() => handleDeleteMenuItem(item.id)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RestaurantPage;
