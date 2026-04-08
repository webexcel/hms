import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { roomTypeData } from '../data/roomTypes';
import { getRoomTypeDetail } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import dayjs from 'dayjs';

export default function RoomDetailPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const room = roomTypeData[type];
  const [apiData, setApiData] = useState(null);
  const [checkIn, setCheckIn] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [checkOut, setCheckOut] = useState(dayjs().add(2, 'day').format('YYYY-MM-DD'));

  useEffect(() => {
    getRoomTypeDetail(type).then(res => setApiData(res.data)).catch(() => {});
  }, [type]);

  if (!room) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Room type not found</h2>
          <Link to="/rooms" className="btn-primary-custom mt-3">View All Rooms</Link>
        </div>
      </div>
    );
  }

  const rate = apiData?.min_rate || 0;

  const handleBooking = (e) => {
    e.preventDefault();
    navigate(`/booking?room_type=${type}&check_in=${checkIn}&check_out=${checkOut}`);
  };

  return (
    <>
      {/* Gallery */}
      <section style={{ paddingTop: 'var(--nav-height)' }}>
        <div className="container-site" style={{ paddingTop: 24 }}>
          <div className="room-detail-gallery">
            {room.photos.map((p, i) => (
              <img key={i} src={p} alt={`${room.name} ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding-sm">
        <div className="container-site">
          <div className="row g-4">
            <div className="col-lg-8">
              <span className="label" style={{
                fontSize: '0.75rem', letterSpacing: 2, textTransform: 'uppercase',
                color: 'var(--color-gold)', fontWeight: 600, display: 'block', marginBottom: 8,
              }}>
                {room.tagline}
              </span>
              <h1 style={{ fontFamily: 'var(--font-heading)', marginBottom: 24 }}>{room.name}</h1>

              <div style={{ display: 'flex', gap: 32, marginBottom: 28, fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                <span><i className="bi bi-rulers me-2"></i>{room.size}</span>
                <span><i className="bi bi-people me-2"></i>Up to {room.maxOccupancy} guests</span>
                <span><i className="bi bi-door-open me-2"></i>{room.bedType}</span>
                {apiData && <span><i className="bi bi-building me-2"></i>{apiData.total_rooms} rooms</span>}
              </div>

              <p style={{ color: 'var(--color-text)', lineHeight: 1.8, marginBottom: 32, fontSize: '1.05rem' }}>
                {room.description}
              </p>

              <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16 }}>Room Highlights</h4>
              <div className="row g-3 mb-4">
                {room.highlights.map(h => (
                  <div key={h} className="col-md-6">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="bi bi-check-circle-fill" style={{ color: 'var(--color-success)' }}></i>
                      <span>{h}</span>
                    </div>
                  </div>
                ))}
              </div>

              {apiData?.amenities?.length > 0 && (
                <>
                  <h4 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16, marginTop: 32 }}>Amenities</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {apiData.amenities.map(a => (
                      <span key={a} style={{
                        background: 'var(--color-bg-soft)', padding: '6px 14px', borderRadius: 20,
                        fontSize: '0.85rem', color: 'var(--color-text)',
                      }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Booking Sidebar */}
            <div className="col-lg-4">
              <div className="booking-summary">
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-dark)' }}>
                    {formatCurrency(rate)}
                  </div>
                  <div style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>per night</div>
                </div>

                <form onSubmit={handleBooking}>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Check In</label>
                    <input type="date" className="form-control" value={checkIn}
                      min={dayjs().format('YYYY-MM-DD')}
                      onChange={e => setCheckIn(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Check Out</label>
                    <input type="date" className="form-control" value={checkOut}
                      min={checkIn}
                      onChange={e => setCheckOut(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary-custom w-100 justify-content-center" style={{ padding: '12px' }}>
                    Check Availability <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </form>

                <div style={{ marginTop: 20, padding: '16px', background: 'var(--color-bg-soft)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                  <div style={{ marginBottom: 6 }}><i className="bi bi-clock me-2"></i>Check-in: 12:00 PM</div>
                  <div><i className="bi bi-clock me-2"></i>Check-out: 12:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
