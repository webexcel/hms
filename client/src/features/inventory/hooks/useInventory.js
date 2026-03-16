import { useState, useEffect } from 'react';
import { useApi } from '../../../hooks/useApi';
import toast from 'react-hot-toast';

const CATEGORIES = ['Linens', 'Toiletries', 'Food & Beverage', 'Cleaning', 'Office Supplies', 'Maintenance', 'Other'];

const INITIAL_FORM = {
  name: '',
  category: '',
  sku: '',
  unit: '',
  current_stock: '',
  min_stock_level: '',
  unit_cost: '',
  supplier: ''
};

const INITIAL_ADJUST = {
  quantity: '',
  transaction_type: 'addition',
  reference: '',
  notes: ''
};

const useInventory = () => {
  const api = useApi();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stats, setStats] = useState({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [adjustData, setAdjustData] = useState(INITIAL_ADJUST);

  useEffect(() => {
    fetchItems();
    fetchStats();
    fetchLowStockAlerts();
  }, [currentPage, categoryFilter, statusFilter, search]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, search };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/inventory', { params });
      setItems(res.data.items || res.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to fetch inventory items');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/inventory/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const res = await api.get('/inventory/low-stock');
      setLowStockAlerts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch low stock alerts', err);
    }
  };

  const refreshAll = () => {
    fetchItems();
    fetchStats();
    fetchLowStockAlerts();
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await api.put(`/inventory/${selectedItem.id}`, formData);
        toast.success('Item updated successfully');
      } else {
        await api.post('/inventory', formData);
        toast.success('Item added successfully');
      }
      setShowAddModal(false);
      resetForm();
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save item');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/inventory/${selectedItem.id}/adjust`, adjustData);
      toast.success('Stock adjusted successfully');
      setShowAdjustModal(false);
      setAdjustData(INITIAL_ADJUST);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Item deleted successfully');
      fetchItems();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setSelectedItem(null);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku,
      unit: item.unit,
      current_stock: item.current_stock,
      min_stock_level: item.min_stock_level,
      unit_cost: item.unit_cost,
      supplier: item.supplier
    });
    setShowAddModal(true);
  };

  const openAdjustModal = (item) => {
    setSelectedItem(item);
    setAdjustData(INITIAL_ADJUST);
    setShowAdjustModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const closeAdjustModal = () => {
    setShowAdjustModal(false);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAdjustData = (field, value) => {
    setAdjustData(prev => ({ ...prev, [field]: value }));
  };

  const updateSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const updateCategoryFilter = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const updateStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return {
    // Data
    items,
    loading,
    search,
    categoryFilter,
    statusFilter,
    currentPage,
    totalPages,
    showAddModal,
    showAdjustModal,
    selectedItem,
    stats,
    lowStockAlerts,
    formData,
    adjustData,
    categories: CATEGORIES,

    // Actions
    setCurrentPage,
    handleAddItem,
    handleAdjustStock,
    handleDeleteItem,
    openEditModal,
    openAdjustModal,
    openAddModal,
    closeAddModal,
    closeAdjustModal,
    updateFormData,
    updateAdjustData,
    updateSearch,
    updateCategoryFilter,
    updateStatusFilter
  };
};

export default useInventory;
