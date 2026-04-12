import { useState, useMemo } from 'react';
import { useApi } from '../../../hooks/useApi';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import toast from 'react-hot-toast';

const HOTEL_NAME = 'Hotel Udhayam International';
const HOTEL_ADDRESS = 'Travellers Bungalow Road, Thiruchendur, TN 628215';

export default function WalkInBills({ filteredOrders, fetchOrders, menuByCategory }) {
  const api = useApi();
  const [statusFilter, setStatusFilter] = useState('unpaid'); // unpaid, paid, all
  const [printOrder, setPrintOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paying, setPaying] = useState(null);
  const [showNewBill, setShowNewBill] = useState(true);
  const [newItems, setNewItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const allMenuItems = useMemo(() => (menuByCategory || []).flatMap(c => c.items || []), [menuByCategory]);
  const getItem = (id) => allMenuItems.find(m => String(m.id) === String(id));

  const categories = useMemo(() => {
    const cats = [{ value: 'all', label: 'All' }];
    (menuByCategory || []).forEach(c => cats.push({ value: c.value, label: c.label }));
    return cats;
  }, [menuByCategory]);

  const visibleMenuItems = useMemo(() => {
    let all = [];
    (menuByCategory || []).forEach(c => {
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
    newItems.forEach(i => { if (i.menu_item_id) m[i.menu_item_id] = (m[i.menu_item_id] || 0) + (parseInt(i.quantity) || 0); });
    return m;
  }, [newItems]);

  const addItemToCart = (menuItemId) => {
    const existing = newItems.find(i => String(i.menu_item_id) === String(menuItemId));
    if (existing) {
      setNewItems(newItems.map(i => String(i.menu_item_id) === String(menuItemId)
        ? { ...i, quantity: (parseInt(i.quantity) || 0) + 1 }
        : i));
    } else {
      setNewItems([...newItems, { menu_item_id: String(menuItemId), quantity: 1 }]);
    }
  };

  const decrementItemFromCart = (menuItemId) => {
    const updated = newItems
      .map(i => String(i.menu_item_id) === String(menuItemId)
        ? { ...i, quantity: (parseInt(i.quantity) || 0) - 1 }
        : i)
      .filter(i => parseInt(i.quantity) > 0);
    setNewItems(updated);
  };

  const newSubtotal = newItems.reduce((s, it) => {
    const m = getItem(it.menu_item_id);
    return s + (m ? parseFloat(m.price) * (parseInt(it.quantity) || 0) : 0);
  }, 0);
  const newGst = Math.round(newSubtotal * 0.05 * 100) / 100;
  const newTotal = Math.round((newSubtotal + newGst) * 100) / 100;

  const handleCreateBill = async () => {
    const validItems = newItems.filter(it => it.menu_item_id && parseInt(it.quantity) > 0);
    if (validItems.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    try {
      setCreating(true);
      const res = await api.post('/restaurant/orders', {
        order_type: 'dine_in',
        items: validItems.map(it => ({ menu_item_id: parseInt(it.menu_item_id), quantity: parseInt(it.quantity) })),
      });
      // Auto-pay
      const orderId = res.data?.data?.id || res.data?.order?.id || res.data?.id;
      if (orderId) {
        await api.put(`/restaurant/orders/${orderId}/pay`, { payment_method: paymentMethod });
        toast.success(`Bill created & paid (${paymentMethod.toUpperCase()})`);
      } else {
        toast.success('Walk-in bill created — please mark paid manually');
      }
      setNewItems([]);
      setShowNewBill(false);
      fetchOrders && fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setCreating(false);
    }
  };

  // Filter walk-in orders only (no room_id)
  const walkInOrders = useMemo(() => {
    return (filteredOrders || []).filter(o => !o.room_id && o.status !== 'cancelled');
  }, [filteredOrders]);

  // Today's totals — all orders (walk-in + room service)
  const todayTotals = useMemo(() => {
    const today = new Date().toDateString();
    const todayOrders = (filteredOrders || []).filter(o => {
      if (o.status === 'cancelled') return false;
      const d = new Date(o.created_at || o.createdAt).toDateString();
      return d === today;
    });
    const total = todayOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const paid = todayOrders.filter(o => o.payment_status === 'paid');
    const paidTotal = paid.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const unpaid = todayOrders.filter(o => o.payment_status !== 'paid');
    const unpaidTotal = unpaid.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const byMethod = { cash: 0, card: 0, upi: 0 };
    paid.forEach(o => {
      const m = (o.payment_method || '').toLowerCase();
      if (byMethod[m] !== undefined) byMethod[m] += parseFloat(o.total) || 0;
    });
    const walkInToday = todayOrders.filter(o => !o.room_id);
    const roomToday = todayOrders.filter(o => o.room_id);
    return {
      count: todayOrders.length,
      total, paidTotal, unpaidTotal,
      byMethod, paidCount: paid.length, unpaidCount: unpaid.length,
      walkInCount: walkInToday.length,
      walkInTotal: walkInToday.reduce((s, o) => s + (parseFloat(o.total) || 0), 0),
      roomCount: roomToday.length,
      roomTotal: roomToday.reduce((s, o) => s + (parseFloat(o.total) || 0), 0),
    };
  }, [filteredOrders]);

  const visibleOrders = walkInOrders.filter(o => {
    if (statusFilter === 'unpaid') return o.payment_status !== 'paid';
    if (statusFilter === 'paid') return o.payment_status === 'paid';
    return true;
  });

  const handlePay = async (order) => {
    if (!window.confirm(`Mark order ${order.order_number} as paid (${paymentMethod.toUpperCase()})?`)) return;
    try {
      setPaying(order.id);
      await api.put(`/restaurant/orders/${order.id}/pay`, { payment_method: paymentMethod });
      toast.success(`Payment recorded for ${order.order_number}`);
      fetchOrders && fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaying(null);
    }
  };

  const handlePrintBill = (order) => {
    setPrintOrder(order);
    setTimeout(() => window.print(), 100);
  };

  if (printOrder) {
    return (
      <>
        <div className="d-print-none mb-3">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => setPrintOrder(null)}>
            <i className="bi bi-arrow-left me-1"></i>Back
          </button>
          <button className="btn btn-dark btn-sm ms-2" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i>Print
          </button>
        </div>
        <BillPrint order={printOrder} />
      </>
    );
  }

  return (
    <div className="col-12">
      <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-cash-stack me-2"></i>Walk-in / Dine-in Bills
          </h6>
          <div className="d-flex gap-2 align-items-center">
            <select className="form-select form-select-sm" style={{ width: 120 }}
              value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
            <button className="btn btn-sm btn-success" onClick={() => setShowNewBill(!showNewBill)}>
              <i className="bi bi-plus-lg me-1"></i>New Bill
            </button>
            <div className="btn-group btn-group-sm">
              {['unpaid', 'paid', 'all'].map(s => (
                <button key={s} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setStatusFilter(s)} style={{ textTransform: 'capitalize' }}>
                  {s} ({walkInOrders.filter(o => s === 'all' ? true : s === 'unpaid' ? o.payment_status !== 'paid' : o.payment_status === 'paid').length})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* New Bill POS-style */}
        {showNewBill && (
          <div className="row g-3 mb-4" style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: 16, margin: 0 }}>
            <div className="col-12 d-flex justify-content-between align-items-center">
              <strong style={{ fontSize: 14, color: '#166534' }}><i className="bi bi-receipt me-1"></i>New Walk-in Bill — Click menu items to add</strong>
              <button className="btn btn-sm" onClick={() => { setShowNewBill(false); setNewItems([]); }} style={{ background: 'none', border: 'none' }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Left: Menu tiles */}
            <div className="col-lg-8">
              <div style={{ background: '#fff', borderRadius: 10, padding: 12 }}>
                <input type="text" placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)}
                  className="form-control form-control-sm mb-2" style={{ borderRadius: 8 }} />
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  {categories.map(c => (
                    <button key={c.value} onClick={() => setActiveCat(c.value)}
                      style={{
                        padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                        border: `1.5px solid ${activeCat === c.value ? '#16a34a' : '#e2e8f0'}`,
                        background: activeCat === c.value ? '#16a34a' : '#fff',
                        color: activeCat === c.value ? '#fff' : '#475569', cursor: 'pointer',
                      }}>{c.label}</button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                  {visibleMenuItems.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: 20, fontSize: 12 }}>
                      No menu items
                    </div>
                  ) : visibleMenuItems.map(mi => {
                    const qty = cartMap[mi.id] || 0;
                    return (
                      <div key={mi.id} onClick={() => addItemToCart(mi.id)}
                        style={{
                          padding: '10px 10px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                          border: `2px solid ${qty > 0 ? '#16a34a' : '#e2e8f0'}`,
                          background: qty > 0 ? '#f0fdf4' : '#fff', position: 'relative',
                        }}>
                        {qty > 0 && (
                          <span style={{ position: 'absolute', top: -7, right: -7, background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, minWidth: 22, textAlign: 'center' }}>{qty}</span>
                        )}
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2, marginBottom: 4 }}>
                          {mi.name.replace(/\s*\(.*?\)/g, '')}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>{formatCurrency(parseFloat(mi.price))}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Cart + Total */}
            <div className="col-lg-4">
              <div style={{ background: '#fff', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 10 }}>
                  <i className="bi bi-cart3 me-1"></i>Cart ({newItems.length})
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 10 }}>
                  {newItems.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#cbd5e1', padding: 20, fontSize: 12 }}>
                      <i className="bi bi-cart" style={{ fontSize: 28, display: 'block', marginBottom: 4 }}></i>
                      Click menu items to add
                    </div>
                  ) : newItems.map((it) => {
                    const m = getItem(it.menu_item_id);
                    const qty = parseInt(it.quantity) || 0;
                    const amt = m ? parseFloat(m.price) * qty : 0;
                    return (
                      <div key={it.menu_item_id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m?.name?.replace(/\s*\(.*?\)/g, '') || '—'}
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{formatCurrency(m ? parseFloat(m.price) : 0)} × {qty}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button onClick={() => decrementItemFromCart(it.menu_item_id)}
                            style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#64748b' }}>−</button>
                          <span style={{ minWidth: 18, textAlign: 'center', fontSize: 12, fontWeight: 700 }}>{qty}</span>
                          <button onClick={() => addItemToCart(it.menu_item_id)}
                            style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#16a34a' }}>+</button>
                        </div>
                        <div style={{ width: 60, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{formatCurrency(amt)}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 8, fontSize: 12 }}>
                  <div className="d-flex justify-content-between"><span>Subtotal:</span><strong>{formatCurrency(newSubtotal)}</strong></div>
                  <div className="d-flex justify-content-between"><span>GST (5%):</span><strong>{formatCurrency(newGst)}</strong></div>
                  <div className="d-flex justify-content-between" style={{ fontSize: 15, color: '#166534', fontWeight: 800, borderTop: '1px dashed #86efac', marginTop: 4, paddingTop: 4 }}>
                    <span>Total:</span><span>{formatCurrency(newTotal)}</span>
                  </div>
                  <button className="btn btn-success btn-sm w-100 mt-2" onClick={handleCreateBill} disabled={creating || newSubtotal === 0}>
                    {creating ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-check-lg me-1"></i>}
                    Create & Mark Paid ({paymentMethod.toUpperCase()})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {visibleOrders.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-cup-hot" style={{ fontSize: 32, opacity: 0.4 }}></i>
            <div className="mt-2">No {statusFilter !== 'all' ? statusFilter : ''} walk-in orders</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0" style={{ fontSize: 12 }}>
              <thead style={{ background: '#f9fafb', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 }}>
                <tr>
                  <th>Order #</th>
                  <th>Time</th>
                  <th>Items</th>
                  <th className="text-end">Subtotal</th>
                  <th className="text-end">GST</th>
                  <th className="text-end">Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.order_number}</strong></td>
                    <td style={{ fontSize: 11 }}>{formatDate(o.created_at || o.createdAt, 'DD MMM hh:mm A')}</td>
                    <td style={{ fontSize: 11, maxWidth: 300 }}>
                      {(o.items || []).map(it => `${it.item_name} x${it.quantity}`).join(', ') || '—'}
                    </td>
                    <td className="text-end">{formatCurrency(parseFloat(o.subtotal) || 0)}</td>
                    <td className="text-end">{formatCurrency(parseFloat(o.tax_amount) || 0)}</td>
                    <td className="text-end fw-bold">{formatCurrency(parseFloat(o.total) || 0)}</td>
                    <td>
                      <span className="badge" style={{
                        background: o.payment_status === 'paid' ? '#dcfce7' : '#fef3c7',
                        color: o.payment_status === 'paid' ? '#166534' : '#92400e',
                        fontSize: 10, padding: '4px 8px',
                      }}>
                        {o.payment_status === 'paid' ? `PAID (${(o.payment_method || '').toUpperCase()})` : 'UNPAID'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {o.payment_status !== 'paid' && (
                          <button className="btn btn-sm btn-success" onClick={() => handlePay(o)} disabled={paying === o.id}>
                            {paying === o.id ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-check-lg"></i> Pay</>}
                          </button>
                        )}
                        <button className="btn btn-sm btn-outline-dark" onClick={() => handlePrintBill(o)}>
                          <i className="bi bi-printer"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Today's All Orders List */}
      {(() => {
        const today = new Date().toDateString();
        const allTodayOrders = (filteredOrders || []).filter(o => {
          if (o.status === 'cancelled') return false;
          const d = new Date(o.created_at || o.createdAt).toDateString();
          return d === today;
        });
        const todayOrders = allTodayOrders
          .filter(o => {
            if (typeFilter === 'walkin' && o.room_id) return false;
            if (typeFilter === 'room' && !o.room_id) return false;
            if (methodFilter !== 'all') {
              const m = (o.payment_method || '').toLowerCase();
              if (methodFilter === 'unpaid') return o.payment_status !== 'paid' && !o.posted_to_room;
              if (methodFilter === 'posted') return !!o.posted_to_room;
              if (m !== methodFilter) return false;
              if (o.payment_status !== 'paid') return false;
            }
            return true;
          })
          .sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
        const totalAmount = todayOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
        return (
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', marginTop: 16 }}>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-list-ul me-2"></i>Today's All Orders ({todayOrders.length})
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, marginLeft: 10 }}>
                  Total: <strong style={{ color: '#1a1a2e' }}>{formatCurrency(totalAmount)}</strong>
                </span>
              </h6>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <div className="btn-group btn-group-sm">
                  <button className={`btn ${typeFilter === 'all' ? 'btn-dark' : 'btn-outline-dark'}`} onClick={() => setTypeFilter('all')}>All Types</button>
                  <button className={`btn ${typeFilter === 'walkin' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => setTypeFilter('walkin')}>Walk-in</button>
                  <button className={`btn ${typeFilter === 'room' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setTypeFilter('room')}>Room</button>
                </div>
                <div className="btn-group btn-group-sm">
                  <button className={`btn ${methodFilter === 'all' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setMethodFilter('all')}>All</button>
                  <button className={`btn ${methodFilter === 'cash' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setMethodFilter('cash')}>Cash</button>
                  <button className={`btn ${methodFilter === 'upi' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => setMethodFilter('upi')}>UPI</button>
                  <button className={`btn ${methodFilter === 'card' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMethodFilter('card')}>Card</button>
                  <button className={`btn ${methodFilter === 'bank_transfer' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setMethodFilter('bank_transfer')}>Bank</button>
                  <button className={`btn ${methodFilter === 'unpaid' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setMethodFilter('unpaid')}>Unpaid</button>
                  <button className={`btn ${methodFilter === 'posted' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setMethodFilter('posted')}>Posted</button>
                </div>
              </div>
            </div>
            {todayOrders.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-calendar-x" style={{ fontSize: 28, opacity: 0.4 }}></i>
                <div className="mt-2" style={{ fontSize: 13 }}>No orders today</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-sm" style={{ fontSize: 12 }}>
                  <thead style={{ background: '#f9fafb' }}>
                    <tr>
                      <th>Time</th>
                      <th>Order #</th>
                      <th>Type</th>
                      <th>Room / Guest</th>
                      <th>Items</th>
                      <th className="text-end">Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayOrders.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontSize: 10 }}>{formatDate(o.created_at || o.createdAt, 'hh:mm A')}</td>
                        <td><strong>{o.order_number}</strong></td>
                        <td>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                            background: o.room_id ? '#dbeafe' : '#fef3c7',
                            color: o.room_id ? '#1e40af' : '#92400e',
                          }}>{o.room_id ? 'ROOM' : 'WALK-IN'}</span>
                        </td>
                        <td style={{ fontSize: 11 }}>
                          {o.room_id
                            ? `Room ${o.room?.room_number || '—'}${o.guest ? ` · ${o.guest.first_name} ${o.guest.last_name}`.trim() : ''}`
                            : 'Walk-in'}
                        </td>
                        <td style={{ fontSize: 10, maxWidth: 220, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {(o.items || []).map(it => `${it.item_name} ×${it.quantity}`).join(', ') || '—'}
                        </td>
                        <td className="text-end fw-bold">{formatCurrency(parseFloat(o.total) || 0)}</td>
                        <td>
                          {o.payment_status === 'paid' && !o.room_id && !o.locked ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#dcfce7', color: '#166534' }}>
                                PAID
                              </span>
                              <select
                                value={o.payment_method || 'cash'}
                                onChange={async (e) => {
                                  const newMethod = e.target.value;
                                  try {
                                    await api.put(`/restaurant/orders/${o.id}/payment-method`, { payment_method: newMethod });
                                    toast.success(`Payment method changed to ${newMethod.toUpperCase()}`);
                                    fetchOrders && fetchOrders();
                                  } catch (err) {
                                    toast.error(err.response?.data?.message || 'Failed to update');
                                  }
                                }}
                                style={{ fontSize: 10, padding: '1px 4px', borderRadius: 4, border: '1px solid #d1d5db' }}>
                                <option value="cash">Cash</option>
                                <option value="card">Card</option>
                                <option value="upi">UPI</option>
                                <option value="bank_transfer">Bank</option>
                              </select>
                            </div>
                          ) : o.payment_status === 'paid' && o.locked ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#dcfce7', color: '#166534' }}>
                                PAID ({(o.payment_method || '').toUpperCase() || 'CASH'})
                              </span>
                              <span title={`Locked by ${o.locked_by || 'shift handover'}`} style={{ fontSize: 11, color: '#94a3b8' }}>
                                <i className="bi bi-lock-fill"></i>
                              </span>
                            </div>
                          ) : o.payment_status === 'paid' ? (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#dcfce7', color: '#166534' }}>
                              PAID ({(o.payment_method || '').toUpperCase() || 'CASH'})
                            </span>
                          ) : o.posted_to_room ? (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#e0e7ff', color: '#3730a3' }}>POSTED TO ROOM</span>
                          ) : (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#fef3c7', color: '#92400e' }}>UNPAID</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function BillPrint({ order }) {
  return (
    <div className="walkin-bill" style={{ maxWidth: 380, margin: '0 auto', fontFamily: 'monospace', fontSize: 12, padding: 16, background: '#fff' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px dashed #111', paddingBottom: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{HOTEL_NAME}</div>
        <div style={{ fontSize: 10 }}>{HOTEL_ADDRESS}</div>
        <div style={{ fontSize: 10 }}>BELL Restaurant — Pure Vegetarian</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
        <span>Bill #: <strong>{order.order_number}</strong></span>
        <span>{formatDate(order.created_at || order.createdAt, 'DD/MM/YY hh:mm A')}</span>
      </div>
      <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '6px 0', marginBottom: 6 }}>
        <div style={{ display: 'flex', fontWeight: 700, fontSize: 11 }}>
          <span style={{ flex: 2 }}>Item</span>
          <span style={{ flex: 0.5, textAlign: 'center' }}>Qty</span>
          <span style={{ flex: 1, textAlign: 'right' }}>Rate</span>
          <span style={{ flex: 1, textAlign: 'right' }}>Amt</span>
        </div>
      </div>
      {(order.items || []).map((it, i) => (
        <div key={i} style={{ display: 'flex', fontSize: 11, marginBottom: 2 }}>
          <span style={{ flex: 2 }}>{it.item_name}</span>
          <span style={{ flex: 0.5, textAlign: 'center' }}>{it.quantity}</span>
          <span style={{ flex: 1, textAlign: 'right' }}>{formatCurrency(parseFloat(it.unit_price) || 0)}</span>
          <span style={{ flex: 1, textAlign: 'right' }}>{formatCurrency(parseFloat(it.amount) || 0)}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px dashed #999', marginTop: 6, paddingTop: 6, fontSize: 11 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal</span>
          <span>{formatCurrency(parseFloat(order.subtotal) || 0)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>GST (5%)</span>
          <span>{formatCurrency(parseFloat(order.tax_amount) || 0)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, borderTop: '1px solid #111', marginTop: 4, paddingTop: 4 }}>
          <span>TOTAL</span>
          <span>{formatCurrency(parseFloat(order.total) || 0)}</span>
        </div>
      </div>
      {order.payment_status === 'paid' && (
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11 }}>
          PAID via {(order.payment_method || '').toUpperCase()}
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, borderTop: '2px dashed #111', paddingTop: 10 }}>
        Thank you for dining with us!
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .walkin-bill, .walkin-bill * { visibility: visible; }
          .walkin-bill { position: absolute; left: 0; top: 0; width: 100%; }
          @page { margin: 5mm; size: 80mm auto; }
        }
      `}</style>
    </div>
  );
}
