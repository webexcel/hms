import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <h1 style={{ fontSize: '6rem', fontWeight: 700, color: 'var(--color-border)', lineHeight: 1 }}>404</h1>
        <h2 style={{ marginBottom: 12 }}>Page Not Found</h2>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 24 }}>The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary-custom">Back to Home</Link>
      </div>
    </div>
  );
}
