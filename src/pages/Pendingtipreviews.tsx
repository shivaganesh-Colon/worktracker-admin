// worktracker-admin/src/pages/PendingTipReviews.tsx
// One-click approve/reject for community tips

import React, { useEffect, useState } from 'react';
import { feedReviewsApi } from '../services/api';
import { COLORS } from '../theme/colours';

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrls: string[];
  status: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl?: string;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  cleaning: '#4CAF50',
  cooking: '#FF9800',
  organizing: '#2196F3',
  general: COLORS.primary,
};

const PendingTipReviews: React.FC = () => {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadTips();
  }, [activeTab]);

  const loadTips = async () => {
    try {
      setLoading(true);
      const response = await feedReviewsApi.getAll({ status: activeTab });
      setTips(response.data.posts);
      setCounts(response.data.counts);
    } catch (error) {
      console.error('Failed to load tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await feedReviewsApi.approve(id);
      setTips(prev => prev.filter(t => t.id !== id));
      setCounts(prev => ({ ...prev, pending: prev.pending - 1, approved: prev.approved + 1 }));
    } catch {
      alert('Failed to approve tip');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await feedReviewsApi.reject(id);
      setTips(prev => prev.filter(t => t.id !== id));
      setCounts(prev => ({ ...prev, pending: prev.pending - 1, rejected: prev.rejected + 1 }));
    } catch {
      alert('Failed to reject tip');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>💡 Tip Reviews</h1>
        <p style={styles.subtitle}>Review community tips before they go live</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['pending', 'approved', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
          >
            {tab === 'pending' ? '⏳' : tab === 'approved' ? '✅' : '❌'}
            {' '}{tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span style={{
              ...styles.badge,
              backgroundColor: tab === 'pending' ? '#fef3c7' : tab === 'approved' ? '#dcfce7' : '#fee2e2',
              color: tab === 'pending' ? '#92400e' : tab === 'approved' ? '#166534' : '#dc2626',
            }}>
              {counts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Tips List */}
      {loading ? (
        <div style={styles.loading}>Loading tips...</div>
      ) : tips.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {activeTab === 'pending' ? '🎉' : activeTab === 'approved' ? '✅' : '❌'}
          </div>
          <div style={styles.emptyText}>
            {activeTab === 'pending' ? 'No pending tips! All caught up.' : `No ${activeTab} tips yet.`}
          </div>
        </div>
      ) : (
        <div style={styles.list}>
          {tips.map(tip => (
            <div key={tip.id} style={styles.card}>
              {/* User info */}
              <div style={styles.cardHeader}>
                <div style={styles.userInfo}>
                  <div style={styles.avatar}>
                    {tip.user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={styles.userName}>{tip.user.fullName}</div>
                    <div style={styles.userPhone}>{tip.user.phone}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Category badge */}
                  <span style={{
                    ...styles.categoryBadge,
                    backgroundColor: (CATEGORY_COLORS[tip.category] || COLORS.primary) + '20',
                    color: CATEGORY_COLORS[tip.category] || COLORS.primary,
                  }}>
                    {tip.category}
                  </span>
                  <span style={styles.date}>
                    {new Date(tip.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div style={styles.cardBody}>
                <div style={styles.tipTitle}>{tip.title}</div>
                <div style={styles.tipContent}>{tip.content}</div>

                {/* Images */}
                {tip.imageUrls && tip.imageUrls.length > 0 && (
                  <div style={styles.images}>
                    {tip.imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`tip-${i}`}
                        style={styles.image}
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons — only for pending */}
              {activeTab === 'pending' && (
                <div style={styles.actions}>
                  <button
                    onClick={() => handleApprove(tip.id)}
                    disabled={actionLoading === tip.id}
                    style={styles.approveBtn}
                  >
                    {actionLoading === tip.id ? '...' : '✅ Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(tip.id)}
                    disabled={actionLoading === tip.id}
                    style={styles.rejectBtn}
                  >
                    {actionLoading === tip.id ? '...' : '❌ Reject'}
                  </button>
                </div>
              )}

              {/* Status badge for approved/rejected */}
              {activeTab !== 'pending' && (
                <div style={styles.statusRow}>
                  <span style={activeTab === 'approved' ? styles.approvedBadge : styles.rejectedBadge}>
                    {activeTab === 'approved' ? '✅ Approved' : '❌ Rejected'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: any = {
  container: { padding: '32px', maxWidth: '900px', margin: '0 auto' },
  header: { marginBottom: '24px' },
  title: { fontSize: 32, fontWeight: 800, color: COLORS.text, margin: 0 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 6 },

  tabs: { display: 'flex', gap: 12, marginBottom: 24 },
  tab: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 20px', borderRadius: 10,
    border: `1px solid ${COLORS.border}`,
    background: '#fff', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, color: COLORS.textSecondary,
  },
  tabActive: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderColor: COLORS.primary,
  },
  badge: {
    padding: '2px 8px', borderRadius: 20,
    fontSize: 12, fontWeight: 700,
  },

  loading: { textAlign: 'center', padding: '60px', color: COLORS.textSecondary },
  empty: { textAlign: 'center', padding: '60px' },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },

  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: '#fff', borderRadius: 12,
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  },

  cardHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${COLORS.border}`,
    background: '#fafafa',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    background: COLORS.primary, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 700,
  },
  userName: { fontSize: 15, fontWeight: 700, color: COLORS.text },
  userPhone: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  categoryBadge: {
    padding: '4px 10px', borderRadius: 20,
    fontSize: 12, fontWeight: 600,
  },
  date: { fontSize: 12, color: COLORS.textSecondary },

  cardBody: { padding: '16px 20px' },
  tipTitle: { fontSize: 17, fontWeight: 700, color: COLORS.text, marginBottom: 8 },
  tipContent: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: 12 },

  images: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  image: {
    width: 120, height: 100, borderRadius: 8,
    objectFit: 'cover', cursor: 'pointer',
    border: `1px solid ${COLORS.border}`,
  },

  actions: {
    display: 'flex', gap: 12, padding: '12px 20px',
    borderTop: `1px solid ${COLORS.border}`,
    background: '#fafafa',
  },
  approveBtn: {
    flex: 1, padding: '10px', background: '#dcfce7',
    color: '#166534', border: '1px solid #86efac',
    borderRadius: 8, cursor: 'pointer',
    fontWeight: 700, fontSize: 14,
  },
  rejectBtn: {
    flex: 1, padding: '10px', background: '#fee2e2',
    color: '#dc2626', border: '1px solid #fca5a5',
    borderRadius: 8, cursor: 'pointer',
    fontWeight: 700, fontSize: 14,
  },

  statusRow: { padding: '12px 20px', borderTop: `1px solid ${COLORS.border}` },
  approvedBadge: {
    padding: '6px 14px', background: '#dcfce7',
    color: '#166534', borderRadius: 8, fontWeight: 600, fontSize: 13,
  },
  rejectedBadge: {
    padding: '6px 14px', background: '#fee2e2',
    color: '#dc2626', borderRadius: 8, fontWeight: 600, fontSize: 13,
  },
};

export default PendingTipReviews;