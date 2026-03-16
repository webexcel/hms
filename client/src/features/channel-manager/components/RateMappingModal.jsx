import React from 'react';

const RateMappingModal = ({
  show, onClose, rateMappings, ratePlans,
  mappingForm, setMappingForm, onSave, onDelete,
}) => {
  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Rate Mappings</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <table className="table table-sm mb-4">
              <thead>
                <tr><th>Rate Plan</th><th>OTA Room</th><th>OTA Rate</th><th>Markup</th><th></th></tr>
              </thead>
              <tbody>
                {rateMappings.map((m) => (
                  <tr key={m.id}>
                    <td>{m.ratePlan?.name || m.rate_plan_id}</td>
                    <td><code>{m.ota_room_code}</code></td>
                    <td><code>{m.ota_rate_code}</code></td>
                    <td>{m.markup_value}{m.markup_type === 'percentage' ? '%' : ' INR'}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(m.id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h6>Add Mapping</h6>
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label className="form-label small">Rate Plan</label>
                <select className="form-select form-select-sm" value={mappingForm.rate_plan_id}
                  onChange={(e) => setMappingForm({ ...mappingForm, rate_plan_id: e.target.value })}>
                  <option value="">Select...</option>
                  {ratePlans.map((rp) => (
                    <option key={rp.id} value={rp.id}>{rp.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small">OTA Room Code</label>
                <input className="form-control form-control-sm" value={mappingForm.ota_room_code}
                  onChange={(e) => setMappingForm({ ...mappingForm, ota_room_code: e.target.value })} />
              </div>
              <div className="col-md-2">
                <label className="form-label small">OTA Rate Code</label>
                <input className="form-control form-control-sm" value={mappingForm.ota_rate_code}
                  onChange={(e) => setMappingForm({ ...mappingForm, ota_rate_code: e.target.value })} />
              </div>
              <div className="col-md-2">
                <label className="form-label small">Markup</label>
                <div className="input-group input-group-sm">
                  <input type="number" className="form-control" value={mappingForm.markup_value}
                    onChange={(e) => setMappingForm({ ...mappingForm, markup_value: e.target.value })} />
                  <select className="form-select" value={mappingForm.markup_type}
                    onChange={(e) => setMappingForm({ ...mappingForm, markup_type: e.target.value })}>
                    <option value="percentage">%</option>
                    <option value="fixed">INR</option>
                  </select>
                </div>
              </div>
              <div className="col-md-1">
                <button className="btn btn-sm btn-primary" onClick={onSave}>Add</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateMappingModal;
