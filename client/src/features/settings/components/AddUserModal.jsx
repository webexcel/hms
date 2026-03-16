import React from 'react';
import FormModal from '../../../components/organisms/FormModal';
import { capitalize } from '../../../utils/formatters';

export default function AddUserModal({
  showUserModal, setShowUserModal,
  userForm, setUserForm,
  handleAddUser, roles,
}) {
  return (
    <FormModal
      show={showUserModal}
      onHide={() => setShowUserModal(false)}
      title="Add User"
      onSubmit={handleAddUser}
    >
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-control"
            value={userForm.full_name}
            onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
          />
        </div>
        <div className="col-12">
          <label className="form-label">Role</label>
          <select
            className="form-select"
            value={userForm.role}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            required
          >
            {roles.map(r => (
              <option key={r} value={r}>{capitalize(r.replace('_', ' '))}</option>
            ))}
          </select>
        </div>
      </div>
    </FormModal>
  );
}
