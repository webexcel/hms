import React from 'react';

const AdjustStockModal = ({
  show,
  selectedItem,
  adjustData,
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
              <i className="bi bi-plus-slash-minus me-2"></i>Adjust Stock - {selectedItem?.name || ''}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter quantity"
                  min="1"
                  value={adjustData.quantity}
                  onChange={(e) => onFieldChange('quantity', e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Adjustment Type</label>
                <select
                  className="form-select"
                  value={adjustData.transaction_type}
                  onChange={(e) => onFieldChange('transaction_type', e.target.value)}
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
                  onChange={(e) => onFieldChange('reference', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Additional notes..."
                  value={adjustData.notes}
                  onChange={(e) => onFieldChange('notes', e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-check-lg me-1"></i>Save Adjustment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdjustStockModal;
