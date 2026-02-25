// src/pages/ProgramDetail.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { COLORS } from '../theme/colours';
import { programsApi, EngagementProgram, UserProgram } from '../services/api';

const TYPE_META: Record<string, { color: string; bg: string; emoji: string }> = {
  weekly:    { color: '#F59E0B', bg: '#FEF3C7', emoji: '🔥' },
  flash:     { color: '#EF4444', bg: '#FEE2E2', emoji: '⚡' },
  challenge: { color: '#6366F1', bg: '#EEF2FF', emoji: '🏆' },
  monthly:   { color: '#10B981', bg: '#D1FAE5', emoji: '📅' },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div style={{ background: COLORS.border, borderRadius: 4, height: 6, width: '100%' }}>
    <div style={{ width: `${value}%`, background: value === 100 ? COLORS.secondary : COLORS.primary, height: '100%', borderRadius: 4, transition: 'width 0.3s' }} />
  </div>
);

const ProgramDetail: React.FC = () => {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const [program, setProgram]       = useState<EngagementProgram | null>(null);
  const [participants, setParticipants] = useState<UserProgram[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      programsApi.getById(id),
      programsApi.getParticipants(id),
    ]).then(([pRes, partRes]) => {
      setProgram(pRes.data.program);
      setParticipants(partRes.data.participants);
    }).catch(() => setError('Failed to load program'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={s.loading}>Loading...</div>;
  if (error)   return <div style={s.loading}>{error}</div>;
  if (!program) return null;

  const meta       = TYPE_META[program.type] || TYPE_META.weekly;
  const completed  = participants.filter(p => p.completed).length;
  const inProgress = participants.filter(p => !p.completed).length;
  const avgProgress = participants.length
    ? Math.round(participants.reduce((a, p) => a + p.progress, 0) / participants.length)
    : 0;

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/programs')}>← Back</button>
        <div style={s.headerRight}>
          <button style={s.editBtn} onClick={() => navigate(`/programs/${id}/edit`)}>✏️ Edit</button>
        </div>
      </div>

      {/* ── Program Card ── */}
      <div style={s.card}>
        <div style={s.cardTop}>
          <span style={{ ...s.typeBadge, color: meta.color, background: meta.bg }}>
            {meta.emoji} {program.type}
          </span>
          <span style={{ ...s.statusBadge, background: program.isActive ? COLORS.secondaryLight : COLORS.border, color: program.isActive ? COLORS.secondary : COLORS.textSecondary }}>
            {program.isActive ? '● Active' : '○ Inactive'}
          </span>
        </div>
        <h1 style={s.programTitle}>{program.title}</h1>
        {program.description && <p style={s.desc}>{program.description}</p>}

        {/* Meta grid */}
        <div style={s.metaGrid}>
          {program.taskTarget && (
            <div style={s.metaItem}>
              <span style={s.metaLabel}>🎯 Target</span>
              <span style={s.metaValue}>{program.taskTarget} tasks</span>
            </div>
          )}
          {program.points && (
            <div style={s.metaItem}>
              <span style={s.metaLabel}>⭐ Points</span>
              <span style={s.metaValue}>{program.points}</span>
            </div>
          )}
          {program.bonusPoints && (
            <div style={s.metaItem}>
              <span style={s.metaLabel}>🎁 Bonus</span>
              <span style={s.metaValue}>+{program.bonusPoints}</span>
            </div>
          )}
          {program.multiplier && (
            <div style={s.metaItem}>
              <span style={s.metaLabel}>✨ Multiplier</span>
              <span style={s.metaValue}>{program.multiplier}×</span>
            </div>
          )}
          {program.durationDays && (
            <div style={s.metaItem}>
              <span style={s.metaLabel}>📆 Duration</span>
              <span style={s.metaValue}>{program.durationDays} days</span>
            </div>
          )}
          <div style={s.metaItem}>
            <span style={s.metaLabel}>🗓 Start</span>
            <span style={s.metaValue}>{formatDate(program.startDate)}</span>
          </div>
          {program.endDate && (
            <div style={s.metaItem}>
              <span style={s.metaLabel}>🏁 End</span>
              <span style={s.metaValue}>{formatDate(program.endDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statNum}>{participants.length}</div>
          <div style={s.statLabel}>Total Joined</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statNum, color: COLORS.secondary }}>{completed}</div>
          <div style={s.statLabel}>Completed</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statNum, color: COLORS.warning }}>{inProgress}</div>
          <div style={s.statLabel}>In Progress</div>
        </div>
        <div style={s.statCard}>
          <div style={{ ...s.statNum, color: COLORS.primary }}>{avgProgress}%</div>
          <div style={s.statLabel}>Avg Progress</div>
        </div>
      </div>

      {/* ── Participants Table ── */}
      <div style={s.tableCard}>
        <h2 style={s.tableTitle}>👥 Participants ({participants.length})</h2>
        {participants.length === 0 ? (
          <div style={s.emptyPart}>No participants yet</div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>#</th>
                <th style={s.th}>User</th>
                <th style={s.th}>Progress</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Joined</th>
                <th style={s.th}>Completed</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={s.td}>{i + 1}</td>
                  <td style={s.td}>
                    <div style={{ fontWeight: 600, color: COLORS.text }}>
                      {p.user?.fullName || 'Unknown'}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textLight }}>
                      Lv.{p.user?.level ?? '—'}
                    </div>
                  </td>
                  <td style={{ ...s.td, minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ProgressBar value={p.progress} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, whiteSpace: 'nowrap' }}>
                        {p.progress}%
                      </span>
                    </div>
                  </td>
                  <td style={s.td}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: p.completed ? COLORS.secondaryLight : COLORS.primaryLight,
                      color:      p.completed ? COLORS.secondary       : COLORS.primary,
                    }}>
                      {p.completed ? '✅ Done' : '🔄 Active'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
                      {formatDate(p.joinedAt)}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
                      {p.completedAt ? formatDate(p.completedAt) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const s: any = {
  page:         { padding: 28, background: COLORS.background, minHeight: '100vh' },
  loading:      { padding: 60, textAlign: 'center', color: COLORS.textSecondary },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backBtn:      { background: 'none', border: `1px solid ${COLORS.border}`, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: COLORS.text, fontSize: 14 },
  editBtn:      { background: COLORS.warningLight, color: COLORS.warning, border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  headerRight:  { display: 'flex', gap: 10 },
  card:         { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  cardTop:      { display: 'flex', gap: 10, marginBottom: 12 },
  typeBadge:    { padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  statusBadge:  { padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  programTitle: { fontSize: 24, fontWeight: 700, color: COLORS.text, margin: '0 0 8px' },
  desc:         { color: COLORS.textSecondary, fontSize: 15, marginBottom: 20 },
  metaGrid:     { display: 'flex', gap: 24, flexWrap: 'wrap' },
  metaItem:     { display: 'flex', flexDirection: 'column', gap: 4 },
  metaLabel:    { fontSize: 12, color: COLORS.textLight },
  metaValue:    { fontSize: 15, fontWeight: 700, color: COLORS.text },
  statsRow:     { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 },
  statCard:     { background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' },
  statNum:      { fontSize: 28, fontWeight: 800, color: COLORS.primary },
  statLabel:    { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  tableCard:    { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  tableTitle:   { fontSize: 17, fontWeight: 700, color: COLORS.text, margin: '0 0 16px' },
  emptyPart:    { textAlign: 'center', padding: 40, color: COLORS.textSecondary },
  table:        { width: '100%', borderCollapse: 'collapse' },
  thead:        { background: COLORS.background },
  th:           { padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' },
  td:           { padding: '12px 14px', verticalAlign: 'middle' },
};

export default ProgramDetail;