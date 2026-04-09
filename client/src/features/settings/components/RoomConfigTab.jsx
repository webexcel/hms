import React from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { getGstPercent, gstInclusiveRate } from '../hooks/useSettings';

export default function RoomConfigTab({
  roomTypes, editingRoom, setEditingRoom, savingRate,
  setShowAddRoomModal, amenities, allRooms,
  handleSaveRate,
}) {
  const formatType = (t) => t ? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—';
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
          {(!allRooms || allRooms.length === 0) ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-door-closed" style={{ fontSize: 32, opacity: 0.4 }}></i>
              <div className="mt-2">No rooms added yet. Click "Add Room" to get started.</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th>Room No.</th>
                    <th>Floor</th>
                    <th>Type</th>
                    <th className="text-end">Single</th>
                    <th className="text-end">Double</th>
                    <th className="text-end">Triple</th>
                    <th>Hourly Rates</th>
                    <th>Extra Bed</th>
                    <th>Max</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allRooms.map(r => {
                    const isEditing = editingRoom?.id === r.id;
                    return (
                      <tr key={r.id}>
                        <td><strong>{r.room_number}</strong></td>
                        <td>{r.floor}</td>
                        <td>{formatType(r.room_type)}</td>
                        <td className="text-end">
                          {isEditing ? (
                            <input type="number" className="form-control form-control-sm text-end" style={{ width: 90 }}
                              value={editingRoom.single_rate || ''}
                              onChange={e => setEditingRoom({ ...editingRoom, single_rate: e.target.value })} />
                          ) : (r.single_rate ? formatCurrency(r.single_rate) : '—')}
                        </td>
                        <td className="text-end">
                          {isEditing ? (
                            <input type="number" className="form-control form-control-sm text-end" style={{ width: 90 }}
                              value={editingRoom.double_rate || ''}
                              onChange={e => setEditingRoom({ ...editingRoom, double_rate: e.target.value })} />
                          ) : (r.double_rate ? formatCurrency(r.double_rate) : '—')}
                        </td>
                        <td className="text-end">
                          {isEditing ? (
                            <input type="number" className="form-control form-control-sm text-end" style={{ width: 90 }}
                              value={editingRoom.triple_rate || ''}
                              onChange={e => setEditingRoom({ ...editingRoom, triple_rate: e.target.value })} />
                          ) : (r.triple_rate ? formatCurrency(r.triple_rate) : '—')}
                        </td>
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
                        <td>
                          {isEditing ? (
                            <input type="number" className="form-control form-control-sm" style={{ width: 60 }}
                              value={editingRoom.max_occupancy || ''}
                              onChange={e => setEditingRoom({ ...editingRoom, max_occupancy: e.target.value })} min="1" max="10" />
                          ) : `${r.max_occupancy} guests`}
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: r.status === 'available' ? '#dcfce7' : r.status === 'occupied' ? '#fee2e2' : '#fef3c7',
                            color: r.status === 'available' ? '#166534' : r.status === 'occupied' ? '#991b1b' : '#92400e',
                            fontSize: 10, padding: '4px 8px',
                          }}>{r.status}</span>
                        </td>
                        <td>
                          {isEditing ? (
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm btn-success" onClick={handleSaveRate} disabled={savingRate} title="Save">
                                <i className="bi bi-check-lg"></i>
                              </button>
                              <button className="btn btn-sm btn-secondary" onClick={() => setEditingRoom(null)} disabled={savingRate} title="Cancel">
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </div>
                          ) : (
                            <button className="btn btn-sm btn-outline-primary"
                              onClick={() => setEditingRoom({
                                id: r.id, room_number: r.room_number,
                                single_rate: r.single_rate || '',
                                double_rate: r.double_rate || '',
                                triple_rate: r.triple_rate || '',
                                hourly_rates: r.hourly_rates || { '2': 0, '3': 0, '4': 0, default: 0 },
                                extra_bed_charge: r.extra_bed_charge || 0,
                                max_extra_beds: r.max_extra_beds || 1,
                                max_occupancy: r.max_occupancy || 2,
                              })}
                              disabled={editingRoom !== null} title="Edit room">
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {false && (
      <div className="card mb-4">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Room Type</th>
                  <th>Capacity</th>
                  <th>Base Rate</th>
                  <th>Hourly Rate</th>
                  <th>Extra Bed</th>
                  <th>GST</th>
                  <th>Rate (incl. GST)</th>
                  <th>Total Rooms</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roomTypes.map((rt, idx) => {
                  const editRate = editingRoom?.type === rt.type ? editingRoom.base_rate : rt.base_rate;
                  const gstPct = getGstPercent(editRate);
                  const inclRate = gstInclusiveRate(editRate);
                  const editRates = editingRoom?.type === rt.type ? editingRoom.hourly_rates : (rt.hourly_rates || {});
                  return (
                  <tr key={idx}>
                    <td><strong>{rt.name}</strong></td>
                    <td>{rt.capacity}</td>
                    <td>
                      {editingRoom && editingRoom.type === rt.type ? (
                        <div className="d-flex align-items-center gap-2">
                          <div className="input-group input-group-sm" style={{ width: '150px' }}>
                            <span className="input-group-text">Rs</span>
                            <input
                              type="number"
                              className="form-control"
                              value={editingRoom.base_rate}
                              onChange={(e) => setEditingRoom({ ...editingRoom, base_rate: Number(e.target.value) })}
                              min="0"
                              step="0.01"
                              autoFocus
                            />
                          </div>
                        </div>
                      ) : (
                        <>{formatCurrency(rt.base_rate)}/night</>
                      )}
                    </td>
                    <td>
                      {editingRoom && editingRoom.type === rt.type ? (
                        <div>
                          <div className="form-check form-switch mb-2">
                            <input className="form-check-input" type="checkbox" id={`hourly-toggle-${rt.type}`}
                              checked={editingRoom.hourly_enabled !== false}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingRoom({ ...editingRoom, hourly_enabled: true, hourly_rates: editingRoom.hourly_rates || { '2': 0, '3': 0, '4': 0, default: 0 } });
                                } else {
                                  setEditingRoom({ ...editingRoom, hourly_enabled: false, hourly_rates: null });
                                }
                              }}
                            />
                            <label className="form-check-label" htmlFor={`hourly-toggle-${rt.type}`} style={{ fontSize: 11, fontWeight: 700, color: editingRoom.hourly_enabled !== false ? '#92400e' : '#94a3b8' }}>
                              {editingRoom.hourly_enabled !== false ? 'Enabled' : 'Disabled'}
                            </label>
                          </div>
                          {editingRoom.hourly_enabled !== false && (
                            <>
                              {['2', '3', '4'].map(h => (
                                <div key={h} className="d-flex align-items-center gap-1 mb-1">
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', minWidth: 24 }}>{h}h</span>
                                  <div className="input-group input-group-sm" style={{ width: '120px' }}>
                                    <span className="input-group-text" style={{ padding: '2px 6px', fontSize: 11 }}>₹</span>
                                    <input type="number" className="form-control"
                                      value={editingRoom.hourly_rates?.[h] || ''}
                                      onChange={(e) => setEditingRoom({ ...editingRoom, hourly_rates: { ...editingRoom.hourly_rates, [h]: Number(e.target.value) || 0 } })}
                                      min="0" step="1" placeholder="0" style={{ padding: '2px 6px', fontSize: 12 }} />
                                  </div>
                                </div>
                              ))}
                              <div className="d-flex align-items-center gap-1 mt-1">
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', minWidth: 24 }}>5h+</span>
                                <div className="input-group input-group-sm" style={{ width: '120px' }}>
                                  <span className="input-group-text" style={{ padding: '2px 6px', fontSize: 11 }}>₹</span>
                                  <input type="number" className="form-control"
                                    value={editingRoom.hourly_rates?.default || ''}
                                    onChange={(e) => setEditingRoom({ ...editingRoom, hourly_rates: { ...editingRoom.hourly_rates, default: Number(e.target.value) || 0 } })}
                                    min="0" step="1" placeholder="per extra hr" style={{ padding: '2px 6px', fontSize: 12 }} />
                                </div>
                                <span style={{ fontSize: 9, color: '#94a3b8' }}>/hr</span>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        editRates && (editRates['2'] || editRates['3'] || editRates['4'])
                          ? <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                              <span className="badge bg-success mb-1" style={{ fontSize: 9 }}>Enabled</span>
                              {['2', '3', '4'].map(h => editRates[h] ? (
                                <div key={h}><span style={{ color: '#92400e', fontWeight: 700 }}>{h}h:</span> <span style={{ fontWeight: 600 }}>{formatCurrency(editRates[h])}</span></div>
                              ) : null)}
                              {editRates.default ? <div style={{ color: '#64748b' }}>5h+: {formatCurrency(editRates.default)}/hr</div> : null}
                            </div>
                          : <span className="badge bg-secondary" style={{ fontSize: 10 }}>Disabled</span>
                      )}
                    </td>
                    <td>
                      {editingRoom && editingRoom.type === rt.type ? (
                        <div>
                          <div className="form-check form-switch mb-2">
                            <input className="form-check-input" type="checkbox" id={`extrabed-toggle-${rt.type}`}
                              checked={editingRoom.extra_bed_enabled !== false}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingRoom({ ...editingRoom, extra_bed_enabled: true, extra_bed_charge: editingRoom.extra_bed_charge || 0, max_extra_beds: editingRoom.max_extra_beds || 1 });
                                } else {
                                  setEditingRoom({ ...editingRoom, extra_bed_enabled: false, extra_bed_charge: 0, max_extra_beds: 0 });
                                }
                              }}
                            />
                            <label className="form-check-label" htmlFor={`extrabed-toggle-${rt.type}`} style={{ fontSize: 11, fontWeight: 700, color: editingRoom.extra_bed_enabled !== false ? '#92400e' : '#94a3b8' }}>
                              {editingRoom.extra_bed_enabled !== false ? 'Enabled' : 'Disabled'}
                            </label>
                          </div>
                          {editingRoom.extra_bed_enabled !== false && (
                            <>
                              <div className="input-group input-group-sm mb-1" style={{ width: '120px' }}>
                                <span className="input-group-text" style={{ padding: '2px 6px', fontSize: 11 }}>₹</span>
                                <input type="number" className="form-control" value={editingRoom.extra_bed_charge || ''}
                                  onChange={(e) => setEditingRoom({ ...editingRoom, extra_bed_charge: Number(e.target.value) || 0 })}
                                  min="0" step="1" placeholder="charge/night" style={{ padding: '2px 6px', fontSize: 12 }} />
                              </div>
                              <div className="input-group input-group-sm" style={{ width: '120px' }}>
                                <span className="input-group-text" style={{ padding: '2px 6px', fontSize: 10 }}>Max</span>
                                <input type="number" className="form-control" value={editingRoom.max_extra_beds || 1}
                                  onChange={(e) => setEditingRoom({ ...editingRoom, max_extra_beds: Number(e.target.value) || 1 })}
                                  min="1" max="3" style={{ padding: '2px 6px', fontSize: 12 }} />
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        rt.extra_bed_charge > 0
                          ? <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                              <span className="badge bg-success mb-1" style={{ fontSize: 9 }}>Enabled</span>
                              <div><span style={{ color: '#92400e', fontWeight: 700 }}>{formatCurrency(rt.extra_bed_charge)}</span>/night</div>
                              <div style={{ color: '#64748b' }}>Max: {rt.max_extra_beds || 1}</div>
                            </div>
                          : <span className="badge bg-secondary" style={{ fontSize: 10 }}>Disabled</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${gstPct === 18 ? 'bg-warning text-dark' : 'bg-info text-white'}`}>
                        {gstPct}%
                      </span>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        CGST {gstPct / 2}% + SGST {gstPct / 2}%
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#059669' }}>{formatCurrency(inclRate)}</strong>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>/night</span>
                    </td>
                    <td>{rt.total}</td>
                    <td><span className="badge bg-success">{rt.status}</span></td>
                    <td>
                      {editingRoom && editingRoom.type === rt.type ? (
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-success" onClick={handleSaveRate} disabled={savingRate}>
                            <i className={`bi ${savingRate ? 'bi-hourglass-split' : 'bi-check-lg'}`}></i>
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => setEditingRoom(null)} disabled={savingRate}>
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setEditingRoom({ type: rt.type, base_rate: rt.base_rate, hourly_rate: rt.hourly_rate || 0, hourly_enabled: !!(rt.hourly_rates && (rt.hourly_rates['2'] || rt.hourly_rates['3'] || rt.hourly_rates['4'])), hourly_rates: rt.hourly_rates || null, extra_bed_enabled: rt.extra_bed_charge > 0, extra_bed_charge: rt.extra_bed_charge || 0, max_extra_beds: rt.max_extra_beds || 1 })}
                          disabled={editingRoom !== null}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-footer" style={{ background: '#fffbeb', borderTop: '1px solid #fde68a', padding: '12px 16px' }}>
          <div className="d-flex align-items-start gap-2" style={{ fontSize: 12, color: '#92400e' }}>
            <i className="bi bi-info-circle-fill mt-1" style={{ flexShrink: 0 }}></i>
            <div>
              <strong>GST Slab Rules (SAC 9963):</strong>
              <ul className="mb-0 mt-1" style={{ paddingLeft: 16 }}>
                <li>Room tariff <strong>below ₹7,500/night</strong> — GST at <strong>12%</strong> (CGST 6% + SGST 6%)</li>
                <li>Room tariff <strong>₹7,500 and above/night</strong> — GST at <strong>18%</strong> (CGST 9% + SGST 9%)</li>
              </ul>
              <div className="mt-1" style={{ color: '#78716c' }}>Base rate is stored internally. Guests always see the GST-inclusive rate.</div>
            </div>
          </div>
        </div>
      </div>
      )}

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
