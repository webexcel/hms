import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { capitalize } from '../../utils/formatters';

const PAGE_TITLES = {
  '/front-desk': 'Front Desk',
  '/reservations': 'Reservations',
  '/guests': 'Guests',
  '/billing': 'Billing',
  '/restaurant': 'Restaurant',
  '/housekeeping': 'Housekeeping',
  '/staff': 'Staff Management',
  '/inventory': 'Inventory',
  '/rates': 'Rates & Pricing',
  '/reports': 'Reports',
  '/shift-handover': 'Shift Handover',
  '/settings': 'Settings',
};

export default function TopHeader() {
  const { toggle } = useSidebar();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';
  useDocumentTitle(pageTitle);

  const initials = `${user?.full_name?.split(' ')?.[0]?.[0] || ''}${user?.full_name?.split(' ')?.[1]?.[0] || ''}`.toUpperCase() || 'U';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <button className="sidebar-toggle" id="sidebarToggle" onClick={toggle}>
          <i className="bi bi-list"></i>
        </button>
        <h1 className="page-title">{pageTitle}</h1>
      </div>
      <div className="header-right">
        <button
          className="header-icon-btn"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          onClick={toggleTheme}
        >
          <i className={`bi ${theme === 'light' ? 'bi-moon' : 'bi-sun'}`}></i>
        </button>
        <button className="header-icon-btn" title="Notifications">
          <i className="bi bi-bell"></i>
        </button>
        <div className="dropdown">
          <div className="user-dropdown" data-bs-toggle="dropdown" role="button">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <p className="user-name">{user?.full_name}</p>
              <p className="user-role">{capitalize(user?.role)}</p>
            </div>
            <i className="bi bi-chevron-down ms-2 text-muted"></i>
          </div>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); navigate('/settings'); }}><i className="bi bi-gear me-2"></i>Settings</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li><a className="dropdown-item text-danger" href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}><i className="bi bi-box-arrow-left me-2"></i>Logout</a></li>
          </ul>
        </div>
      </div>
    </header>
  );
}
