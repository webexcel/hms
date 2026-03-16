import { Modal } from 'react-bootstrap';
import { capitalize, formatCurrency, formatDate } from '../../../utils/formatters';

export default function RoomDetailsModal({ showRoomModal, setShowRoomModal, selectedRoom, roomReservation, rmGuest, rmBalance, setCheckOutData, resetCheckOutForm, setShowCheckOutModal }) {
  return (
    <Modal show={showRoomModal} onHide={() => setShowRoomModal(false)} centered>
      <div className="modal-content" style={{ borderRadius: 16, border: 'none' }}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', borderRadius: '16px 16px 0 0' }}>
          <h5 className="modal-title"><i className="bi bi-door-open me-2"></i>Room {selectedRoom?.room_number}</h5>
          <button type="button" className="btn-close btn-close-white" onClick={() => setShowRoomModal(false)}></button>
        </div>
        {selectedRoom && (
          <div className="modal-body" style={{ padding: 24 }}>
            <div className="row g-3">
              <div className="col-6">
                <div style={{ background: selectedRoom.status === 'occupied' ? '#fce4ec' : selectedRoom.status === 'available' ? '#e8f5e9' : '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                  <small style={{ color: selectedRoom.status === 'occupied' ? '#c2185b' : selectedRoom.status === 'available' ? '#2e7d32' : '#64748b', display: 'block' }}>Status</small>
                  <strong style={{ color: selectedRoom.status === 'occupied' ? '#c2185b' : selectedRoom.status === 'available' ? '#2e7d32' : '#1a1a2e' }}>{capitalize(selectedRoom.status)}</strong>
                </div>
              </div>
              <div className="col-6">
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                  <small style={{ color: '#64748b', display: 'block' }}>Room Type</small>
                  <strong style={{ color: '#1a1a2e' }}>{capitalize(selectedRoom.room_type)}</strong>
                </div>
              </div>

              {/* Show guest info for occupied rooms */}
              {selectedRoom.status === 'occupied' && roomReservation && (
                <>
                  <div className="col-12">
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                      <small style={{ color: '#64748b', display: 'block' }}>Guest</small>
                      <strong style={{ color: '#1a1a2e' }}>{rmGuest.first_name} {rmGuest.last_name}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                      <small style={{ color: '#64748b', display: 'block' }}>Check-in</small>
                      <strong style={{ color: '#1a1a2e' }}>{formatDate(roomReservation.check_in_date)}</strong>
                    </div>
                  </div>
                  <div className="col-6">
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10 }}>
                      <small style={{ color: '#64748b', display: 'block' }}>Check-out</small>
                      <strong style={{ color: '#1a1a2e' }}>{formatDate(roomReservation.check_out_date)}</strong>
                    </div>
                  </div>
                  <div className="col-12">
                    <div style={{ background: '#fff7ed', padding: '12px 16px', borderRadius: 10, border: '1px solid #fed7aa' }}>
                      <small style={{ color: '#9a3412', display: 'block' }}>Balance Due</small>
                      <strong style={{ color: '#9a3412', fontSize: 18 }}>{formatCurrency(rmBalance)}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        <div className="modal-footer" style={{ border: 'none', padding: '16px 24px' }}>
          <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 10 }} onClick={() => setShowRoomModal(false)}>Close</button>
          {selectedRoom?.status === 'occupied' && roomReservation && (
            <button className="btn" style={{ background: '#f97316', color: '#fff', borderRadius: 10, padding: '10px 24px' }}
              onClick={() => { setShowRoomModal(false); setCheckOutData(roomReservation); resetCheckOutForm(); setShowCheckOutModal(true); }}>
              <i className="bi bi-box-arrow-right me-1"></i> Check Out
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
