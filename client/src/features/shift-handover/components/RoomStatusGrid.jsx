import React from 'react';
import { capitalize } from '../../../utils/formatters';

const RoomStatusGrid = ({ latestHandover, rooms, getRoomStatusClass }) => (
  <div className="sh-section">
    <div className="sh-section-header">
      <h2 className="sh-section-title">
        <i className="bi bi-grid-3x3-gap rooms"></i>
        Room Status at Handover
      </h2>
      <span style={{ fontSize: '13px', color: '#64748b' }}>
        Snapshot at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
    <div className="sh-section-body">
      {/* Legend */}
      <div className="sh-room-legend">
        {['available', 'occupied', 'reserved', 'arriving', 'departing', 'maintenance'].map(status => (
          <div key={status} className="sh-room-legend-item">
            <div className={`sh-room-legend-dot ${status}`}></div>
            {capitalize(status)}
          </div>
        ))}
      </div>

      {/* Room Grid */}
      <div className="sh-rooms">
        {(latestHandover?.rooms || rooms || []).map((room) => (
          <div
            key={room.id || room.room_number}
            className={`sh-room ${getRoomStatusClass(room.status)}`}
            title={`Room ${room.room_number} - ${capitalize(room.status || 'available')}`}
          >
            {room.room_number}
          </div>
        ))}
        {(!latestHandover?.rooms && rooms.length === 0) && (
          <p className="text-muted" style={{ fontSize: '14px', gridColumn: '1 / -1', textAlign: 'center', padding: '20px 0' }}>
            No room data available
          </p>
        )}
      </div>
    </div>
  </div>
);

export default RoomStatusGrid;
