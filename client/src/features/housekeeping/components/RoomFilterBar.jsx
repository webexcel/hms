import React from 'react';

const RoomFilterBar = ({ statusFilter, setStatusFilter, totalRooms, cleanCount, dirtyCount, progressCount, maintCount }) => (
  <div className="hk-filter-bar">
    <div className="filter-tabs">
      <button
        className={`filter-tab${statusFilter === 'all' ? ' active' : ''}`}
        onClick={() => setStatusFilter('all')}
      >
        All Rooms <span className="badge">{totalRooms}</span>
      </button>
      <button
        className={`filter-tab${statusFilter === 'clean' ? ' active' : ''}`}
        onClick={() => setStatusFilter('clean')}
      >
        <i className="bi bi-check-circle text-success"></i> Clean <span className="badge">{cleanCount}</span>
      </button>
      <button
        className={`filter-tab${statusFilter === 'dirty' ? ' active' : ''}`}
        onClick={() => setStatusFilter('dirty')}
      >
        <i className="bi bi-brush text-warning"></i> Dirty <span className="badge">{dirtyCount}</span>
      </button>
      <button
        className={`filter-tab${statusFilter === 'progress' ? ' active' : ''}`}
        onClick={() => setStatusFilter('progress')}
      >
        <i className="bi bi-arrow-repeat text-info"></i> In Progress <span className="badge">{progressCount}</span>
      </button>
      <button
        className={`filter-tab${statusFilter === 'maintenance' ? ' active' : ''}`}
        onClick={() => setStatusFilter('maintenance')}
      >
        <i className="bi bi-wrench text-danger"></i> Maintenance <span className="badge">{maintCount}</span>
      </button>
    </div>
  </div>
);

export default RoomFilterBar;
