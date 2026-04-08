import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roomTypeData, roomTypeOrder } from '../data/roomTypes';
import { getRoomTypes } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

export default function RoomsPage() {
  const [roomRates, setRoomRates] = useState({});

  useEffect(() => {
    getRoomTypes().then(res => {
      const rates = {};
      res.data.forEach(r => { rates[r.type] = r; });
      setRoomRates(rates);
    }).catch(() => {});
  }, []);

  return (
    <>
      <section className="page-hero">
        <h1>Rooms & Suites</h1>
        <p>Find the perfect room for your stay</p>
      </section>

      <section className="section-padding">
        <div className="container-site">
          <div className="row g-4">
            {roomTypeOrder.map(type => {
              const room = roomTypeData[type];
              const apiData = roomRates[type];
              const rate = apiData?.min_rate || 0;
              const totalRooms = apiData?.total_rooms || 0;

              return (
                <div key={type} className="col-lg-6">
                  <div className="room-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={room.photos[0]} alt={room.name} className="room-card-img" style={{ height: 280 }} />
                      <div style={{
                        position: 'absolute', top: 16, right: 16,
                        background: 'rgba(255,255,255,0.95)', borderRadius: 8,
                        padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600,
                      }}>
                        {totalRooms} rooms
                      </div>
                    </div>
                    <div className="room-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 className="room-card-type">{room.name}</h3>
                      <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 16, flex: 1 }}>
                        {room.description}
                      </p>
                      <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                        <span><i className="bi bi-rulers me-1"></i> {room.size}</span>
                        <span><i className="bi bi-people me-1"></i> Up to {room.maxOccupancy} guests</span>
                        <span><i className="bi bi-door-open me-1"></i> {room.bedType}</span>
                      </div>
                      <div className="room-card-amenities">
                        {room.highlights.map(a => <span key={a}>{a}</span>)}
                      </div>
                      <div className="room-card-footer">
                        <div className="room-card-price">
                          {formatCurrency(rate)} <span>/ night</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link to={`/rooms/${type}`} className="btn-outline-custom" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                            Details
                          </Link>
                          <Link to={`/booking?room_type=${type}`} className="btn-primary-custom" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                            Book Now
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
