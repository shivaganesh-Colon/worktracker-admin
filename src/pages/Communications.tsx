// worktracker-admin/src/pages/Communications.tsx
// Admin Communications Page — Send notifications, manage messages

import React, { useState } from 'react';
import { COLORS } from '../theme/colours';
import api from '../services/api';

// ── Types ──────────────────────────────────────────────────────────
interface NotificationForm {
  title: string;
  body: string;
  type: 'market' | 'offer' | 'general' | 'reminder';
}

const NOTIFICATION_TEMPLATES = [
  {
    type: 'market' as const,
    label: '🏪 Weekly Market',
    icon: '🏪',
    title: 'Weekly Market This Saturday!',
    body: 'Homvika market is live! Come redeem your points for amazing deals. See you there! 🎉',
  },
  {
    type: 'offer' as const,
    label: '🎁 New Offer',
    icon: '🎁',
    title: 'New Offers Just Added!',
    body: 'Fresh deals are waiting for you. Check out the latest offers and redeem your points now!',
  },
  {
    type: 'reminder' as const,
    label: '⏰ Task Reminder',
    icon: '⏰',
    title: 'Complete Your Daily Tasks!',
    body: "Don't forget to complete your tasks today and earn more points! 💪",
  },
  {
    type: 'general' as const,
    label: '📢 General',
    icon: '📢',
    title: '',
    body: '',
  },
];

