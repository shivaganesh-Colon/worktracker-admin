// worktracker-admin/src/pages/VendorDetail.tsx
// COMPLETE VENDOR DETAIL PAGE with Charts & Analytics

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vendorsApi } from '../services/api';
import { COLORS } from '../theme/colours';

interface VendorDetail {
  id: string;
  businessName: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  offers: any[];
  redemptions: any[];
  dailyRedemptions: Array<{ date: string; count: number }>;
  stats: {
    totalOffers: number;
    activeOffers: number;
    totalRedemptions: number;
    uniqueCustomers: number;
    mostPopularOffer: any;
    avgRedemptionsPerDay: number;
    totalPointsRedeemed: number;
  };
}

const VendorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendor();
  }, [id]);

  const loadVendor = async () => {
    try {
      setLoading(true);
      const response = await vendorsApi.getById(id!);
      setVendor(response.data.vendor);
    } catch (error) {
      console.error('Failed to load vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (isActive: boolean) => {
    try {
      await vendorsApi.toggleStatus(id!, isActive);
      loadVendor();
      alert(`Vendor ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      alert('Failed to toggle vendor status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }
    
    try {
      await vendorsApi.delete(id!);
      alert('Vendor deleted successfully');
      navigate('/vendors');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete vendor');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading vendor details...</div>;
  }

  if (!vendor) {
    return <div style={styles.error}>Vendor not found</div>;
  }

  const hasActiveOffers = vendor.stats.activeOffers > 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/vendors')} style={styles.backButton}>
          ← Back to Vendors
        </button>
      </div>

      {/* Vendor Profile Card */}
      <div style={styles.profileCard}>
        <div style={styles.profileHeader}>
          <div style={styles.icon}>🏪</div>
          <div style={{ flex: 1 }}>
            <h1 style={styles.name}>{vendor.businessName}</h1>
            <div style={styles.email}>{vendor.email}</div>
            {vendor.phone && <div style={styles.phone}>📞 {vendor.phone}</div>}
            {vendor.address && <div style={styles.address}>📍 {vendor.address}</div>}
            <div style={styles.joinDate}>
              Joined {new Date(vendor.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div style={styles.actions}>
            <button
              onClick={() => handleToggleStatus(!hasActiveOffers)}
              style={hasActiveOffers ? styles.deactivateButton : styles.activateButton}
            >
              {hasActiveOffers ? 'Deactivate Vendor' : 'Activate Vendor'}
            </button>
            <button onClick={handleDelete} style={styles.deleteButton}>
              Delete Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎁</div>
          <div style={styles.statValue}>{vendor.stats.totalRedemptions.toLocaleString()}</div>
          <div style={styles.statLabel}>Total Redemptions</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>👥</div>
          <div style={styles.statValue}>{vendor.stats.uniqueCustomers}</div>
          <div style={styles.statLabel}>Unique Customers</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📋</div>
          <div style={styles.statValue}>
            {vendor.stats.activeOffers}/{vendor.stats.totalOffers}
          </div>
          <div style={styles.statLabel}>Active Offers</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue}>{vendor.stats.avgRedemptionsPerDay}</div>
          <div style={styles.statLabel}>Avg/Day</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statValue}>
            {(vendor.stats.totalPointsRedeemed / 1000).toFixed(1)}K
          </div>
          <div style={styles.statLabel}>Points Redeemed</div>
        </div>

        {vendor.stats.mostPopularOffer && (
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⭐</div>
            <div style={styles.statValue}>{vendor.stats.mostPopularOffer.title}</div>
            <div style={styles.statLabel}>Most Popular</div>
          </div>
        )}
      </div>

      {/* Daily Redemptions Chart */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📈 Daily Redemptions (Last 30 Days)</h2>
        <div style={styles.chartCard}>
          <div style={styles.chartContainer}>
            {vendor.dailyRedemptions.map((day, index) => {
              const maxCount = Math.max(...vendor.dailyRedemptions.map(d => d.count));
              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              
              return (
                <div key={index} style={styles.chartBar}>
                  <div style={styles.chartBarLabel}>{day.count}</div>
                  <div
                    style={{
                      ...styles.chartBarFill,
                      height: `${height}%`,
                      background: day.count > 0 ? COLORS.primary : '#f5f5f5',
                    }}
                  />
                  <div style={styles.chartBarDate}>
                    {new Date(day.date).getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={styles.chartLegend}>
            Average: {vendor.stats.avgRedemptionsPerDay} redemptions per day
          </div>
        </div>
      </div>

      {/* Offers */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎁 Offers ({vendor.offers.length})</h2>
        <div style={styles.listCard}>
          {vendor.offers.map((offer) => (
            <div key={offer.id} style={styles.listItem}>
              <div style={styles.listItemIcon}>🎁</div>
              <div style={{ flex: 1 }}>
                <div style={styles.listItemTitle}>{offer.title}</div>
                <div style={styles.listItemSubtitle}>{offer.description}</div>
                <div style={styles.offerPoints}>
                  {offer.pointsRequired} points required
                </div>
              </div>
              <div style={styles.listItemBadge}>
                {offer._count.redemptions} redeemed
              </div>
              <div style={offer.isActive ? styles.activeBadge : styles.inactiveBadge}>
                {offer.isActive ? '✅ Active' : '⚪ Inactive'}
              </div>
            </div>
          ))}
          {vendor.offers.length === 0 && (
            <div style={styles.emptyState}>No offers created yet</div>
          )}
        </div>
      </div>

      {/* Recent Redemptions */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎫 Recent Redemptions</h2>
        <div style={styles.listCard}>
          {vendor.redemptions.slice(0, 20).map((redemption) => (
            <div key={redemption.id} style={styles.listItem}>
              <div style={styles.listItemIcon}>👤</div>
              <div style={{ flex: 1 }}>
                <div style={styles.listItemTitle}>{redemption.user.name}</div>
                <div style={styles.listItemSubtitle}>
                  {redemption.offer.title}
                </div>
                <div style={styles.couponCode}>Code: {redemption.couponCode}</div>
                <div style={styles.redemptionDate}>
                  {new Date(redemption.createdAt).toLocaleString()}
                </div>
              </div>
              <div style={styles.listItemBadge}>
                {redemption.offer.pointsRequired} pts
              </div>
              <div
                style={
                  redemption.status === 'active'
                    ? styles.statusActive
                    : styles.statusRedeemed
                }
              >
                {redemption.status}
              </div>
            </div>
          ))}
          {vendor.redemptions.length === 0 && (
            <div style={styles.emptyState}>No redemptions yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: any = {
  container: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  backButton: {
    padding: '10px 20px',
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.text,
  },

  // Profile Card
  profileCard: {
    background: '#fff',
    padding: '32px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    marginBottom: '24px',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
  },
  icon: {
    width: '80px',
    height: '80px',
    borderRadius: '16px',
    background: '#fff3e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
  },
  name: {
    fontSize: '28px',
    fontWeight: '700',
    color: COLORS.text,
    margin: 0,
  },
  email: {
    fontSize: '16px',
    color: COLORS.textSecondary,
    marginTop: '4px',
  },
  phone: {
    fontSize: '14px',
    color: COLORS.textLight,
    marginTop: '4px',
  },
  address: {
    fontSize: '14px',
    color: COLORS.textLight,
    marginTop: '4px',
  },
  joinDate: {
    fontSize: '13px',
    color: COLORS.textLight,
    marginTop: '8px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activateButton: {
    padding: '12px 24px',
    background: '#e8f5e9',
    color: '#2e7d32',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  deactivateButton: {
    padding: '12px 24px',
    background: COLORS.errorLight,
    color: COLORS.error,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  deleteButton: {
    padding: '12px 24px',
    background: '#fff',
    color: COLORS.error,
    border: `1px solid ${COLORS.error}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    textAlign: 'center',
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '13px',
    color: COLORS.textSecondary,
  },

  // Sections
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: '16px',
  },

  // Chart
  chartCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
  },
  chartContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
    height: '200px',
    marginBottom: '16px',
  },
  chartBar: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  chartBarLabel: {
    fontSize: '10px',
    color: COLORS.textLight,
    fontWeight: '600',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: '4px 4px 0 0',
    minHeight: '2px',
  },
  chartBarDate: {
    fontSize: '10px',
    color: COLORS.textLight,
    marginTop: '4px',
  },
  chartLegend: {
    fontSize: '13px',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // List Card
  listCard: {
    background: '#fff',
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  listItemIcon: {
    fontSize: '24px',
  },
  listItemTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: COLORS.text,
  },
  listItemSubtitle: {
    fontSize: '13px',
    color: COLORS.textSecondary,
    marginTop: '4px',
  },
  offerPoints: {
    fontSize: '12px',
    color: COLORS.primary,
    marginTop: '4px',
    fontWeight: '600',
  },
  couponCode: {
    fontSize: '12px',
    color: COLORS.primary,
    marginTop: '4px',
    fontFamily: 'monospace',
  },
  redemptionDate: {
    fontSize: '11px',
    color: COLORS.textLight,
    marginTop: '4px',
  },
  listItemBadge: {
    padding: '6px 12px',
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
  },
  activeBadge: {
    padding: '6px 12px',
    background: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  inactiveBadge: {
    padding: '6px 12px',
    background: '#f5f5f5',
    color: '#757575',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  statusActive: {
    padding: '6px 12px',
    background: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusRedeemed: {
    padding: '6px 12px',
    background: '#fff3e0',
    color: '#e65100',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: '14px',
  },

  loading: {
    textAlign: 'center',
    padding: '100px',
    color: COLORS.textSecondary,
    fontSize: '16px',
  },
  error: {
    textAlign: 'center',
    padding: '100px',
    color: COLORS.error,
    fontSize: '16px',
  },
};

export default VendorDetail;