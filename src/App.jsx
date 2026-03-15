import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import HeaderBar from './components/HeaderBar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OperationsDashboardPage from './pages/OperationsDashboardPage.jsx';
import FleetManagementPage from './pages/FleetManagementPage.jsx';
import TripManagementPage from './pages/TripManagementPage.jsx';
import RouteOptimizationPage from './pages/RouteOptimizationPage.jsx';
import FleetAnalyticsPage from './pages/FleetAnalyticsPage.jsx';
import CostOptimizationPage from './pages/CostOptimizationPage.jsx';

function ProtectedLayout() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <HeaderBar />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<OperationsDashboardPage />} />
            <Route path="/fleet-management" element={<FleetManagementPage />} />
            <Route path="/trip-management" element={<TripManagementPage />} />
            <Route path="/route-optimization" element={<RouteOptimizationPage />} />
            <Route path="/fleet-analytics" element={<FleetAnalyticsPage />} />
            <Route path="/cost-optimization" element={<CostOptimizationPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </HashRouter>
  );
}
