import React from 'react';

const InventoryFilterBar = ({
  search,
  categoryFilter,
  statusFilter,
  categories,
  onSearchChange,
  onCategoryChange,
  onStatusChange
}) => {
  return (
    <div className="inventory-filter-bar">
      <div className="search-box">
        <i className="bi bi-search"></i>
        <input
          type="text"
          className="form-control"
          placeholder="Search items..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="filter-group">
        <select
          className="form-select"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat.toLowerCase()}>{cat}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>
    </div>
  );
};

export default InventoryFilterBar;
