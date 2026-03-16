import React from 'react';

const SeasonalRatesModal = ({ onClose }) => {
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title"><i className="bi bi-calendar-range me-2"></i>Seasonal Rate Adjustments</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="seasonal-rate-item mb-3 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Peak Season</strong>
                <span className="badge bg-danger">+25%</span>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small">Start Date</label>
                  <input type="date" className="form-control form-control-sm" defaultValue="2026-06-01" />
                </div>
                <div className="col-6">
                  <label className="form-label small">End Date</label>
                  <input type="date" className="form-control form-control-sm" defaultValue="2026-08-31" />
                </div>
              </div>
            </div>
            <div className="seasonal-rate-item mb-3 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Holiday Season</strong>
                <span className="badge bg-danger">+35%</span>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small">Start Date</label>
                  <input type="date" className="form-control form-control-sm" defaultValue="2025-12-20" />
                </div>
                <div className="col-6">
                  <label className="form-label small">End Date</label>
                  <input type="date" className="form-control form-control-sm" defaultValue="2026-01-05" />
                </div>
              </div>
            </div>
            <div className="seasonal-rate-item mb-3 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Off Season</strong>
                <span className="badge bg-success">-15%</span>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small">Start Date</label>
                  <input type="date" className="form-control form-control-sm" defaultValue="2026-11-01" />
                </div>
                <div className="col-6">
                  <label className="form-label small">End Date</label>
                  <input type="date" className="form-control form-control-sm" defaultValue="2026-12-19" />
                </div>
              </div>
            </div>
            <button className="btn btn-outline-primary btn-sm w-100">
              <i className="bi bi-plus me-1"></i>Add New Season
            </button>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalRatesModal;
