import React from 'react';
import { formatCurrency, capitalize } from '../../../utils/formatters';
import { CATEGORIES } from '../hooks/useRestaurant';

const MenuTable = ({
  menuItems,
  filteredMenuItems,
  menuFilter,
  setMenuFilter,
  handleEditMenuItem,
  handleDeleteMenuItem,
  handleToggleAvailability,
}) => (
  <div className="col-lg-8">
    <div
      className="card"
      style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div
        className="card-header d-flex justify-content-between align-items-center"
        style={{ background: '#f8fafc', borderRadius: '12px 12px 0 0' }}
      >
        <h5 className="mb-0" style={{ fontWeight: 700, fontSize: 15 }}>
          <i className="bi bi-journal-text me-2"></i>Menu Items ({menuItems.length})
        </h5>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${menuFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ borderRadius: 6, fontSize: 11, fontWeight: 700 }}
            onClick={() => setMenuFilter('all')}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`btn btn-sm ${menuFilter === c.value ? 'btn-primary' : 'btn-outline-secondary'}`}
              style={{ borderRadius: 6, fontSize: 11, fontWeight: 700 }}
              onClick={() => setMenuFilter(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Name</th>
                <th>Category</th>
                <th className="text-end">Price</th>
                <th className="text-center">Available</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenuItems.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No menu items found. Add your first item!
                  </td>
                </tr>
              )}
              {filteredMenuItems.map((item) => (
                <tr key={item.id} style={{ opacity: item.is_available ? 1 : 0.5 }}>
                  <td style={{ fontSize: 16 }}>{item.is_veg ? '\u{1F7E2}' : '\u{1F534}'}</td>
                  <td>
                    <strong>{item.name}</strong>
                    {item.description && (
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.description}</div>
                    )}
                  </td>
                  <td>
                    <span className="badge bg-light text-dark" style={{ fontSize: 11 }}>
                      {capitalize(item.category?.replace('_', ' '))}
                    </span>
                  </td>
                  <td className="text-end" style={{ fontWeight: 700 }}>
                    {formatCurrency(item.price)}
                  </td>
                  <td className="text-center">
                    <div className="form-check form-switch d-flex justify-content-center mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={item.is_available}
                        onChange={() => handleToggleAvailability(item.id, item.is_available)}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      style={{ borderRadius: 6, fontSize: 11, padding: '2px 8px' }}
                      onClick={() => handleEditMenuItem(item)}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      style={{ borderRadius: 6, fontSize: 11, padding: '2px 8px' }}
                      onClick={() => handleDeleteMenuItem(item.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

export default MenuTable;
