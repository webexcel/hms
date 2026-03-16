import { formatCurrency, capitalize } from '../../../utils/formatters';

export default function RoomTransferModal({
  showRoomTransferModal, setShowRoomTransferModal,
  roomTransferData, setRoomTransferData,
  roomTransferLoading, availableTransferRooms,
  handleRoomTransfer,
}) {
  if (!showRoomTransferModal) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff', border: 'none' }}>
            <h5 className="modal-title">
              <i className="bi bi-arrow-left-right me-2"></i>Room Transfer
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => setShowRoomTransferModal(false)}></button>
          </div>
          <div className="modal-body p-4">
            {/* Current Room Info */}
            {roomTransferData.reservation && (
              <div className="alert alert-light border mb-4" style={{ borderRadius: 12 }}>
                <div className="row align-items-center">
                  <div className="col-auto">
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-door-open" style={{ fontSize: 22, color: '#ef4444' }}></i>
                    </div>
                  </div>
                  <div className="col">
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      Current Room: {roomTransferData.reservation.room?.room_number || 'N/A'}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>
                      {capitalize(roomTransferData.reservation.room?.room_type || '')} &middot;
                      Floor {roomTransferData.reservation.room?.floor} &middot;
                      {formatCurrency(roomTransferData.reservation.rate_per_night)}/night &middot;
                      Guest: {roomTransferData.reservation.guest ? `${roomTransferData.reservation.guest.first_name} ${roomTransferData.reservation.guest.last_name}` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: 13 }}>
                <i className="bi bi-chat-text me-1"></i> Reason for Transfer
              </label>
              <select
                className="form-select"
                value={roomTransferData.reason}
                onChange={(e) => setRoomTransferData(prev => ({ ...prev, reason: e.target.value }))}
              >
                <option value="">Select a reason...</option>
                <option value="AC/Heating not working">AC/Heating not working</option>
                <option value="Plumbing issue">Plumbing issue</option>
                <option value="Noise complaint">Noise complaint</option>
                <option value="Room upgrade request">Room upgrade request</option>
                <option value="Room downgrade request">Room downgrade request</option>
                <option value="Electrical issue">Electrical issue</option>
                <option value="Pest issue">Pest issue</option>
                <option value="Cleanliness issue">Cleanliness issue</option>
                <option value="Guest preference">Guest preference</option>
                <option value="Maintenance required">Maintenance required</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Select New Room */}
            <div className="mb-3">
              <label className="form-label fw-bold" style={{ fontSize: 13 }}>
                <i className="bi bi-door-closed me-1"></i> Transfer To
              </label>
              {availableTransferRooms.length === 0 ? (
                <div className="alert alert-warning" style={{ borderRadius: 10 }}>
                  <i className="bi bi-exclamation-triangle me-1"></i> No available rooms for transfer
                </div>
              ) : (
                <div className="row g-2" style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {availableTransferRooms.map(room => {
                    const isSelected = roomTransferData.new_room_id === room.id;
                    return (
                      <div key={room.id} className="col-md-4 col-sm-6">
                        <div
                          onClick={() => setRoomTransferData(prev => ({ ...prev, new_room_id: room.id }))}
                          style={{
                            cursor: 'pointer', padding: '12px 14px', borderRadius: 10, transition: 'all 0.2s',
                            border: `2px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                            background: isSelected ? '#eef2ff' : '#fff',
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 16, color: isSelected ? '#4f46e5' : '#1e293b' }}>
                            {room.room_number}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            {capitalize(room.room_type)} &middot; Floor {room.floor}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>
                            {formatCurrency(room.base_rate)}/night
                          </div>
                          <span className={`badge mt-1 ${room.status === 'available' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`} style={{ fontSize: 10 }}>
                            {capitalize(room.status)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Adjust Rate Toggle */}
            {roomTransferData.new_room_id && (() => {
              const newRoom = availableTransferRooms.find(r => r.id === roomTransferData.new_room_id);
              const currentRate = parseFloat(roomTransferData.reservation?.rate_per_night || 0);
              const newRate = parseFloat(newRoom?.base_rate || 0);
              const rateDiff = newRate - currentRate;
              return (
                <div className="p-3 rounded mb-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="form-check form-switch d-flex align-items-center gap-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={roomTransferData.adjust_rate}
                      onChange={(e) => setRoomTransferData(prev => ({ ...prev, adjust_rate: e.target.checked }))}
                      id="adjustRateSwitch"
                    />
                    <label className="form-check-label" htmlFor="adjustRateSwitch" style={{ fontSize: 13 }}>
                      Adjust rate to new room ({formatCurrency(newRate)}/night)
                    </label>
                  </div>
                  {rateDiff !== 0 && (
                    <div style={{ fontSize: 12, color: rateDiff > 0 ? '#dc2626' : '#059669', marginTop: 4, marginLeft: 40 }}>
                      {rateDiff > 0 ? '+' : ''}{formatCurrency(rateDiff)}/night {rateDiff > 0 ? 'increase' : 'decrease'}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <div className="modal-footer" style={{ border: 'none' }}>
            <button className="btn btn-light" onClick={() => setShowRoomTransferModal(false)} disabled={roomTransferLoading}>
              Cancel
            </button>
            <button className="btn btn-warning text-white" onClick={handleRoomTransfer} disabled={roomTransferLoading || !roomTransferData.new_room_id}>
              {roomTransferLoading ? (
                <><span className="spinner-border spinner-border-sm me-1"></span> Transferring...</>
              ) : (
                <><i className="bi bi-arrow-left-right me-1"></i> Transfer Room</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
