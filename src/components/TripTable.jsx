import React from 'react';

function calculateEfficiencyScore(distance, fuel) {
  if (!fuel || fuel === 0) return 0;

  const efficiency = distance / fuel;
  const score = Math.min(100, Math.round(efficiency * 5));

  return score;
}

function getRecommendedVehicle(load, distance) {
  if (load <= 2 && distance < 300) return 'Van';
  if (load <= 5 && distance < 800) return 'Mini Truck';
  if (load <= 10) return 'Truck';
  return 'Container Truck';
}

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
          {trips.map((t) => (
            <tr key={t.tripId}>
              <td>
                <span className="id-badge">#{t.tripId}</span>
              </td>
              <td>{t.source}</td>
              <td>{t.destination}</td>
              <td>{t.distance?.toLocaleString() ?? '—'}</td>
              <td>{t.loadWeight?.toLocaleString() ?? '—'}</td>
              <td>{typeof t.predictedFuel === 'number' ? t.predictedFuel.toFixed(2) : '—'}</td>
              <td>{typeof t.carbonEmission === 'number' ? t.carbonEmission.toFixed(2) : '—'}</td>
              <td>
                {(() => {
                  const score = calculateEfficiencyScore(t.distance ?? 0, t.predictedFuel ?? 0);
                  const scoreClass = score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-danger';
                  return <span className={`badge ${scoreClass}`}>{score}</span>;
                })()}
              </td>
              <td>
                <span className="badge bg-success">
                  {getRecommendedVehicle(t.loadWeight ?? 0, t.distance ?? 0)}
                </span>
              </td>
              <td>
                {t.vehicle ? (
                  <span className="badge badge-secondary">
                    #{t.vehicle.vehicleId} {t.vehicle.vehicleType}
                  </span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
