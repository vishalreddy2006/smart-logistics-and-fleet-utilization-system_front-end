import React, { useState } from 'react';

const RISK_CLASS = { LOW: 'badge-success', MEDIUM: 'badge-warning', HIGH: 'badge-danger' };
const STATUS_CLASS = {
  ACTIVE: 'badge-success',
  IDLE: 'badge-secondary',
  MAINTENANCE: 'badge-warning',
  INACTIVE: 'badge-danger',
};

const VEHICLE_TYPES = ['Truck', 'Van', 'Motorcycle', 'Car', 'Bus', 'Trailer'];
const STATUSES = ['ACTIVE', 'IDLE', 'MAINTENANCE', 'INACTIVE'];

export default function VehicleTable({ vehicles, onDelete, onUpdate }) {
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEdit = (v) => {
    setEditId(v.vehicleId);
    setEditForm({
      vehicleType: v.vehicleType,
      capacity: v.capacity,
      mileage: v.mileage,
      age: v.age,
      status: v.status,
    });
  };

  const cancelEdit = () => setEditId(null);

  const saveEdit = async () => {
    if (onUpdate) {
      await onUpdate(editId, {
        ...editForm,
        capacity: Number(editForm.capacity),
        mileage: Number(editForm.mileage),
        age: Number(editForm.age),
      });
    }
    setEditId(null);
  };

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="table-empty">
        No vehicles found. Add a vehicle above to get started.
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Capacity (T)</th>
            <th>Mileage (km)</th>
            <th>Age (yrs)</th>
            <th>Status</th>
            <th>Maint. Risk</th>
            {(onDelete || onUpdate) && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) =>
            editId === v.vehicleId ? (
              <tr key={v.vehicleId} className="editing-row">
                <td>#{v.vehicleId}</td>
                <td>
                  <select
                    value={editForm.vehicleType}
                    onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })}
                  >
                    {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={editForm.capacity}
                    onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={editForm.mileage}
                    onChange={(e) => setEditForm({ ...editForm, mileage: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                  />
                </td>
                <td>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td>—</td>
                <td className="action-cell">
                  <button className="btn btn-sm btn-success" onClick={saveEdit}>Save</button>
                  <button className="btn btn-sm btn-ghost" onClick={cancelEdit}>Cancel</button>
                </td>
              </tr>
            ) : (
              <tr key={v.vehicleId}>
                <td>
                  <span className="id-badge">#{v.vehicleId}</span>
                </td>
                <td><strong>{v.vehicleType}</strong></td>
                <td>{v.capacity?.toLocaleString() ?? '—'}</td>
                <td>{v.mileage?.toLocaleString() ?? '—'}</td>
                <td>{v.age ?? '—'}</td>
                <td>
                  <span className={`badge ${STATUS_CLASS[v.status] || 'badge-secondary'}`}>
                    {v.status || '—'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${RISK_CLASS[v.maintenanceRisk] || 'badge-secondary'}`}>
                    {v.maintenanceRisk || 'N/A'}
                  </span>
                </td>
                {(onDelete || onUpdate) && (
                  <td className="action-cell">
                    {onUpdate && (
                      <button className="btn btn-sm btn-outline" onClick={() => startEdit(v)}>
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="btn btn-sm btn-danger-outline"
                        onClick={() => onDelete(v.vehicleId)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
