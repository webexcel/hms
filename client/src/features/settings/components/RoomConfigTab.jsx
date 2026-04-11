import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

export default function RoomConfigTab({
  roomTypes, editingRoom, setEditingRoom, savingRate,
  setShowAddRoomModal, amenities, allRooms,
  handleSaveRate,
}) {
  const formatType = (t) => t ? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';

  // Group rooms by type for section headers
  const grouped = React.useMemo(() => {
    const map = {};
    (allRooms || []).forEach(r => {
      if (!map[r.room_type]) map[r.room_type] = [];
      map[r.room_type].push(r);
    });
    // Sort rooms within each type by room_number
    Object.values(map).forEach(arr => arr.sort((a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true })));
    return map;
  }, [allRooms]);

  const typeKeys = Object.keys(grouped);

  return (
    <div className="tab-pane fade show active" id="rooms">
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0"><i className="bi bi-door-closed me-2"></i>Rooms ({allRooms?.length || 0})</h5>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddRoomModal(true)}>
            <i className="bi bi-plus-lg me-1"></i>Add Room
          </button>
        </div>
        <div className="card-body p-0">
          {typeKeys.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-door-closed" style={{ fontSize: 32, opacity: 0.4 }}></i>
              <div className="mt-2">No rooms added yet. Click "Add Room" to get started.</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th>Room</th>
                    <th className="text-end">Single</th>
                    <th className="text-end">Double</th>
                    <th className="text-end">Triple</th>
                    <th>Hourly Rates</th>
                    <th>Extra Bed</th>
                    <th>Max</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {typeKeys.map(type => {
                    const rooms = grouped[type];
                    return (
                      <React.Fragment key={type}>
                        {/* Type header row */}
                        <tr style={{ background: '#eef2ff' }}>
                          <td colSpan={8} style={{ padding: '8px 12px' }}>
                            <strong style={{ fontSize: 14 }}>{formatType(type)}</strong>
                            <span className="badge bg-secondary ms-2">{rooms.length} room{rooms.length > 1 ? 's' : ''}</span>
                          </td>
                        </tr>
                        {/* Individual room rows */}
                        {rooms.map(r => {
                          const isEditing = editingRoom?.id === r.id;
                          return (
                            <tr key={r.id}>
                              <td>
                                <span className="fw-bold">{r.room_number}</span>
                                {r.floor && <span className="text-muted ms-1" style={{ fontSize: 10 }}>F{r.floor}</span>}
                              </td>
                              {/* Single */}
                              <td className="text-end">
                                {isEditing ? (
                                  <div className="d-flex flex-column gap-1" style={{ minWidth: 100 }}>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 9 }}>Base</span>
                                      <input type="number" className="form-control text-end" style={{ padding: '1px 5px', fontSize: 11 }}
                                        value={editingRoom.single_rate || ''}
                                        onChange={e => setEditingRoom({ ...editingRoom, single_rate: e.target.value })} />
                                    </div>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 9 }}>Misc</span>
                                      <input type="number" className="form-control text-end" style={{ padding: '1px 5px', fontSize: 11 }}
                                        value={editingRoom.single_misc || ''}
                                        onChange={e => setEditingRoom({ ...editingRoom, single_misc: e.target.value })} />
                                    </div>
                                  </div>
                                ) : (
                                  r.single_rate ? (
                                    <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                                      <div>{formatCurrency(r.single_rate)}</div>
                                      {parseFloat(r.single_misc) > 0 && <div style={{ color: '#94a3b8', fontSize: 10 }}>+{formatCurrency(r.single_misc)} misc</div>}
                                    </div>
                                  ) : '—'
                                )}
                              </td>
                              {/* Double */}
                              <td className="text-end">
                                {isEditing ? (
                                  <div className="d-flex flex-column gap-1" style={{ minWidth: 100 }}>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 9 }}>Base</span>
                                      <input type="number" className="form-control text-end" style={{ padding: '1px 5px', fontSize: 11 }}
                                        value={editingRoom.double_rate || ''}
                                        onChange={e => setEditingRoom({ ...editingRoom, double_rate: e.target.value })} />
                                    </div>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 9 }}>Misc</span>
                                      <input type="number" className="form-control text-end" style={{ padding: '1px 5px', fontSize: 11 }}
                                        value={editingRoom.double_misc || ''}
                                        onChange={e => setEditingRoom({ ...editingRoom, double_misc: e.target.value })} />
                                    </div>
                                  </div>
                                ) : (
                                  r.double_rate ? (
                                    <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                                      <div>{formatCurrency(r.double_rate)}</div>
                                      {parseFloat(r.double_misc) > 0 && <div style={{ color: '#94a3b8', fontSize: 10 }}>+{formatCurrency(r.double_misc)} misc</div>}
                                    </div>
                                  ) : '—'
                                )}
                              </td>
                              {/* Triple */}
                              <td className="text-end">
                                {isEditing ? (
                                  <div className="d-flex flex-column gap-1" style={{ minWidth: 100 }}>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 9 }}>Base</span>
                                      <input type="number" className="form-control text-end" style={{ padding: '1px 5px', fontSize: 11 }}
                                        value={editingRoom.triple_rate || ''}
                                        onChange={e => setEditingRoom({ ...editingRoom, triple_rate: e.target.value })} />
                                    </div>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 9 }}>Misc</span>
                                      <input type="number" className="form-control text-end" style={{ padding: '1px 5px', fontSize: 11 }}
                                        value={editingRoom.triple_misc || ''}
                                        onChange={e => setEditingRoom({ ...editingRoom, triple_misc: e.target.value })} />
                                    </div>
                                  </div>
                                ) : (
                                  r.triple_rate ? (
                                    <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                                      <div>{formatCurrency(r.triple_rate)}</div>
                                      {parseFloat(r.triple_misc) > 0 && <div style={{ color: '#94a3b8', fontSize: 10 }}>+{formatCurrency(r.triple_misc)} misc</div>}
                                    </div>
                                  ) : '—'
                                )}
                              </td>
                              {/* Hourly */}
                              <td>
                                {isEditing ? (
                                  <div className="d-flex flex-column gap-1" style={{ minWidth: 110 }}>
                                    {['2', '3', '4'].map(h => (
                                      <div key={h} className="input-group input-group-sm">
                                        <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 10, fontWeight: 700 }}>{h}h</span>
                                        <input type="number" className="form-control" style={{ padding: '1px 5px', fontSize: 11 }}
                                          value={editingRoom.hourly_rates?.[h] || ''}
                                          onChange={e => setEditingRoom({ ...editingRoom, hourly_rates: { ...(editingRoom.hourly_rates || {}), [h]: Number(e.target.value) || 0 } })}
                                          placeholder="0" />
                                      </div>
                                    ))}
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 10 }}>5h+</span>
                                      <input type="number" className="form-control" style={{ padding: '1px 5px', fontSize: 11 }}
                                        value={editingRoom.hourly_rates?.default || ''}
                                        onChange={e => setEditingRoom({ ...editingRoom, hourly_rates: { ...(editingRoom.hourly_rates || {}), default: Number(e.target.value) || 0 } })}
                                        placeholder="per hr" />
                                    </div>
                                  </div>
                                ) : (
                                  r.hourly_rates && (r.hourly_rates['2'] || r.hourly_rates['3'] || r.hourly_rates['4']) ? (
                                    <div style={{ fontSize: 10, lineHeight: 1.5 }}>
                                      {['2', '3', '4'].map(h => r.hourly_rates[h] ? <div key={h}><strong>{h}h:</strong> {formatCurrency(r.hourly_rates[h])}</div> : null)}
                                      {r.hourly_rates.default ? <div style={{ color: '#64748b' }}>5h+: {formatCurrency(r.hourly_rates.default)}/hr</div> : null}
                                    </div>
                                  ) : <span className="badge bg-secondary" style={{ fontSize: 9 }}>None</span>
                                )}
                              </td>
                              {/* Extra Bed */}
                              <td>
                                {isEditing ? (
                                  <div className="d-flex flex-column gap-1" style={{ minWidth: 90 }}>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 10 }}>Rs</span>
                                      <input type="number" className="form-control" style={{ padding: '1px 5px', fontSize: 11 }}
                                        value={editingRoom.extra_bed_charge || ''}
                                        onChange={e => setEditingRoom({ ...editingRoom, extra_bed_charge: Number(e.target.value) || 0 })}
                                        placeholder="charge" />
                                    </div>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 10 }}>Max</span>
                                      <input type="number" className="form-control" style={{ padding: '1px 5px', fontSize: 11 }}
                                        value={editingRoom.max_extra_beds || 1}
                                        onChange={e => setEditingRoom({ ...editingRoom, max_extra_beds: Number(e.target.value) || 1 })}
                                        min="1" max="3" />
                                    </div>
                                  </div>
                                ) : (
                                  r.extra_bed_charge > 0 ? (
                                    <div style={{ fontSize: 10, lineHeight: 1.5 }}>
                                      <div><strong>{formatCurrency(r.extra_bed_charge)}</strong>/night</div>
                                      <div style={{ color: '#64748b' }}>Max: {r.max_extra_beds || 1}</div>
                                    </div>
                                  ) : <span className="badge bg-secondary" style={{ fontSize: 9 }}>None</span>
                                )}
                              </td>
                              {/* Max Occupancy */}
                              <td>
                                {isEditing ? (
                                  <input type="number" className="form-control form-control-sm" style={{ width: 60 }}
                                    value={editingRoom.max_occupancy || ''}
                                    onChange={e => setEditingRoom({ ...editingRoom, max_occupancy: e.target.value })} min="1" max="10" />
                                ) : `${r.max_occupancy} guests`}
                              </td>
                              {/* Actions */}
                              <td>
                                {isEditing ? (
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-sm btn-success" onClick={() => handleSaveRate(r.id)} disabled={savingRate} title="Save">
                                      <i className="bi bi-check-lg"></i>
                                    </button>
                                    <button className="btn btn-sm btn-secondary" onClick={() => setEditingRoom(null)} disabled={savingRate} title="Cancel">
                                      <i className="bi bi-x-lg"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button className="btn btn-sm btn-outline-primary"
                                    onClick={() => setEditingRoom({
                                      id: r.id,
                                      room_number: r.room_number,
                                      type: r.room_type,
                                      single_rate: r.single_rate || '',
                                      single_misc: r.single_misc || '',
                                      double_rate: r.double_rate || '',
                                      double_misc: r.double_misc || '',
                                      triple_rate: r.triple_rate || '',
                                      triple_misc: r.triple_misc || '',
                                      hourly_rates: r.hourly_rates || { '2': 0, '3': 0, '4': 0, default: 0 },
                                      extra_bed_charge: r.extra_bed_charge || 0,
                                      max_extra_beds: r.max_extra_beds || 1,
                                      max_occupancy: r.max_occupancy || 2,
                                    })}
                                    disabled={editingRoom !== null} title={`Edit room ${r.room_number}`}>
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Room Amenities */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0"><i className="bi bi-stars me-2"></i>Room Amenities</h5>
          <button className="btn btn-outline-primary btn-sm">
            <i className="bi bi-plus-lg me-1"></i>Add Amenity
          </button>
        </div>
        <div className="card-body">
          <div className="amenities-grid">
            {amenities.map((a, idx) => (
              <div key={idx} className="amenity-tag">
                <i className={`bi ${a.icon}`}></i> {a.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
