import React from 'react';

const AddEditItemModal = ({
  show,
  selectedItem,
  formData,
  categories,
  onClose,
  onSubmit,
  onFieldChange
}) => {
  if (!show) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`bi ${selectedItem ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
              {selectedItem ? 'Edit Item' : 'Add New Item'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter item name"
                  value={formData.name}
                  onChange={(e) => onFieldChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => onFieldChange('category', e.target.value)}
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
                    onChange={(e) => onFieldChange('sku', e.target.value)}
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
                    onChange={(e) => onFieldChange('current_stock', e.target.value)}
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
                    onChange={(e) => onFieldChange('min_stock_level', e.target.value)}
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
                    onChange={(e) => onFieldChange('unit_cost', e.target.value)}
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
                    onChange={(e) => onFieldChange('unit', e.target.value)}
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
                  onChange={(e) => onFieldChange('supplier', e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-check-lg me-1"></i>{selectedItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditItemModal;
