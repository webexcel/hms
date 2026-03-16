import React from 'react';

const PromoModal = ({
  selectedPromo,
  promoForm,
  setPromoForm,
  handleSavePromo,
  onClose,
}) => {
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-percent me-2"></i>
              {selectedPromo ? 'Edit Promotion' : 'Add Promotion'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSavePromo}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Promotion Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Summer Sale"
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Promo Code</label>
                <input
                  type="text"
                  className="form-control text-uppercase"
                  placeholder="e.g., SUMMER25"
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label">Discount Type</label>
                  <select
                    className="form-select"
                    value={promoForm.discount_type}
                    onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label">Discount Value</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g., 20"
                    min="0"
                    step="0.01"
                    value={promoForm.discount_value}
                    onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label">Valid From</label>
                  <input
                    type="date"
                    className="form-control"
                    value={promoForm.valid_from}
                    onChange={(e) => setPromoForm({ ...promoForm, valid_from: e.target.value })}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Valid Until</label>
                  <input
                    type="date"
                    className="form-control"
                    value={promoForm.valid_until}
                    onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Usage Limit</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Leave empty for unlimited"
                  min="0"
                  value={promoForm.max_uses}
                  onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Terms and conditions"
                  value={promoForm.description || ''}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">{selectedPromo ? 'Save Promotion' : 'Create Promotion'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PromoModal;
