import React from 'react';
import { capitalize } from '../../../utils/formatters';

const PackageModal = ({
  selectedPackage,
  packageForm,
  setPackageForm,
  roomTypes,
  handleSavePackage,
  onClose,
}) => {
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-gift me-2"></i>
              {selectedPackage ? 'Edit Package' : 'Create New Package'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSavePackage}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label">Package Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Weekend Escape"
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Package Price</label>
                  <div className="input-group">
                    <span className="input-group-text">Rs</span>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={packageForm.price}
                      onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Brief description of the package"
                    value={packageForm.description}
                    onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Room Type</label>
                  <select
                    className="form-select"
                    value={packageForm.room_type}
                    onChange={(e) => setPackageForm({ ...packageForm, room_type: e.target.value })}
                    required
                  >
                    <option value="">Select Room Type</option>
                    {roomTypes.map(rt => <option key={rt} value={rt}>{capitalize(rt)}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Duration</label>
                  <select
                    className="form-select"
                    value={packageForm.nights}
                    onChange={(e) => setPackageForm({ ...packageForm, nights: e.target.value })}
                    required
                  >
                    <option value="">Select Duration</option>
                    <option value="1">1 Night</option>
                    <option value="2">2 Nights</option>
                    <option value="3">3 Nights</option>
                    <option value="weekend">Weekend (Fri-Sun)</option>
                    <option value="7">Week (7 Nights)</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Inclusions</label>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="pkgBreakfast" />
                        <label className="form-check-label" htmlFor="pkgBreakfast">Breakfast</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="pkgSpa" />
                        <label className="form-check-label" htmlFor="pkgSpa">Spa Credit</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="pkgParking" />
                        <label className="form-check-label" htmlFor="pkgParking">Free Parking</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="pkgWifi" />
                        <label className="form-check-label" htmlFor="pkgWifi">Premium WiFi</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="pkgCheckout" />
                        <label className="form-check-label" htmlFor="pkgCheckout">Late Checkout</label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="pkgWelcome" />
                        <label className="form-check-label" htmlFor="pkgWelcome">Welcome Drink</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Valid From</label>
                  <input
                    type="date"
                    className="form-control"
                    value={packageForm.valid_from || ''}
                    onChange={(e) => setPackageForm({ ...packageForm, valid_from: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Valid Until</label>
                  <input
                    type="date"
                    className="form-control"
                    value={packageForm.valid_until || ''}
                    onChange={(e) => setPackageForm({ ...packageForm, valid_until: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">{selectedPackage ? 'Save Package' : 'Create Package'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PackageModal;
