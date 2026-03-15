import React from 'react';

export default function MetricCard({ title, value, unit, icon, color = 'blue', subtitle }) {
  const displayValue =
    value !== undefined && value !== null
      ? typeof value === 'number'
        ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
        : value
      : '—';

  return (
    <div className={`metric-card metric-${color}`}>
      <div className="metric-card-top">
        <span className="metric-label">{title}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value-row">
        <span className="metric-number">{displayValue}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
}
