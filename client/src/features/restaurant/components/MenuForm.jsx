import React from 'react';
import { CATEGORIES } from '../hooks/useRestaurant';

const MenuForm = ({ menuForm, setMenuForm, editingMenuId, handleSaveMenuItem, handleCancelEdit }) => (
  <div className="col-lg-4">
    <div
      className="card"
      style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div
        className="card-header"
        style={{
          background: '#1a1a2e',
          color: '#fff',
          borderRadius: '12px 12px 0 0',
          fontWeight: 700,
        }}
      >
        <i className={`bi ${editingMenuId ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
        {editingMenuId ? 'Edit Menu Item' : 'Add Menu Item'}
      </div>
      <div className="card-body" style={{ padding: 20 }}>
        <div className="mb-3">
          <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
            Item Name *
          </label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={menuForm.name}
            onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
            placeholder="e.g. Chicken Biryani"
          />
        </div>
        <div className="row g-2 mb-3">
          <div className="col-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
              Category *
            </label>
            <select
              className="form-select form-select-sm"
              value={menuForm.category}
              onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-6">
            <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
              Price (\u20B9) *
            </label>
            <input
              type="number"
              className="form-control form-control-sm"
              min="0"
              value={menuForm.price}
              onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
              placeholder="0"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label" style={{ fontSize: 12, fontWeight: 700 }}>
            Description
          </label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={menuForm.description}
            onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
            placeholder="Optional"
          />
        </div>
        <div className="form-check form-switch mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            checked={menuForm.is_veg}
            onChange={(e) => setMenuForm({ ...menuForm, is_veg: e.target.checked })}
            id="vegToggle"
          />
          <label
            className="form-check-label"
            htmlFor="vegToggle"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            {menuForm.is_veg ? '\u{1F7E2} Vegetarian' : '\u{1F534} Non-Vegetarian'}
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary btn-sm"
            style={{ borderRadius: 8, fontWeight: 700, flex: 1 }}
            onClick={handleSaveMenuItem}
          >
            <i className={`bi ${editingMenuId ? 'bi-check-lg' : 'bi-plus'} me-1`}></i>
            {editingMenuId ? 'Update' : 'Add Item'}
          </button>
          {editingMenuId && (
            <button
              className="btn btn-outline-secondary btn-sm"
              style={{ borderRadius: 8 }}
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default MenuForm;
