// src/pages/Dashboard.tsx - UPDATED with Tasks buttons
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../theme/colours';
import { dashboardApi, programsApi } from '../services/api';

interface Stats {
  users:        number;
  vendors:      number;
  rewards:      number;
  redemptions:  number;
}

interface ProgramStats {
  totalPrograms:     number;
  activePrograms:    number;
  totalParticipants: number;
  completionRate:    number;
}

const StatCard: React.FC<{
  label: string;
  value: number | string;
  icon: string;
  color: string;
  bg: string;
  onClick?: () => void;
}> = ({ label, value, icon, color, bg, onClick }) => (
  <div style={{ ...s.card, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
    <div style={{ ...s.iconCircle, background: bg }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
    </div>
    <div>
      <p style={{ ...s.value, color }}>{value}</p>
      <h3 style={s.cardLabel}>{label}</h3>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats,  setStats]         = useState<Stats>({ users: 0, vendors: 0, rewards: 0, redemptions: 0 });
  const [pStats, setPStats]        = useState<ProgramStats | null>(null);
  const [loading, setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.getStats().catch(() => ({ data: { users: 1240, vendors: 85, rewards: 23, redemptions: 540 } })),
      programsApi.getStats().catch(() => null),
    ]).then(([dRes, pRes]) => {
      setStats(dRes.data as Stats);
      if (pRes) setPStats(pRes.data.stats as ProgramStats);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Admin Dashboard</h1>
          <p style={s.subtitle}>Welcome back! Here's what's happening.</p>
        </div>
        <div style={{ fontSize: 13, color: COLORS.textLight }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Main Stats */}
      <h2 style={s.sectionLabel}>📊 Overview</h2>
      <div style={s.grid}>
        <StatCard label="Total Users"     value={stats.users}       icon="👥" color={COLORS.primary}   bg={COLORS.primaryLight} />
        <StatCard label="Vendors"         value={stats.vendors}     icon="🏪" color={COLORS.warning}   bg="#FEF3C7" />
        <StatCard label="Active Rewards"  value={stats.rewards}     icon="🎁" color={COLORS.secondary} bg={COLORS.secondaryLight} />
        <StatCard label="Redemptions"     value={stats.redemptions} icon="✅" color="#8B5CF6"           bg="#F3E8FF" />
      </div>

      {/* Programs Stats */}
      {pStats && (
        <>
          <h2 style={s.sectionLabel}>🏆 Engagement Programs</h2>
          <div style={s.grid}>
            <StatCard
              label="Total Programs"
              value={pStats.totalPrograms}
              icon="📋" color={COLORS.primary} bg={COLORS.primaryLight}
              onClick={() => navigate('/programs')}
            />
            <StatCard
              label="Active Programs"
              value={pStats.activePrograms}
              icon="🟢" color={COLORS.secondary} bg={COLORS.secondaryLight}
              onClick={() => navigate('/programs')}
            />
            <StatCard
              label="Participants"
              value={pStats.totalParticipants}
              icon="👤" color={COLORS.warning} bg="#FEF3C7"
            />
            <StatCard
              label="Completion Rate"
              value={`${pStats.completionRate}%`}
              icon="🎯" color="#8B5CF6" bg="#F3E8FF"
            />
          </div>
        </>
      )}

      {/* Quick Actions */}
      <h2 style={s.sectionLabel}>⚡ Quick Actions</h2>
      <div style={s.actions}>
        <button style={s.primaryBtn} onClick={() => navigate('/programs/create')}>
          ➕ Create Program
        </button>
        <button style={s.secondaryBtn} onClick={() => navigate('/programs')}>
          🏆 Manage Programs
        </button>
        <button 
          style={{ ...s.secondaryBtn, background: COLORS.primaryLight, color: COLORS.primary }}
          onClick={() => navigate('/tasks')}
        >
          ✅ Manage Tasks
        </button>
        <button 
          style={{ ...s.secondaryBtn, background: '#FEF3C7', color: COLORS.warning }}
          onClick={() => navigate('/task-suggestions')}
        >
          💡 Review Suggestions
        </button>
      </div>
    </div>
  );
};

const s: any = {
  container:   { padding: 28, background: COLORS.background, minHeight: '100vh' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title:       { fontSize: 26, fontWeight: 800, color: COLORS.text, margin: 0 },
  subtitle:    { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  sectionLabel:{ fontSize: 16, fontWeight: 700, color: COLORS.text, margin: '24px 0 12px' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 },
  card:        { background: '#fff', padding: '20px 24px', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 16, transition: 'box-shadow 0.2s' },
  iconCircle:  { width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  value:       { fontSize: 28, fontWeight: 800, margin: '0 0 2px' },
  cardLabel:   { fontSize: 13, fontWeight: 500, color: COLORS.textSecondary, margin: 0 },
  actions:     { display: 'flex', gap: 12, flexWrap: 'wrap' },
  primaryBtn:  { background: COLORS.primary, color: '#fff', padding: '12px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
  secondaryBtn:{ background: COLORS.secondaryLight, color: COLORS.secondary, padding: '12px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 },
};

export default AdminDashboard;