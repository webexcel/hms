import React from 'react';
import { capitalize } from '../../../utils/formatters';

export default function UsersTab({
  users, setShowUserModal, setUserForm,
  toggleUserActive, getRoleBadgeClass,
  roleDescriptions,
}) {
  return (
    <div className="tab-pane fade show active" id="users">
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0"><i className="bi bi-people me-2"></i>System Users</h5>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setUserForm({ username: '', password: '', full_name: '', email: '', role: 'front_desk' }); setShowUserModal(true); }}
          >
            <i className="bi bi-plus-lg me-1"></i>Add User
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Last Active</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className={`user-avatar-sm ${getRoleBadgeClass(u.role)}`}>
                          {(u.full_name || u.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <strong>{u.full_name || u.username}</strong>
                      </div>
                    </td>
                    <td>{u.email || '-'}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                        {capitalize(u.role?.replace('_', ' '))}
                      </span>
                    </td>
                    <td>{u.last_active || '-'}</td>
                    <td>
                      <span className={`badge ${u.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1"><i className="bi bi-pencil"></i></button>
                      {u.role !== 'admin' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => toggleUserActive(u)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0"><i className="bi bi-shield-lock me-2"></i>User Roles</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {Object.entries(roleDescriptions).map(([key, role]) => {
              const count = users.filter(u => u.role === key).length;
              return (
                <div key={key} className="col-md-6">
                  <div className="role-card">
                    <div className="role-header">
                      <h6><i className={`bi bi-shield-fill ${role.icon} me-2`}></i>{role.label}</h6>
                      <span className="badge bg-light text-dark">{count} user{count !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-muted small mb-0">{role.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
