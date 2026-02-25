// src/pages/ProgramForm.tsx - UPDATED with TaskSelector
// Used for both CREATE (/programs/create) and EDIT (/programs/:id/edit)
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { COLORS } from '../theme/colours';
import { programsApi, CreateProgramPayload } from '../services/api';
import { TaskSelector } from './TaskSelector';

const INITIAL: CreateProgramPayload & { taskIds?: string[] } = {
  title:        '',
  description:  '',
  type:         'weekly',
  points:       undefined,
  multiplier:   undefined,
  bonusPoints:  undefined,
  taskTarget:   undefined,
  durationDays: undefined,
  startDate:    new Date().toISOString().slice(0, 16),
  endDate:      '',
  isActive:     true,
  taskIds:      [], // NEW: Selected task IDs
};

const ProgramForm: React.FC = () => {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const isEdit      = Boolean(id);

  const [form, setForm]       = useState<typeof INITIAL>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError]     = useState('');

  // Load existing data for EDIT mode
  useEffect(() => {
    if (!id) return;
    programsApi.getById(id).then(res => {
      const p = res.data.program;
      const rules = p.rules as any;
      setForm({
        title:        p.title,
        description:  p.description || '',
        type:         p.type,
        points:       p.points       ?? undefined,
        multiplier:   p.multiplier   ?? undefined,
        bonusPoints:  p.bonusPoints  ?? undefined,
        taskTarget:   p.taskTarget   ?? undefined,
        durationDays: p.durationDays ?? undefined,
        startDate:    p.startDate.slice(0, 16),
        endDate:      p.endDate ? p.endDate.slice(0, 16) : '',
        isActive:     p.isActive,
        taskIds:      rules?.allowedTaskIds || [], // Load existing task IDs
      });
    }).catch(() => setError('Failed to load program'))
      .finally(() => setFetching(false));
  }, [id]);

  const set = (key: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.startDate)    { setError('Start date is required'); return; }

    setLoading(true);
    try {
      const payload: any = {
        title:        form.title,
        description:  form.description,
        type:         form.type,
        points:       form.points       ? Number(form.points)       : undefined,
        multiplier:   form.multiplier   ? Number(form.multiplier)   : undefined,
        bonusPoints:  form.bonusPoints  ? Number(form.bonusPoints)  : undefined,
        taskTarget:   form.taskTarget   ? Number(form.taskTarget)   : undefined,
        durationDays: form.durationDays ? Number(form.durationDays) : undefined,
        startDate:    form.startDate,
        endDate:      form.endDate || undefined,
        isActive:     form.isActive,
        taskIds:      form.taskIds,      // NEW: Include selected task IDs
      };

      if (isEdit && id) {
        await programsApi.update(id, payload);
      } else {
        await programsApi.create(payload);
      }
      navigate('/programs');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/programs')}>← Back</button>
        <h1 style={s.title}>{isEdit ? '✏️ Edit Program' : '➕ Create Program'}</h1>
      </div>

      <form onSubmit={handleSubmit} style={s.form}>
        {error && <div style={s.errorBox}>{error}</div>}

        {/* ── Basic Info ── */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Basic Info</h2>

          <div style={s.field}>
            <label style={s.label}>Title *</label>
            <input
              style={s.input}
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. 🔥 7-Day Clean Home Challenge"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Description</label>
            <textarea
              style={{ ...s.input, height: 80, resize: 'vertical' }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Tell users what this program is about..."
            />
          </div>

          {/* Type */}
          <div style={s.field}>
            <label style={s.label}>Type *</label>
            <div style={s.typeGrid}>
              {[
                { value: 'weekly',    label: '🔥 Weekly',    desc: 'Resets every week' },
                { value: 'flash',     label: '⚡ Flash',     desc: 'Short burst (hours/day)' },
                { value: 'challenge', label: '🏆 Challenge', desc: 'Goal-based, any duration' },
                { value: 'monthly',   label: '📅 Monthly',   desc: 'Month-long program' },
              ].map(t => (
                <div
                  key={t.value}
                  style={{ ...s.typeCard, ...(form.type === t.value ? s.typeCardActive : {}) }}
                  onClick={() => set('type', t.value)}
                >
                  <div style={{ fontWeight: 600 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Task Selection (NEW!) ── */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Allowed Tasks</h2>
          <p style={s.sectionDesc}>
            Select which tasks users can complete for this program. Leave empty to allow all tasks.
          </p>
          <TaskSelector
            selectedTaskIds={form.taskIds || []}
            onChange={(taskIds) => set('taskIds', taskIds)}
          />
        </div>

        {/* ── Goals ── */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Goals</h2>
          <div style={s.row2}>
            <div style={s.field}>
              <label style={s.label}>Task Target</label>
              <input
                style={s.input}
                type="number"
                value={form.taskTarget ?? ''}
                onChange={e => set('taskTarget', e.target.value)}
                placeholder="e.g. 7"
              />
              <span style={s.hint}>Number of tasks to complete</span>
            </div>
            <div style={s.field}>
              <label style={s.label}>Duration (days)</label>
              <input
                style={s.input}
                type="number"
                value={form.durationDays ?? ''}
                onChange={e => set('durationDays', e.target.value)}
                placeholder="e.g. 7"
              />
              <span style={s.hint}>How long the program runs</span>
            </div>
          </div>
        </div>

        {/* ── Rewards ── */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Rewards</h2>
          <div style={s.row3}>
            <div style={s.field}>
              <label style={s.label}>Completion Points</label>
              <input
                style={s.input}
                type="number"
                value={form.points ?? ''}
                onChange={e => set('points', e.target.value)}
                placeholder="e.g. 500"
              />
              <span style={s.hint}>Points on completion</span>
            </div>
            <div style={s.field}>
              <label style={s.label}>Bonus Points</label>
              <input
                style={s.input}
                type="number"
                value={form.bonusPoints ?? ''}
                onChange={e => set('bonusPoints', e.target.value)}
                placeholder="e.g. 100"
              />
              <span style={s.hint}>Extra bonus points</span>
            </div>
            <div style={s.field}>
              <label style={s.label}>Point Multiplier</label>
              <input
                style={s.input}
                type="number"
                step="0.5"
                value={form.multiplier ?? ''}
                onChange={e => set('multiplier', e.target.value)}
                placeholder="e.g. 2"
              />
              <span style={s.hint}>2 = 2× all task points</span>
            </div>
          </div>
        </div>

        {/* ── Dates ── */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Dates</h2>
          <div style={s.row2}>
            <div style={s.field}>
              <label style={s.label}>Start Date *</label>
              <input
                style={s.input}
                type="datetime-local"
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>End Date</label>
              <input
                style={s.input}
                type="datetime-local"
                value={form.endDate}
                onChange={e => set('endDate', e.target.value)}
              />
              <span style={s.hint}>Leave empty for no expiry</span>
            </div>
          </div>
        </div>

        {/* ── Settings ── */}
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Settings</h2>
          <label style={s.checkRow}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => set('isActive', e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <span style={{ color: COLORS.text, fontWeight: 500 }}>Active (visible to users)</span>
          </label>
        </div>

        {/* ── Submit ── */}
        <div style={s.footer}>
          <button type="button" style={s.cancelBtn} onClick={() => navigate('/programs')}>
            Cancel
          </button>
          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? '⏳ Saving...' : isEdit ? '✅ Update Program' : '🚀 Create Program'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s: any = {
  page:          { padding: 28, background: COLORS.background, minHeight: '100vh' },
  loading:       { padding: 60, textAlign: 'center', color: COLORS.textSecondary },
  header:        { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  title:         { fontSize: 24, fontWeight: 700, color: COLORS.text, margin: 0 },
  backBtn:       { background: 'none', border: `1px solid ${COLORS.border}`, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', color: COLORS.text, fontSize: 14 },
  form:          { maxWidth: 1000 },
  errorBox:      { background: COLORS.errorLight, color: COLORS.error, padding: 12, borderRadius: 8, marginBottom: 16 },
  section:       { background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionTitle:  { fontSize: 16, fontWeight: 700, color: COLORS.text, margin: '0 0 4px' },
  sectionDesc:   { fontSize: 13, color: COLORS.textSecondary, margin: '0 0 16px' },
  field:         { marginBottom: 16, flex: 1 },
  label:         { display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 },
  input:         { width: '100%', padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 14, color: COLORS.text, background: '#fff', boxSizing: 'border-box' },
  hint:          { fontSize: 11, color: COLORS.textLight, marginTop: 4, display: 'block' },
  row2:          { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  row3:          { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  typeGrid:      { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 },
  typeCard:      { padding: 14, border: `2px solid ${COLORS.border}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' },
  typeCardActive:{ borderColor: COLORS.primary, background: COLORS.primaryLight },
  checkRow:      { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  footer:        { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn:     { padding: '12px 24px', border: `1px solid ${COLORS.border}`, background: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: COLORS.text },
  submitBtn:     { padding: '12px 32px', background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
};

export default ProgramForm;