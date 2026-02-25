// src/pages/TaskSuggestions.tsx
import React, { useEffect, useState } from 'react';
import { COLORS } from '../theme/colours';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface TaskSuggestion {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  suggestedPoints: number | null;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: {
    id: string;
    fullName: string;
    phone: string;
    level: number;
    tasksCompleted: number;
  };
}

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  cleaning:   { emoji: '✨', color: '#10B981', bg: '#D1FAE5' },
  cooking:    { emoji: '🍳', color: '#F59E0B', bg: '#FEF3C7' },
  organizing: { emoji: '📦', color: '#6366F1', bg: '#EEF2FF' },
  laundry:    { emoji: '👕', color: '#3B82F6', bg: '#DBEAFE' },
  other:      { emoji: '🏠', color: '#8B5CF6', bg: '#F3E8FF' },
};

const TaskSuggestions: React.FC = () => {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'pending' 
        ? '/task-suggestions/pending'
        : `/task-suggestions/all?status=${filter === 'all' ? '' : filter}`;
      const res = await api.get(endpoint);
      setSuggestions(res.data.suggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [filter]);

  const handleApprove = async (suggestion: TaskSuggestion) => {
    const basePoints = prompt(`Enter base points for "${suggestion.title}" (suggested: ${suggestion.suggestedPoints || 25}):`, String(suggestion.suggestedPoints || 25));
    if (!basePoints) return;

    const bonusPoints = prompt('Enter bonus points:', '10');
    const iconName = prompt('Enter icon name (e.g., checkmark-circle):', 'checkmark-circle');
    const iconColor = prompt('Enter icon color (hex):', '#4CAF50');

    setApprovingId(suggestion.id);
    try {
      await api.post(`/task-suggestions/${suggestion.id}/approve`, {
        basePoints: Number(basePoints),
        bonusPoints: Number(bonusPoints),
        iconName,
        iconColor,
        timeLimitMinutes: 30,
        estimatedMinutes: 30,
      });

      alert(`✅ Approved! Task "${suggestion.title}" created. User will receive 50 bonus points!`);
      loadSuggestions();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve suggestion');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string, title: string) => {
    const reason = prompt(`Why are you rejecting "${title}"?`, 'Does not fit our task requirements');
    if (!reason) return;

    try {
      await api.post(`/task-suggestions/${id}/reject`, { adminNote: reason });
      alert('✅ Suggestion rejected');
      loadSuggestions();
    } catch (error) {
      alert('Failed to reject suggestion');
    }
  };

  const stats = {
    pending: suggestions.filter(s => s.status === 'pending').length,
    approved: suggestions.filter(s => s.status === 'approved').length,
    rejected: suggestions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Task Suggestions</h1>
          <p style={s.subtitle}>
            {stats.pending} pending · {stats.approved} approved · {stats.rejected} rejected
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={s.filterRow}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <button
            key={f}
            style={{
              ...s.filterTab,
              ...(filter === f ? s.filterTabActive : {}),
            }}
            onClick={() => setFilter(f)}
          >
            {f === 'pending' && '⏳'} 
            {f === 'approved' && '✅'} 
            {f === 'rejected' && '❌'} 
            {f === 'all' && '📋'} 
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Suggestions Grid */}
      {loading ? (
        <div style={s.loadingBox}>Loading suggestions...</div>
      ) : suggestions.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={{ fontSize: 40 }}>📭</p>
          <p style={{ color: COLORS.textSecondary }}>
            No {filter === 'all' ? '' : filter} suggestions
          </p>
        </div>
      ) : (
        <div style={s.grid}>
          {suggestions.map(suggestion => {
            const catMeta = CATEGORY_META[suggestion.category] || CATEGORY_META.other;
            const isPending = suggestion.status === 'pending';
            const isApproved = suggestion.status === 'approved';
            const isRejected = suggestion.status === 'rejected';

            return (
              <div key={suggestion.id} style={s.card}>
                {/* Header */}
                <div style={s.cardHeader}>
                  <span
                    style={{
                      ...s.categoryBadge,
                      color: catMeta.color,
                      background: catMeta.bg,
                    }}
                  >
                    {catMeta.emoji} {suggestion.category}
                  </span>
                  <span
                    style={{
                      ...s.statusBadge,
                      ...(isPending && { color: COLORS.warning, background: COLORS.warningLight }),
                      ...(isApproved && { color: COLORS.secondary, background: COLORS.secondaryLight }),
                      ...(isRejected && { color: COLORS.error, background: COLORS.errorLight }),
                    }}
                  >
                    {isPending && '⏳ Pending'}
                    {isApproved && '✅ Approved'}
                    {isRejected && '❌ Rejected'}
                  </span>
                </div>

                {/* Title */}
                <h3 style={s.cardTitle}>{suggestion.title}</h3>

                {/* Description */}
                {suggestion.description && (
                  <p style={s.cardDesc}>{suggestion.description}</p>
                )}

                {/* Reason */}
                {suggestion.reason && (
                  <div style={s.reasonBox}>
                    <strong style={{ color: COLORS.primary }}>Why add this:</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.text }}>
                      {suggestion.reason}
                    </p>
                  </div>
                )}

                {/* Meta */}
                <div style={s.metaRow}>
                  <div style={s.metaItem}>
                    <span style={s.metaLabel}>Difficulty:</span>
                    <span style={s.metaValue}>{suggestion.difficulty}</span>
                  </div>
                  {suggestion.suggestedPoints && (
                    <div style={s.metaItem}>
                      <span style={s.metaLabel}>Suggested Points:</span>
                      <span style={{ ...s.metaValue, color: COLORS.primary }}>
                        {suggestion.suggestedPoints} pts
                      </span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div style={s.userBox}>
                  <div style={s.userAvatar}>{suggestion.user.fullName.charAt(0)}</div>
                  <div>
                    <div style={s.userName}>{suggestion.user.fullName}</div>
                    <div style={s.userMeta}>
                      Lv.{suggestion.user.level} · {suggestion.user.tasksCompleted} tasks
                    </div>
                  </div>
                </div>

                {/* Date */}
                <div style={s.dateRow}>
                  <div style={s.dateLabel}>
                    Submitted: {new Date(suggestion.createdAt).toLocaleDateString()}
                  </div>
                  {suggestion.reviewedAt && (
                    <div style={s.dateLabel}>
                      Reviewed: {new Date(suggestion.reviewedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Admin Note (if rejected) */}
                {suggestion.adminNote && (
                  <div style={s.adminNote}>
                    <strong>Admin Note:</strong> {suggestion.adminNote}
                  </div>
                )}

                {/* Actions (only for pending) */}
                {isPending && (
                  <div style={s.actionRow}>
                    <button
                      style={s.approveBtn}
                      onClick={() => handleApprove(suggestion)}
                      disabled={approvingId === suggestion.id}
                    >
                      {approvingId === suggestion.id ? '⏳ Approving...' : '✅ Approve & Create Task'}
                    </button>
                    <button
                      style={s.rejectBtn}
                      onClick={() => handleReject(suggestion.id, suggestion.title)}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const s: any = {
  page: { padding: 28, background: COLORS.background, minHeight: '100vh' },
  header: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: COLORS.text, margin: 0 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  filterRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filterTab: {
    padding: '8px 16px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    cursor: 'pointer',
    background: '#fff',
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: 500,
  },
  filterTabActive: { background: COLORS.primary, color: '#fff', borderColor: COLORS.primary },
  loadingBox: { textAlign: 'center', padding: 60, color: COLORS.textSecondary },
  emptyBox: { textAlign: 'center', padding: 80, color: COLORS.textSecondary },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: `1px solid ${COLORS.border}`,
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: {
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  cardTitle: { fontSize: 18, fontWeight: 700, color: COLORS.text, margin: '0 0 8px' },
  cardDesc: { fontSize: 14, color: COLORS.textSecondary, margin: '0 0 12px', lineHeight: 1.5 },
  reasonBox: {
    background: COLORS.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  metaRow: { display: 'flex', gap: 20, marginBottom: 12 },
  metaItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  metaLabel: { fontSize: 11, color: COLORS.textLight, textTransform: 'uppercase' },
  metaValue: { fontSize: 14, fontWeight: 600, color: COLORS.text, textTransform: 'capitalize' },
  userBox: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: COLORS.primary,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
  },
  userName: { fontSize: 14, fontWeight: 600, color: COLORS.text },
  userMeta: { fontSize: 12, color: COLORS.textLight },
  dateRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 },
  dateLabel: { fontSize: 11, color: COLORS.textLight },
  adminNote: {
    background: COLORS.errorLight,
    padding: 10,
    borderRadius: 6,
    fontSize: 12,
    color: COLORS.error,
    marginBottom: 12,
  },
  actionRow: { display: 'flex', gap: 8 },
  approveBtn: {
    flex: 1,
    padding: '10px',
    background: COLORS.secondary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  rejectBtn: {
    flex: 1,
    padding: '10px',
    background: COLORS.errorLight,
    color: COLORS.error,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
};

export default TaskSuggestions;