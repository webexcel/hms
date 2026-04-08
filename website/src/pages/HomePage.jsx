import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { heroImage, hotelPhotos } from '../data/photos';
import { roomTypeData, roomTypeOrder } from '../data/roomTypes';
import { amenities } from '../data/amenities';
import { testimonials } from '../data/testimonials';
import { hotelInfo } from '../data/hotelInfo';
import { getRoomTypes } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import dayjs from 'dayjs';

export default function HomePage() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [checkOut, setCheckOut] = useState(dayjs().add(2, 'day').format('YYYY-MM-DD'));
  const [roomType, setRoomType] = useState('');
  const [roomRates, setRoomRates] = useState({});

  useEffect(() => {
    getRoomTypes().then(res => {
      const rates = {};
      res.data.forEach(r => { rates[r.type] = r.min_rate; });
      setRoomRates(rates);
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ check_in: checkIn, check_out: checkOut });
    if (roomType) params.set('room_type', roomType);
    navigate(`/booking?${params}`);
  };

  return (
    <>
      {/* Hero */}
      <section className="home-hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="home-hero-content">
          <div className="hero-label">Welcome to</div>
          <h1>Udhayam International</h1>
          <p>{hotelInfo.tagline}. Experience warm hospitality in the sacred temple town of Thiruchendur.</p>
          <form className="booking-widget" onSubmit={handleSearch}>
            <div className="bw-field">
              <label>Check In</label>
              <input type="date" value={checkIn} min={dayjs().format('YYYY-MM-DD')}
                onChange={e => setCheckIn(e.target.value)} required />
            </div>
            <div className="bw-field">
              <label>Check Out</label>
              <input type="date" value={checkOut} min={checkIn || dayjs().format('YYYY-MM-DD')}
                onChange={e => setCheckOut(e.target.value)} required />
            </div>
            <div className="bw-field">
              <label>Room Type</label>
              <select value={roomType} onChange={e => setRoomType(e.target.value)}>
                <option value="">All Types</option>
                {roomTypeOrder.map(t => (
                  <option key={t} value={t}>{roomTypeData[t].name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bw-btn">Check Availability</button>
          </form>
        </div>
      </section>

      {/* About Preview */}
      <section className="section-padding">
        <div className="container-site">
          <div className="about-preview">
            <img src={hotelPhotos.lobby[0]} alt="Hotel Lobby" />
            <div>
              <div className="section-title" style={{ textAlign: 'left', marginBottom: 24 }}>
                <span className="label">About Us</span>
                <h2>A Legacy of Hospitality</h2>
              </div>
              <p style={{ color: 'var(--color-text-light)', lineHeight: 1.8, marginBottom: 20 }}>
                {hotelInfo.description}
              </p>
              <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
                <div><strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>{hotelInfo.totalRooms}</strong><br /><small style={{ color: 'var(--color-text-light)' }}>Luxury Rooms</small></div>
                <div><strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>{new Date().getFullYear() - hotelInfo.yearEstablished}+</strong><br /><small style={{ color: 'var(--color-text-light)' }}>Years of Service</small></div>
                <div><strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>4.8</strong><br /><small style={{ color: 'var(--color-text-light)' }}>Guest Rating</small></div>
              </div>
              <Link to="/about" className="btn-outline-custom">Learn More</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Room Types */}
      <section className="section-padding bg-soft">
        <div className="container-site">
          <div className="section-title">
            <span className="label">Accommodations</span>
            <h2>Our Rooms & Suites</h2>
            <p>Choose from our carefully designed rooms, each offering a unique experience</p>
          </div>
          <div className="row g-4">
            {roomTypeOrder.map(type => {
              const room = roomTypeData[type];
              const rate = roomRates[type] || room.startingRate || 0;
              return (
                <div key={type} className="col-lg-3 col-md-6">
                  <div className="room-card">
                    <img src={room.photos[0]} alt={room.name} className="room-card-img" />
                    <div className="room-card-body">
                      <h3 className="room-card-type">{room.name}</h3>
                      <p className="room-card-desc">{room.tagline}</p>
                      <div className="room-card-amenities">
                        {room.highlights.slice(0, 3).map(a => <span key={a}>{a}</span>)}
                      </div>
                      <div className="room-card-footer">
                        <div className="room-card-price">
                          {formatCurrency(rate)} <span>/ night</span>
                        </div>
                        <Link to={`/rooms/${type}`} className="btn-primary-custom" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                          View <i className="bi bi-arrow-right"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="section-padding">
        <div className="container-site">
          <div className="section-title">
            <span className="label">Facilities</span>
            <h2>Hotel Amenities</h2>
            <p>Everything you need for a comfortable and memorable stay</p>
          </div>
          <div className="row g-3">
            {amenities.map(a => (
              <div key={a.label} className="col-lg-2 col-md-3 col-4">
                <div className="amenity-item">
                  <div className="amenity-icon"><i className={`bi ${a.icon}`}></i></div>
                  <span className="amenity-label">{a.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-warm">
        <div className="container-site">
          <div className="section-title">
            <span className="label">Guest Reviews</span>
            <h2>What Our Guests Say</h2>
          </div>
          <div className="row g-4">
            {testimonials.map((t, i) => (
              <div key={i} className="col-lg-3 col-md-6">
                <div className="testimonial-card">
                  <div className="stars">
                    {Array.from({ length: t.rating }, (_, j) => <i key={j} className="bi bi-star-fill"></i>)}
                  </div>
                  <p className="quote">"{t.quote}"</p>
                  <div className="author">
                    <div className="author-avatar">{t.initials}</div>
                    <div>
                      <div className="author-name">{t.name}</div>
                      <div className="author-location">{t.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-site">
          <div className="cta-banner">
            <h2>Ready for an Unforgettable Stay?</h2>
            <p>Book directly with us for the best rates and exclusive benefits</p>
            <Link to="/booking" className="btn-gold" style={{ fontSize: '1rem', padding: '14px 36px' }}>
              Book Your Stay <i className="bi bi-arrow-right ms-2"></i>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
