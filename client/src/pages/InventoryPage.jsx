import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { formatCurrency, formatDate, capitalize } from '../utils/formatters';
import PageTemplate from '../components/templates/PageTemplate';
import toast from 'react-hot-toast';

const InventoryPage = () => {
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

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    unit: '',
    current_stock: '',
    min_stock_level: '',
    unit_cost: '',
    supplier: ''
  });

  const [adjustData, setAdjustData] = useState({
    quantity: '',
    transaction_type: 'addition',
    reference: '',
    notes: ''
  });

  const categories = ['Linens', 'Toiletries', 'Food & Beverage', 'Cleaning', 'Office Supplies', 'Maintenance', 'Other'];

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
      fetchItems();
      fetchStats();
      fetchLowStockAlerts();
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
      setAdjustData({ quantity: '', transaction_type: 'addition', reference: '', notes: '' });
      fetchItems();
      fetchStats();
      fetchLowStockAlerts();
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
    setFormData({ name: '', category: '', sku: '', unit: '', current_stock: '', min_stock_level: '', unit_cost: '', supplier: '' });
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
    setAdjustData({ quantity: '', transaction_type: 'addition', reference: '', notes: '' });
    setShowAdjustModal(true);
  };

  const getStockStatus = (item) => {
    if (item.current_stock === 0) return { className: 'out', label: 'Out of Stock' };
    if (item.current_stock <= item.min_stock_level) return { className: 'low', label: 'Low Stock' };
    return { className: 'instock', label: 'In Stock' };
  };

  const getCategoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('linen')) return 'bi-basket3';
    if (cat.includes('toilet')) return 'bi-droplet';
    if (cat.includes('food') || cat.includes('beverage') || cat.includes('minibar')) return 'bi-cup-straw';
    if (cat.includes('cleaning')) return 'bi-spray';
    if (cat.includes('amenit')) return 'bi-gift';
    if (cat.includes('office')) return 'bi-paperclip';
    if (cat.includes('maintenance') || cat.includes('equipment')) return 'bi-tools';
    return 'bi-box-seam';
  };

  const getCategoryClass = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('linen')) return 'linens';
    if (cat.includes('toilet')) return 'toiletries';
    if (cat.includes('food') || cat.includes('beverage') || cat.includes('minibar')) return 'minibar';
    if (cat.includes('cleaning')) return 'cleaning';
    if (cat.includes('amenit')) return 'amenities';
    if (cat.includes('office')) return 'office';
    if (cat.includes('maintenance') || cat.includes('equipment')) return 'equipment';
    return 'other';
  };

  if (loading && items.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <PageTemplate
      title="Inventory Management"
      description="Track and manage hotel supplies, amenities, and equipment"
      actions={<>
        <button className="btn btn-outline-secondary" onClick={() => { if (items.length > 0) openAdjustModal(items[0]); }}>
          <i className="bi bi-plus-slash-minus me-2"></i>Adjust Stock
        </button>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <i className="bi bi-plus-lg me-2"></i>Add Item
        </button>
      </>}
    >

      {/* Inventory Stats */}
      <div className="row g-4 mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-primary-subtle">
              <i className="bi bi-box-seam text-primary"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total || 0}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-success-subtle">
              <i className="bi bi-check-circle text-success"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.inStock || 0}</div>
              <div className="stat-label">In Stock</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-warning-subtle">
              <i className="bi bi-exclamation-triangle text-warning"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.lowStock || 0}</div>
              <div className="stat-label">Low Stock</div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="stat-card">
            <div className="stat-icon bg-danger-subtle">
              <i className="bi bi-x-circle text-danger"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.outOfStock || 0}</div>
              <div className="stat-label">Out of Stock</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-4">
        {/* Left Column - Inventory List */}
        <div className="col-xl-8">
          {/* Filter Bar */}
          <div className="inventory-filter-bar">
            <div className="search-box">
              <i className="bi bi-search"></i>
              <input
                type="text"
                className="form-control"
                placeholder="Search items..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="filter-group">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                ))}
              </select>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="inventory-table-card">
            <div className="table-responsive">
              <table className="table inventory-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>SKU</th>
                    <th>In Stock</th>
                    <th>Min Level</th>
                    <th>Unit Cost</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        No inventory items found
                      </td>
                    </tr>
                  ) : (
                    items.map(item => {
                      const status = getStockStatus(item);
                      const catClass = getCategoryClass(item.category);
                      const catIcon = getCategoryIcon(item.category);
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="item-info">
                              <div className={`item-icon ${catClass}`}>
                                <i className={`bi ${catIcon}`}></i>
                              </div>
                              <div className="item-details">
                                <span className="item-name">{item.name}</span>
                                {item.supplier && (
                                  <span className="item-supplier">Supplier: {item.supplier}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td><span className={`category-badge ${catClass}`}>{capitalize(item.category)}</span></td>
                          <td>{item.sku}</td>
                          <td><strong>{item.current_stock}</strong></td>
                          <td>{item.min_stock_level}</td>
                          <td>{formatCurrency(item.unit_cost)}</td>
                          <td><span className={`stock-status ${status.className}`}>{status.label}</span></td>
                          <td>
                            <div className="action-btns">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                title="Edit"
                                onClick={() => openEditModal(item)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-success"
                                title="Adjust Stock"
                                onClick={() => openAdjustModal(item)}
                              >
                                <i className="bi bi-plus-slash-minus"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                title="Delete"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="table-pagination">
                <div className="pagination-info">
                  Showing page {currentPage} of {totalPages}
                </div>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let page;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setCurrentPage(page)}>
                            {page}
                          </button>
                        </li>
                      );
                    })}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-xl-4">
          {/* Low Stock Alerts */}
          <div className="inventory-alert-card">
            <div className="card-header-custom">
              <h5><i className="bi bi-exclamation-triangle text-warning me-2"></i>Low Stock Alerts</h5>
              {lowStockAlerts.length > 0 && (
                <span className="badge bg-warning text-dark">{lowStockAlerts.length} items</span>
              )}
            </div>
            <div className="alert-list">
              {lowStockAlerts.length === 0 ? (
                <div className="text-center text-muted py-4">No low stock alerts</div>
              ) : (
                lowStockAlerts.map(item => {
                  const isCritical = item.current_stock === 0;
                  return (
                    <div key={item.id} className={`alert-item ${isCritical ? 'critical' : 'warning'}`}>
                      <div className="alert-icon">
                        <i className={`bi ${getCategoryIcon(item.category)}`}></i>
                      </div>
                      <div className="alert-info">
                        <span className="alert-name">{item.name}</span>
                        <span className="alert-stock">
                          {isCritical
                            ? '0 units remaining'
                            : `${item.current_stock} units (Min: ${item.min_stock_level})`
                          }
                        </span>
                      </div>
                      <button
                        className={`btn btn-sm ${isCritical ? 'btn-danger' : 'btn-warning'}`}
                        onClick={() => openAdjustModal(item)}
                      >
                        Order
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${selectedItem ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                  {selectedItem ? 'Edit Item' : 'Add New Item'}
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowAddModal(false); resetForm(); }}></button>
              </div>
              <form onSubmit={handleAddItem}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Item Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter item name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Category</label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                      >
                        <option value="">Select category...</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">SKU</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., LIN-004"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Current Stock</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={formData.current_stock}
                        onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Minimum Level</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={formData.min_stock_level}
                        onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Unit Cost</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        value={formData.unit_cost}
                        onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Unit</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., pcs, kg, liters"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Supplier</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter supplier name"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-lg me-1"></i>{selectedItem ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-slash-minus me-2"></i>Adjust Stock - {selectedItem?.name || ''}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAdjustModal(false)}></button>
              </div>
              <form onSubmit={handleAdjustStock}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter quantity"
                      min="1"
                      value={adjustData.quantity}
                      onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Adjustment Type</label>
                    <select
                      className="form-select"
                      value={adjustData.transaction_type}
                      onChange={(e) => setAdjustData({ ...adjustData, transaction_type: e.target.value })}
                    >
                      <option value="addition">Add Stock</option>
                      <option value="subtraction">Remove Stock</option>
                      <option value="purchase">Purchase</option>
                      <option value="damage">Damaged / Loss</option>
                      <option value="return">Return</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Reference</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., PO number, invoice"
                      value={adjustData.reference}
                      onChange={(e) => setAdjustData({ ...adjustData, reference: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Additional notes..."
                      value={adjustData.notes}
                      onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => setShowAdjustModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-lg me-1"></i>Save Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
};

export default InventoryPage;
