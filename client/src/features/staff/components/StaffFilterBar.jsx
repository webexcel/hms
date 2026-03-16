import React from 'react';

const StaffFilterBar = ({
  searchQuery,
  setSearchQuery,
  departmentFilter,
  setDepartmentFilter,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  departments,
}) => {
  return (
    <div className="staff-filter-bar">
      <div className="search-box">
        <i className="bi bi-search"></i>
        <input
          type="text"
          className="form-control"
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="filter-group">
        <select
          className="form-select"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept.value} value={dept.value}>{dept.label}</option>
          ))}
        </select>
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="view-toggle">
        <button
          className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          <i className="bi bi-list-ul"></i>
        </button>
        <button
          className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
        >
          <i className="bi bi-grid-3x3-gap"></i>
        </button>
      </div>
    </div>
  );
};

export default StaffFilterBar;
