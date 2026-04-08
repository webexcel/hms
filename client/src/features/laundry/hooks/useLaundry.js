import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../../hooks/useApi';
import toast from 'react-hot-toast';

const ITEM_CATEGORIES = [
  { value: 'topwear', label: 'Topwear' },
  { value: 'bottomwear', label: 'Bottomwear' },
  { value: 'ethnic', label: 'Ethnic' },
  { value: 'innerwear', label: 'Innerwear' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
];

const SERVICE_TYPES = [
  { value: 'regular', label: 'Regular' },
  { value: 'express', label: 'Express' },
  { value: 'dry_clean', label: 'Dry Clean' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'delivered', label: 'Delivered', color: 'success' },
];

const INITIAL_ORDER_FORM = {
  room_id: '',
  service_type: 'regular',
  notes: '',
  expected_delivery: '',
  items: [{ item_name: '', category: 'topwear', quantity: 1, unit_price: '' }],
};

export { ITEM_CATEGORIES, SERVICE_TYPES, STATUS_OPTIONS };

export function useLaundry() {
  const [orders, setOrders] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, delivered: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [orderForm, setOrderForm] = useState(INITIAL_ORDER_FORM);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const api = useApi();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, roomsRes] = await Promise.all([
        api.get('/laundry/orders', { silent: true }),
        api.get('/rooms', { silent: true }),
      ]);
      const ordersList = ordersRes.data?.data || [];
      setOrders(ordersList);
      setRooms(roomsRes.data?.data || roomsRes.data || []);

      const todayOrders = ordersList.filter((o) => {
        const d = new Date(o.createdAt || o.created_at).toDateString();
        return d === new Date().toDateString();
      });
      const pending = ordersList.filter((o) => o.status === 'pending').length;
      const delivered = todayOrders.filter((o) => o.status === 'delivered').length;
      const revenue = todayOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);

      setStats({ total: todayOrders.length, pending, delivered, revenue });
    } catch {
      toast.error('Failed to load laundry data');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchData(); }, []);

  // ── Form handlers ──

  const handleRoomChange = (e) => {
    setOrderForm({ ...orderForm, room_id: e.target.value });
  };

  const handleFormChange = (field, value) => {
    setOrderForm({ ...orderForm, [field]: value });
  };

  const handleAddItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { item_name: '', category: 'topwear', quantity: 1, unit_price: '' }],
    });
  };

  const handleRemoveItem = (index) => {
    if (orderForm.items.length <= 1) return;
    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderForm.items];
    updated[index] = { ...updated[index], [field]: value };
    setOrderForm({ ...orderForm, items: updated });
  };

  const calculateSubtotal = () => {
    return orderForm.items.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 0);
    }, 0);
  };

  const calculateTax = () => Math.round(calculateSubtotal() * 0.18 * 100) / 100;
  const calculateTotal = () => calculateSubtotal() + calculateTax();

  const isFormValid = () => {
    return !!orderForm.room_id && orderForm.items.every(
      (item) => item.item_name && (parseFloat(item.unit_price) || 0) > 0 && (parseInt(item.quantity) || 0) > 0
    );
  };

  const handleCreateOrder = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all item details');
      return;
    }
    try {
      await api.post('/laundry/orders', {
        room_id: orderForm.room_id || undefined,
        service_type: orderForm.service_type,
        notes: orderForm.notes || undefined,
        expected_delivery: orderForm.expected_delivery || undefined,
        items: orderForm.items.map((item) => ({
          item_name: item.item_name,
          category: item.category,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
        })),
      });
      toast.success('Laundry order created');
      setOrderForm(INITIAL_ORDER_FORM);
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create order');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await api.put(`/laundry/orders/${orderId}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handlePostToRoom = async (orderId) => {
    try {
      await api.put(`/laundry/orders/${orderId}/post-to-room`);
      toast.success('Laundry charge posted to room');
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to post to room');
    }
  };

  // ── Derived ──

  const filteredOrders =
    activeFilter === 'all' ? orders : orders.filter((o) => o.status === activeFilter);

  return {
    loading,
    stats,
    orders,
    rooms,
    activeFilter,
    setActiveFilter,
    orderForm,
    selectedOrder,
    setSelectedOrder,
    filteredOrders,

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
    handleUpdateStatus,
    handlePostToRoom,
  };
}
