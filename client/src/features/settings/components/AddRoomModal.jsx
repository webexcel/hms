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
        <div className="col-12">
          <label className="form-label">Rates by Occupancy <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>(Base Rate + 5% GST · Misc no GST)</span></label>
          <div className="row g-2">
            {[
              { key: 'single', label: 'Single', desc: '1 adult' },
              { key: 'double', label: 'Double', desc: '2 adults' },
              { key: 'triple', label: 'Triple', desc: '3+ adults' },
            ].map(o => (
              <div key={o.key} className="col-md-4">
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, background: '#f9fafb' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>{o.label} <span style={{ fontWeight: 400, color: '#9ca3af' }}>· {o.desc}</span></div>
                  <div className="input-group input-group-sm mb-1">
                    <span className="input-group-text" style={{ minWidth: 50, fontSize: 10 }}>Base</span>
                    <span className="input-group-text" style={{ fontSize: 10 }}>Rs</span>
                    <input type="number" className="form-control" min="0" placeholder="0"
                      value={addRoomForm[`${o.key}_rate`] || ''}
                      onChange={(e) => setAddRoomForm({ ...addRoomForm, [`${o.key}_rate`]: e.target.value, base_rate: e.target.value || addRoomForm.base_rate })} />
                  </div>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text" style={{ minWidth: 50, fontSize: 10 }}>Misc</span>
                    <span className="input-group-text" style={{ fontSize: 10 }}>Rs</span>
                    <input type="number" className="form-control" min="0" placeholder="0"
                      value={addRoomForm[`${o.key}_misc`] || ''}
                      onChange={(e) => setAddRoomForm({ ...addRoomForm, [`${o.key}_misc`]: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
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
