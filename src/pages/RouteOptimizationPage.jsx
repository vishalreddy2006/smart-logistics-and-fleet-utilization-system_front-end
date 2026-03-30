import React, { useState } from 'react';
import {
  MapContainer, Marker, Polyline, Popup,
  TileLayer, Tooltip, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import RouteCard from '../components/RouteCard.jsx';

// ── Constants ─────────────────────────────────────────────
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY;
const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const EFFICIENCY = 0.22; // L/km
const CO2_PER_L  = 2.68; // kg/L

const CITY_COORDS = {
  mumbai:     [19.0760, 72.8777],
  delhi:      [28.6139, 77.2090],
  bangalore:  [12.9716, 77.5946],
  bengaluru:  [12.9716, 77.5946],
  chennai:    [13.0827, 80.2707],
  hyderabad:  [17.3850, 78.4867],
  pune:       [18.5204, 73.8567],
  kolkata:    [22.5726, 88.3639],
  ahmedabad:  [23.0225, 72.5714],
  jaipur:     [26.9124, 75.7873],
  surat:      [21.1702, 72.8311],
  lucknow:    [26.8467, 80.9462],
  nagpur:     [21.1458, 79.0882],
  indore:     [22.7196, 75.8577],
  bhopal:     [23.2599, 77.4126],
  patna:      [25.5941, 85.1376],
  chandigarh: [30.7333, 76.7794],
  coimbatore: [11.0168, 76.9558],
  kochi:      [9.9312,  76.2673],
  guwahati:   [26.1445, 91.7362],
};

// ── Decode ORS/Google encoded polyline → [[lat,lng],...] ──
function decodePolyline(encoded) {
  const coords = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

// ── Single ORS call ───────────────────────────────────────
async function fetchRoute(srcLat, srcLng, dstLat, dstLng, preference) {
  const res = await fetch(ORS_URL, {
    method: 'POST',
    headers: {
      'Authorization': ORS_KEY,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
    },
    body: JSON.stringify({
      coordinates: [[srcLng, srcLat], [dstLng, dstLat]],
      preference,
      units: 'km',
      geometry: true,
      instructions: false,
    }),
  });

  if (!res.ok) {
    return null;
  }

  const json = await res.json();
  const route = json?.routes?.[0];
  if (!route) return null;

  const distKm  = route.summary.distance;
  const durHrs  = route.summary.duration / 3600;
  const coords  = decodePolyline(route.geometry);
  return { distKm, durHrs, coords };
}

// ── Build 3 routes ────────────────────────────────────────
async function getRoutes(srcLat, srcLng, dstLat, dstLng) {
  const DEFS = [
    { pref: 'recommended', name: 'Balanced Route', type: 'balanced' },
    { pref: 'fastest',     name: 'Express Route',  type: 'express'  },
    { pref: 'shortest',    name: 'Eco Route',      type: 'eco'      },
  ];

  const raw = await Promise.all(DEFS.map(d => fetchRoute(srcLat, srcLng, dstLat, dstLng, d.pref)));

  const routes = DEFS.map((d, i) => {
    const r = raw[i];
    if (!r) return null;
    const fuel = +(r.distKm * EFFICIENCY).toFixed(1);
    const co2  = +(fuel * CO2_PER_L).toFixed(2);
    const raw_score = 0.5 * r.durHrs + 0.3 * fuel + 0.2 * co2;
    return {
      routeName:      d.name,
      routeType:      d.type,
      distance:       +r.distKm.toFixed(1),
      estimatedTime:  +r.durHrs.toFixed(2),
      predictedFuel:  fuel,
      carbonEmission: co2,
      _raw:           raw_score,
      coordinates:    r.coords,
    };
  }).filter(Boolean);

  if (!routes.length) return null;

  // Normalize scores 0–100 (higher = better)
  const min = Math.min(...routes.map(r => r._raw));
  const max = Math.max(...routes.map(r => r._raw));
  routes.forEach(r => {
    r.routeScore = max === min ? 50 : +(100 - ((r._raw - min) / (max - min) * 100)).toFixed(1);
    delete r._raw;
  });

  const recommended = routes.reduce((a, b) => a.routeScore > b.routeScore ? a : b);
  return { routes, recommendedType: recommended.routeType };
}

// ── Leaflet setup ─────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const STYLE = {
  eco:      { color: '#16a34a', weight: 5 },
  express:  { color: '#2563eb', weight: 5, dashArray: '10 5' },
  balanced: { color: '#d97706', weight: 5, dashArray: '6 4' },
};

function FitBounds({ points }) {
  const map = useMap();
  React.useEffect(() => { if (points.length >= 2) map.fitBounds(points, { padding: [50, 50] }); }, [map, points]);
  return null;
}

function openGoogleMaps(src, dst) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(src + ', India')}&destination=${encodeURIComponent(dst + ', India')}&travelmode=driving`,
    '_blank'
  );
}

// ── Page ──────────────────────────────────────────────────
export default function RouteOptimizationPage() {
  const [source, setSource]           = useState('');
  const [destination, setDestination] = useState('');
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [mapKey, setMapKey]           = useState(0);
  const [searched, setSearched]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const src = source.trim();
    const dst = destination.trim();
    const srcC = CITY_COORDS[src.toLowerCase()];
    const dstC = CITY_COORDS[dst.toLowerCase()];

    if (!srcC || !dstC) {
      setError('City not recognised. Please select from the suggestions list.');
      return;
    }

    setLoading(true); setError(''); setData(null); setSearched(true);

    try {
      const result = await getRoutes(srcC[0], srcC[1], dstC[0], dstC[1]);
      if (!result) { setError('Routing service unavailable. Please try again.'); return; }
      setData(result);
      setMapKey(k => k + 1);
    } catch {
      setError('Routing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const routes          = data?.routes          || [];
  const recommendedType = data?.recommendedType || '';
  const srcCoords       = CITY_COORDS[source.trim().toLowerCase()];
  const dstCoords       = CITY_COORDS[destination.trim().toLowerCase()];

  const allMapPoints = [
    ...routes.flatMap(r => r.coordinates),
    ...(srcCoords ? [srcCoords] : []),
    ...(dstCoords ? [dstCoords] : []),
  ];

  return (
    <div className="page-container">

      {/* Input */}
      <section className="section-card">
        <h2 className="section-title">📍 AI Route Optimization</h2>
        <p className="section-desc">Real road-based routing — accurate distance, time, fuel &amp; CO₂.</p>
        <form className="route-search-form" onSubmit={handleSubmit}>
          <div className="route-inputs">
            <div className="form-group">
              <label>Origin City</label>
              <input type="text" placeholder="e.g. Hyderabad" value={source}
                onChange={e => setSource(e.target.value)} required list="city-list" />
            </div>
            <div className="route-arrow">→</div>
            <div className="form-group">
              <label>Destination City</label>
              <input type="text" placeholder="e.g. Chennai" value={destination}
                onChange={e => setDestination(e.target.value)} required list="city-list" />
            </div>
            <datalist id="city-list">
              {Object.keys(CITY_COORDS).map(c => (
                <option key={c} value={c.charAt(0).toUpperCase() + c.slice(1)} />
              ))}
            </datalist>
          </div>
          <button type="submit" className="btn btn-primary btn-optimize" disabled={loading}>
            {loading ? '⏳ Calculating…' : '🔍 Find Best Routes'}
          </button>
        </form>
      </section>

      {error && <div className="error-state">❌ {error}</div>}

      {/* Route Cards */}
      {routes.length > 0 && (
        <section>
          <h2 className="routes-section-label">
            Route options for <strong>{source}</strong> → <strong>{destination}</strong>
          </h2>
          <div className="route-cards-grid">
            {routes.map(r => (
              <RouteCard key={r.routeName} route={r} isRecommended={r.routeType === recommendedType} />
            ))}
          </div>
        </section>
      )}

      {searched && !loading && routes.length === 0 && !error && (
        <div className="empty-state">No routes found. Try again.</div>
      )}

      {/* Map */}
      <section className="section-card">
        <h2 className="section-title">🗺️ Route Map</h2>

        {routes.length > 0 ? (
          <div className="route-map-container">
            <MapContainer key={mapKey} center={srcCoords || [20.5937, 78.9629]}
              zoom={6} scrollWheelZoom className="leaflet-route-map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {srcCoords && <Marker position={srcCoords}><Popup>📍 {source}</Popup></Marker>}
              {dstCoords && <Marker position={dstCoords}><Popup>🏁 {destination}</Popup></Marker>}
              {routes.map(r => {
                if (r.coordinates.length < 2) return null;
                const s = STYLE[r.routeType] || STYLE.balanced;
                const isRec = r.routeType === recommendedType;
                return (
                  <React.Fragment key={r.routeType}>
                    {isRec && <Polyline positions={r.coordinates}
                      pathOptions={{ color: s.color, weight: 14, opacity: 0.18 }} />}
                    <Polyline positions={r.coordinates}
                      pathOptions={{ color: s.color, weight: isRec ? 7 : s.weight, dashArray: s.dashArray, opacity: 0.9 }}>
                      {isRec && <Tooltip sticky>⭐ AI Recommended</Tooltip>}
                    </Polyline>
                  </React.Fragment>
                );
              })}
              <FitBounds points={allMapPoints} />
            </MapContainer>
          </div>
        ) : (
          <div className="map-placeholder">
            <div className="map-overlay-hint">Search for a route to see it on the map</div>
          </div>
        )}

        <p className="map-note">🟢 Eco &nbsp;·&nbsp; 🔵 Express &nbsp;·&nbsp; 🟡 Balanced</p>

        {routes.length > 0 && (
          <button onClick={() => openGoogleMaps(source, destination)} style={{
            marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px',
            background: '#fff', border: '1.5px solid #dadce0', borderRadius: '8px',
            padding: '10px 20px', fontSize: '14px', fontWeight: '600',
            color: '#3c4043', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          }}>
            <img src="https://www.google.com/favicon.ico" alt="" width="18" height="18" />
            Open in Google Maps
          </button>
        )}
      </section>
    </div>
  );
}
