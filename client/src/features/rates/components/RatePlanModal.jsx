import React from 'react';
import { capitalize } from '../../../utils/formatters';

const RatePlanModal = ({
  selectedRatePlan,
  ratePlanForm,
  setRatePlanForm,
  roomTypes,
  handleSaveRatePlan,
  onClose,
}) => {
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-plus-circle me-2"></i>
              {selectedRatePlan ? 'Edit Rate Plan' : 'Add Rate Plan'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSaveRatePlan}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Room Type</label>
                  <select
                    className="form-select"
                    value={ratePlanForm.room_type}
                    onChange={(e) => setRatePlanForm({ ...ratePlanForm, room_type: e.target.value })}
                    required
                  >
                    <option value="">Select Room Type</option>
                    {roomTypes.map(rt => <option key={rt} value={rt}>{capitalize(rt)}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Rate Plan Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Best Available Rate"
                    value={ratePlanForm.season}
                    onChange={(e) => setRatePlanForm({ ...ratePlanForm, season: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Base Rate (Weekday)</label>
                  <div className="input-group">
                    <span className="input-group-text">Rs</span>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={ratePlanForm.base_rate}
                      onChange={(e) => setRatePlanForm({ ...ratePlanForm, base_rate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Weekend Rate</label>
                  <div className="input-group">
                    <span className="input-group-text">Rs</span>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={ratePlanForm.weekend_rate}
                      onChange={(e) => setRatePlanForm({ ...ratePlanForm, weekend_rate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Extra Person</label>
                  <div className="input-group">
                    <span className="input-group-text">Rs</span>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={ratePlanForm.extra_person_rate}
                      onChange={(e) => setRatePlanForm({ ...ratePlanForm, extra_person_rate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Valid From</label>
                  <input
                    type="date"
                    className="form-control"
                    value={ratePlanForm.valid_from || ''}
                    onChange={(e) => setRatePlanForm({ ...ratePlanForm, valid_from: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Valid Until</label>
                  <input
                    type="date"
                    className="form-control"
                    value={ratePlanForm.valid_until || ''}
                    onChange={(e) => setRatePlanForm({ ...ratePlanForm, valid_until: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Inclusions</label>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="incBreakfast" />
                    <label className="form-check-label" htmlFor="incBreakfast">Breakfast Included</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="incWifi" />
                    <label className="form-check-label" htmlFor="incWifi">Premium WiFi</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="incParking" />
                    <label className="form-check-label" htmlFor="incParking">Free Parking</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Rate Plan</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatePlanModal;
