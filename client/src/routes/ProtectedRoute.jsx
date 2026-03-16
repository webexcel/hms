import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/atoms/LoadingSpinner';

export default function ProtectedRoute({ children, roles }) {
  const { authenticated, loading, user } = useAuth();

  if (loading) return <LoadingSpinner text="Authenticating..." />;
  if (!authenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/front-desk" replace />;

  return children;
}
