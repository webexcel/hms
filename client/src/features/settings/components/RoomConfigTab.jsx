import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/formatters';

export default function RoomConfigTab({
  roomTypes, editingRoom, setEditingRoom, savingRate,
  setShowAddRoomModal, amenities, allRooms,
  handleSaveRate, handleSaveTypeRate, handleChangeRoomType,
}) {
  const formatType = (t) => t ? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';
  const [expandedType, setExpandedType] = useState(null);
  const [changingType, setChangingType] = useState(null); // { roomId, roomNumber, newType }

  // Group rooms by type
  const grouped = React.useMemo(() => {
    const map = {};
    (allRooms || []).forEach(r => {
      if (!map[r.room_type]) map[r.room_type] = [];
      map[r.room_type].push(r);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true })));
    return map;
  }, [allRooms]);

  const typeKeys = Object.keys(grouped);

  // Get representative room for each type (first room)
  const getTypeData = (type) => {
    const rooms = grouped[type];
    if (!rooms || rooms.length === 0) return null;
    const r = rooms[0];
    return {
      type,
      count: rooms.length,
      rooms: rooms.map(rm => rm.room_number).join(', '),
      single_rate: r.single_rate,
      single_misc: r.single_misc,
      double_rate: r.double_rate,
      double_misc: r.double_misc,
      triple_rate: r.triple_rate,
      triple_misc: r.triple_misc,
      hourly_rates: r.hourly_rates,
      extra_bed_charge: r.extra_bed_charge,
      max_extra_beds: r.max_extra_beds,
      max_occupancy: r.max_occupancy,
      room_ids: rooms.map(rm => rm.id),
    };
  };

  return (
    <div className="tab-pane fade show active" id="rooms">
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0"><i className="bi bi-door-closed me-2"></i>Room Types ({typeKeys.length}) &middot; {allRooms?.length || 0} Rooms</h5>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddRoomModal(true)}>
            <i className="bi bi-plus-lg me-1"></i>Add Room
          </button>
        </div>
        <div className="card-body p-0">
          {typeKeys.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-door-closed" style={{ fontSize: 32, opacity: 0.4 }}></i>
              <div className="mt-2">No rooms added yet.</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th>Room Type</th>
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
                    const td = getTypeData(type);
                    if (!td) return null;
                    const isEditing = editingRoom?._typeEdit === type;
                    const isExpanded = expandedType === type;

                    return (
                      <React.Fragment key={type}>
                        {/* Type row */}
                        <tr style={{ background: isEditing ? '#fefce8' : '#fff' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button className="btn btn-sm p-0" style={{ border: 'none', background: 'none', fontSize: 12, color: '#6366f1' }}
                                onClick={() => setExpandedType(isExpanded ? null : type)}>
                                <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                              </button>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{formatType(type)}</div>
                                <div style={{ fontSize: 10, color: '#64748b' }}>
                                  {td.count} room{td.count > 1 ? 's' : ''}: {td.rooms}
                                </div>
                              </div>
                            </div>
                          </td>
                          {/* Single */}
                          <td className="text-end">
                            {isEditing ? (
                              <RateInput label="Base" value={editingRoom.single_rate} onChange={v => setEditingRoom({ ...editingRoom, single_rate: v })}
                                miscLabel="Misc" miscValue={editingRoom.single_misc} onMiscChange={v => setEditingRoom({ ...editingRoom, single_misc: v })} />
                            ) : (
                              <RateDisplay rate={td.single_rate} misc={td.single_misc} />
                            )}
                          </td>
                          {/* Double */}
                          <td className="text-end">
                            {isEditing ? (
                              <RateInput label="Base" value={editingRoom.double_rate} onChange={v => setEditingRoom({ ...editingRoom, double_rate: v })}
                                miscLabel="Misc" miscValue={editingRoom.double_misc} onMiscChange={v => setEditingRoom({ ...editingRoom, double_misc: v })} />
                            ) : (
                              <RateDisplay rate={td.double_rate} misc={td.double_misc} />
                            )}
                          </td>
                          {/* Triple */}
                          <td className="text-end">
                            {isEditing ? (
                              <RateInput label="Base" value={editingRoom.triple_rate} onChange={v => setEditingRoom({ ...editingRoom, triple_rate: v })}
                                miscLabel="Misc" miscValue={editingRoom.triple_misc} onMiscChange={v => setEditingRoom({ ...editingRoom, triple_misc: v })} />
                            ) : (
                              <RateDisplay rate={td.triple_rate} misc={td.triple_misc} />
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
                              <HourlyDisplay rates={td.hourly_rates} />
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
                                    onChange={e => setEditingRoom({ ...editingRoom, extra_bed_charge: Number(e.target.value) || 0 })} />
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
                              td.extra_bed_charge > 0 ? (
                                <div style={{ fontSize: 10, lineHeight: 1.5 }}>
                                  <div><strong>{formatCurrency(td.extra_bed_charge)}</strong>/night</div>
                                  <div style={{ color: '#64748b' }}>Max: {td.max_extra_beds || 1}</div>
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
                            ) : `${td.max_occupancy} guests`}
                          </td>
                          {/* Actions */}
                          <td>
                            {isEditing ? (
                              <div className="d-flex gap-1">
                                <button className="btn btn-sm btn-success" onClick={() => handleSaveTypeRate(type, td.room_ids)} disabled={savingRate} title="Save to all rooms">
                                  <i className="bi bi-check-lg"></i>
                                </button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setEditingRoom(null)} disabled={savingRate} title="Cancel">
                                  <i className="bi bi-x-lg"></i>
                                </button>
                              </div>
                            ) : (
                              <button className="btn btn-sm btn-outline-primary"
                                onClick={() => setEditingRoom({
                                  _typeEdit: type,
                                  room_ids: td.room_ids,
                                  single_rate: td.single_rate || '',
                                  single_misc: td.single_misc || '',
                                  double_rate: td.double_rate || '',
                                  double_misc: td.double_misc || '',
                                  triple_rate: td.triple_rate || '',
                                  triple_misc: td.triple_misc || '',
                                  hourly_rates: td.hourly_rates || { '2': 0, '3': 0, '4': 0, default: 0 },
                                  extra_bed_charge: td.extra_bed_charge || 0,
                                  max_extra_beds: td.max_extra_beds || 1,
                                  max_occupancy: td.max_occupancy || 2,
                                })}
                                disabled={editingRoom !== null} title={`Edit all ${formatType(type)} rooms`}>
                                <i className="bi bi-pencil me-1"></i>{td.count}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Expanded individual rooms */}
                        {isExpanded && grouped[type].map(r => (
                          <tr key={r.id} style={{ background: '#f8fafc', fontSize: 11 }}>
                            <td style={{ paddingLeft: 40 }}>
                              <span className="fw-bold">{r.room_number}</span>
                              <span className="text-muted ms-1" style={{ fontSize: 10 }}>F{r.floor}</span>
                              {changingType?.roomId === r.id ? (
                                <div style={{ marginTop: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
                                  <select className="form-select form-select-sm" style={{ fontSize: 10, width: 130, padding: '2px 6px' }}
                                    value={changingType.newType}
                                    onChange={e => setChangingType({ ...changingType, newType: e.target.value })}>
                                    {typeKeys.filter(t => t !== type).map(t => (
                                      <option key={t} value={t}>{formatType(t)}</option>
                                    ))}
                                  </select>
                                  <button className="btn btn-sm btn-success" style={{ fontSize: 9, padding: '1px 6px' }}
                                    onClick={async () => {
                                      if (handleChangeRoomType) {
                                        await handleChangeRoomType(r.id, changingType.newType);
                                      }
                                      setChangingType(null);
                                    }} disabled={savingRate}>
                                    <i className="bi bi-check-lg"></i>
                                  </button>
                                  <button className="btn btn-sm btn-secondary" style={{ fontSize: 9, padding: '1px 6px' }}
                                    onClick={() => setChangingType(null)}>
                                    <i className="bi bi-x-lg"></i>
                                  </button>
                                </div>
                              ) : null}
                            </td>
                            <td className="text-end"><RateDisplay rate={r.single_rate} misc={r.single_misc} /></td>
                            <td className="text-end"><RateDisplay rate={r.double_rate} misc={r.double_misc} /></td>
                            <td className="text-end"><RateDisplay rate={r.triple_rate} misc={r.triple_misc} /></td>
                            <td><HourlyDisplay rates={r.hourly_rates} /></td>
                            <td>{r.extra_bed_charge > 0 ? formatCurrency(r.extra_bed_charge) : '—'}</td>
                            <td>{r.max_occupancy}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-warning" style={{ fontSize: 10 }}
                                title="Move to another type"
                                onClick={() => setChangingType({
                                  roomId: r.id,
                                  roomNumber: r.room_number,
                                  newType: typeKeys.find(t => t !== type) || type,
                                })}
                                disabled={editingRoom !== null || changingType !== null}>
                                <i className="bi bi-arrow-left-right"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
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

function RateInput({ label, value, onChange, miscLabel, miscValue, onMiscChange }) {
  return (
    <div className="d-flex flex-column gap-1" style={{ minWidth: 100 }}>
      <div className="input-group input-group-sm">
        <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 9 }}>{label}</span>
        <input type="number" className="form-control text-end" style={{ padding: '1px 5px', fontSize: 11 }}
          value={value || ''} onChange={e => onChange(e.target.value)} />
      </div>
      <div className="input-group input-group-sm">
        <span className="input-group-text" style={{ padding: '1px 5px', fontSize: 9 }}>{miscLabel}</span>
        <input type="number" className="form-control text-end" style={{ padding: '1px 5px', fontSize: 11 }}
          value={miscValue || ''} onChange={e => onMiscChange(e.target.value)} />
      </div>
    </div>
  );
}

function RateDisplay({ rate, misc }) {
  if (!rate) return '—';
  return (
    <div style={{ fontSize: 11, lineHeight: 1.4 }}>
      <div>{formatCurrency(rate)}</div>
      {parseFloat(misc) > 0 && <div style={{ color: '#94a3b8', fontSize: 10 }}>+{formatCurrency(misc)} misc</div>}
    </div>
  );
}

function HourlyDisplay({ rates }) {
  if (!rates || (!rates['2'] && !rates['3'] && !rates['4'])) {
    return <span className="badge bg-secondary" style={{ fontSize: 9 }}>None</span>;
  }
  return (
    <div style={{ fontSize: 10, lineHeight: 1.5 }}>
      {['2', '3', '4'].map(h => rates[h] ? <div key={h}><strong>{h}h:</strong> {formatCurrency(rates[h])}</div> : null)}
      {rates.default ? <div style={{ color: '#64748b' }}>5h+: {formatCurrency(rates.default)}/hr</div> : null}
    </div>
  );
}
