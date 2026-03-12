import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <div className="text-center p-5">
        <h1 className="display-1 fw-bold text-muted">404</h1>
        <h4 className="mb-3">Page Not Found</h4>
        <p className="text-muted mb-4">The page you are looking for does not exist or has been moved.</p>
        <button className="btn btn-primary" onClick={() => navigate('/front-desk')}>
          <i className="bi bi-house me-2"></i>Go to Front Desk
        </button>
      </div>
    </div>
  );
}
