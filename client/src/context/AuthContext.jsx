import { createContext, useContext, useReducer, useEffect } from 'react';
import api, { setAccessToken } from '../services/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  loading: true,
  authenticated: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return { user: action.payload, loading: false, authenticated: true };
    case 'LOGOUT':
      return { user: null, loading: false, authenticated: false };
    case 'LOADED':
      return { ...state, loading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data } = await api.post('/auth/refresh');
      setAccessToken(data.accessToken);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
    } catch {
      dispatch({ type: 'LOADED' });
    }
  }

  async function login(username, password, tenant) {
    try {
      const { data } = await api.post('/auth/login', { username, password, tenant });
      setAccessToken(data.accessToken);
      if (tenant) localStorage.setItem('tenantSlug', tenant);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
      return data;
    } catch (error) {
      dispatch({ type: 'LOADED' });
      throw error;
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    setAccessToken(null);
    localStorage.removeItem('tenantSlug');
    dispatch({ type: 'LOGOUT' });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
