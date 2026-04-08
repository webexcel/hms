import { Link } from 'react-router-dom';
import { hotelInfo } from '../../data/hotelInfo';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container-site">
        <div className="row g-4">
          <div className="col-lg-4 col-md-6">
            <h5 style={{ fontFamily: 'var(--font-heading)' }}>Udhayam International</h5>
            <p style={{ fontSize: '0.9rem', color: '#9ca3af', lineHeight: 1.7, marginBottom: 16 }}>
              Your comfort destination near the sacred Thiruchendur Murugan Temple. Warm Tamil hospitality at its finest.
            </p>
            <div className="social-links">
              <a href="#"><i className="bi bi-facebook"></i></a>
              <a href="#"><i className="bi bi-instagram"></i></a>
              <a href="#"><i className="bi bi-twitter-x"></i></a>
              <a href="#"><i className="bi bi-youtube"></i></a>
            </div>
          </div>

          <div className="col-lg-2 col-md-6">
            <h5>Quick Links</h5>
            <ul className="footer-links">
              <li><Link to="/rooms">Rooms & Suites</Link></li>
              <li><Link to="/dining">Dining</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/booking">Book Now</Link></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5>Hotel Info</h5>
            <ul className="footer-links">
              <li>Check-in: {hotelInfo.checkIn}</li>
              <li>Check-out: {hotelInfo.checkOut}</li>
              <li style={{ marginTop: 8 }}>Valet Parking Available</li>
              <li>Airport Shuttle Service</li>
              <li>Pet-Friendly Rooms</li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5>Contact Us</h5>
            <div className="footer-contact-item">
              <i className="bi bi-geo-alt"></i>
              <span>{hotelInfo.fullAddress}</span>
            </div>
            <div className="footer-contact-item">
              <i className="bi bi-telephone"></i>
              <span>{hotelInfo.phone}</span>
            </div>
            <div className="footer-contact-item">
              <i className="bi bi-phone"></i>
              <span>{hotelInfo.mobile}</span>
            </div>
            <div className="footer-contact-item">
              <i className="bi bi-envelope"></i>
              <span>{hotelInfo.email}</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} {hotelInfo.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
