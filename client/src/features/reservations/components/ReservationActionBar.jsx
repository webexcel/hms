import { STATUS_OPTIONS } from '../hooks/useReservations';

export default function ReservationActionBar({
  searchQuery, setSearchQuery,
  showFilterDropdown, setShowFilterDropdown,
  statusFilter, handleFilterSelect,
  handleOpenNewModal,
}) {
  return (
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
      <div className="d-flex align-items-center gap-3">
        {/* Search */}
        <div className="search-box">
          <i className="bi bi-search search-icon"></i>
          <input
            type="text"
            className="form-control form-control-custom"
            placeholder="Search reservations..."
            style={{ paddingLeft: '2.5rem', minWidth: '250px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {/* Filter */}
        <div className="dropdown" style={{ position: 'relative' }}>
          <button
            className="btn btn-outline-secondary dropdown-toggle"
            type="button"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <i className="bi bi-funnel me-1"></i> Filter
          </button>
          {showFilterDropdown && (
            <ul className="dropdown-menu show" style={{ display: 'block' }}>
              {STATUS_OPTIONS.map((opt) => (
                <li key={opt.value}>
                  <a
                    className={`dropdown-item${statusFilter === opt.value ? ' active' : ''}`}
                    href="#"
                    onClick={(e) => { e.preventDefault(); handleFilterSelect(opt.value); }}
                  >
                    {opt.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <button
        className="btn btn-primary"
        style={{ background: 'var(--secondary-color)', borderColor: 'var(--secondary-color)' }}
        onClick={handleOpenNewModal}
      >
        <i className="bi bi-plus-lg me-1"></i> New Reservation
      </button>
    </div>
  );
}
