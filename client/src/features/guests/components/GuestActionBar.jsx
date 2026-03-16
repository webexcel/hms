import React from 'react';

const GuestActionBar = ({
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  handleFilter,
  setShowModal,
}) => (
  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
    <div className="d-flex align-items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="search-box">
        <i className="bi bi-search search-icon"></i>
        <input
          type="text"
          className="form-control form-control-custom"
          placeholder="Search guests by name, email, phone..."
          style={{ paddingLeft: '2.5rem', minWidth: '300px' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {/* Filter */}
      <div className="dropdown">
        <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
          <i className="bi bi-funnel me-1"></i> Filter
        </button>
        <ul className="dropdown-menu">
          <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('all', e)}>All Guests</a></li>
          <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('in_house', e)}>Currently In-House</a></li>
          <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('vip', e)}>VIP Guests</a></li>
          <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('returning', e)}>Returning Guests</a></li>
          <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('corporate', e)}>Corporate Guests</a></li>
          <li><hr className="dropdown-divider" /></li>
          <li><a className="dropdown-item" href="#" onClick={(e) => handleFilter('blacklisted', e)}>Blacklisted</a></li>
        </ul>
      </div>
      {/* View Toggle */}
      <div className="btn-group" role="group">
        <button
          type="button"
          className={`btn btn-outline-secondary${viewMode === 'list' ? ' active' : ''}`}
          title="List View"
          onClick={() => setViewMode('list')}
        >
          <i className="bi bi-list-ul"></i>
        </button>
        <button
          type="button"
          className={`btn btn-outline-secondary${viewMode === 'grid' ? ' active' : ''}`}
          title="Grid View"
          onClick={() => setViewMode('grid')}
        >
          <i className="bi bi-grid-3x3-gap"></i>
        </button>
      </div>
    </div>
    <button
      className="btn btn-primary"
      style={{ background: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
      onClick={() => setShowModal(true)}
    >
      <i className="bi bi-plus-lg me-1"></i> Add Guest
    </button>
  </div>
);

export default GuestActionBar;
