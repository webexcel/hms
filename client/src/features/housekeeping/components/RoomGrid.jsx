import React from 'react';
import { capitalize } from '../../../utils/formatters';

const getRoomStatusClass = (status) => {
  const map = {
    clean: 'clean',
    dirty: 'dirty',
    inspected: 'clean',
    out_of_order: 'maintenance',
    in_progress: 'progress',
    awaiting_verification: 'verification'
  };
  return map[status] || 'dirty';
};

const getRoomStatusIcon = (status) => {
  const icons = {
    clean: 'bi-check-circle-fill',
    dirty: 'bi-brush-fill',
    inspected: 'bi-check-circle-fill',
    out_of_order: 'bi-wrench-fill',
    in_progress: 'bi-arrow-repeat',
    awaiting_verification: 'bi-hourglass-split'
  };
  return icons[status] || 'bi-brush-fill';
};

const getFloorStats = (floorRooms) => {
  const total = floorRooms.length;
  const clean = floorRooms.filter(r => r.cleanliness_status === 'clean' || r.cleanliness_status === 'inspected').length;
  const dirty = floorRooms.filter(r => r.cleanliness_status === 'dirty').length;
  const inProg = floorRooms.filter(r => r.cleanliness_status === 'in_progress' || r.cleanliness_status === 'awaiting_verification').length;
  const maint = floorRooms.filter(r => r.cleanliness_status === 'out_of_order').length;
  const parts = [`${total} rooms`, `${clean} clean`];
  if (dirty) parts.push(`${dirty} dirty`);
  if (inProg) parts.push(`${inProg} in progress`);
  if (maint) parts.push(`${maint} maintenance`);
  return parts.join(' \u2022 ');
};

const RoomGrid = ({ roomsByFloor, filteredRooms, onRoomClick }) => (
  <div className="hk-room-section">
    {Object.keys(roomsByFloor).sort((a, b) => a - b).map(floor => (
      <div className="floor-section" key={floor}>
        <div className="floor-header">
          <h6><i className="bi bi-building me-2"></i>Floor {floor}</h6>
          <span className="floor-stats">{getFloorStats(roomsByFloor[floor])}</span>
        </div>
        <div className="hk-room-grid">
          {roomsByFloor[floor].map(room => (
            <div
              className={`hk-room-card ${getRoomStatusClass(room.cleanliness_status)}`}
              key={room.id}
              onClick={() => onRoomClick(room)}
              style={{ cursor: 'pointer' }}
            >
              <div className="room-number">{room.room_number}</div>
              <div className="room-status-icon">
                <i className={`bi ${getRoomStatusIcon(room.cleanliness_status)}`}></i>
              </div>
              <div className="room-type">{room.room_type || 'Standard'}</div>
              <div className="room-status-text">
                {room.cleanliness_status === 'awaiting_verification'
                  ? 'Awaiting Verify'
                  : capitalize((room.cleanliness_status || 'unknown').replace('_', ' '))}
              </div>
              {room.priority && (room.priority === 'high' || room.priority === 'urgent') && (
                <div className={`room-priority ${room.priority}`}>{capitalize(room.priority)}</div>
              )}
              {room.assigned_staff && (room.cleanliness_status === 'in_progress' || room.cleanliness_status === 'awaiting_verification') && (
                <div className="room-assignee">{room.assigned_staff}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    ))}
    {filteredRooms.length === 0 && (
      <div className="text-center text-muted py-5">No rooms found</div>
    )}
  </div>
);

export default RoomGrid;
