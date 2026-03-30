import React from 'react';

export default function TripTable({ trips }) {
  if (!trips || trips.length === 0) {
    return (
      <div className="table-empty">
        No trips found. Create a trip above to get started.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Source</th>
            <th>Destination</th>
            <th>Distance (km)</th>
            <th>Load (T)</th>
            <th>Fuel (L)</th>
            <th>CO₂ (kg)</th>
            <th>AI Efficiency Score</th>
            <th>AI Recommended Vehicle</th>
            <th>Vehicle</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((t) => {
            const score = typeof t.efficiencyScore === 'number' ? Math.round(t.efficiencyScore) : 0;
            const scoreClass = score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-danger';
            return (
              <tr key={t.tripId}>
                <td><span className="id-badge">#{t.tripId}</span></td>
                <td>{t.source}</td>
                <td>{t.destination}</td>
                <td>{t.distance?.toLocaleString() ?? '—'}</td>
                <td>{t.loadWeight?.toLocaleString() ?? '—'}</td>
                <td>{typeof t.predictedFuel === 'number' ? t.predictedFuel.toFixed(2) : '—'}</td>
                <td>{typeof t.carbonEmission === 'number' ? t.carbonEmission.toFixed(2) : '—'}</td>
                <td><span className={`badge ${scoreClass}`}>{score}</span></td>
                <td><span className="badge bg-success">{t.recommendedVehicle ?? '—'}</span></td>
                <td>
                  {t.vehicle ? (
                    <span className="badge badge-secondary">#{t.vehicle.vehicleId} {t.vehicle.vehicleType}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
