import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import MetricCard from '../components/MetricCard.jsx';
import { getAnalyticsSummary } from '../api/api';

export default function FleetAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnalyticsSummary()
      .then((res) => setData(res.data))
      .catch((err) => {
        setError('Failed to load analytics. Make sure the backend is running.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">⏳ Loading analytics data…</div>;
  if (error) return <div className="error-state">❌ {error}</div>;

  const tripsChartData = (data?.dates || []).map((d, i) => ({
    day: d,
    Trips: data.tripsPerDay[i] ?? 0,
  }));

  const fuelChartData = (data?.dates || []).map((d, i) => ({
    day: d,
    Fuel: data.fuelTrend[i] ?? 0,
  }));

  return (
    <div className="page-container">
      {/* ─── KPI Cards ─────────────────────────────────── */}
      <div className="metric-grid">
        <MetricCard
          title="Total Trips"
          value={data?.totalTrips}
          icon="🗺️"
          color="blue"
          subtitle={`${data?.totalDistance?.toFixed(0) ?? '—'} km total distance`}
        />
        <MetricCard
          title="Total Fuel Consumed"
          value={data?.totalFuel?.toFixed(1)}
          unit="L"
          icon="⛽"
          color="orange"
          subtitle={`CO₂: ${data?.totalCO2?.toFixed(1) ?? '—'} kg`}
        />
        <MetricCard
          title="Net Profit"
          value={data?.netProfit?.toFixed(0)}
          unit="₹"
          icon="💰"
          color={(data?.netProfit ?? 0) >= 0 ? 'green' : 'red'}
          subtitle={`Revenue ₹${data?.revenue?.toFixed(0) ?? '—'}`}
        />
        <MetricCard
          title="CO₂ Emission"
          value={data?.totalCO2?.toFixed(1)}
          unit="kg"
          icon="🌫️"
          color="red"
          subtitle={`Efficiency score: ${data?.efficiencyScore?.toFixed(1) ?? '—'}`}
        />
        <MetricCard
          title="Available Vehicles"
          value={data?.availableVehicles}
          icon="🚛"
          color="purple"
          subtitle="ACTIVE / AVAILABLE status"
        />
        <MetricCard
          title="Maintenance Alerts"
          value={data?.maintenanceAlerts}
          icon="⚠️"
          color={(data?.maintenanceAlerts ?? 0) > 0 ? 'red' : 'green'}
          subtitle={
            (data?.maintenanceAlerts ?? 0) > 0
              ? 'HIGH risk vehicles need attention'
              : 'Fleet in good health'
          }
        />
      </div>

      {/* ─── Charts Row ─────────────────────────────────── */}
      <div className="charts-row">
        <div className="section-card chart-card">
          <h3 className="section-title">📈 Trips per Day (Last 7 Days)</h3>
          {tripsChartData.some((d) => d.Trips > 0) ? (
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
            <div className="chart-empty">No trip data yet. Create trips to see the trend.</div>
          )}
        </div>

        <div className="section-card chart-card">
          <h3 className="section-title">⛽ Fuel Consumption Trend</h3>
          {fuelChartData.some((d) => d.Fuel > 0) ? (
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
            <strong>₹{data?.revenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'}</strong>
          </div>
          <div className="profit-stat profit-cost">
            <span>Fuel Cost</span>
            <strong>₹{data?.fuelCost?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'}</strong>
          </div>
          <div className="profit-stat profit-cost">
            <span>Maintenance Cost</span>
            <strong>₹{data?.maintenanceCost?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'}</strong>
          </div>
          <div className="profit-stat profit-cost">
            <span>Total Cost</span>
            <strong>₹{data?.totalCost?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'}</strong>
          </div>
          <div className={`profit-stat ${(data?.netProfit ?? 0) >= 0 ? 'profit-pos' : 'profit-neg'}`}>
            <span>Net Profit</span>
            <strong>₹{data?.netProfit?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) ?? '—'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
