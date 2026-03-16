import React from 'react';

const MaintenanceModal = ({ show, maintenanceForm, setMaintenanceForm, rooms, onSubmit, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={onClose}>
      <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-tools me-2"></i>New Maintenance Request
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Room Number</label>
                <select
                  className="form-select"
                  value={maintenanceForm.room_id}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, room_id: e.target.value })}
                  required
                >
                  <option value="">Select room...</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      Room {room.room_number}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Issue Category</label>
                <select
                  className="form-select"
                  value={maintenanceForm.issue_type}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issue_type: e.target.value })}
                  required
                >
                  <option value="">Select category...</option>
                  <option value="hvac">Air Conditioning</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="furniture">Furniture</option>
                  <option value="appliance">TV/Electronics</option>
                  <option value="structural">Structural</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Issue Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  required
                ></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={maintenanceForm.priority}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                >
                  <option value="urgent">Urgent - Guest impacted</option>
                  <option value="high">High - Needs quick attention</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low - Can wait</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-send me-1"></i>Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceModal;
