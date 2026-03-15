import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import {
  getAllVehicles,
  addVehicle,
  deleteVehicle,
  getMaintenanceAlerts,
} from '../api/api';

const VEHICLE_TYPES = ['Truck', 'Van', 'Motorcycle', 'Car', 'Bus', 'Trailer'];
const STATUSES = ['ACTIVE', 'IDLE', 'MAINTENANCE', 'INACTIVE'];
const INIT_FORM = { vehicleType: 'Truck', capacity: '', mileage: '', age: '', status: 'ACTIVE' };

export default function FleetManagementPage() {
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState(INIT_FORM);
  const [loading, setLoading] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadVehicles = useCallback(async () => {
    const vRes = await getAllVehicles();
    setVehicles(vRes.data);
    return vRes.data;
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [_, aRes] = await Promise.all([loadVehicles(), getMaintenanceAlerts()]);
      setAlerts(aRes.data);
    } catch (err) {
      showToast('Failed to load fleet data.', 'error');
    } finally {
      setPageLoading(false);
    }
  }, [loadVehicles]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addVehicle({
        vehicleType: form.vehicleType,
        capacity: Number(form.capacity),
        mileage: Number(form.mileage),
        age: Number(form.age),
        status: form.status,
      });
      setForm(INIT_FORM);
      await loadData();
      showToast('Vehicle added successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add vehicle.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete vehicle #${id}? This action cannot be undone.`)) return;
    try {
      await deleteVehicle(id);
      await loadData();
      showToast('Vehicle deleted.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete vehicle.', 'error');
    }
  };

  const handleMaintenanceCheck = async () => {
    setMaintenanceLoading(true);
    try {
      await api.post('/maintenance/predict');
      const refreshedVehicles = await loadVehicles();
      showToast(`AI maintenance scan complete. ${refreshedVehicles.length} vehicles updated.`);
    } catch (err) {
      showToast('Maintenance check failed.', 'error');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  if (pageLoading) return <div className="loading-state">⏳ Loading fleet…</div>;

  const activeCount = vehicles.filter((v) => v.status === 'ACTIVE').length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'MAINTENANCE').length;
  const highRiskCount = vehicles.filter((v) => v.maintenanceRisk === 'HIGH').length;

  return (
    <div className="page-container">
      {toast && <div className={`toast-message ${toast.type}`}>{toast.text}</div>}

      {/* ─── Fleet Summary Metrics ─────────────────────── */}
      <div className="metric-grid metric-grid-4">
        <div className="metric-card metric-blue">
          <div className="metric-card-top">
            <span className="metric-label">Total Vehicles</span>
            <span className="metric-icon">🚛</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{vehicles.length}</span>
          </div>
        </div>
        <div className="metric-card metric-green">
          <div className="metric-card-top">
            <span className="metric-label">Active</span>
            <span className="metric-icon">✅</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{activeCount}</span>
          </div>
        </div>
        <div className="metric-card metric-orange">
          <div className="metric-card-top">
            <span className="metric-label">In Maintenance</span>
            <span className="metric-icon">🔧</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{maintenanceCount}</span>
          </div>
        </div>
        <div className="metric-card metric-red">
          <div className="metric-card-top">
            <span className="metric-label">High Risk</span>
            <span className="metric-icon">⚠️</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{highRiskCount}</span>
          </div>
        </div>
      </div>

      {/* ─── Add Vehicle Form ──────────────────────────── */}
      <section className="section-card">
        <div className="section-header">
          <h2 className="section-title">➕ Add New Vehicle</h2>
          <button
            className="btn btn-warning"
            onClick={handleMaintenanceCheck}
            disabled={maintenanceLoading}
          >
            {maintenanceLoading ? '⏳ Scanning…' : '🔧 Predictive AI Maintenance Check'}
          </button>
        </div>
        <form className="form-row" onSubmit={handleAdd}>
          <div className="form-group">
            <label>Vehicle Type</label>
            <select
              value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              required
            >
              {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Capacity (Tonnes)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 10"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Mileage (km)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 45000"
              value={form.mileage}
              onChange={(e) => setForm({ ...form, mileage: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Age (Years)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 3"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group form-submit">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding…' : '+ Add Vehicle'}
            </button>
          </div>
        </form>
      </section>

      {/* ─── Vehicle Table ─────────────────────────────── */}
      <section className="section-card">
        <div className="section-header">
          <h2 className="section-title">🚛 Fleet Registry ({vehicles.length} vehicles)</h2>
          {alerts.length > 0 && (
            <span className="badge badge-danger">⚠️ {alerts.length} High Risk</span>
          )}
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Mileage (km)</th>
                <th>Age (yrs)</th>
                <th>Maintenance Risk</th>
                <th>Failure Score</th>
                <th>Days Left For Service</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.vehicleId}>
                  <td><span className="id-badge">#{v.vehicleId}</span></td>
                  <td><strong>{v.vehicleType}</strong></td>
                  <td>{v.mileage?.toLocaleString() ?? '—'}</td>
                  <td>{v.age ?? '—'}</td>
                  <td>
                    <span className={`badge ${v.maintenanceRisk === 'HIGH' ? 'badge-danger' : v.maintenanceRisk === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                      {v.maintenanceRisk || 'N/A'}
                    </span>
                  </td>
                  <td>{v.failureScore != null ? Number(v.failureScore).toFixed(1) : '—'}</td>
                  <td>{v.daysLeftForService ?? '—'}</td>
                  <td className="action-cell">
                    <button
                      className="btn btn-sm btn-danger-outline"
                      onClick={() => handleDelete(v.vehicleId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
