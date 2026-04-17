import { useState, useEffect } from 'react';

const ID_PROOF_OPTIONS = [
  { value: '', label: '— Select —' },
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'pan', label: 'PAN' },
];

const emptyForm = {
  first_name: '', last_name: '', phone: '', email: '',
  id_proof_type: '', id_proof_number: '', address: '',
};

export default function EditGuestModal({ show, reservation, mode, saving, onClose, onSave }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!show) return;
    if (mode === 'edit' && reservation?.guest) {
      const g = reservation.guest;
      setForm({
        first_name: g.first_name || '',
        last_name: g.last_name || '',
        phone: g.phone || '',
        email: g.email || '',
        id_proof_type: g.id_proof_type || '',
        id_proof_number: g.id_proof_number || '',
        address: g.address || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [show, reservation, mode]);

  if (!show || !reservation) return null;

  const currentGuestName = reservation.guest
    ? `${reservation.guest.first_name || ''} ${reservation.guest.last_name || ''}`.trim() || '—'
    : '—';
  const roomNumber = reservation.room?.room_number || reservation.room_number || '—';
  const isEdit = mode === 'edit';

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.phone.trim()) return;
    onSave(reservation.id, form, mode);
  };

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className={`bi ${isEdit ? 'bi-person-gear' : 'bi-person-plus'} me-2`}></i>
                {isEdit ? 'Edit Guest Details' : 'Add New Guest'}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={saving}></button>
            </div>
            <div className="modal-body">
              <div className={`alert ${isEdit ? 'alert-warning' : 'alert-info'} py-2 mb-3`} style={{ fontSize: 13 }}>
                <div><strong>Room:</strong> {roomNumber}</div>
                <div><strong>Current guest:</strong> {currentGuestName}</div>
                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                  {isEdit
                    ? 'Edits update the existing guest record — name changes apply to all past reservations for this guest.'
                    : 'A new guest record will be created and linked to this reservation. The previous guest stays unchanged.'}
                </div>
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">First Name *</label>
                  <input type="text" className="form-control" value={form.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)} required autoFocus />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-control" value={form.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone *</label>
                  <input type="tel" className="form-control" value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">ID Proof Type</label>
                  <select className="form-select" value={form.id_proof_type}
                    onChange={(e) => handleChange('id_proof_type', e.target.value)}>
                    {ID_PROOF_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">ID Proof Number</label>
                  <input type="text" className="form-control" value={form.id_proof_number}
                    onChange={(e) => handleChange('id_proof_number', e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label">Address</label>
                  <textarea className="form-control" rows={2} value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Guest'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
