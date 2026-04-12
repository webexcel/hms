import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../../hooks/useApi';
import { capitalize } from '../../../utils/formatters';
import toast from 'react-hot-toast';

const INITIAL_ORDER_FORM = {
  room_id: '',
  items: [{ menu_item_id: '', quantity: 1 }],
  guest_name: '',
};

const INITIAL_MENU_FORM = {
  name: '',
  category: 'main_course',
  price: '',
  is_veg: true,
  description: '',
};

export const CATEGORIES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'starters', label: 'Starters' },
  { value: 'soups', label: 'Soups' },
  { value: 'main_course', label: 'Main Course' },
  { value: 'desserts', label: 'Desserts' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'snacks', label: 'Snacks' },
];

export function useRestaurant() {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalPosted: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('orders');

  const [orderForm, setOrderForm] = useState(INITIAL_ORDER_FORM);

  const [menuForm, setMenuForm] = useState(INITIAL_MENU_FORM);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuFilter, setMenuFilter] = useState('all');

  const api = useApi();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, menuRes, roomsRes] = await Promise.all([
        api.get('/restaurant/orders'),
        api.get('/restaurant/menu'),
        api.get('/rooms'),
      ]);
      const ordersList = ordersRes.data?.data || ordersRes.data || [];
      setOrders(ordersList);
      setMenuItems(menuRes.data?.data || menuRes.data || []);
      setRooms(roomsRes.data?.data || roomsRes.data || []);

      const todayOrders = ordersList.filter((o) => {
        const orderDate = new Date(o.created_at || o.createdAt).toDateString();
        return orderDate === new Date().toDateString();
      });
      const revenue = todayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      const active = ordersList.filter((o) => o.status === 'pending');

      setStats({
        totalOrders: todayOrders.length,
        totalPosted: revenue,
        pendingOrders: active.length,
      });
    } catch {
      toast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, []);

  // ---- Order Form Handlers ----

  const handleRoomChange = (e) => {
    const roomId = e.target.value;
    const room = rooms.find((r) => String(r.id) === roomId);
    setOrderForm({ ...orderForm, room_id: roomId, guest_name: room?.guest_name || '' });
  };

  const handleAddItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { menu_item_id: '', quantity: 1 }],
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

  // Click-to-add: tap a menu item to add or increment in cart
  const handleAddMenuItemToCart = (menuItemId) => {
    const existing = orderForm.items.find(i => String(i.menu_item_id) === String(menuItemId));
    let items;
    if (existing) {
      items = orderForm.items.map(i => String(i.menu_item_id) === String(menuItemId)
        ? { ...i, quantity: (parseInt(i.quantity) || 0) + 1 }
        : i);
    } else {
      const emptyIdx = orderForm.items.findIndex(i => !i.menu_item_id);
      if (emptyIdx >= 0) {
        items = orderForm.items.map((i, idx) => idx === emptyIdx ? { menu_item_id: menuItemId, quantity: 1 } : i);
      } else {
        items = [...orderForm.items, { menu_item_id: menuItemId, quantity: 1 }];
      }
    }
    setOrderForm({ ...orderForm, items });
  };

  const handleDecrementItem = (menuItemId) => {
    const items = orderForm.items
      .map(i => String(i.menu_item_id) === String(menuItemId)
        ? { ...i, quantity: (parseInt(i.quantity) || 0) - 1 }
        : i)
      .filter(i => !i.menu_item_id || parseInt(i.quantity) > 0);
    setOrderForm({ ...orderForm, items: items.length ? items : [{ menu_item_id: '', quantity: 1 }] });
  };

  const getItemPrice = (menuItemId) => {
    const mi = menuItems.find((m) => String(m.id) === String(menuItemId));
    return mi ? parseFloat(mi.price) : 0;
  };

  const calculateSubtotal = () => {
    return orderForm.items.reduce((sum, item) => {
      return sum + getItemPrice(item.menu_item_id) * (parseInt(item.quantity) || 0);
    }, 0);
  };

  const calculateGST = () => Math.round(calculateSubtotal() * 0.05);
  const calculateTotal = () => calculateSubtotal() + calculateGST();

  const isFormValid = () => {
    return orderForm.items.some((item) => item.menu_item_id && (parseInt(item.quantity) || 0) > 0);
  };

  const handlePlaceOrder = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const validItems = orderForm.items.filter(
        (item) => item.menu_item_id && (parseInt(item.quantity) || 0) > 0
      );
      await api.post('/restaurant/orders', {
        room_id: orderForm.room_id,
        order_type: 'room_service',
        items: validItems.map((item) => ({
          menu_item_id: parseInt(item.menu_item_id),
          quantity: parseInt(item.quantity),
        })),
      });
      toast.success('Order placed successfully!');
      setOrderForm(INITIAL_ORDER_FORM);
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to place order');
    }
  };

  const handlePostToRoom = async (orderId) => {
    try {
      await api.put(`/restaurant/orders/${orderId}/post-to-room`);
      toast.success('Order posted to room billing!');
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to post order to room');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/restaurant/orders/${orderId}/status`, { status });
      toast.success(`Order status updated to ${capitalize(status)}`);
      fetchData();
    } catch {
      toast.error('Failed to update order status');
    }
  };

  // ---- Menu Master Handlers ----

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
      setMenuForm(INITIAL_MENU_FORM);
      setEditingMenuId(null);
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save menu item');
    }
  };

  const handleEditMenuItem = (item) => {
    setMenuForm({
      name: item.name,
      category: item.category,
      price: item.price,
      is_veg: item.is_veg,
      description: item.description || '',
    });
    setEditingMenuId(item.id);
  };

  const handleCancelEdit = () => {
    setEditingMenuId(null);
    setMenuForm(INITIAL_MENU_FORM);
  };

  const handleDeleteMenuItem = async (id) => {
    try {
      await api.del(`/restaurant/menu/${id}`);
      toast.success('Menu item deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      await api.put(`/restaurant/menu/${itemId}`, { is_available: !currentStatus });
      toast.success('Availability updated');
      fetchData();
    } catch {
      toast.error('Failed to update availability');
    }
  };

  // ---- Derived Data ----

  const filteredOrders =
    activeFilter === 'all' ? orders : orders.filter((o) => o.status === activeFilter);

  const filteredMenuItems =
    menuFilter === 'all' ? menuItems : menuItems.filter((m) => m.category === menuFilter);

  const availableMenuItems = menuItems.filter((m) => m.is_available);
  const menuByCategory = CATEGORIES.reduce((acc, cat) => {
    const items = availableMenuItems.filter((m) => m.category === cat.value);
    if (items.length > 0) acc.push({ ...cat, items });
    return acc;
  }, []);

  return {
    // State
    loading,
    stats,
    activeTab,
    setActiveTab,
    activeFilter,
    setActiveFilter,
    menuFilter,
    setMenuFilter,
    orderForm,
    menuForm,
    setMenuForm,
    editingMenuId,
    rooms,
    menuItems,
    filteredOrders,
    filteredMenuItems,
    menuByCategory,

    // Order handlers
    handleRoomChange,
    handleAddItem,
    handleRemoveItem,
    handleItemChange,
    handleAddMenuItemToCart,
    handleDecrementItem,
    getItemPrice,
    calculateSubtotal,
    calculateGST,
    calculateTotal,
    isFormValid,
    handlePlaceOrder,
    handlePostToRoom,
    handleUpdateOrderStatus,
    fetchData,

    // Menu handlers
    handleSaveMenuItem,
    handleEditMenuItem,
    handleCancelEdit,
    handleDeleteMenuItem,
    handleToggleAvailability,
  };
}
