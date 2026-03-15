import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', icon: '📊', label: 'Operations Dashboard' },
  { path: '/fleet-management', icon: '🚛', label: 'Fleet Management' },
  { path: '/trip-management', icon: '🗺️', label: 'Trip Management' },
  { path: '/route-optimization', icon: '📍', label: 'Route Optimization' },
  { path: '/fleet-analytics', icon: '📈', label: 'AI Fleet Analytics' },
  { path: '/cost-optimization', icon: '💰', label: 'AI Cost Optimization' },
];

export default function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🚛</span>
        <div>
          <div className="sidebar-logo-title">Smart Logistics</div>
          <div className="sidebar-logo-sub">Fleet Management System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? ' active' : ''}`
            }
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
