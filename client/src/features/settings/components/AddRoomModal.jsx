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
            <option value="standard">Standard</option>
            <option value="executive">Executive</option>
            <option value="comfort">Comfort</option>
            <option value="comfort_executive">Comfort Executive</option>
            <option value="suite">Suite</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Rates by Occupancy (Rs/night)</label>
          <div className="d-flex flex-column gap-1">
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ minWidth: 70, fontSize: 11, fontWeight: 700 }}>Single</span>
              <span className="input-group-text" style={{ fontSize: 11 }}>Rs</span>
              <input
                type="number"
                className="form-control"
                value={addRoomForm.single_rate || ''}
                onChange={(e) => setAddRoomForm({ ...addRoomForm, single_rate: e.target.value, base_rate: e.target.value || addRoomForm.base_rate })}
                min="0"
                placeholder="1 adult"
              />
            </div>
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ minWidth: 70, fontSize: 11, fontWeight: 700 }}>Double</span>
              <span className="input-group-text" style={{ fontSize: 11 }}>Rs</span>
              <input
                type="number"
                className="form-control"
                value={addRoomForm.double_rate || ''}
                onChange={(e) => setAddRoomForm({ ...addRoomForm, double_rate: e.target.value, base_rate: e.target.value || addRoomForm.base_rate })}
                min="0"
                placeholder="2 adults"
              />
            </div>
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ minWidth: 70, fontSize: 11, fontWeight: 700 }}>Triple</span>
              <span className="input-group-text" style={{ fontSize: 11 }}>Rs</span>
              <input
                type="number"
                className="form-control"
                value={addRoomForm.triple_rate || ''}
                onChange={(e) => setAddRoomForm({ ...addRoomForm, triple_rate: e.target.value, base_rate: e.target.value || addRoomForm.base_rate })}
                min="0"
                placeholder="3+ adults"
              />
            </div>
          </div>
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
          <label className="form-label">Extra Bed</label>
          <div className="d-flex flex-column gap-1">
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ minWidth: 70, fontSize: 11 }}>Charge</span>
              <span className="input-group-text" style={{ fontSize: 11 }}>Rs</span>
              <input type="number" className="form-control" value={addRoomForm.extra_bed_charge || ''}
                onChange={(e) => setAddRoomForm({ ...addRoomForm, extra_bed_charge: e.target.value })}
                min="0" placeholder="per night" />
            </div>
            <div className="input-group input-group-sm">
              <span className="input-group-text" style={{ minWidth: 70, fontSize: 11 }}>Max Beds</span>
              <input type="number" className="form-control" value={addRoomForm.max_extra_beds || ''}
                onChange={(e) => setAddRoomForm({ ...addRoomForm, max_extra_beds: e.target.value })}
                min="1" max="3" placeholder="1" />
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
