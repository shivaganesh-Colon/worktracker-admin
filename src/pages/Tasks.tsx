// src/pages/Tasks.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../theme/colours';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';
const api = axios.create({ baseURL: BASE_URL });

// Add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string;
  basePoints: number;
  bonusPoints: number;
  timeLimitMinutes: number | null;
  iconName: string | null;
  iconColor: string | null;
  difficulty: string;
  estimatedMinutes: number | null;
  isDefault: boolean;
  isActive: boolean;
  _count?: {
    userTasks: number;
    posts: number;
  };
}

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  cleaning:   { emoji: '✨', color: '#10B981', bg: '#D1FAE5' },
  cooking:    { emoji: '🍳', color: '#F59E0B', bg: '#FEF3C7' },
  organizing: { emoji: '📦', color: '#6366F1', bg: '#EEF2FF' },
  laundry:    { emoji: '👕', color: '#3B82F6', bg: '#DBEAFE' },
  other:      { emoji: '🏠', color: '#8B5CF6', bg: '#F3E8FF' },
};

const DIFFICULTY_META: Record<string, { color: string; bg: string }> = {
  easy:   { color: '#10B981', bg: '#D1FAE5' },
  medium: { color: '#F59E0B', bg: '#FEF3C7' },
  hard:   { color: '#EF4444', bg: '#FEE2E2' },
};

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'cleaning' | 'cooking' | 'organizing' | 'laundry' | 'other'>('all');
  const [diffFilter, setDiffFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [showOnlyDefault, setShowOnlyDefault] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/tasks');
      setTasks(res.data.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.post(`/admin/tasks/${id}/${currentStatus ? 'deactivate' : 'activate'}`);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, isActive: !currentStatus } : t));
    } catch (error) {
      alert('Failed to update task status');
    }
  };

  const handleDelete = async (id: string, title: string, isDefault: boolean) => {
    if (isDefault) {
      alert('Cannot delete default tasks');
      return;
    }
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    
    try {
      await api.delete(`/admin/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete task');
    }
  };

  let filtered = tasks;
  if (filter !== 'all') filtered = filtered.filter(t => t.category === filter);
  if (diffFilter !== 'all') filtered = filtered.filter(t => t.difficulty === diffFilter);
  if (showOnlyDefault) filtered = filtered.filter(t => t.isDefault);

  const stats = {
    total: tasks.length,
    default: tasks.filter(t => t.isDefault).length,
    custom: tasks.filter(t => !t.isDefault).length,
    active: tasks.filter(t => t.isActive).length,
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Task Management</h1>
          <p style={s.subtitle}>
            {stats.total} total · {stats.default} default · {stats.custom} custom · {stats.active} active
          </p>
        </div>
        <button style={s.createBtn} onClick={() => navigate('/tasks/create')}>
          ➕ Create Task
        </button>
      </div>

      {/* Filter Bar */}
      <div style={s.filterSection}>
        {/* Category Filter */}
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Category:</label>
          <div style={s.filterRow}>
            {(['all', 'cleaning', 'cooking', 'organizing', 'laundry', 'other'] as const).map(cat => {
              const meta = cat === 'all' ? null : CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  style={{
                    ...s.filterBtn,
                    ...(filter === cat ? s.filterBtnActive : {}),
                  }}
                  onClick={() => setFilter(cat)}
                >
                  {meta ? `${meta.emoji} ${cat}` : '📋 All'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>Difficulty:</label>
          <div style={s.filterRow}>
            {(['all', 'easy', 'medium', 'hard'] as const).map(diff => (
              <button
                key={diff}
                style={{
                  ...s.filterBtn,
                  ...(diffFilter === diff ? s.filterBtnActive : {}),
                }}
                onClick={() => setDiffFilter(diff)}
              >
                {diff === 'all' ? '🎯 All' : diff}
              </button>
            ))}
          </div>
        </div>

        {/* Default Filter */}
        <label style={s.checkLabel}>
          <input
            type="checkbox"
            checked={showOnlyDefault}
            onChange={e => setShowOnlyDefault(e.target.checked)}
            style={s.checkbox}
          />
          Show only default tasks
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <div style={s.loadingBox}>Loading tasks...</div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyBox}>
          <p style={{ fontSize: 40 }}>📭</p>
          <p style={{ color: COLORS.textSecondary }}>No tasks found</p>
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>Task</th>
                <th style={s.th}>Category</th>
                <th style={s.th}>Points</th>
                <th style={s.th}>Difficulty</th>
                <th style={s.th}>Time</th>
                <th style={s.th}>Completions</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, i) => {
                const catMeta = CATEGORY_META[task.category] || CATEGORY_META.other;
                const diffMeta = DIFFICULTY_META[task.difficulty];
                return (
                  <tr
                    key={task.id}
                    style={{
                      ...s.row,
                      background: i % 2 === 0 ? '#fff' : '#FAFAFA',
                    }}
                  >
                    {/* Task Name */}
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: task.iconColor || catMeta.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                          }}
                        >
                          {catMeta.emoji}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: COLORS.text, display: 'flex', gap: 6, alignItems: 'center' }}>
                            {task.title}
                            {task.isDefault && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: COLORS.primary,
                                  background: COLORS.primaryLight,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                }}
                              >
                                DEFAULT
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <div style={{ fontSize: 12, color: COLORS.textLight, marginTop: 2 }}>
                              {task.description.slice(0, 50)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={s.td}>
                      <span
                        style={{
                          ...s.badge,
                          color: catMeta.color,
                          background: catMeta.bg,
                        }}
                      >
                        {catMeta.emoji} {task.category}
                      </span>
                    </td>

                    {/* Points */}
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: COLORS.primary }}>
                        {task.basePoints} pts
                      </div>
                      {task.bonusPoints > 0 && (
                        <div style={{ fontSize: 12, color: COLORS.secondary }}>
                          +{task.bonusPoints} bonus
                        </div>
                      )}
                    </td>

                    {/* Difficulty */}
                    <td style={s.td}>
                      <span
                        style={{
                          ...s.badge,
                          color: diffMeta.color,
                          background: diffMeta.bg,
                        }}
                      >
                        {task.difficulty}
                      </span>
                    </td>

                    {/* Time */}
                    <td style={s.td}>
                      <div style={{ fontSize: 13, color: COLORS.text }}>
                        ~{task.estimatedMinutes || task.timeLimitMinutes || '—'} min
                      </div>
                    </td>

                    {/* Completions */}
                    <td style={s.td}>
                      <div style={{ fontWeight: 600, color: COLORS.text }}>
                        {task._count?.userTasks || 0}
                      </div>
                      {task._count?.posts && task._count.posts > 0 && (
                        <div style={{ fontSize: 11, color: COLORS.textLight }}>
                          {task._count.posts} posts
                        </div>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td style={s.td}>
                      <div
                        style={{
                          ...s.toggle,
                          background: task.isActive ? COLORS.secondary : COLORS.border,
                          cursor: 'pointer',
                        }}
                        onClick={() => handleToggleActive(task.id, task.isActive)}
                      >
                        <div
                          style={{
                            ...s.toggleThumb,
                            transform: task.isActive ? 'translateX(18px)' : 'translateX(0)',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: task.isActive ? COLORS.secondary : COLORS.textLight,
                          marginTop: 4,
                        }}
                      >
                        {task.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={s.td}>
                      <div style={s.actionBtns}>
                        <button
                          style={s.editBtn}
                          onClick={() => navigate(`/tasks/${task.id}/edit`)}
                        >
                          ✏️ Edit
                        </button>
                        {!task.isDefault && (
                          <button
                            style={s.delBtn}
                            onClick={() => handleDelete(task.id, task.title, task.isDefault)}
                          >
                            🗑
                          </button>
                        )}
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

const s: any = {
  page: { padding: 28, background: COLORS.background, minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 700, color: COLORS.text, margin: 0 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  createBtn: {
    background: COLORS.primary,
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
  },
  filterSection: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  filterGroup: { marginBottom: 16 },
  filterLabel: { display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterBtn: {
    padding: '6px 14px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    cursor: 'pointer',
    background: '#fff',
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  filterBtnActive: {
    background: COLORS.primary,
    color: '#fff',
    borderColor: COLORS.primary,
  },
  checkLabel: { display: 'flex', alignItems: 'center', fontSize: 14, color: COLORS.text, cursor: 'pointer' },
  checkbox: { marginRight: 8 },
  loadingBox: { textAlign: 'center', padding: 60, color: COLORS.textSecondary },
  emptyBox: { textAlign: 'center', padding: 80, color: COLORS.textSecondary },
  tableWrap: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: COLORS.background },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  row: { borderBottom: `1px solid ${COLORS.border}` },
  td: { padding: '14px 16px', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    position: 'relative',
    transition: 'background 0.2s',
  },
  toggleThumb: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 16,
    height: 16,
    background: '#fff',
    borderRadius: '50%',
    transition: 'transform 0.2s',
  },
  actionBtns: { display: 'flex', gap: 6 },
  editBtn: {
    padding: '5px 10px',
    background: COLORS.warningLight,
    color: COLORS.warning,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  delBtn: {
    padding: '5px 10px',
    background: COLORS.errorLight,
    color: COLORS.error,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
};

export default Tasks;