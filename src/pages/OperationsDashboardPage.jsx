import React, { useState, useEffect, useCallback } from 'react';
import VehicleTable from '../components/VehicleTable.jsx';
import TripTable from '../components/TripTable.jsx';
import {
	getAllVehicles, addVehicle, deleteVehicle, runMaintenanceCheck,
	getAllTrips, createTrip, getMaintenanceAlerts,
} from '../api/api';

const VEHICLE_TYPES = ['Truck', 'Van', 'Motorcycle', 'Car', 'Bus', 'Trailer'];
const STATUSES = ['ACTIVE', 'IDLE', 'MAINTENANCE', 'INACTIVE'];
const INIT_VEHICLE = { vehicleType: 'Truck', capacity: '', mileage: '', age: '', status: 'ACTIVE' };
const INIT_TRIP = { source: '', destination: '', distance: '', loadWeight: '', vehicleId: '' };

export default function OperationsDashboardPage() {
	const [vehicles, setVehicles] = useState([]);
	const [trips, setTrips] = useState([]);
	const [alerts, setAlerts] = useState([]);
	const [vehicleForm, setVehicleForm] = useState(INIT_VEHICLE);
	const [tripForm, setTripForm] = useState(INIT_TRIP);
	const [vehicleLoading, setVehicleLoading] = useState(false);
	const [tripLoading, setTripLoading] = useState(false);
	const [maintenanceLoading, setMaintenanceLoading] = useState(false);
	const [toast, setToast] = useState(null);

	const showToast = (text, type = 'success') => {
		setToast({ text, type });
		setTimeout(() => setToast(null), 4000);
	};

	const loadData = useCallback(async () => {
		try {
			const [vRes, tRes, aRes] = await Promise.all([
				getAllVehicles(), getAllTrips(), getMaintenanceAlerts(),
			]);
			setVehicles(vRes.data);
			setTrips(tRes.data);
			setAlerts(aRes.data);
		} catch (err) {
			console.error('Failed to load dashboard data', err);
		}
	}, []);

	useEffect(() => { loadData(); }, [loadData]);

	const handleAddVehicle = async (e) => {
		e.preventDefault();
		setVehicleLoading(true);
		try {
			await addVehicle({
				vehicleType: vehicleForm.vehicleType,
				capacity: Number(vehicleForm.capacity),
				mileage: Number(vehicleForm.mileage),
				age: Number(vehicleForm.age),
				status: vehicleForm.status,
			});
			setVehicleForm(INIT_VEHICLE);
			await loadData();
			showToast('Vehicle added successfully!');
		} catch (err) {
			showToast(err.response?.data?.message || 'Failed to add vehicle.', 'error');
		} finally {
			setVehicleLoading(false);
		}
	};

	const handleDeleteVehicle = async (id) => {
		if (!window.confirm('Delete vehicle #' + id + '?')) return;
		try {
			await deleteVehicle(id);
			await loadData();
			showToast('Vehicle deleted.');
		} catch (err) {
			showToast(err.response?.data?.message || 'Failed to delete vehicle.', 'error');
		}
	};

	const handleMaintenanceCheck = async () => {
		setMaintenanceLoading(true);
		try {
			const res = await runMaintenanceCheck();
			setVehicles(res.data);
			await loadData();
			showToast('AI maintenance scan complete — ' + res.data.length + ' vehicles updated.');
		} catch (err) {
			showToast('Maintenance check failed.', 'error');
		} finally {
			setMaintenanceLoading(false);
		}
	};

	const handleCreateTrip = async (e) => {
		e.preventDefault();
		setTripLoading(true);
		try {
			await createTrip({
				source: tripForm.source,
				destination: tripForm.destination,
				distance: Number(tripForm.distance),
				loadWeight: Number(tripForm.loadWeight),
				vehicle: tripForm.vehicleId ? { vehicleId: Number(tripForm.vehicleId) } : null,
			});
			setTripForm(INIT_TRIP);
			await loadData();
			showToast('Trip created! AI predictions applied.');
		} catch (err) {
			showToast(err.response?.data?.message || 'Failed to create trip.', 'error');
		} finally {
			setTripLoading(false);
		}
	};

	return (
		<div className="page-container">
			{toast && <div className={'toast-message ' + toast.type}>{toast.text}</div>}

			<div className="dashboard-summary-bar">
				<div className="summary-item">
					<span className="summary-icon">🚛</span>
					<div>
						<span className="summary-value">{vehicles.length}</span>
						<span className="summary-label">Vehicles</span>
					</div>
				</div>
				<div className="summary-item">
					<span className="summary-icon">🗺️</span>
					<div>
						<span className="summary-value">{trips.length}</span>
						<span className="summary-label">Trips</span>
					</div>
				</div>
				<div className="summary-item">
					<span className="summary-icon">⚠️</span>
					<div>
						<span className={'summary-value' + (alerts.length > 0 ? ' text-danger' : '')}>{alerts.length}</span>
						<span className="summary-label">Alerts</span>
					</div>
				</div>
				<div className="summary-item">
					<span className="summary-icon">✅</span>
					<div>
						<span className="summary-value">{vehicles.filter((v) => v.status === 'ACTIVE').length}</span>
						<span className="summary-label">Active</span>
					</div>
				</div>
			</div>

			<section className="section-card">
				<div className="section-header">
					<h2 className="section-title">🚛 Vehicle Management</h2>
				</div>

				<div className="subsection">
					<h3 className="subsection-title">Add New Vehicle</h3>
					<form className="form-row" onSubmit={handleAddVehicle}>
						<div className="form-group">
							<label>Vehicle Type</label>
							<select
								value={vehicleForm.vehicleType}
								onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
								required
							>
								{VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
							</select>
						</div>
						<div className="form-group">
							<label>Capacity (T)</label>
							<input
								type="number" min="0" step="0.1" placeholder="e.g. 10"
								value={vehicleForm.capacity}
								onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
								required
							/>
						</div>
						<div className="form-group">
							<label>Mileage (km)</label>
							<input
								type="number" min="0" placeholder="e.g. 45000"
								value={vehicleForm.mileage}
								onChange={(e) => setVehicleForm({ ...vehicleForm, mileage: e.target.value })}
								required
							/>
						</div>
						<div className="form-group">
							<label>Age (yrs)</label>
							<input
								type="number" min="0" placeholder="e.g. 3"
								value={vehicleForm.age}
								onChange={(e) => setVehicleForm({ ...vehicleForm, age: e.target.value })}
								required
							/>
						</div>
						<div className="form-group">
							<label>Status</label>
							<select
								value={vehicleForm.status}
								onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
							>
								{STATUSES.map((s) => <option key={s}>{s}</option>)}
							</select>
						</div>
						<div className="form-group form-submit">
							<button type="submit" className="btn btn-primary" disabled={vehicleLoading}>
								{vehicleLoading ? 'Adding…' : '+ Add Vehicle'}
							</button>
						</div>
					</form>
				</div>

				<div className="subsection">
					<h3 className="subsection-title">Fleet Overview ({vehicles.length} vehicles)</h3>
					<VehicleTable vehicles={vehicles} onDelete={handleDeleteVehicle} />
				</div>
			</section>

			<section className="section-card">
				<div className="section-header">
					<h2 className="section-title">🗺️ Trip Management</h2>
				</div>

				<div className="subsection">
					<h3 className="subsection-title">Create New Trip</h3>
					<form className="form-row" onSubmit={handleCreateTrip}>
						<div className="form-group">
							<label>Source</label>
							<input
								type="text" placeholder="e.g. Mumbai"
								value={tripForm.source}
								onChange={(e) => setTripForm({ ...tripForm, source: e.target.value })}
								required
							/>
						</div>
						<div className="form-group">
							<label>Destination</label>
							<input
								type="text" placeholder="e.g. Delhi"
								value={tripForm.destination}
								onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
								required
							/>
						</div>
						<div className="form-group">
							<label>Distance (km)</label>
							<input
								type="number" min="1" step="0.1" placeholder="e.g. 1400"
								value={tripForm.distance}
								onChange={(e) => setTripForm({ ...tripForm, distance: e.target.value })}
								required
							/>
						</div>
						<div className="form-group">
							<label>Load (T)</label>
							<input
								type="number" min="0" step="0.1" placeholder="e.g. 5"
								value={tripForm.loadWeight}
								onChange={(e) => setTripForm({ ...tripForm, loadWeight: e.target.value })}
								required
							/>
						</div>
						<div className="form-group">
							<label>Vehicle</label>
							<select
								value={tripForm.vehicleId}
								onChange={(e) => setTripForm({ ...tripForm, vehicleId: e.target.value })}
							>
								<option value="">— Select —</option>
								{vehicles.map((v) => (
									<option key={v.vehicleId} value={v.vehicleId}>
										{'#' + v.vehicleId + ' ' + v.vehicleType}
									</option>
								))}
							</select>
						</div>
						<div className="form-group form-submit">
							<button type="submit" className="btn btn-primary" disabled={tripLoading}>
								{tripLoading ? 'Creating…' : '+ Create Trip'}
							</button>
						</div>
					</form>
				</div>

				<div className="subsection">
					<h3 className="subsection-title">Trip Records ({trips.length})</h3>
					<TripTable trips={trips} />
				</div>
			</section>

			<section className="section-card">
				<div className="section-header">
					<h2 className="section-title">⚠️ Maintenance Alerts</h2>
					{alerts.length > 0 && (
						<span className="badge badge-danger">{alerts.length} High Risk</span>
					)}
				</div>
				{alerts.length === 0 ? (
					<div className="success-state">✅ All vehicles are in good health. No maintenance alerts.</div>
				) : (
					<div className="alerts-grid">
						{alerts.map((a) => (
							<div key={a.vehicleId} className="alert-card">
								<div className="alert-card-header">
									<span className="alert-vehicle-name">🚨 {a.vehicleType + ' #' + a.vehicleId}</span>
									<span className="badge badge-danger">{a.maintenanceRisk}</span>
								</div>
								<div className="alert-details">
									<span><strong>Age:</strong> {a.age} yrs</span>
									<span><strong>Mileage:</strong> {a.mileage?.toLocaleString()} km</span>
								</div>
								<p className="alert-message">
									Immediate maintenance required. High wear detected based on age and mileage data.
								</p>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
