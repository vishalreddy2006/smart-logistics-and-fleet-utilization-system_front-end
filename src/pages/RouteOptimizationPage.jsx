import React, { useMemo, useState } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import RouteCard from '../components/RouteCard.jsx';
import { optimizeRoutes } from '../api/api';

// City coordinate lookup for map visualization
const CITY_COORDS = {
  mumbai: [19.076, 72.8777],
  delhi: [28.6139, 77.209],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  surat: [21.1702, 72.8311],
  lucknow: [26.8467, 80.9462],
  nagpur: [21.1458, 79.0882],
  indore: [22.7196, 75.8577],
  bhopal: [23.2599, 77.4126],
  patna: [25.5941, 85.1376],
  chandigarh: [30.7333, 76.7794],
  coimbatore: [11.0168, 76.9558],
  kochi: [9.9312, 76.2673],
  guwahati: [26.1445, 91.7362],
};

function getCoords(cityName) {
  const key = cityName.trim().toLowerCase();
  return CITY_COORDS[key] || null;
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const TYPE_TO_TITLE = {
  eco: 'Eco Bypass Route',
  express: 'Express Highway Route',
  urban: 'Urban Connector Route',
};

const TYPE_STYLE = {
  eco: { color: 'green', weight: 6 },
  express: { color: 'blue', weight: 5, dashArray: '10' },
  urban: { color: 'orange', weight: 5, dashArray: '6' },
};

function normalizeType(route, index) {
  const raw = String(route?.type || route?.routeName || '').toLowerCase();
  if (raw.includes('eco')) return 'eco';
  if (raw.includes('express')) return 'express';
  if (raw.includes('urban')) return 'urban';
  if (index === 0) return 'eco';
  if (index === 1) return 'express';
  return 'urban';
}

function normalizeCoordinates(coordinates) {
  if (!Array.isArray(coordinates)) return [];
  return coordinates
    .filter(
      (point) =>
        Array.isArray(point) &&
        point.length === 2 &&
        Number.isFinite(Number(point[0])) &&
        Number.isFinite(Number(point[1]))
    )
    .map(([lat, lng]) => [Number(lat), Number(lng)]);
}

function generateRoutePoints(src, dst, variant) {
  const midLat = (src[0] + dst[0]) / 2;
  const midLng = (src[1] + dst[1]) / 2;
  const offsets = [0, 1.2, -1.2];
  const offset = offsets[variant % offsets.length];
  return [
    src,
    [midLat + offset, midLng + offset * 0.5],
    dst,
  ];
}

function FitBounds({ points }) {
  const map = useMap();

  React.useEffect(() => {
    if (!points.length) {
      return;
    }

    map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);

  return null;
}

function MapView({ source, destination, routes, recommendedType, mapVersion }) {
  const sourceCoords = getCoords(source);
  const destinationCoords = getCoords(destination);

  const routesWithCoordinates = routes.map((route, idx) => {
    const backendCoordinates = normalizeCoordinates(route.coordinates);
    if (backendCoordinates.length > 1) {
      return { ...route, coordinates: backendCoordinates };
    }

    if (sourceCoords && destinationCoords) {
      return {
        ...route,
        coordinates: generateRoutePoints(sourceCoords, destinationCoords, idx),
      };
    }

    return { ...route, coordinates: [] };
  });

  const polylinePoints = routesWithCoordinates.flatMap((route) => route.coordinates);
  const firstRoute = routesWithCoordinates.find((route) => route.coordinates.length > 1);
  const originPoint = sourceCoords || firstRoute?.coordinates?.[0] || null;
  const destinationPoint =
    destinationCoords ||
    (firstRoute ? firstRoute.coordinates[firstRoute.coordinates.length - 1] : null);

  const boundsPoints = [
    ...polylinePoints,
    ...(originPoint ? [originPoint] : []),
    ...(destinationPoint ? [destinationPoint] : []),
  ];

  if (!boundsPoints.length || routesWithCoordinates.some((route) => route.coordinates.length < 2)) {
    return <div className="map-fallback">Route map unavailable</div>;
  }

  return (
    <div className="route-map-container">
      <MapContainer
        key={mapVersion}
        center={originPoint || [20.5937, 78.9629]}
        zoom={6}
        scrollWheelZoom
        className="leaflet-route-map"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {originPoint && (
          <Marker position={originPoint}>
            <Popup>Origin: {source}</Popup>
          </Marker>
        )}
        {destinationPoint && (
          <Marker position={destinationPoint}>
            <Popup>Destination: {destination}</Popup>
          </Marker>
        )}

        {routesWithCoordinates.map((route) => {
          const style = TYPE_STYLE[route.routeType] || TYPE_STYLE.urban;
          const isRecommended = route.routeType === recommendedType;

          return (
            <React.Fragment key={`${route.routeType}-${route.routeName}`}>
              {isRecommended && (
                <Polyline
                  positions={route.coordinates}
                  pathOptions={{
                    color: style.color,
                    weight: 11,
                    opacity: 0.25,
                  }}
                />
              )}

              <Polyline
                positions={route.coordinates}
                pathOptions={{
                  color: style.color,
                  weight: isRecommended ? 7 : style.weight,
                  dashArray: style.dashArray,
                  opacity: 0.95,
                }}
              >
                {isRecommended && <Tooltip sticky>AI Recommended Route</Tooltip>}
              </Polyline>
            </React.Fragment>
          );
        })}

        <FitBounds points={boundsPoints} />
      </MapContainer>
    </div>
  );
}

export default function RouteOptimizationPage() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapVersion, setMapVersion] = useState(0);
  const [searched, setSearched] = useState(false);

  const handleOptimize = async (e) => {
    e.preventDefault();
    if (!source.trim() || !destination.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);
    try {
      const res = await optimizeRoutes(source.trim(), destination.trim());
      setResult(res.data);
      setMapVersion((prev) => prev + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to optimize route. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const routes = useMemo(() => {
    if (!Array.isArray(result?.routes)) {
      return [];
    }

    return result.routes.map((route, index) => {
      const routeType = normalizeType(route, index);

      return {
        ...route,
        routeType,
        routeName: TYPE_TO_TITLE[routeType],
        distance: route.distance,
        estimatedTime: route.time ?? route.estimatedTime,
        predictedFuel: route.fuel ?? route.predictedFuel,
        carbonEmission: route.co2 ?? route.carbonEmission,
      };
    });
  }, [result]);

  const recommendedType = useMemo(() => {
    if (!result?.recommendedRoute) {
      return '';
    }

    if (typeof result.recommendedRoute === 'string') {
      return normalizeType({ type: result.recommendedRoute }, 0);
    }

    return normalizeType(result.recommendedRoute, 0);
  }, [result]);

  return (
    <div className="page-container">
      {/* ─── Input Panel ───────────────────────────────── */}
      <section className="section-card">
        <h2 className="section-title">📍 AI Route Optimization</h2>
        <p className="section-desc">
          Enter source and destination to get AI-powered route recommendations
          with fuel, time, and carbon emission predictions.
        </p>
        <form className="route-search-form" onSubmit={handleOptimize}>
          <div className="route-inputs">
            <div className="form-group">
              <label>Origin City</label>
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
                list="city-list"
              />
            </div>
            <div className="route-arrow">→</div>
            <div className="form-group">
              <label>Destination City</label>
              <input
                type="text"
                placeholder="e.g. Delhi"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                list="city-list"
              />
            </div>
            <datalist id="city-list">
              {Object.keys(CITY_COORDS).map((c) => (
                <option key={c} value={c.charAt(0).toUpperCase() + c.slice(1)} />
              ))}
            </datalist>
          </div>
          <button type="submit" className="btn btn-primary btn-optimize" disabled={loading}>
            {loading ? '⏳ Optimizing…' : '🔍 Find Best Routes'}
          </button>
        </form>
      </section>

      {/* ─── Error ─────────────────────────────────────── */}
      {error && <div className="error-state">❌ {error}</div>}

      {/* ─── Route Cards ───────────────────────────────── */}
      {routes.length > 0 && (
        <section>
          <h2 className="routes-section-label">
            Route options for <strong>{source}</strong> → <strong>{destination}</strong>
          </h2>
          <div className="route-cards-grid">
            {routes.map((route) => (
              <RouteCard
                key={route.routeName}
                route={route}
                isRecommended={route.routeType === recommendedType}
              />
            ))}
          </div>
        </section>
      )}

      {searched && !loading && routes.length === 0 && !error && (
        <div className="empty-state">No routes returned. Check city names and try again.</div>
      )}

      {/* ─── Leaflet Map ───────────────────────────────── */}
      <section className="section-card">
        <h2 className="section-title">🗺️ Route Map</h2>
        {routes.length > 0 ? (
          <MapView
            source={source}
            destination={destination}
            routes={routes}
            recommendedType={recommendedType}
            mapVersion={mapVersion}
          />
        ) : (
          <div className="map-placeholder">
            <div className="map-overlay-hint">
              Search for a route to see it on the map
            </div>
          </div>
        )}
        <p className="map-note">
          💡 Map shows routes for cities with known coordinates.
          Green line = Eco Route · Blue dashed = Express · Orange dashed = Urban
        </p>
      </section>
    </div>
  );
}
