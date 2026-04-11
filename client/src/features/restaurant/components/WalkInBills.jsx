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
  const [showNewBill, setShowNewBill] = useState(false);
  const [newItems, setNewItems] = useState([{ menu_item_id: '', quantity: 1 }]);
  const [creating, setCreating] = useState(false);

  const allMenuItems = useMemo(() => (menuByCategory || []).flatMap(c => c.items || []), [menuByCategory]);
  const getItem = (id) => allMenuItems.find(m => String(m.id) === String(id));

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
      toast.success('Walk-in bill created');
      // Auto-pay if needed
      const orderId = res.data?.order?.id || res.data?.id;
      if (orderId) {
        await api.put(`/restaurant/orders/${orderId}/pay`, { payment_method: paymentMethod });
        toast.success(`Marked as paid (${paymentMethod.toUpperCase()})`);
      }
      setNewItems([{ menu_item_id: '', quantity: 1 }]);
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

        {/* New Bill inline form */}
        {showNewBill && (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <strong style={{ fontSize: 13, color: '#166534' }}><i className="bi bi-receipt me-1"></i>New Walk-in Bill</strong>
              <button className="btn btn-sm" onClick={() => setShowNewBill(false)} style={{ background: 'none', border: 'none' }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            {newItems.map((it, idx) => {
              const m = getItem(it.menu_item_id);
              const amt = m ? parseFloat(m.price) * (parseInt(it.quantity) || 0) : 0;
              return (
                <div key={idx} className="d-flex gap-2 mb-2 align-items-center">
                  <select className="form-select form-select-sm" style={{ flex: 1, fontSize: 12 }}
                    value={it.menu_item_id}
                    onChange={e => {
                      const newArr = [...newItems];
                      newArr[idx].menu_item_id = e.target.value;
                      setNewItems(newArr);
                    }}>
                    <option value="">Select item...</option>
                    {(menuByCategory || []).map(cat => (
                      <optgroup key={cat.value} label={cat.label}>
                        {cat.items.map(mi => (
                          <option key={mi.id} value={mi.id}>{mi.name.replace(/\s*\(.*?\)/g, '')} - Rs.{mi.price}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <input type="number" className="form-control form-control-sm" style={{ width: 70, fontSize: 12 }}
                    min="1" value={it.quantity}
                    onChange={e => {
                      const newArr = [...newItems];
                      newArr[idx].quantity = e.target.value;
                      setNewItems(newArr);
                    }} />
                  <span style={{ width: 80, textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{formatCurrency(amt)}</span>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))} disabled={newItems.length === 1}>
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              );
            })}
            <button className="btn btn-sm btn-outline-success" onClick={() => setNewItems([...newItems, { menu_item_id: '', quantity: 1 }])}>
              <i className="bi bi-plus me-1"></i>Add Item
            </button>

            <div style={{ borderTop: '1px dashed #86efac', marginTop: 12, paddingTop: 8, fontSize: 12 }}>
              <div className="d-flex justify-content-between"><span>Subtotal:</span><strong>{formatCurrency(newSubtotal)}</strong></div>
              <div className="d-flex justify-content-between"><span>GST (5%):</span><strong>{formatCurrency(newGst)}</strong></div>
              <div className="d-flex justify-content-between" style={{ fontSize: 14, color: '#166534', fontWeight: 700 }}>
                <span>Total:</span><span>{formatCurrency(newTotal)}</span>
              </div>
              <button className="btn btn-success btn-sm w-100 mt-2" onClick={handleCreateBill} disabled={creating || newSubtotal === 0}>
                {creating ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-check-lg me-1"></i>}
                Create & Mark Paid ({paymentMethod.toUpperCase()})
              </button>
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
            <table className="table table-hover" style={{ fontSize: 13 }}>
              <thead style={{ background: '#f9fafb' }}>
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
