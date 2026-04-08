import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`site-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-brand" onClick={() => setMenuOpen(false)}>
          <span className="nav-brand-name">Udhayam International</span>
          <span className="nav-brand-sub">Thiruchendur</span>
        </Link>

        <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
        </button>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <li><NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink></li>
          <li><NavLink to="/rooms" onClick={() => setMenuOpen(false)}>Rooms</NavLink></li>
          <li><NavLink to="/dining" onClick={() => setMenuOpen(false)}>Dining</NavLink></li>
          <li><NavLink to="/gallery" onClick={() => setMenuOpen(false)}>Gallery</NavLink></li>
          <li><NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink></li>
          <li><NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink></li>
          <li><NavLink to="/booking" className="nav-book-btn" onClick={() => setMenuOpen(false)}>Book Now</NavLink></li>
        </ul>
      </div>
    </nav>
  );
}
