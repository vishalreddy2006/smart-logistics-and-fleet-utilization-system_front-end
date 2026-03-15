import React from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard': 'Operations Dashboard',
  '/fleet-management': 'Fleet Management',
  '/trip-management': 'Trip Management',
  '/route-optimization': 'Route Optimization',
  '/fleet-analytics': 'AI Fleet Analytics',
  '/cost-optimization': 'AI Cost Optimization',
};

export default function HeaderBar() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Dashboard';
  const userEmail = localStorage.getItem('userEmail') || 'Admin';
  const initial = userEmail[0].toUpperCase();

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="header-bar">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        <span className="header-date">{today}</span>
      </div>
      <div className="header-right">
        <div className="header-status">
          <span className="status-dot"></span>
          <span className="status-label">System Online</span>
        </div>
        <div className="header-user">
          <div className="user-avatar">{initial}</div>
          <span className="user-name">{userEmail}</span>
        </div>
      </div>
    </header>
  );
}
