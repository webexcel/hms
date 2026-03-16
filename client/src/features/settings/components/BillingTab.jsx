import React from 'react';

export default function BillingTab({
  billingSettings, setBillingSettings,
  mealSettings, setMealSettings,
  taxes, editingTax, setEditingTax,
  setShowAddTaxModal,
  saving, saveSettings,
  handleSaveTaxEdit, handleDeleteTax,
}) {
  return (
    <div className="tab-pane fade show active" id="billing-settings">
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-receipt me-2"></i>Invoice Settings</h5>
        </div>
        <div className="card-body">
          <form>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Invoice Prefix</label>
                <input
                  type="text"
                  className="form-control"
                  value={billingSettings.invoice_prefix}
                  onChange={(e) => setBillingSettings({ ...billingSettings, invoice_prefix: e.target.value })}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Starting Number</label>
                <input
                  type="number"
                  className="form-control"
                  value={billingSettings.starting_number}
                  onChange={(e) => setBillingSettings({ ...billingSettings, starting_number: e.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Invoice Footer Text</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={billingSettings.invoice_footer}
                  onChange={(e) => setBillingSettings({ ...billingSettings, invoice_footer: e.target.value })}
                ></textarea>
              </div>
              <div className="col-12">
                <label className="form-label">Terms &amp; Conditions</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={billingSettings.terms_conditions}
                  onChange={(e) => setBillingSettings({ ...billingSettings, terms_conditions: e.target.value })}
                ></textarea>
              </div>
            </div>
          </form>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => saveSettings('Invoice', billingSettings, 'billing')} disabled={saving}>
            {saving ? 'Saving...' : 'Save Invoice Settings'}
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-cup-hot me-2"></i>Complimentary Meal Rates</h5>
        </div>
        <div className="card-body">
          <p className="text-muted mb-3" style={{ fontSize: 13 }}>
            Set per-person per-night rates for complimentary meals. These rates are added to the room base rate when a meal plan is selected during booking.
          </p>
          <form>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Breakfast Rate (per person/night)</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={mealSettings.breakfast_rate}
                    onChange={(e) => setMealSettings({ ...mealSettings, breakfast_rate: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Dinner Rate (per person/night)</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    value={mealSettings.dinner_rate}
                    onChange={(e) => setMealSettings({ ...mealSettings, dinner_rate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="card-footer">
          <button className="btn btn-primary" onClick={() => saveSettings('Meal Plan', mealSettings, 'billing')} disabled={saving}>
            {saving ? 'Saving...' : 'Save Meal Rates'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0"><i className="bi bi-percent me-2"></i>Tax Configuration</h5>
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowAddTaxModal(true)}>
            <i className="bi bi-plus-lg me-1"></i>Add Tax
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Tax Name</th>
                  <th>Rate</th>
                  <th>Applies To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {taxes.length === 0 && (
                  <tr><td colSpan="5" className="text-center text-muted py-3">No taxes configured</td></tr>
                )}
                {taxes.map((tax, idx) => (
                  <tr key={idx}>
                    {editingTax && editingTax.index === idx ? (
                      <>
                        <td>
                          <input type="text" className="form-control form-control-sm" value={editingTax.name}
                            onChange={(e) => setEditingTax({ ...editingTax, name: e.target.value })} />
                        </td>
                        <td>
                          <input type="text" className="form-control form-control-sm" value={editingTax.rate} placeholder="e.g., 6%"
                            onChange={(e) => setEditingTax({ ...editingTax, rate: e.target.value })} />
                        </td>
                        <td>
                          <select className="form-select form-select-sm" value={editingTax.applies_to}
                            onChange={(e) => setEditingTax({ ...editingTax, applies_to: e.target.value })}>
                            <option>Room Charges</option>
                            <option>F&B Services</option>
                            <option>All Services</option>
                          </select>
                        </td>
                        <td>
                          <select className="form-select form-select-sm" value={editingTax.status}
                            onChange={(e) => setEditingTax({ ...editingTax, status: e.target.value })}>
                            <option>Active</option>
                            <option>Inactive</option>
                          </select>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-success me-1" onClick={handleSaveTaxEdit} disabled={saving}>
                            <i className="bi bi-check-lg"></i>
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => setEditingTax(null)} disabled={saving}>
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td><strong>{tax.name}</strong></td>
                        <td>{tax.rate}</td>
                        <td>{tax.applies_to}</td>
                        <td><span className={`badge ${tax.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>{tax.status}</span></td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setEditingTax({ index: idx, ...tax })} disabled={editingTax !== null}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTax(idx)} disabled={saving}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
