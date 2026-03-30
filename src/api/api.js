import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      window.location.replace('/#/login');
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const signup = (email, phoneNumber, password) =>
  api.post('/auth/signup', { email, phoneNumber, password });

// ─── Vehicles ────────────────────────────────────────────
export const getAllVehicles = () => api.get('/vehicles/all');
export const addVehicle = (vehicle) => api.post('/vehicles/add', vehicle);
export const updateVehicle = (id, vehicle) => api.put(`/vehicles/update/${id}`, vehicle);
export const deleteVehicle = (id) => api.delete(`/vehicles/delete/${id}`);
export const predictMaintenance = () => api.post('/maintenance/predict');
export const runMaintenanceCheck = () => api.post('/maintenance/predict');

// ─── Trips ───────────────────────────────────────────────
export const getAllTrips = () => api.get('/trips/all');
export const createTrip = (trip) => api.post('/trips/create', trip);

// ─── Analytics ───────────────────────────────────────────
export const getAnalyticsSummary = () => api.get('/analytics');
export const getMaintenanceAlerts = () => api.get('/analytics/maintenance-alerts');
export const getTripActivity = () => api.get('/analytics/trip-activity');
export const getFuelUsage = () => api.get('/analytics/fuel-usage');
export const getProfitAnalysis = () => api.get('/analytics/profit-analysis');
export const getCarbonEmissions = () => api.get('/analytics/carbon-emissions');
export const getFleetUtilization = () => api.get('/analytics/fleet-utilization');
export const getVehiclePerformance = () => api.get('/analytics/vehicle-performance');

// ─── Route Optimization ──────────────────────────────────
export const optimizeRoutes = (source, destination) =>
  api.get('/routes/optimize', { params: { source, destination } });

// ─── Cost Optimization ───────────────────────────────────
export const getCostSummary = () => api.get('/cost-optimization/summary');
export const getVehicleEfficiency = () => api.get('/cost-optimization/vehicle-efficiency');
export const getRouteEfficiency = () => api.get('/cost-optimization/route-efficiency');
export const getCostRecommendations = () => api.get('/cost-optimization/recommendations');

export default api;