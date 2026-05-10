// worktracker-admin/src/pages/Banners.tsx
// Admin Banner Management Page

import React, { useState, useEffect } from 'react';
import { COLORS } from '../theme/colours';
import api from '../services/api';

// ── Types ──────────────────────────────────────────────────────────
interface Banner {
  id: string;
  title: string;
  message: string;
  emoji: string;
  bgColor: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

// ── Main Component ─────────────────────────────────────────────────
const Banners: React.FC = () => {

  const [banners, setBanners]       = useState<Banner[]>([]);
  const [loading, setLoading]       = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');

  const [form, setForm] = useState({
    title: '',
    message: '',
    emoji: '🎉',
    bgColor: '#6366f1',
    expiresAt: '',
  });

  const PRESET_COLORS = [
    '#6366f1', '#e11d75', '#16a34a',
    '#f59e0b', '#0ea5e9', '#e11d48',
    '#8b5cf6', '#14b8a6', '#f97316',
  ];

  const QUICK_TEMPLATES = [
    { emoji: '💐', title: "Happy Mother's Day!", message: "To all amazing mothers — your hard work at home is seen, valued & rewarded by Homvika!", color: '#e11d75' },
    { emoji: '🏪', title: 'Weekly Market is Live!', message: 'Come visit our stall this Saturday and redeem your points for amazing deals!', color: '#6366f1' },
    { emoji: '🎁', title: 'New Offers Added!', message: 'Fresh deals are waiting for you. Check out the latest offers now!', color: '#16a34a' },
    { emoji: '🔥', title: 'Flash Sale Today!', message: 'Limited time offers available. Redeem your points before they expire!', color: '#f59e0b' },
    { emoji: '⭐', title: 'Complete Tasks & Earn!', message: 'Complete your daily household tasks and earn points to redeem amazing rewards!', color: '#0ea5e9' },
  ];

  // ── Fetch all banners ────────────────────────────────────────────
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/banner');
      setBanners(res.data.banners || []);
    } catch {
      setError('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  // ── Create banner ────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.title || !form.message) {
      setError('Title and message are required');
      return;
    }
    try {
      setActionLoading('create');
      setError('');
      await api.post('/banner', { ...form, expiresAt: form.expiresAt || null });
      setSuccess('✅ Banner created and is now live in the app!');
      setForm({ title: '', message: '', emoji: '🎉', bgColor: '#6366f1', expiresAt: '' });
      fetchBanners();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create banner');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Deactivate banner ────────────────────────────────────────────
  const handleDeactivate = async (id: string) => {
    try {
      setActionLoading(id);
      await api.patch(`/banner/${id}/deactivate`);
      setSuccess('✅ Banner deactivated!');
      fetchBanners();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to deactivate banner');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Apply template ───────────────────────────────────────────────
  const applyTemplate = (t: typeof QUICK_TEMPLATES[0]) => {
    setForm(f => ({ ...f, title: t.title, message: t.message, emoji: t.emoji, bgColor: t.color }));
  };

  return (
    <div style={styles.page}>

      {/* Page Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>🏠 App Banners</h1>
          <p style={styles.pageSubtitle}>Create and manage home screen banners for all users</p>
        </div>
        <div style={styles.statsRow}>
          <div style={styles.statBadge}>
            <span style={styles.statNum}>{banners.filter(b => b.isActive).length}</span>
            <span style={styles.statLabel}>Active</span>
          </div>
          <div style={styles.statBadge}>
            <span style={styles.statNum}>{banners.length}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && <div style={styles.successBox}>{success}</div>}
      {error   && <div style={styles.errorBox}>{error} <button onClick={() => setError('')} style={styles.closeBtn}>✕</button></div>}

      <div style={styles.layout}>

        {/* ── Left: Create Banner ───────────────────────────────── */}
        <div style={styles.createCard}>
          <h2 style={styles.cardTitle}>✨ Create New Banner</h2>

          {/* Live Preview */}
          <div style={{ ...styles.preview, background: form.bgColor }}>
            <span style={styles.previewEmoji}>{form.emoji || '🎉'}</span>
            <div>
              <div style={styles.previewTitle}>{form.title || 'Banner Title'}</div>
              <div style={styles.previewMsg}>{form.message || 'Banner message preview...'}</div>
            </div>
          </div>

          {/* Quick Templates */}
          <div style={styles.sectionLabel}>Quick Templates:</div>
          <div style={styles.templateRow}>
            {QUICK_TEMPLATES.map((t, i) => (
              <button key={i} style={styles.templateBtn} onClick={() => applyTemplate(t)}>
                {t.emoji} {t.title.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>

          {/* Emoji + Color */}
          <div style={styles.emojiColorRow}>
            <div>
              <div style={styles.sectionLabel}>Emoji:</div>
              <input
                style={styles.emojiInput}
                value={form.emoji}
                onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                placeholder="🎉"
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.sectionLabel}>Background Color:</div>
              <div style={styles.colorRow}>
                {PRESET_COLORS.map(color => (
                  <div
                    key={color}
                    onClick={() => setForm(f => ({ ...f, bgColor: color }))}
                    style={{
                      ...styles.colorDot,
                      background: color,
                      border: form.bgColor === color ? '3px solid #1a1a2e' : '2px solid transparent',
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={form.bgColor}
                  onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                  style={styles.colorPicker}
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={styles.sectionLabel}>Title *</div>
          <input
            style={styles.input}
            placeholder="e.g. Happy Mother's Day! 💐"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />

          {/* Message */}
          <div style={styles.sectionLabel}>Message *</div>
          <textarea
            style={styles.textarea}
            placeholder="e.g. To all amazing mothers — your hard work is seen & rewarded!"
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
          />

          {/* Expiry */}
          <div style={styles.sectionLabel}>Expires At (optional)</div>
          <input
            type="datetime-local"
            style={styles.input}
            value={form.expiresAt}
            onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
          />

          <button
            style={{ ...styles.createBtn, opacity: actionLoading === 'create' ? 0.7 : 1 }}
            onClick={handleCreate}
            disabled={actionLoading === 'create'}
          >
            {actionLoading === 'create' ? '⏳ Creating...' : '🚀 Go Live'}
          </button>
        </div>

        {/* ── Right: Banner List ────────────────────────────────── */}
        <div style={styles.listCard}>
          <h2 style={styles.cardTitle}>📋 All Banners</h2>

          {loading ? (
            <div style={styles.emptyState}>⏳ Loading...</div>
          ) : banners.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏠</div>
              <div>No banners created yet</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                Create your first banner on the left!
              </div>
            </div>
          ) : (
            <div style={styles.bannerList}>
              {banners.map(banner => (
                <div key={banner.id} style={styles.bannerItem}>

                  {/* Status indicator */}
                  <div style={{ ...styles.statusBar, background: banner.isActive ? '#16a34a' : '#94a3b8' }} />

                  {/* Preview mini */}
                  <div style={{ ...styles.bannerPreviewMini, background: banner.bgColor }}>
                    <span style={{ fontSize: 20 }}>{banner.emoji}</span>
                  </div>

                  {/* Details */}
                  <div style={styles.bannerDetails}>
                    <div style={styles.bannerTitleText}>{banner.title}</div>
                    <div style={styles.bannerMsgText}>{banner.message}</div>
                    <div style={styles.bannerMeta}>
                      <span style={{
                        ...styles.statusBadge,
                        background: banner.isActive ? '#dcfce7' : '#f1f5f9',
                        color: banner.isActive ? '#16a34a' : '#94a3b8',
                      }}>
                        {banner.isActive ? '● Active' : '○ Inactive'}
                      </span>
                      {banner.expiresAt && (
                        <span style={styles.expiryText}>
                          Expires: {new Date(banner.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                      <span style={styles.expiryText}>
                        {new Date(banner.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {banner.isActive && (
                    <button
                      style={styles.deactivateBtn}
                      onClick={() => handleDeactivate(banner.id)}
                      disabled={actionLoading === banner.id}
                    >
                      {actionLoading === banner.id ? '...' : '❌ Deactivate'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page:        { padding: '24px', background: '#f8fafc', minHeight: '100vh' },
  pageHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  pageTitle:   { fontSize: 24, fontWeight: 800, color: COLORS.text, margin: 0 },
  pageSubtitle:{ fontSize: 14, color: COLORS.textSecondary, margin: '4px 0 0 0' },
  statsRow:    { display: 'flex', gap: 12 },
  statBadge:   { background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '10px 18px', textAlign: 'center' },
  statNum:     { display: 'block', fontSize: 22, fontWeight: 800, color: COLORS.primary },
  statLabel:   { display: 'block', fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  successBox:  { background: '#dcfce7', color: '#16a34a', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: 14 },
  errorBox:    { background: '#fee2e2', color: '#ef4444', padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn:    { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16 },

  layout:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-start' },

  createCard:  { background: '#fff', borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24 },
  listCard:    { background: '#fff', borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24 },
  cardTitle:   { fontSize: 16, fontWeight: 700, color: COLORS.text, margin: '0 0 18px 0' },

  preview:     { borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 },
  previewEmoji:{ fontSize: 28 },
  previewTitle:{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 2 },
  previewMsg:  { color: 'rgba(255,255,255,0.88)', fontSize: 12 },

  sectionLabel:{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6, marginTop: 14 },

  templateRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  templateBtn: { fontSize: 11, padding: '5px 10px', borderRadius: 8, border: `1px solid ${COLORS.border}`, background: '#f8fafc', cursor: 'pointer', color: COLORS.text, fontWeight: 500 },

  emojiColorRow: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  emojiInput:  { width: 60, padding: '8px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 22, textAlign: 'center', outline: 'none' },

  colorRow:    { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  colorDot:    { width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', transition: 'transform 0.1s' },
  colorPicker: { width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 },

  input:       { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.text, outline: 'none', boxSizing: 'border-box', marginBottom: 4 },
  textarea:    { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.text, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 80, marginBottom: 4 },

  createBtn:   { width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: COLORS.primary, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 16 },

  bannerList:  { display: 'flex', flexDirection: 'column', gap: 12 },
  bannerItem:  { display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 12, border: `1px solid ${COLORS.border}`, background: '#fafafa', position: 'relative' },
  statusBar:   { width: 4, height: 50, borderRadius: 4, flexShrink: 0 },
  bannerPreviewMini: { width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bannerDetails:     { flex: 1, minWidth: 0 },
  bannerTitleText:   { fontSize: 14, fontWeight: 700, color: COLORS.text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  bannerMsgText:     { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  bannerMeta:        { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  statusBadge:       { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 },
  expiryText:        { fontSize: 11, color: COLORS.textSecondary },
  deactivateBtn:     { padding: '7px 12px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fff', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },

  emptyState: { textAlign: 'center', padding: '40px 20px', color: COLORS.textSecondary, fontSize: 14 },
};

export default Banners;