import React from 'react';
import FormModal from '../../../components/organisms/FormModal';
import { formatCurrency } from '../../../utils/formatters';
import { getGstPercent, gstInclusiveRate } from '../hooks/useSettings';

export default function AddRoomModal({
  showAddRoomModal, setShowAddRoomModal,
  addRoomForm, setAddRoomForm,
  handleAddRoom, addingRoom,
}) {
  return (
    <FormModal
      show={showAddRoomModal}
      onHide={() => setShowAddRoomModal(false)}
      title="Add Room"
      onSubmit={handleAddRoom}
      loading={addingRoom}
    >
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Room Number</label>
          <input
            type="text"
            className="form-control"
            value={addRoomForm.room_number}
            onChange={(e) => setAddRoomForm({ ...addRoomForm, room_number: e.target.value })}
            placeholder="e.g., 101"
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Floor</label>
          <input
            type="number"
            className="form-control"
            value={addRoomForm.floor}
            onChange={(e) => setAddRoomForm({ ...addRoomForm, floor: e.target.value })}
            min="1"
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Room Type</label>
          <select
            className="form-select"
            value={addRoomForm.room_type}
            onChange={(e) => setAddRoomForm({ ...addRoomForm, room_type: e.target.value })}
            required
          >
            <option value="standard_single">Standard Single</option>
            <option value="standard_double">Standard Double</option>
            <option value="executive_single">Executive Single</option>
            <option value="executive_double">Executive Double</option>
            <option value="comfort_single">Comfort Single</option>
            <option value="comfort_double">Comfort Double</option>
            <option value="comfort_executive_double">Comfort Executive Double</option>
            <option value="comfort_executive_triple">Comfort Executive Triple</option>
            <option value="suite_triple">Suite Triple</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Base Rate (Rs/night)</label>
          <input
            type="number"
            className="form-control"
            value={addRoomForm.base_rate}
            onChange={(e) => setAddRoomForm({ ...addRoomForm, base_rate: e.target.value })}
            min="0"
            step="0.01"
            placeholder="e.g., 2500"
            required
          />
          {addRoomForm.base_rate > 0 && (
            <div className="mt-2 p-2 rounded" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12 }}>
              <div className="d-flex justify-content-between">
                <span style={{ color: '#6b7280' }}>GST ({getGstPercent(addRoomForm.base_rate)}%)</span>
                <span style={{ color: '#6b7280' }}>{formatCurrency(gstInclusiveRate(addRoomForm.base_rate) - parseFloat(addRoomForm.base_rate))}</span>
              </div>
              <div className="d-flex justify-content-between" style={{ fontWeight: 700 }}>
                <span style={{ color: '#059669' }}>Guest pays (incl. GST)</span>
                <span style={{ color: '#059669' }}>{formatCurrency(gstInclusiveRate(addRoomForm.base_rate))}/night</span>
              </div>
            </div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label">Hourly Rates <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>— tiered short stay pricing</span></label>
          <div className="d-flex flex-column gap-1">
            {['2', '3', '4'].map(h => (
              <div key={h} className="input-group input-group-sm">
                <span className="input-group-text" style={{ minWidth: 36, fontSize: 11, fontWeight: 700 }}>{h}h</span>
                <span className="input-group-text" style={{ fontSize: 11 }}>₹</span>
                <input
                  type="number"
                  className="form-control"
                  value={addRoomForm[`hourly_${h}`] || ''}
                  onChange={(e) => setAddRoomForm({ ...addRoomForm, [`hourly_${h}`]: e.target.value })}
                  min="0"
                  placeholder="0"
                />
              </div>
            ))}
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ minWidth: 36, fontSize: 11, fontWeight: 600 }}>5h+</span>
              <span className="input-group-text" style={{ fontSize: 11 }}>₹</span>
              <input
                type="number"
                className="form-control"
                value={addRoomForm.hourly_default || ''}
                onChange={(e) => setAddRoomForm({ ...addRoomForm, hourly_default: e.target.value })}
                min="0"
                placeholder="per extra hr"
              />
              <span className="input-group-text" style={{ fontSize: 10 }}>/hr</span>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Max Occupancy</label>
          <input
            type="number"
            className="form-control"
            value={addRoomForm.max_occupancy}
            onChange={(e) => setAddRoomForm({ ...addRoomForm, max_occupancy: e.target.value })}
            min="1"
            max="10"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Description</label>
          <input
            type="text"
            className="form-control"
            value={addRoomForm.description}
            onChange={(e) => setAddRoomForm({ ...addRoomForm, description: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </div>
    </FormModal>
  );
}
