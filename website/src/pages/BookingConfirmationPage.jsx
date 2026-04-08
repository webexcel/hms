import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { lookupBooking } from '../services/api';

export default function BookingConfirmationPage() {
  const { ref } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    // Try to look up the booking (best effort — the API requires email/phone)
    // For the confirmation flow, we show the ref directly since we just created it
  }, [ref]);

  return (
    <div className="confirmation-page">
      <div className="container-site">
        <div className="confirmation-card">
          <div className="confirmation-icon">
            <i className="bi bi-check-lg"></i>
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 8 }}>Booking Submitted!</h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: 24 }}>
            Your reservation request has been received. Our team will confirm your booking shortly.
          </p>

          <div className="booking-ref">{ref}</div>

          <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', marginTop: 16, marginBottom: 8 }}>
            Please save your booking reference for future correspondence.
          </p>

          <div style={{
            background: 'var(--color-bg-soft)', borderRadius: 'var(--radius-md)',
            padding: 24, textAlign: 'left', marginTop: 24,
          }}>
            <h6 style={{ marginBottom: 16, fontFamily: 'var(--font-heading)' }}>What happens next?</h6>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 2 }}>
              <div><i className="bi bi-1-circle-fill text-primary me-2"></i> Our team will review your booking request</div>
              <div><i className="bi bi-2-circle-fill text-primary me-2"></i> You'll receive a confirmation via email/phone</div>
              <div><i className="bi bi-3-circle-fill text-primary me-2"></i> Payment can be made at the hotel during check-in</div>
            </div>
          </div>

          <div style={{
            background: '#fffbeb', borderRadius: 'var(--radius-sm)', padding: '14px 20px',
            marginTop: 20, fontSize: '0.85rem', color: '#92400e', textAlign: 'left',
          }}>
            <i className="bi bi-telephone me-2"></i>
            For any queries, call us at <strong>04639-242566</strong> / <strong>+91 9554404292</strong> or email <strong>udhayam.intl@gmail.com</strong>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32 }}>
            <Link to="/" className="btn-outline-custom">Back to Home</Link>
            <Link to="/rooms" className="btn-primary-custom">Browse Rooms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
