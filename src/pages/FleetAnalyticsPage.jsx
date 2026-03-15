import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import MetricCard from '../components/MetricCard.jsx';
import {
  getTripActivity,
  getFuelUsage,
  getProfitAnalysis,
  getCarbonEmissions,
  getFleetUtilization,
  getMaintenanceAlerts,
  getVehiclePerformance,
} from '../api/api';

export default function FleetAnalyticsPage() {
  const [tripActivity, setTripActivity] = useState(null);
  const [fuelUsage, setFuelUsage] = useState(null);
  const [profitAnalysis, setProfitAnalysis] = useState(null);
  const [carbonEmissions, setCarbonEmissions] = useState(null);
  const [fleetUtilization, setFleetUtilization] = useState(null);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [vehiclePerformance, setVehiclePerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ta, fu, pa, ce, flu, ma, vp] = await Promise.all([
          getTripActivity(),
          getFuelUsage(),
          getProfitAnalysis(),
          getCarbonEmissions(),
          getFleetUtilization(),
          getMaintenanceAlerts(),
          getVehiclePerformance(),
        ]);
        setTripActivity(ta.data);
        setFuelUsage(fu.data);
        setProfitAnalysis(pa.data);
        setCarbonEmissions(ce.data);
        setFleetUtilization(flu.data);
        setMaintenanceAlerts(ma.data);
        setVehiclePerformance(vp.data);
      } catch (err) {
        setError('Failed to load analytics. Make sure the backend is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="loading-state">⏳ Loading analytics data…</div>;
  if (error) return <div className="error-state">❌ {error}</div>;

  // Chart data: tripsPerDay comes as [{label, value}]
  const tripsChartData = (tripActivity?.tripsPerDay || []).map((d) => ({
    day: d.label,
    Trips: d.value,
  }));

  const fuelChartData = (fuelUsage?.fuelUsageTrend || []).map((d) => ({
    day: d.label,
    Fuel: d.value,
  }));

  const vehiclePerfData = (vehiclePerformance?.tripCountPerVehicle || []).map((v) => ({
    name: `V#${v.vehicleId} ${v.vehicleType}`,
    Trips: v.tripCount,
    Fuel: v.fuelUsed,
  }));

  return (
    <div className="page-container">
      {/* ─── KPI Cards ─────────────────────────────────── */}
      <div className="metric-grid">
        <MetricCard
          title="Trips Today"
          value={tripActivity?.totalTripsToday}
          icon="🗺️"
          color="blue"
          subtitle={`Avg ${tripActivity?.averageTripDistance?.toFixed(0) ?? '—'} km/trip`}
        />
        <MetricCard
          title="Total Fuel Consumed"
          value={fuelUsage?.totalFuelConsumed?.toFixed(1)}
          unit="L"
          icon="⛽"
          color="orange"
          subtitle={`${fuelUsage?.averageFuelPerTrip?.toFixed(1) ?? '—'} L avg/trip`}
        />
        <MetricCard
          title="Net Profit"
          value={profitAnalysis?.netProfit?.toFixed(0)}
          unit="₹"
          icon="💰"
          color={profitAnalysis?.netProfit >= 0 ? 'green' : 'red'}
          subtitle={`Revenue ₹${profitAnalysis?.totalRevenue?.toFixed(0) ?? '—'}`}
        />
        <MetricCard
          title="CO₂ Emission"
          value={carbonEmissions?.totalEmission?.toFixed(1)}
          unit="kg"
          icon="🌫️"
          color="red"
          subtitle={`${carbonEmissions?.averageEmissionPerTrip?.toFixed(2) ?? '—'} kg avg/trip`}
        />
        <MetricCard
          title="Available Vehicles"
          value={fleetUtilization?.availableVehicles}
          icon="🚛"
          color="purple"
          subtitle={`${fleetUtilization?.vehiclesInTrip ?? 0} in trip · ${fleetUtilization?.vehiclesUnderMaintenance ?? 0} in maint.`}
        />
        <MetricCard
          title="Maintenance Alerts"
          value={maintenanceAlerts.length}
          icon="⚠️"
          color={maintenanceAlerts.length > 0 ? 'red' : 'green'}
          subtitle={
            maintenanceAlerts.length > 0
              ? 'Vehicles need attention'
              : 'Fleet in good health'
          }
        />
      </div>

      {/* ─── Charts Row 1 ───────────────────────────────── */}
      <div className="charts-row">
        <div className="section-card chart-card">
          <h3 className="section-title">📈 Trips per Day (Last 7 Days)</h3>
          {tripsChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={tripsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Trips"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              No trip data yet. Create trips to see the trend.
            </div>
          )}
        </div>

        <div className="section-card chart-card">
          <h3 className="section-title">⛽ Fuel Consumption Trend</h3>
          {fuelChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={fuelChartData}>
                <defs>
                  <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`${v} L`, 'Fuel']} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Fuel"
                  stroke="#f59e0b"
                  fill="url(#fuelGrad)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No fuel trend data yet.</div>
          )}
        </div>
      </div>

      {/* ─── Revenue vs Cost ────────────────────────────── */}
      <div className="section-card">
        <h3 className="section-title">💰 Revenue vs Cost Overview</h3>
        <div className="profit-summary-row">
          <div className="profit-stat profit-revenue">
            <span>Total Revenue</span>
            <strong>₹{profitAnalysis?.totalRevenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'}</strong>
          </div>
          <div className="profit-stat profit-cost">
            <span>Total Cost</span>
            <strong>₹{profitAnalysis?.totalCost?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'}</strong>
          </div>
          <div className={`profit-stat ${(profitAnalysis?.netProfit ?? 0) >= 0 ? 'profit-pos' : 'profit-neg'}`}>
            <span>Net Profit</span>
            <strong>₹{profitAnalysis?.netProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'}</strong>
          </div>
        </div>
      </div>

      {/* ─── Vehicle Performance Chart ──────────────────── */}
      <div className="section-card">
        <h3 className="section-title">🚛 Trips &amp; Fuel Usage per Vehicle</h3>
        {vehiclePerfData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehiclePerfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="Trips" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Trips" />
              <Bar yAxisId="right" dataKey="Fuel" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Fuel (L)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">No vehicle performance data yet. Create trips and assign vehicles.</div>
        )}
      </div>
    </div>
  );
}
