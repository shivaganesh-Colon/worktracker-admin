// worktracker-admin/src/pages/Areas.tsx
import React, { useState, useEffect } from 'react';
import { areaApi } from '../services/api';

interface Area {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  mapsLink: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count?: { users: number; sponsors: number };
}

export default function Areas() {
  const [areas, setAreas]         = useState<Area[]>([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [search, setSearch]       = useState('');

  // Form state
  const [name, setName]           = useState('');
  const [city, setCity]           = useState('Hyderabad');
  const [state, setState]         = useState('Telangana');
  const [sortOrder, setSortOrder] = useState('0');

  useEffect(() => { loadAreas(); }, []);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const res = await areaApi.adminGetAll();
      setAreas(res.data.areas || []);
    } catch {
      setError('Failed to load areas');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(''); setCity('Hyderabad'); setState('Telangana'); setSortOrder('0');
  };

  const handleAdd = async () => {
    if (!name.trim()) return setError('Area name is required');
    try {
      setSubmitting(true);
      setError('');
      await areaApi.add({ name: name.trim(), city, state, sortOrder: parseInt(sortOrder) });
      setSuccess(`✅ "${name}" added successfully!`);
      resetForm();
      loadAreas();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add area');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await areaApi.toggle(id);
      loadAreas();
    } catch {
      setError('Failed to toggle area');
    }
  };

  const filteredAreas = areas.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, marginTop: 0 }}>
        📍 Areas Management
      </h2>
      <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>
        Manage locality areas — used to target advertisements to specific areas.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── ADD FORM ── */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>➕ Add New Area</h3>

          {error   && <div style={s.error}>{error}</div>}
          {success && <div style={s.success}>{success}</div>}

          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>Area Name *</label>
            <input
              style={s.input}
              placeholder="e.g. Dilsukhnagar"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>City</label>
            <input
              style={s.input}
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={s.label}>State</label>
            <input
              style={s.input}
              value={state}
              onChange={e => setState(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={s.label}>Sort Order (higher = shown first)</label>
            <input
              style={s.input}
              type="number"
              placeholder="0"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            />
          </div>

          <button
            style={{ ...s.btn, opacity: submitting ? 0.6 : 1 }}
            onClick={handleAdd}
            disabled={submitting}
          >
            {submitting ? 'Adding...' : '➕ Add Area'}
          </button>
        </div>

        {/* ── LIST ── */}
        <div style={s.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ ...s.cardTitle, marginBottom: 0 }}>
              📋 All Areas ({filteredAreas.length})
            </h3>
            <input
              style={{ ...s.input, width: 220, marginBottom: 0 }}
              placeholder="🔍 Search area..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading...</div>
          ) : filteredAreas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
              <div style={{ fontSize: 32 }}>📍</div>
              <div style={{ marginTop: 8 }}>No areas found</div>
            </div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={s.th}>Area Name</th>
                    <th style={s.th}>City</th>
                    <th style={s.th}>Users</th>
                    <th style={s.th}>Ads</th>
                    <th style={s.th}>Maps</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAreas.map(area => (
                    <tr key={area.id} style={{ borderBottom: '1px solid #F3F4F6', opacity: area.isActive ? 1 : 0.5 }}>
                      <td style={s.td}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{area.name}</span>
                      </td>
                      <td style={s.td}>{area.city}</td>
                      <td style={s.td}>
                        <span style={{ background: '#EEF2FF', color: '#6366F1', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                          {area._count?.users || 0}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ background: '#D1FAE5', color: '#059669', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                          {area._count?.sponsors || 0}
                        </span>
                      </td>
                      <td style={s.td}>
                        {area.mapsLink
                          ? <a href={area.mapsLink} target="_blank" rel="noreferrer" style={{ color: '#6366F1', fontSize: 12 }}>📍 View</a>
                          : <span style={{ color: '#D1D5DB' }}>—</span>
                        }
                      </td>
                      <td style={s.td}>
                        <span style={{
                          background: area.isActive ? '#D1FAE5' : '#F3F4F6',
                          color: area.isActive ? '#059669' : '#9CA3AF',
                          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700
                        }}>
                          {area.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={s.td}>
                        <button
                          style={{
                            padding: '4px 12px', border: 'none', borderRadius: 6,
                            fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            background: area.isActive ? '#FEF3C7' : '#D1FAE5',
                            color: area.isActive ? '#D97706' : '#059669',
                          }}
                          onClick={() => handleToggle(area.id)}
                        >
                          {area.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s: any = {
  card:      { background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20 },
  cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16, marginTop: 0 },
  label:     { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input:     { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, boxSizing: 'border-box' as const, outline: 'none', marginBottom: 0 },
  btn:       { width: '100%', padding: 12, backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' },
  error:     { backgroundColor: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 },
  success:   { backgroundColor: '#D1FAE5', color: '#059669', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 },
  th:        { textAlign: 'left' as const, padding: '8px 12px', color: '#6B7280', fontWeight: 600, fontSize: 12 },
  td:        { padding: '10px 12px', color: '#374151' },
};