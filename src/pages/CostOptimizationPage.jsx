import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import MetricCard from '../components/MetricCard.jsx';
import {
  getCostSummary,
  getVehicleEfficiency,
  getRouteEfficiency,
  getCostRecommendations,
} from '../api/api';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const REC_ICONS = { FUEL: '⛽', MAINTENANCE: '🔧', ROUTE: '📍', VEHICLE: '🚛' };

export default function CostOptimizationPage() {
  const [summary, setSummary] = useState(null);
  const [vehicleEfficiency, setVehicleEfficiency] = useState([]);
  const [routeEfficiency, setRouteEfficiency] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, ve, re, rec] = await Promise.all([
          getCostSummary(),
          getVehicleEfficiency(),
          getRouteEfficiency(),
          getCostRecommendations(),
        ]);
        setSummary(s.data);
        setVehicleEfficiency(ve.data);
        setRouteEfficiency(re.data);
        setRecommendations(rec.data);
      } catch {
        setError('Failed to load cost data. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="loading-state">⏳ Loading cost optimization data…</div>;
  if (error) return <div className="error-state">❌ {error}</div>;

  const vehicleChartData = vehicleEfficiency.map((v) => ({
    name: `V#${v.vehicleId} ${v.vehicleType}`,
    CostPerKm: parseFloat(v.costPerKm.toFixed(2)),
    FuelEfficiency: parseFloat(v.fuelEfficiency.toFixed(2)),
    Trips: v.tripCount,
  }));

  const fuelRankData = [...vehicleChartData].sort(
    (a, b) => b.FuelEfficiency - a.FuelEfficiency
  );

  const pieData = vehicleEfficiency.map((v) => ({
    name: `V#${v.vehicleId}`,
    value: parseFloat((v.costPerKm * Math.max(v.tripCount, 1)).toFixed(2)),
  }));

  return (
    <div className="page-container">
      {/* ─── KPI Cards ─────────────────────────────────── */}
      <div className="metric-grid metric-grid-4">
        <MetricCard
          title="Total Revenue"
          value={summary?.totalRevenue?.toFixed(0)}
          unit="₹"
          icon="💵"
          color="green"
          subtitle="All trips combined"
        />
        <MetricCard
          title="Operational Cost"
          value={summary?.totalOperationalCost?.toFixed(0)}
          unit="₹"
          icon="🔧"
          color="orange"
          subtitle="Fuel + maintenance"
        />
        <MetricCard
          title="Net Profit"
          value={summary?.netProfit?.toFixed(0)}
          unit="₹"
          icon="📈"
          color={summary?.netProfit >= 0 ? 'green' : 'red'}
          subtitle={summary?.netProfit >= 0 ? 'Profitable' : 'Operating at loss'}
        />
        <MetricCard
          title="Avg Cost per KM"
          value={summary?.averageCostPerKm?.toFixed(2)}
          unit="₹/km"
          icon="⚡"
          color="blue"
          subtitle="Fleet average"
        />
      </div>

      {/* ─── Charts Row 1 ───────────────────────────────── */}
      <div className="charts-row">
        <div className="section-card chart-card">
          <h3 className="section-title">🚛 Revenue vs Cost per Vehicle</h3>
          {vehicleChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={vehicleChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v, name) => [`₹${v}`, name]} />
                <Legend />
                <Bar dataKey="CostPerKm" fill="#ef4444" radius={[4, 4, 0, 0]} name="Cost/km (₹)" />
                <Bar dataKey="Trips" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Trip Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No vehicle efficiency data yet.</div>
          )}
        </div>

        <div className="section-card chart-card">
          <h3 className="section-title">🥧 Operational Cost Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`₹${v.toFixed(2)}`, 'Cost']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No cost distribution data yet.</div>
          )}
        </div>
      </div>

      {/* ─── Fuel Efficiency Ranking ─────────────────────── */}
      <div className="section-card">
        <h3 className="section-title">⚡ Fuel Efficiency Ranking (km/L)</h3>
        {fuelRankData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fuelRankData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} km/L`, 'Fuel Efficiency']} />
              <Legend />
              <Bar
                dataKey="FuelEfficiency"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
                name="Efficiency (km/L)"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">No fuel efficiency data yet.</div>
        )}
      </div>

      {/* ─── Route Efficiency ────────────────────────────── */}
      {routeEfficiency.length > 0 && (
        <div className="section-card">
          <h3 className="section-title">📍 Route Efficiency Overview</h3>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Distance (km)</th>
                  <th>Fuel (L)</th>
                  <th>CO₂ (kg)</th>
                  <th>Cost/km (₹)</th>
                </tr>
              </thead>
              <tbody>
                {routeEfficiency.map((r, i) => (
                  <tr key={i}>
                    <td><strong>{r.routeName}</strong></td>
                    <td>{r.distance?.toFixed(1)}</td>
                    <td>{r.predictedFuel?.toFixed(2)}</td>
                    <td>{r.carbonEmission?.toFixed(2)}</td>
                    <td>₹{r.costPerKm?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── AI Recommendations ───────────────────────────── */}
      {recommendations.length > 0 && (
        <div className="section-card">
          <h3 className="section-title">💡 AI Cost Recommendations</h3>
          <div className="recommendations-list">
            {recommendations.map((rec, i) => (
              <div key={i} className={`recommendation-item rec-${rec.type?.toLowerCase()}`}>
                <span className="rec-icon">
                  {REC_ICONS[rec.type] || '💡'}
                </span>
                <div className="rec-content">
                  <strong className="rec-title">{rec.title}</strong>
                  <p className="rec-message">{rec.message}</p>
                  <span className={`rec-type-badge rec-type-${rec.type?.toLowerCase()}`}>
                    {rec.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