// ── Main Component ─────────────────────────────────────────────────
const Communications: React.FC = () => {
  const [form, setForm] = useState<NotificationForm>({
    title: '',
    body: '',
    type: 'market',
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // ── Apply Template ───────────────────────────────────────────────
  const applyTemplate = (template: typeof NOTIFICATION_TEMPLATES[0]) => {
    setSelectedTemplate(template.type);
    setForm({
      title: template.title,
      body: template.body,
      type: template.type,
    });
    setResult(null);
    setError('');
  };

  // ── Send Notification ────────────────────────────────────────────
  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setError('Please enter both title and message.');
      return;
    }

    const confirmed = window.confirm(
      `Send notification to ALL users?\n\nTitle: ${form.title}\nMessage: ${form.body}`
    );
    if (!confirmed) return;

    try {
      setSending(true);
      setError('');
      setResult(null);

      const response = await api.post('/notifications/broadcast', {
        title: form.title.trim(),
        body: form.body.trim(),
        data: { type: form.type, screen: 'Home' },
      });

      setResult(response.data.result);
      setForm({ title: '', body: '', type: 'general' });
      setSelectedTemplate(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const charCount = form.body.length;

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📡 Communications</h1>
          <p style={styles.subtitle}>Send notifications and messages to your users</p>
        </div>
      </div>

      <div style={styles.grid}>

        {/* Left — Notification Composer */}
        <div style={styles.mainCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIconBox}>
              <span style={{ fontSize: 18 }}>🔔</span>
            </div>
            <div>
              <h2 style={styles.cardTitle}>Push Notification</h2>
              <p style={styles.cardSubtitle}>Send to all active users instantly</p>
            </div>
          </div>

          {/* Templates */}
          <div style={styles.section}>
            <p style={styles.sectionLabel}>Quick Templates</p>
            <div style={styles.templateGrid}>
              {NOTIFICATION_TEMPLATES.map((t) => (
                <button
                  key={t.type}
                  style={{
                    ...styles.templateBtn,
                    ...(selectedTemplate === t.type ? styles.templateBtnActive : {}),
                  }}
                  onClick={() => applyTemplate(t)}
                >
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span style={styles.templateLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          <div style={styles.section}>
            <label style={styles.label}>
              Notification Title <span style={styles.required}>*</span>
            </label>
            <input
              style={styles.input}
              placeholder="e.g. Weekly Market This Saturday!"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={100}
            />
            <p style={styles.hint}>{form.title.length}/100 characters</p>
          </div>

          {/* Body Input */}
          <div style={styles.section}>
            <label style={styles.label}>
              Message <span style={styles.required}>*</span>
            </label>
            <textarea
              style={styles.textarea}
              placeholder="e.g. Come visit us at Kukatpally market, 9AM-1PM. Bring your points!"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              maxLength={200}
              rows={4}
            />
            <p style={styles.hint}>{charCount}/200 characters</p>
          </div>

          {/* Preview */}
          {(form.title || form.body) && (
            <div style={styles.preview}>
              <p style={styles.previewLabel}>📱 Preview</p>
              <div style={styles.previewCard}>
                <div style={styles.previewHeader}>
                  <div style={styles.previewIcon}>H</div>
                  <div>
                    <p style={styles.previewApp}>Homvika</p>
                    <p style={styles.previewTime}>now</p>
                  </div>
                </div>
                <p style={styles.previewTitle}>{form.title || 'Notification Title'}</p>
                <p style={styles.previewBody}>{form.body || 'Message body...'}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          {/* Success */}
          {result && (
            <div style={styles.successBox}>
              ✅ Notification sent!
              <span style={styles.successStats}>
                {result.success} delivered · {result.failed} failed
              </span>
            </div>
          )}

          {/* Send Button */}
          <button
            style={{
              ...styles.sendBtn,
              ...(sending ? styles.sendBtnDisabled : {}),
            }}
            onClick={handleSend}
            disabled={sending}
          >
            {sending ? (
              <>⏳ Sending...</>
            ) : (
              <>🚀 Send to All Users</>
            )}
          </button>
        </div>

        {/* Right — Info Cards */}
        <div style={styles.sidebar}>

          {/* Tips Card */}
          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>💡 Tips for Better Notifications</h3>
            <div style={styles.tipList}>
              {[
                'Send market notifications on Thursday or Friday',
                'Keep messages short and action-oriented',
                'Use emojis to grab attention',
                'Include location and time for market events',
                'Don\'t send more than 1-2 notifications per day',
              ].map((tip, i) => (
                <div key={i} style={styles.tip}>
                  <span style={styles.tipDot}>•</span>
                  <span style={styles.tipText}>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coming Soon Card */}
          <div style={styles.infoCard}>
            <h3 style={styles.infoTitle}>🔮 Coming Soon</h3>
            <div style={styles.comingSoonList}>
              {[
                { icon: '📱', label: 'SMS Notifications', status: 'Planned' },
                { icon: '📧', label: 'Email Campaigns', status: 'Planned' },
                { icon: '⏰', label: 'Scheduled Notifications', status: 'Planned' },
                { icon: '🎯', label: 'Targeted by City', status: 'Planned' },
              ].map((item, i) => (
                <div key={i} style={styles.comingSoonItem}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={styles.comingSoonLabel}>{item.label}</span>
                  <span style={styles.comingSoonBadge}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────
const styles: any = {
  container: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    color: COLORS.text,
    margin: 0,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    margin: '8px 0 0 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '24px',
    alignItems: 'start',
  },

  // Main Card
  mainCard: {
    background: '#fff',
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    padding: '28px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
    paddingBottom: '20px',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: '12px',
    background: COLORS.primaryLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.text,
    margin: 0,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    margin: '2px 0 0 0',
  },

  // Section
  section: {
    marginBottom: '20px',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.textSecondary,
    marginBottom: '10px',
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.text,
    marginBottom: '8px',
  },
  required: {
    color: COLORS.error,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: '4px',
  },

  // Templates
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  templateBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 8px',
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: '10px',
    background: '#fff',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  templateBtnActive: {
    border: `1.5px solid ${COLORS.primary}`,
    background: COLORS.primaryLight,
  },
  templateLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.text,
    textAlign: 'center' as const,
  },

  // Inputs
  input: {
    width: '100%',
    padding: '12px 14px',
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: '10px',
    fontSize: 15,
    color: COLORS.text,
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: '10px',
    fontSize: 15,
    color: COLORS.text,
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },

  // Preview
  preview: {
    marginBottom: '20px',
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.textSecondary,
    marginBottom: '10px',
  },
  previewCard: {
    background: '#F3F4F6',
    borderRadius: '12px',
    padding: '14px',
    border: `1px solid ${COLORS.border}`,
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  previewIcon: {
    width: 28,
    height: 28,
    borderRadius: '8px',
    background: COLORS.primary,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
  },
  previewApp: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.text,
    margin: 0,
  },
  previewTime: {
    fontSize: 11,
    color: COLORS.textLight,
    margin: 0,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.text,
    margin: '0 0 4px 0',
  },
  previewBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    margin: 0,
    lineHeight: 1.4,
  },

  // Error/Success
  errorBox: {
    padding: '12px 16px',
    background: COLORS.errorLight,
    color: COLORS.error,
    borderRadius: '10px',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: '16px',
  },
  successBox: {
    padding: '12px 16px',
    background: '#D1FAE5',
    color: '#065F46',
    borderRadius: '10px',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successStats: {
    fontSize: 13,
    fontWeight: 600,
  },

  // Send Button
  sendBtn: {
    width: '100%',
    padding: '14px',
    background: COLORS.primary,
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  sendBtnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },

  // Sidebar
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  infoCard: {
    background: '#fff',
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    padding: '20px',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: COLORS.text,
    margin: '0 0 14px 0',
  },

  // Tips
  tipList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  tip: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  tipDot: {
    color: COLORS.primary,
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '1px',
  },
  tipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 1.4,
  },

  // Coming Soon
  comingSoonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  comingSoonItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  comingSoonLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: 500,
    flex: 1,
  },
  comingSoonBadge: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.textLight,
    background: '#F3F4F6',
    padding: '2px 8px',
    borderRadius: '20px',
  },
};

export default Communications;