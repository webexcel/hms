import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Login successful');

      // Check for pending handover before navigating
      try {
        const { data } = await api.get('/shift-handover/pending');
        if (data && data.length > 0) {
          navigate('/accept-handover');
          return;
        }
      } catch {
        // No pending handover or endpoint error — proceed normally
      }

      navigate('/front-desk');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="hotel-icon">
            <i className="bi bi-building" style={{ fontSize: '2rem', color: '#fff' }}></i>
          </div>
          <h4 className="mb-1">Udhayam International</h4>
          <p className="text-muted mb-0">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-person"></i></span>
              <input type="text" className="form-control" value={username}
                onChange={e => setUsername(e.target.value)} placeholder="Enter username" autoFocus />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock"></i></span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>
          <button className="btn btn-primary w-100" type="submit" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</> : <>
              <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
            </>}
          </button>
        </form>
        <div className="text-center mt-3">
          <small className="text-muted">&copy; {new Date().getFullYear()} Hotel Udhayam International</small>
        </div>
      </div>
    </div>
  );
}
