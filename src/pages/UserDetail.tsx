// worktracker-admin/src/pages/UserDetail.tsx
// COMPLETE USER DETAIL PAGE with Charts & Analytics

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi } from '../services/api';
import { COLORS } from '../theme/colours';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalPoints: number;
  tasksCompleted: number;
  level: number;
  createdAt: string;
  dailyPoints: Array<{ date: string; points: number; tasksCount: number }>;
  stats: {
    totalPoints: number;
    tasksCompleted: number;
    level: number;
    totalRedeemed: number;
    postsCount: number;
    achievementsCount: number;
    totalVolumeBonus: number;
    avgPointsPerTask: number;
    bestDay: { date: string; points: number };
    currentStreak: number;
  };
  userTasks: any[];
  redemptions: any[];
  achievements: any[];
}

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getById(id!);
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
      await usersApi.deactivate(id!);
      alert('User deactivated successfully');
      navigate('/users');
    } catch (error) {
      alert('Failed to deactivate user');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading user details...</div>;
  }

  if (!user) {
    return <div style={styles.error}>User not found</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/users')} style={styles.backButton}>
          ← Back to Users
        </button>
      </div>

      {/* User Profile Card */}
      <div style={styles.profileCard}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={styles.name}>{user.name}</h1>
            <div style={styles.email}>{user.email}</div>
            {user.phone && <div style={styles.phone}>📞 {user.phone}</div>}
            <div style={styles.joinDate}>
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
          <button onClick={handleDeactivate} style={styles.deactivateButton}>
            Deactivate User
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statValue}>{user.stats.totalPoints.toLocaleString()}</div>
          <div style={styles.statLabel}>Total Points</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statValue}>{user.stats.tasksCompleted}</div>
          <div style={styles.statLabel}>Tasks Completed</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎁</div>
          <div style={styles.statValue}>{user.stats.totalRedeemed}</div>
          <div style={styles.statLabel}>Redemptions</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🔥</div>
          <div style={styles.statValue}>{user.stats.currentStreak} days</div>
          <div style={styles.statLabel}>Current Streak</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>⭐</div>
          <div style={styles.statValue}>Level {user.stats.level}</div>
          <div style={styles.statLabel}>User Level</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue}>{user.stats.avgPointsPerTask}</div>
          <div style={styles.statLabel}>Avg Points/Task</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎯</div>
          <div style={styles.statValue}>{user.stats.totalVolumeBonus}</div>
          <div style={styles.statLabel}>Volume Bonus</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏆</div>
          <div style={styles.statValue}>{user.stats.achievementsCount}</div>
          <div style={styles.statLabel}>Achievements</div>
        </div>
      </div>

      {/* Daily Points Chart */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📈 Daily Points (Last 30 Days)</h2>
        <div style={styles.chartCard}>
          <div style={styles.chartContainer}>
            {user.dailyPoints.map((day, index) => {
              const maxPoints = Math.max(...user.dailyPoints.map(d => d.points));
              const height = maxPoints > 0 ? (day.points / maxPoints) * 100 : 0;
              
              return (
                <div key={index} style={styles.chartBar}>
                  <div style={styles.chartBarLabel}>{day.points}</div>
                  <div
                    style={{
                      ...styles.chartBarFill,
                      height: `${height}%`,
                      background: day.points > 0 ? COLORS.primary : '#f5f5f5',
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
            Best day: {new Date(user.stats.bestDay.date).toLocaleDateString()} 
            ({user.stats.bestDay.points} points)
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>✅ Recent Tasks</h2>
        <div style={styles.listCard}>
          {user.userTasks.slice(0, 10).map((userTask) => (
            <div key={userTask.id} style={styles.listItem}>
              <div style={styles.listItemIcon}>✅</div>
              <div style={{ flex: 1 }}>
                <div style={styles.listItemTitle}>{userTask.task.title}</div>
                <div style={styles.listItemSubtitle}>
                  {new Date(userTask.createdAt).toLocaleString()}
                </div>
              </div>
              <div style={styles.listItemBadge}>
                +{userTask.totalPointsEarned} pts
              </div>
              {userTask.volumeBonusEarned > 0 && (
                <div style={styles.volumeBadge}>
                  +{userTask.volumeBonusEarned} volume
                </div>
              )}
            </div>
          ))}
          {user.userTasks.length === 0 && (
            <div style={styles.emptyState}>No tasks completed yet</div>
          )}
        </div>
      </div>

      {/* Redemptions */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🎁 Redemption History</h2>
        <div style={styles.listCard}>
          {user?.redemptions?.map((reward:any) => (
            <div key={reward.id} style={styles.listItem}>
              <div style={styles.listItemIcon}>🎁</div>
              <div style={{ flex: 1 }}>
                <div style={styles.listItemTitle}>{reward?.offer?.title}</div>
                <div style={styles.listItemSubtitle}>
                  {new Date(reward.redeemedAt).toLocaleString()}
                </div>
                <div style={styles.couponCode}>Code: {reward.couponCode}</div>
              </div>
              <div style={styles.listItemBadge}>
                {reward?.offer?.pointsRequired} pts
              </div>
            </div>
          ))}
          {user?.redemptions?.length === 0 && (
            <div style={styles.emptyState}>No redemptions yet</div>
          )}
        </div>
      </div>

      {/* Achievements */}
      {user.achievements.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🏆 Achievements</h2>
          <div style={styles.achievementsGrid}>
            {user.achievements.map((userAchievement) => (
              <div key={userAchievement.id} style={styles.achievementCard}>
                <div style={styles.achievementIcon}>
                  {userAchievement.achievement.icon || '🏆'}
                </div>
                <div style={styles.achievementName}>
                  {userAchievement.achievement.name}
                </div>
                <div style={styles.achievementDesc}>
                  {userAchievement.achievement.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: COLORS.primary,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '700',
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
  joinDate: {
    fontSize: '13px',
    color: COLORS.textLight,
    marginTop: '8px',
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

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
  couponCode: {
    fontSize: '12px',
    color: COLORS.primary,
    marginTop: '4px',
    fontFamily: 'monospace',
  },
  listItemBadge: {
    padding: '6px 12px',
    background: COLORS.primaryLight,
    color: COLORS.primary,
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '600',
  },
  volumeBadge: {
    padding: '6px 12px',
    background: '#fff3e0',
    color: '#e65100',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: '14px',
  },

  // Achievements
  achievementsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px',
  },
  achievementCard: {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    textAlign: 'center',
  },
  achievementIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  achievementName: {
    fontSize: '15px',
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: '4px',
  },
  achievementDesc: {
    fontSize: '12px',
    color: COLORS.textSecondary,
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

export default UserDetail;