import React, { useState, useEffect, useCallback } from 'react';
import TripTable from '../components/TripTable.jsx';
import { getAllVehicles, getAllTrips, createTrip } from '../api/api';

const INIT_FORM = {
  source: '',
  destination: '',
  distance: '',
  loadWeight: '',
  vehicleId: '',
};

export default function TripManagementPage() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(INIT_FORM);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [tRes, vRes] = await Promise.all([getAllTrips(), getAllVehicles()]);
      setTrips(tRes.data);
      setVehicles(vRes.data);
    } catch (err) {
      showToast('Failed to load trips.', 'error');
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        source: form.source,
        destination: form.destination,
        distance: Number(form.distance),
        loadWeight: Number(form.loadWeight),
        vehicle: selectedVehicleId ? { vehicleId: Number(selectedVehicleId) } : null,
      };
      await createTrip(payload);
      setForm(INIT_FORM);
      setSelectedVehicleId('');
      await loadData();
      showToast('Trip created successfully! Fuel & CO₂ predictions calculated.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create trip.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="loading-state">⏳ Loading trips…</div>;

  const totalDistance = trips.reduce((sum, t) => sum + (t.distance || 0), 0);
  const totalFuel = trips.reduce((sum, t) => sum + (t.predictedFuel || 0), 0);
  const totalCO2 = trips.reduce((sum, t) => sum + (t.carbonEmission || 0), 0);

  return (
    <div className="page-container">
      {toast && <div className={`toast-message ${toast.type}`}>{toast.text}</div>}

      {/* ─── Trip Metrics ──────────────────────────────── */}
      <div className="metric-grid metric-grid-4">
        <div className="metric-card metric-blue">
          <div className="metric-card-top">
            <span className="metric-label">Total Trips</span>
            <span className="metric-icon">🗺️</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{trips.length}</span>
          </div>
        </div>
        <div className="metric-card metric-orange">
          <div className="metric-card-top">
            <span className="metric-label">Total Distance</span>
            <span className="metric-icon">📏</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{totalDistance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="metric-unit">km</span>
          </div>
        </div>
        <div className="metric-card metric-yellow">
          <div className="metric-card-top">
            <span className="metric-label">Fuel Used</span>
            <span className="metric-icon">⛽</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{totalFuel.toFixed(1)}</span>
            <span className="metric-unit">L</span>
          </div>
        </div>
        <div className="metric-card metric-green">
          <div className="metric-card-top">
            <span className="metric-label">CO₂ Emitted</span>
            <span className="metric-icon">🌫️</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{totalCO2.toFixed(1)}</span>
            <span className="metric-unit">kg</span>
          </div>
        </div>
      </div>

      {/* ─── Create Trip Form ──────────────────────────── */}
      <section className="section-card">
        <h2 className="section-title">➕ Create New Trip</h2>
        <p className="section-desc">
          AI will automatically predict fuel consumption and carbon emissions based on distance, load weight, and vehicle specs.
        </p>
        <form className="form-row" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Source City</label>
            <input
              type="text"
              placeholder="e.g. Mumbai"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Destination City</label>
            <input
              type="text"
              placeholder="e.g. Delhi"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Distance (km)</label>
            <input
              type="number"
              min="1"
              step="0.1"
              placeholder="e.g. 1400"
              value={form.distance}
              onChange={(e) => setForm({ ...form, distance: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Load Weight (Tonnes)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 5"
              value={form.loadWeight}
              onChange={(e) => setForm({ ...form, loadWeight: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Assign Vehicle</label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              <option value="">— Select vehicle —</option>
              {vehicles.map((v) => (
                <option key={v.vehicleId} value={v.vehicleId}>
                  #{v.vehicleId} · {v.vehicleType} · {v.status}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group form-submit">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Creating…' : '+ Create Trip'}
            </button>
          </div>
        </form>
      </section>

      {/* ─── Trip Table ────────────────────────────────── */}
      <section className="section-card">
        <div className="section-header">
          <h2 className="section-title">📋 Trip Records ({trips.length})</h2>
        </div>
        <TripTable trips={trips} />
      </section>
    </div>
  );
}
