import { STATUS_FILTERS, LEGEND_ITEMS } from '../hooks/useFrontDesk';
import { capitalize } from '../../../utils/formatters';

export default function RoomGrid({ activeFilter, setActiveFilter, sortedFloors, roomsByFloor, handleRoomClick, activeReservations, arrivals, departures }) {
  return (
    <div className="col-lg-8">
      <div className="fd-section">
        <div className="fd-section-header">
          <h2 className="fd-section-title">
            <i className="bi bi-grid-3x3-gap"></i> Room Status
          </h2>
          <div className="fd-filters">
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                className={`fd-filter ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {capitalize(f)}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="fd-legend">
          {LEGEND_ITEMS.map(item => (
            <div key={item.cls} className="fd-legend-item">
              <div className={`fd-legend-dot ${item.cls}`}></div>
              {item.label}
            </div>
          ))}
        </div>

        {/* Floor Sections */}
        {sortedFloors.map(floor => (
          <div key={floor} className="fd-floor">
            <div className="fd-floor-title">Floor {floor}</div>
            <div className="fd-rooms">
              {roomsByFloor[floor]
                .sort((a, b) => a.room_number.localeCompare(b.room_number))
                .map(rm => (
                  <div
                    key={rm.id}
                    className={`fd-room ${rm.status}${rm.cleanliness_status === 'dirty' || rm.status === 'cleaning' ? ' fd-dirty' : ''}${rm.cleanliness_status === 'out_of_order' ? ' fd-out-of-order' : ''}${(() => { const res = [...activeReservations, ...arrivals, ...departures].find(r => (r.room_id || r.room?.id) === rm.id); return res?.booking_type === 'hourly' && res?.expected_checkout_time && new Date(res.expected_checkout_time) <= new Date() ? ' fd-overdue' : ''; })()}`}
                    onClick={() => handleRoomClick(rm)}
                  >
                    <div className="fd-room-number">{rm.room_number}</div>
                    <div className="fd-room-type">{capitalize(rm.room_type)}</div>
                    {/* Stay info for occupied/reserved rooms */}
                    {(() => {
                      const res = [...activeReservations, ...arrivals, ...departures].find(r => (r.room_id || r.room?.id) === rm.id);
                      if (!res || (rm.status !== 'occupied' && rm.status !== 'reserved')) return null;
                      const isHourlyRes = res.booking_type === 'hourly';
                      if (isHourlyRes) {
                        const hours = res.expected_hours || 3;
                        let hoursLeft = '';
                        let isOverdue = false;
                        if (res.expected_checkout_time) {
                          const diffMs = new Date(res.expected_checkout_time) - new Date();
                          const diff = Math.max(0, Math.ceil(diffMs / 3600000));
                          isOverdue = diffMs <= 0;
                          hoursLeft = diff > 0 ? `${diff}h left` : 'OVERDUE';
                        }
                        return (
                          <>
                            <div style={{ fontSize: 8, fontWeight: 700, color: isOverdue ? '#dc2626' : '#f59e0b', marginTop: 2 }}>
                              {hours}H{hoursLeft ? ` · ${hoursLeft}` : ''}
                            </div>
                            <span className={isOverdue ? 'fd-overdue-badge' : ''} style={{ position: 'absolute', top: 4, right: 4, background: isOverdue ? '#dc2626' : '#f59e0b', color: '#fff', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3, letterSpacing: 0.3 }}>
                              <i className={`bi ${isOverdue ? 'bi-exclamation-triangle-fill' : 'bi-clock-fill'}`} style={{ fontSize: 7 }}></i> {isOverdue ? 'OVERDUE' : 'SHORT'}
                            </span>
                          </>
                        );
                      }
                      const coDate = res.check_out_date;
                      const nights = res.nights || (res.check_in_date && coDate ? Math.max(1, Math.ceil((new Date(coDate) - new Date(res.check_in_date)) / 86400000)) : 0);
                      const daysLeft = coDate ? Math.max(0, Math.ceil((new Date(coDate) - new Date()) / 86400000)) : 0;
                      return (
                        <>
                          <div style={{ fontSize: 8, fontWeight: 700, color: '#64748b', marginTop: 2 }}>
                            {nights}N{daysLeft > 0 ? ` · ${daysLeft}d left` : ' · Today'}
                          </div>
                          {res.group_id && (
                            <span style={{ position: 'absolute', top: 4, right: 4, background: '#f59e0b', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 3, letterSpacing: 0.5 }}>GRP</span>
                          )}
                        </>
                      );
                    })()}
                    {(rm.cleanliness_status === 'dirty' || rm.status === 'cleaning') && (
                      <span className="fd-cleanliness-badge dirty">
                        <i className="bi bi-brush-fill"></i> Dirty
                      </span>
                    )}
                    {rm.cleanliness_status === 'in_progress' && (
                      <span className="fd-cleanliness-badge in-progress">
                        <i className="bi bi-arrow-repeat"></i> Cleaning
                      </span>
                    )}
                    {rm.cleanliness_status === 'awaiting_verification' && (
                      <span className="fd-cleanliness-badge awaiting-verify">
                        <i className="bi bi-hourglass-split"></i> Awaiting Verify
                      </span>
                    )}
                    {rm.cleanliness_status === 'out_of_order' && (
                      <span className="fd-cleanliness-badge out-of-order">
                        <i className="bi bi-wrench-adjustable"></i> Out of Order
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
