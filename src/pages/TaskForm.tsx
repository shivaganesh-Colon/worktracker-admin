// src/pages/TaskForm.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { COLORS } from '../theme/colours';
import axios from 'axios';

const BASE_URL = 'https://api.homvika.com/api/v1';

const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const CATEGORIES = ['cleaning', 'cooking', 'organizing', 'laundry', 'other'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  cleaning:   { emoji: '✨', color: '#10B981', bg: '#D1FAE5' },
  cooking:    { emoji: '🍳', color: '#F59E0B', bg: '#FEF3C7' },
  organizing: { emoji: '📦', color: '#6366F1', bg: '#EEF2FF' },
  laundry:    { emoji: '👕', color: '#3B82F6', bg: '#DBEAFE' },
  other:      { emoji: '🏠', color: '#8B5CF6', bg: '#F3E8FF' },
};

const DIFFICULTY_META: Record<string, { color: string; bg: string; label: string }> = {
  easy:   { color: '#10B981', bg: '#D1FAE5', label: '🟢 Easy' },
  medium: { color: '#F59E0B', bg: '#FEF3C7', label: '🟡 Medium' },
  hard:   { color: '#EF4444', bg: '#FEE2E2', label: '🔴 Hard' },
};

const TaskForm: React.FC = () => {
  const navigate = useNavigate();
  const { id }   = useParams<{ id: string }>();
  const isEdit   = !!id;

  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  // Form fields
  const [title,            setTitle]            = useState('');
  const [description,      setDescription]      = useState('');
  const [category,         setCategory]         = useState('cleaning');
  const [basePoints,       setBasePoints]       = useState('50');
  const [bonusPoints,      setBonusPoints]      = useState('0');
  const [difficulty,       setDifficulty]       = useState('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [iconName,         setIconName]         = useState('');
  const [iconColor,        setIconColor]        = useState('#6366F1');
  const [isActive,         setIsActive]         = useState(true);
  const [isDefault,        setIsDefault]        = useState(false);

  // Load task data if editing
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/tasks/${id}`);
        const t   = res.data.task || res.data;
        setTitle(t.title || '');
        setDescription(t.description || '');
        setCategory(t.category || 'cleaning');
        setBasePoints(String(t.basePoints ?? 50));
        setBonusPoints(String(t.bonusPoints ?? 0));
        setDifficulty(t.difficulty || 'medium');
        setEstimatedMinutes(String(t.estimatedMinutes || ''));
        setTimeLimitMinutes(String(t.timeLimitMinutes || ''));
        setIconName(t.iconName || '');
        setIconColor(t.iconColor || '#6366F1');
        setIsActive(t.isActive ?? true);
        setIsDefault(t.isDefault ?? false);
      } catch {
        setError('Failed to load task');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!basePoints || Number(basePoints) < 1) { setError('Base points must be at least 1'); return; }

    setSaving(true);
    setError('');

    const payload = {
      title:            title.trim(),
      description:      description.trim() || null,
      category,
      basePoints:       Number(basePoints),
      bonusPoints:      Number(bonusPoints) || 0,
      difficulty,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
      timeLimitMinutes: timeLimitMinutes  ? Number(timeLimitMinutes)  : null,
      iconName:         iconName.trim()   || null,
      iconColor:        iconColor         || null,
      isActive,
    };

    try {
      if (isEdit) {
        await api.put(`/admin/tasks/${id}`, payload);
      } else {
        await api.post('/admin/tasks', payload);
      }
      navigate('/tasks');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loadingBox}>Loading task...</div>
      </div>
    );
  }

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={s.backBtn} onClick={() => navigate('/tasks')}>
            ← Back
          </button>
          <div>
            <h1 style={s.title}>{isEdit ? '✏️ Edit Task' : '➕ Create Task'}</h1>
            <p style={s.subtitle}>
              {isEdit
                ? isDefault
                  ? 'Editing a default task — changes apply to all future completions'
                  : 'Update task details and points'
                : 'Create a new task for users to complete'}
            </p>
          </div>
        </div>
      </div>

      {/* Default task notice */}
      {isEdit && isDefault && (
        <div style={s.noticeBox}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <span>This is a default task. You can edit its points and details, but it cannot be deleted.</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={s.errorBox}>⚠️ {error}</div>
      )}

      <div style={s.grid}>

        {/* Left column — main details */}
        <div style={s.col}>

          {/* Basic Info */}
          <div style={s.card}>
            <div style={s.cardHeader}>📝 Basic Information</div>

            <div style={s.field}>
              <label style={s.label}>Task Title <span style={s.required}>*</span></label>
              <input
                style={s.input}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Clean Kitchen Vessels"
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea
                style={{ ...s.input, height: 100, resize: 'vertical' }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what the user needs to do..."
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Category <span style={s.required}>*</span></label>
              <div style={s.chipRow}>
                {CATEGORIES.map(cat => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <button
                      key={cat}
                      style={{
                        ...s.chip,
                        ...(category === cat ? { background: meta.color, color: '#fff', borderColor: meta.color } : {}),
                      }}
                      onClick={() => setCategory(cat)}
                    >
                      {meta.emoji} {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Difficulty <span style={s.required}>*</span></label>
              <div style={s.chipRow}>
                {DIFFICULTIES.map(diff => {
                  const meta = DIFFICULTY_META[diff];
                  return (
                    <button
                      key={diff}
                      style={{
                        ...s.chip,
                        ...(difficulty === diff ? { background: meta.color, color: '#fff', borderColor: meta.color } : {}),
                      }}
                      onClick={() => setDifficulty(diff)}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Timing */}
          <div style={s.card}>
            <div style={s.cardHeader}>⏱️ Timing</div>
            <div style={s.row2}>
              <div style={{ flex: 1 }}>
                <div style={s.field}>
                  <label style={s.label}>Estimated Minutes</label>
                  <input
                    style={s.input}
                    type="number"
                    min="1"
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(e.target.value)}
                    placeholder="e.g. 10"
                  />
                  <span style={s.hint}>How long it typically takes</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.field}>
                  <label style={s.label}>Time Limit (Minutes)</label>
                  <input
                    style={s.input}
                    type="number"
                    min="1"
                    value={timeLimitMinutes}
                    onChange={e => setTimeLimitMinutes(e.target.value)}
                    placeholder="e.g. 15"
                  />
                  <span style={s.hint}>Max time for speed bonus</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right column — points & settings */}
        <div style={s.col}>

          {/* Points — most prominent */}
          <div style={{ ...s.card, border: `2px solid ${COLORS.primary}` }}>
            <div style={{ ...s.cardHeader, color: COLORS.primary }}>⭐ Points Configuration</div>

            <div style={s.field}>
              <label style={s.label}>
                Base Points <span style={s.required}>*</span>
                <span style={s.hint2}>— awarded on task approval</span>
              </label>
              <div style={s.pointsInputWrap}>
                <input
                  style={{ ...s.input, ...s.pointsInput }}
                  type="number"
                  min="1"
                  value={basePoints}
                  onChange={e => setBasePoints(e.target.value)}
                  placeholder="50"
                />
                <span style={s.pointsSuffix}>pts</span>
              </div>
              <span style={s.hint}>This is the core reward users earn when task is approved</span>
            </div>

            <div style={s.field}>
              <label style={s.label}>
                Bonus Points
                <span style={s.hint2}>— speed/volume bonus cap</span>
              </label>
              <div style={s.pointsInputWrap}>
                <input
                  style={{ ...s.input, ...s.pointsInput }}
                  type="number"
                  min="0"
                  value={bonusPoints}
                  onChange={e => setBonusPoints(e.target.value)}
                  placeholder="0"
                />
                <span style={s.pointsSuffix}>pts</span>
              </div>
              <span style={s.hint}>Extra points for completing quickly or in volume</span>
            </div>

            {/* Points preview */}
            <div style={s.pointsPreview}>
              <div style={s.pointsPreviewRow}>
                <span>Base reward</span>
                <span style={{ fontWeight: 700, color: COLORS.primary }}>{basePoints || 0} pts</span>
              </div>
              <div style={s.pointsPreviewRow}>
                <span>Max bonus</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>+{bonusPoints || 0} pts</span>
              </div>
              <div style={{ ...s.pointsPreviewRow, borderTop: `1px solid ${COLORS.border}`, paddingTop: 8, marginTop: 4 }}>
                <span style={{ fontWeight: 600 }}>Max possible</span>
                <span style={{ fontWeight: 800, color: COLORS.primary, fontSize: 18 }}>
                  {(Number(basePoints) || 0) + (Number(bonusPoints) || 0)} pts
                </span>
              </div>
            </div>
          </div>

          {/* Icon & Appearance */}
          <div style={s.card}>
            <div style={s.cardHeader}>🎨 Appearance</div>

            <div style={s.row2}>
              <div style={{ flex: 1 }}>
                <div style={s.field}>
                  <label style={s.label}>Icon Name</label>
                  <input
                    style={s.input}
                    value={iconName}
                    onChange={e => setIconName(e.target.value)}
                    placeholder="e.g. restaurant"
                  />
                  <span style={s.hint}>Ionicons name</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.field}>
                  <label style={s.label}>Icon Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="color"
                      style={{ ...s.input, width: 50, height: 38, padding: 2, cursor: 'pointer' }}
                      value={iconColor}
                      onChange={e => setIconColor(e.target.value)}
                    />
                    <input
                      style={{ ...s.input, flex: 1 }}
                      value={iconColor}
                      onChange={e => setIconColor(e.target.value)}
                      placeholder="#6366F1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={s.card}>
            <div style={s.cardHeader}>⚙️ Status</div>
            <div
              style={s.toggleRow}
              onClick={() => setIsActive(v => !v)}
            >
              <div>
                <div style={s.toggleLabel}>Active</div>
                <div style={s.toggleSub}>
                  {isActive ? 'Task is visible to users' : 'Task is hidden from users'}
                </div>
              </div>
              <div style={{ ...s.toggle, background: isActive ? COLORS.secondary : COLORS.border }}>
                <div style={{ ...s.toggleThumb, transform: isActive ? 'translateX(18px)' : 'translateX(0)' }} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Save button */}
      <div style={s.footer}>
        <button style={s.cancelBtn} onClick={() => navigate('/tasks')}>
          Cancel
        </button>
        <button
          style={{ ...s.saveBtn, opacity: saving ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? '⏳ Saving...' : isEdit ? '✅ Save Changes' : '➕ Create Task'}
        </button>
      </div>

    </div>
  );
};

const s: any = {
  page:       { padding: 28, background: COLORS.background, minHeight: '100vh' },
  loadingBox: { textAlign: 'center', padding: 80, color: COLORS.textSecondary, fontSize: 16 },

  header:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title:    { fontSize: 26, fontWeight: 700, color: COLORS.text, margin: 0 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  backBtn: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.textSecondary,
  },

  noticeBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#EEF2FF', border: '1px solid #C7D2FE',
    borderRadius: 10, padding: '12px 16px', marginBottom: 20,
    fontSize: 14, color: '#4338CA', fontWeight: 500,
  },

  errorBox: {
    background: COLORS.errorLight, border: `1px solid ${COLORS.error}`,
    borderRadius: 10, padding: '12px 16px', marginBottom: 20,
    fontSize: 14, color: COLORS.error, fontWeight: 500,
  },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  col:  { display: 'flex', flexDirection: 'column', gap: 20 },

  card: {
    background: '#fff', borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: 20, border: `1px solid ${COLORS.border}`,
  },
  cardHeader: {
    fontSize: 15, fontWeight: 700, color: COLORS.text,
    marginBottom: 18, paddingBottom: 12,
    borderBottom: `1px solid ${COLORS.border}`,
  },

  field:    { marginBottom: 16 },
  label:    { display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' },
  required: { color: COLORS.error },
  hint:     { display: 'block', fontSize: 11, color: COLORS.textLight, marginTop: 4 },
  hint2:    { fontSize: 11, color: COLORS.textLight, fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 },

  input: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1.5px solid ${COLORS.border}`, fontSize: 14,
    color: COLORS.text, background: '#FAFAFA', boxSizing: 'border-box',
    outline: 'none',
  },

  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: {
    padding: '7px 14px', borderRadius: 20,
    border: `1.5px solid ${COLORS.border}`,
    background: '#fff', cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
    transition: 'all 0.15s',
  },

  row2: { display: 'flex', gap: 16 },

  // Points inputs
  pointsInputWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  pointsInput:     { fontSize: 20, fontWeight: 700, textAlign: 'center', width: '100%' },
  pointsSuffix:    { fontSize: 14, fontWeight: 600, color: COLORS.textSecondary, whiteSpace: 'nowrap' },

  pointsPreview: {
    background: COLORS.background, borderRadius: 10,
    padding: '12px 16px', marginTop: 8,
  },
  pointsPreviewRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', paddingBottom: 6, fontSize: 14,
    color: COLORS.textSecondary,
  },

  // Toggle
  toggleRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    cursor: 'pointer', padding: '4px 0',
  },
  toggleLabel: { fontSize: 14, fontWeight: 600, color: COLORS.text },
  toggleSub:   { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  toggle: {
    width: 40, height: 22, borderRadius: 11,
    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
  },
  toggleThumb: {
    position: 'absolute', top: 3, left: 3,
    width: 16, height: 16, background: '#fff',
    borderRadius: '50%', transition: 'transform 0.2s',
  },

  // Footer
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 12,
    paddingTop: 20, borderTop: `1px solid ${COLORS.border}`,
  },
  cancelBtn: {
    padding: '11px 24px', borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: '#fff', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, color: COLORS.textSecondary,
  },
  saveBtn: {
    padding: '11px 28px', borderRadius: 8,
    background: COLORS.primary, color: '#fff',
    border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
  },
};

export default TaskForm;