import React from 'react';
import FormModal from '../../../components/organisms/FormModal';

export default function AddTaxModal({
  showAddTaxModal, setShowAddTaxModal,
  addTaxForm, setAddTaxForm,
  handleAddTax, saving,
}) {
  return (
    <FormModal
      show={showAddTaxModal}
      onHide={() => setShowAddTaxModal(false)}
      title="Add Tax"
      onSubmit={handleAddTax}
      loading={saving}
    >
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Tax Name</label>
          <input
            type="text"
            className="form-control"
            value={addTaxForm.name}
            onChange={(e) => setAddTaxForm({ ...addTaxForm, name: e.target.value })}
            placeholder="e.g., CGST"
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Rate</label>
          <input
            type="text"
            className="form-control"
            value={addTaxForm.rate}
            onChange={(e) => setAddTaxForm({ ...addTaxForm, rate: e.target.value })}
            placeholder="e.g., 6%"
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Applies To</label>
          <select
            className="form-select"
            value={addTaxForm.applies_to}
            onChange={(e) => setAddTaxForm({ ...addTaxForm, applies_to: e.target.value })}
          >
            <option>Room Charges</option>
            <option>F&B Services</option>
            <option>All Services</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={addTaxForm.status}
            onChange={(e) => setAddTaxForm({ ...addTaxForm, status: e.target.value })}
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>
    </FormModal>
  );
}
