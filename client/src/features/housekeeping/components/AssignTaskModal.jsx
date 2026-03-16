import React from 'react';

const AssignTaskModal = ({ show, selectedRoom, taskForm, setTaskForm, rooms, housekeepingStaff, onSubmit, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" onClick={onClose}>
      <div className="modal-backdrop fade show" style={{ zIndex: -1 }}></div>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-person-plus me-2"></i>
              {selectedRoom ? `Assign Task - Room ${selectedRoom.room_number}` : 'Assign Cleaning Task'}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={onSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Select Room</label>
                <select
                  className="form-select"
                  value={taskForm.room_id}
                  onChange={(e) => setTaskForm({ ...taskForm, room_id: e.target.value })}
                  required
                >
                  <option value="">Select room...</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      Room {room.room_number} ({room.room_type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Assign To</label>
                <select
                  className="form-select"
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                  required
                >
                  <option value="">Select staff member...</option>
                  {housekeepingStaff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Task Type</label>
                <select
                  className="form-select"
                  value={taskForm.task_type}
                  onChange={(e) => setTaskForm({ ...taskForm, task_type: e.target.value })}
                >
                  <option value="cleaning">Cleaning</option>
                  <option value="deep_cleaning">Deep Cleaning</option>
                  <option value="turnover">Turnover</option>
                  <option value="inspection">Inspection</option>
                  <option value="amenity_restock">Amenity Restock</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High - VIP/Expected Arrival</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Special Instructions</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={taskForm.notes}
                  onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                  placeholder="Any special cleaning requirements..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-check-lg me-1"></i>Assign Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignTaskModal;
