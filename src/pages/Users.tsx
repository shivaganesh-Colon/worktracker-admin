// worktracker-admin/src/pages/Users.tsx
// COMPLETE USER MANAGEMENT PAGE

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../services/api';
import { COLORS } from '../theme/colours';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalPoints: number;
  todayPoints: number;
  todayTasksCount: number;
  tasksCompleted: number;
  level: number;
  totalRedeemed: number;
  isActive: boolean;
  postsCount: number;
  rewardsCount: number;
  createdAt: string;
}

const Users: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [page, search]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll({ page, limit: 20, search });
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await usersApi.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👥 Users</h1>
          <p style={styles.subtitle}>
            {pagination?.total || 0} total users
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👥</div>
            <div>
              <div style={styles.statValue}>{stats.totalUsers.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Users</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: '#e8f5e9' }}>✅</div>
            <div>
              <div style={styles.statValue}>{stats.activeUsers.toLocaleString()}</div>
              <div style={styles.statLabel}>Active Users</div>
              <div style={styles.statSubtext}>
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% active
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: '#fff3e0' }}>🆕</div>
            <div>
              <div style={styles.statValue}>{stats.newUsersThisMonth.toLocaleString()}</div>
              <div style={styles.statLabel}>New This Month</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: '#f3e5f5' }}>💰</div>
            <div>
              <div style={styles.statValue}>
                {(stats.totalPointsDistributed / 1000).toFixed(1)}K
              </div>
              <div style={styles.statLabel}>Points Distributed</div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="🔍 Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Users List */}
      {loading ? (
        <div style={styles.loading}>Loading users...</div>
      ) : (
        <>
          <div style={styles.userGrid}>
            {users.map((user) => (
              <div
                key={user.id}
                style={styles.userCard}
                onClick={() => navigate(`/users/${user.id}`)}
              >
                {/* Header */}
                <div style={styles.userCardHeader}>
                  <div style={styles.userAvatar}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.userName}>{user.name}</div>
                    <div style={styles.userEmail}>{user.email}</div>
                    {user.phone && (
                      <div style={styles.userPhone}>📞 {user.phone}</div>
                    )}
                  </div>
                  <div style={user.isActive ? styles.activeBadge : styles.inactiveBadge}>
                    {user.isActive ? '✅ Active' : '⚪ Inactive'}
                  </div>
                </div>

                {/* Stats */}
                <div style={styles.divider} />

                <div style={styles.userStats}>
                  <div style={styles.userStat}>
                    <div style={styles.userStatValue}>{user.totalPoints.toLocaleString()}</div>
                    <div style={styles.userStatLabel}>Total Points</div>
                  </div>

                  <div style={styles.userStat}>
                    <div style={{ ...styles.userStatValue, color: COLORS.success }}>
                      +{user.todayPoints}
                    </div>
                    <div style={styles.userStatLabel}>Today</div>
                  </div>

                  <div style={styles.userStat}>
                    <div style={styles.userStatValue}>{user.tasksCompleted}</div>
                    <div style={styles.userStatLabel}>Tasks Done</div>
                  </div>

                  <div style={styles.userStat}>
                    <div style={styles.userStatValue}>Level {user.level}</div>
                    <div style={styles.userStatLabel}>Level</div>
                  </div>
                </div>

                {/* Today's Activity */}
                {user.todayTasksCount > 0 && (
                  <div style={styles.todayActivity}>
                    🔥 {user.todayTasksCount} tasks completed today
                  </div>
                )}

                {/* Footer */}
                <div style={styles.userCardFooter}>
                  <span style={styles.userFooterItem}>
                    📝 {user.postsCount} posts
                  </span>
                  <span style={styles.userFooterItem}>
                    🎁 {user.totalRedeemed} redeemed
                  </span>
                  <span style={styles.userFooterItem}>
                    📅 {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={styles.paginationButton}
              >
                ← Previous
              </button>
              <span style={styles.paginationInfo}>
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                style={styles.paginationButton}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles: any = {
  container: {
    padding: '32px',
    maxWidth: '1400px',
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

  // Stats Cards
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: COLORS.primaryLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: '14px',
    color: COLORS.textSecondary,
    marginTop: '4px',
  },
  statSubtext: {
    fontSize: '12px',
    color: COLORS.success,
    marginTop: '4px',
  },

  // Search
  searchContainer: {
    marginBottom: '24px',
  },
  searchInput: {
    width: '100%',
    padding: '14px 20px',
    fontSize: '15px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    outline: 'none',
  },

  // User Grid
  userGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '20px',
  },
  userCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      transform: 'translateY(-2px)',
    },
  },
  userCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px',
  },
  userAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: COLORS.primary,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
  },
  userName: {
    fontSize: '18px',
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: '4px',
  },
  userEmail: {
    fontSize: '14px',
    color: COLORS.textSecondary,
  },
  userPhone: {
    fontSize: '13px',
    color: COLORS.textLight,
    marginTop: '2px',
  },
  activeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    background: '#e8f5e9',
    color: '#2e7d32',
    fontSize: '12px',
    fontWeight: '600',
  },
  inactiveBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    background: '#f5f5f5',
    color: '#757575',
    fontSize: '12px',
    fontWeight: '600',
  },

  divider: {
    height: '1px',
    background: COLORS.border,
    margin: '16px 0',
  },

  userStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '12px',
  },
  userStat: {
    textAlign: 'center',
  },
  userStatValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: COLORS.text,
  },
  userStatLabel: {
    fontSize: '11px',
    color: COLORS.textSecondary,
    marginTop: '4px',
  },

  todayActivity: {
    padding: '8px 12px',
    background: '#fff3e0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#e65100',
    fontWeight: '600',
    marginBottom: '12px',
  },

  userCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '12px',
    borderTop: `1px solid ${COLORS.border}`,
  },
  userFooterItem: {
    fontSize: '12px',
    color: COLORS.textLight,
  },

  // Pagination
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '32px',
  },
  paginationButton: {
    padding: '10px 20px',
    background: COLORS.primary,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
  paginationInfo: {
    fontSize: '14px',
    color: COLORS.textSecondary,
  },

  loading: {
    textAlign: 'center',
    padding: '60px',
    color: COLORS.textSecondary,
    fontSize: '16px',
  },
};

export default Users;