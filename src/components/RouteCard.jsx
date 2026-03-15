import React from 'react';

const ROUTE_CONFIG = {
  'Eco Route': { colorClass: 'route-eco', icon: '🌿', tagline: 'Best for carbon savings' },
  'Express Route': { colorClass: 'route-express', icon: '⚡', tagline: 'Fastest arrival time' },
  'Urban Route': { colorClass: 'route-urban', icon: '🏙️', tagline: 'Through city network' },
};

export default function RouteCard({ route, isRecommended }) {
  const cfg = ROUTE_CONFIG[route.routeName] || {
    colorClass: 'route-default',
    icon: '📍',
    tagline: 'Route option',
  };

  return (
    <div className={`route-card ${cfg.colorClass} ${isRecommended ? 'route-recommended' : ''}`}>
      {isRecommended && (
        <div className="recommended-ribbon">✦ AI Recommended</div>
      )}
      <div className="route-card-header">
        <span className="route-icon">{cfg.icon}</span>
        <div>
          <h3 className="route-name">{route.routeName}</h3>
          <span className="route-tagline">{cfg.tagline}</span>
        </div>
        <div className="route-score-badge">
          <span className="score-label">Score</span>
          <span className="score-value">{route.routeScore?.toFixed(1) ?? '—'}</span>
        </div>
      </div>

      <div className="route-stats-grid">
        <div className="route-stat">
          <span className="stat-icon">📏</span>
          <div>
            <span className="stat-value">{route.distance?.toFixed(1) ?? '—'}</span>
            <span className="stat-label">km</span>
          </div>
        </div>
        <div className="route-stat">
          <span className="stat-icon">⏱️</span>
          <div>
            <span className="stat-value">{route.estimatedTime?.toFixed(1) ?? '—'}</span>
            <span className="stat-label">hrs</span>
          </div>
        </div>
        <div className="route-stat">
          <span className="stat-icon">⛽</span>
          <div>
            <span className="stat-value">{route.predictedFuel?.toFixed(1) ?? '—'}</span>
            <span className="stat-label">L fuel</span>
          </div>
        </div>
        <div className="route-stat">
          <span className="stat-icon">🌫️</span>
          <div>
            <span className="stat-value">{route.carbonEmission?.toFixed(2) ?? '—'}</span>
            <span className="stat-label">kg CO₂</span>
          </div>
        </div>
      </div>
    </div>
  );
}
