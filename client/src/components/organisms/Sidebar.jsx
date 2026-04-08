import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { NAV_SECTIONS } from '../../utils/constants';
import { useEffect } from 'react';

export default function Sidebar() {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => { closeMobile(); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay backdrop for mobile */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobile} />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'show' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <i className="bi bi-building"></i>
          </div>
          {!collapsed && (
            <div className="logo-text">
              <h5>Udhayam</h5>
              <small>International</small>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => {
            const visibleItems = section.items.filter(item => item.roles.includes(user?.role));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title}>
                {!collapsed && (
                  <div className="nav-section">
                    <div className="nav-section-title">{section.title}</div>
                  </div>
                )}
                {visibleItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    title={item.label}
                  >
                    <i className={`bi ${item.icon}`}></i>
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            );
          })}
          <a className="nav-link" onClick={handleLogout} style={{ cursor: 'pointer' }}>
            <i className="bi bi-box-arrow-left"></i>
            {!collapsed && <span>Logout</span>}
          </a>
        </nav>
      </aside>
    </>
  );
}
