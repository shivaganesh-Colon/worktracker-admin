// src/pages/Programs.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../theme/colours';
import { programsApi, EngagementProgram } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  weekly:    { label: 'Weekly',    color: '#F59E0B', bg: '#FEF3C7', emoji: '🔥' },
  flash:     { label: 'Flash',     color: '#EF4444', bg: '#FEE2E2', emoji: '⚡' },
  challenge: { label: 'Challenge', color: '#6366F1', bg: '#EEF2FF', emoji: '🏆' },
  monthly:   { label: 'Monthly',   color: '#10B981', bg: '#D1FAE5', emoji: '📅' },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Component ─────────────────────────────────────────────────────────────────
const Programs: React.FC = () => {
  const navigate = useNavigate();
  const [programs, setPrograms]   = useState<EngagementProgram[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<'all' | 'weekly' | 'flash' | 'challenge' | 'monthly'>('all');
  const [seeding, setSeeding]     = useState(false);
  const [error, setError]         = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await programsApi.getAll();
      setPrograms(res.data.programs);
    } catch {
      setError('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await programsApi.toggleActive(id, !current);
      setPrograms(prev =>
        prev.map(p => p.id === id ? { ...p, isActive: !current } : p)
      );
    } catch {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await programsApi.delete(id);
      setPrograms(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Failed to delete program');
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await programsApi.seed();
      await load();
      alert('✅ Seed data added!');
    } catch {
      alert('Failed to seed');
    } finally {
      setSeeding(false);
    }
  };

  const filtered = filter === 'all' ? programs : programs.filter(p => p.type === filter);

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Engagement Programs</h1>
          <p style={s.subtitle}>{programs.length} total · {programs.filter(p => p.isActive).length} active</p>
        </div>
        <div style={s.headerActions}>
          <button style={s.seedBtn} onClick={handleSeed} disabled={seeding}>
            {seeding ? '⏳ Seeding...' : '🌱 Seed Data'}
          </button>
          <button style={s.createBtn} onClick={() => navigate('/programs/create')}>
            ➕ Create Program
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div style={s.filterRow}>
        {(['all', 'weekly', 'flash', 'challenge', 'monthly'] as const).map(f => (
          <button
            key={f}
            style={{ ...s.filterTab, ...(filter === f ? s.filterTabActive : {}) }}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '📋 All' : `${TYPE_META[f].emoji} ${TYPE_META[f].label}`}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && <div style={s.errorBanner}>{error}</div>}

      {/* ── Loading ── */}
      {loading ? (
        <div style={s.loadingBox}>Loading programs...</div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={{ fontSize: 40 }}>📭</p>
          <p style={{ color: COLORS.textSecondary }}>No programs yet. Create one or seed dummy data!</p>
        </div>
      ) : (
        /* ── Table ── */
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Program</th>
                <th style={s.th}>Type</th>
                <th style={s.th}>Target</th>
                <th style={s.th}>Reward</th>
                <th style={s.th}>Dates</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const meta    = TYPE_META[p.type] || TYPE_META.weekly;
                const expired = p.endDate && new Date(p.endDate) < new Date();
                return (
                  <tr key={p.id} style={{ ...s.row, background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    {/* Program name */}
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: COLORS.text }}>{p.title}</div>
                      {p.description && (
                        <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>
                          {p.description.slice(0, 60)}…
                        </div>
                      )}
                    </td>

                    {/* Type badge */}
                    <td style={s.td}>
                      <span style={{ ...s.badge, color: meta.color, background: meta.bg }}>
                        {meta.emoji} {meta.label}
                      </span>
                    </td>

                    {/* Target */}
                    <td style={s.td}>
                      <div style={{ color: COLORS.text, fontWeight: 500 }}>
                        {p.taskTarget ? `${p.taskTarget} tasks` : '—'}
                      </div>
                      {p.multiplier && (
                        <div style={{ fontSize: 12, color: COLORS.warning }}>×{p.multiplier} pts</div>
                      )}
                    </td>

                    {/* Reward */}
                    <td style={s.td}>
                      <div style={{ color: COLORS.primary, fontWeight: 600 }}>
                        {p.points ? `+${p.points} pts` : '—'}
                      </div>
                      {p.bonusPoints && (
                        <div style={{ fontSize: 12, color: COLORS.secondary }}>+{p.bonusPoints} bonus</div>
                      )}
                    </td>

                    {/* Dates */}
                    <td style={s.td}>
                      <div style={{ fontSize: 13, color: COLORS.text }}>{formatDate(p.startDate)}</div>
                      {p.endDate && (
                        <div style={{ fontSize: 12, color: expired ? COLORS.error : COLORS.textLight }}>
                          → {formatDate(p.endDate)} {expired ? '(Ended)' : ''}
                        </div>
                      )}
                    </td>

                    {/* Toggle */}
                    <td style={s.td}>
                      <div
                        style={{
                          ...s.toggle,
                          background: p.isActive ? COLORS.secondary : COLORS.border,
                        }}
                        onClick={() => handleToggle(p.id, p.isActive)}
                        title={p.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <div style={{ ...s.toggleThumb, transform: p.isActive ? 'translateX(18px)' : 'translateX(0)' }} />
                      </div>
                      <div style={{ fontSize: 11, color: p.isActive ? COLORS.secondary : COLORS.textLight, marginTop: 4 }}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={s.td}>
                      <div style={s.actionBtns}>
                        <button style={s.viewBtn} onClick={() => navigate(`/programs/${p.id}`)}>👁 View</button>
                        <button style={s.editBtn} onClick={() => navigate(`/programs/${p.id}/edit`)}>✏️ Edit</button>
                        <button style={s.delBtn}  onClick={() => handleDelete(p.id, p.title)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s: any = {
  page:         { padding: 28, background: COLORS.background, minHeight: '100vh' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title:        { fontSize: 26, fontWeight: 700, color: COLORS.text, margin: 0 },
  subtitle:     { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  headerActions:{ display: 'flex', gap: 12 },
  createBtn:    { background: COLORS.primary, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  seedBtn:      { background: COLORS.secondary, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  filterRow:    { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const },
  filterTab:    { padding: '8px 16px', border: `1px solid ${COLORS.border}`, borderRadius: 20, cursor: 'pointer', background: '#fff', fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 },
  filterTabActive:{ background: COLORS.primary, color: '#fff', borderColor: COLORS.primary },
  errorBanner:  { background: COLORS.errorLight, color: COLORS.error, padding: 12, borderRadius: 8, marginBottom: 16 },
  loadingBox:   { textAlign: 'center' as const, padding: 60, color: COLORS.textSecondary },
  emptyBox:     { textAlign: 'center' as const, padding: 80, color: COLORS.textSecondary },
  tableWrap:    { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  table:        { width: '100%', borderCollapse: 'collapse' as const },
  thead:        { background: COLORS.background },
  th:           { padding: '14px 16px', textAlign: 'left' as const, fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  row:          { borderBottom: `1px solid ${COLORS.border}`, transition: 'background 0.15s' },
  td:           { padding: '14px 16px', verticalAlign: 'top' as const },
  badge:        { display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  toggle:       { width: 40, height: 22, borderRadius: 11, cursor: 'pointer', position: 'relative' as const, transition: 'background 0.2s' },
  toggleThumb:  { position: 'absolute' as const, top: 3, left: 3, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'transform 0.2s' },
  actionBtns:   { display: 'flex', gap: 6 },
  viewBtn:      { padding: '5px 10px', background: COLORS.primaryLight, color: COLORS.primary, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  editBtn:      { padding: '5px 10px', background: COLORS.warningLight, color: COLORS.warning, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  delBtn:       { padding: '5px 10px', background: COLORS.errorLight, color: COLORS.error, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 },
};

export default Programs;
