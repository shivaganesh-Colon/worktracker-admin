// // worktracker-admin/src/pages/Vendors.tsx
// // COMPLETE VENDOR MANAGEMENT PAGE

// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { vendorsApi } from '../services/api';
// import { COLORS } from '../theme/colours';

// interface Vendor {
//   id: string;
//   businessName: string;
//   email: string;
//   phone: string | null;
//   address: string | null;
//   totalOffers: number;
//   activeOffers: number;
//   totalRedemptions: number;
//   uniqueCustomers: number;
//   redemptionsThisMonth: number;
//   createdAt: string;
// }

// const Vendors: React.FC = () => {
//   const navigate = useNavigate();
//   const [vendors, setVendors] = useState<Vendor[]>([]);
//   const [stats, setStats] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState('');
//   const [page, setPage] = useState(1);
//   const [pagination, setPagination] = useState<any>(null);

//   useEffect(() => {
//     loadVendors();
//     loadStats();
//   }, [page, search]);

//   const loadVendors = async () => {
//     try {
//       setLoading(true);
//       const response = await vendorsApi.getAll({ page, limit: 20, search });
//       setVendors(response.data.vendors);
//       setPagination(response.data.pagination);
//     } catch (error) {
//       console.error('Failed to load vendors:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadStats = async () => {
//     try {
//       const response = await vendorsApi.getStats();
//       setStats(response.data.stats);
//     } catch (error) {
//       console.error('Failed to load stats:', error);
//     }
//   };

//   const handleToggleStatus = async (vendorId: string, currentStatus: boolean) => {
//     try {
//       await vendorsApi.toggleStatus(vendorId, !currentStatus);
//       loadVendors();
//     } catch (error) {
//       alert('Failed to toggle vendor status');
//     }
//   };

//   return (
//     <div style={styles.container}>
//       {/* Header */}
//       <div style={styles.header}>
//         <div>
//           <h1 style={styles.title}>🏪 Vendors</h1>
//           <p style={styles.subtitle}>
//             {pagination?.total || 0} total vendors
//           </p>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       {stats && (
//         <div style={styles.statsGrid}>
//           <div style={styles.statCard}>
//             <div style={styles.statIcon}>🏪</div>
//             <div>
//               <div style={styles.statValue}>{stats.totalVendors}</div>
//               <div style={styles.statLabel}>Total Vendors</div>
//             </div>
//           </div>

//           <div style={styles.statCard}>
//             <div style={{ ...styles.statIcon, background: '#e8f5e9' }}>✅</div>
//             <div>
//               <div style={styles.statValue}>{stats.activeVendors}</div>
//               <div style={styles.statLabel}>Active Vendors</div>
//               <div style={styles.statSubtext}>
//                 {Math.round((stats.activeVendors / stats.totalVendors) * 100)}% active
//               </div>
//             </div>
//           </div>

//           <div style={styles.statCard}>
//             <div style={{ ...styles.statIcon, background: '#fff3e0' }}>🆕</div>
//             <div>
//               <div style={styles.statValue}>{stats.newVendorsThisMonth}</div>
//               <div style={styles.statLabel}>New This Month</div>
//             </div>
//           </div>

//           <div style={styles.statCard}>
//             <div style={{ ...styles.statIcon, background: '#f3e5f5' }}>🎁</div>
//             <div>
//               <div style={styles.statValue}>{stats.totalRedemptions.toLocaleString()}</div>
//               <div style={styles.statLabel}>Total Redemptions</div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Search */}
//       <div style={styles.searchContainer}>
//         <input
//           type="text"
//           placeholder="🔍 Search by business name, email, or phone..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           style={styles.searchInput}
//         />
//       </div>

//       {/* Vendors List */}
//       {loading ? (
//         <div style={styles.loading}>Loading vendors...</div>
//       ) : (
//         <>
//           <div style={styles.vendorGrid}>
//             {vendors.map((vendor) => (
//               <div
//                 key={vendor.id}
//                 style={styles.vendorCard}
//                 onClick={() => navigate(`/vendors/${vendor.id}`)}
//               >
//                 {/* Header */}
//                 <div style={styles.vendorCardHeader}>
//                   <div style={styles.vendorIcon}>🏪</div>
//                   <div style={{ flex: 1 }}>
//                     <div style={styles.vendorName}>{vendor.businessName}</div>
//                     <div style={styles.vendorEmail}>{vendor.email}</div>
//                     {vendor.phone && (
//                       <div style={styles.vendorPhone}>📞 {vendor.phone}</div>
//                     )}
//                     {vendor.address && (
//                       <div style={styles.vendorAddress}>📍 {vendor.address}</div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Stats */}
//                 <div style={styles.divider} />

//                 <div style={styles.vendorStats}>
//                   <div style={styles.vendorStat}>
//                     <div style={styles.vendorStatValue}>
//                       {vendor.totalRedemptions.toLocaleString()}
//                     </div>
//                     <div style={styles.vendorStatLabel}>Total Redemptions</div>
//                   </div>

//                   <div style={styles.vendorStat}>
//                     <div style={styles.vendorStatValue}>
//                       {vendor.uniqueCustomers}
//                     </div>
//                     <div style={styles.vendorStatLabel}>Unique Customers</div>
//                   </div>

//                   <div style={styles.vendorStat}>
//                     <div style={styles.vendorStatValue}>
//                       {vendor.activeOffers}/{vendor.totalOffers}
//                     </div>
//                     <div style={styles.vendorStatLabel}>Active Offers</div>
//                   </div>

//                   <div style={styles.vendorStat}>
//                     <div style={{ ...styles.vendorStatValue, color: COLORS.success }}>
//                       {vendor.redemptionsThisMonth}
//                     </div>
//                     <div style={styles.vendorStatLabel}>This Month</div>
//                   </div>
//                 </div>

//                 {/* Footer */}
//                 <div style={styles.vendorCardFooter}>
//                   <span style={styles.vendorFooterItem}>
//                     📅 {new Date(vendor.createdAt).toLocaleDateString()}
//                   </span>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleToggleStatus(vendor.id, vendor.activeOffers > 0);
//                     }}
//                     style={
//                       vendor.activeOffers > 0
//                         ? styles.activeButton
//                         : styles.inactiveButton
//                     }
//                   >
//                     {vendor.activeOffers > 0 ? '✅ Active' : '⚪ Inactive'}
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Pagination */}
//           {pagination && pagination.totalPages > 1 && (
//             <div style={styles.pagination}>
//               <button
//                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                 disabled={page === 1}
//                 style={styles.paginationButton}
//               >
//                 ← Previous
//               </button>
//               <span style={styles.paginationInfo}>
//                 Page {page} of {pagination.totalPages}
//               </span>
//               <button
//                 onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
//                 disabled={page === pagination.totalPages}
//                 style={styles.paginationButton}
//               >
//                 Next →
//               </button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// const styles: any = {
//   container: {
//     padding: '32px',
//     maxWidth: '1400px',
//     margin: '0 auto',
//   },
//   header: {
//     marginBottom: '32px',
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: 800,
//     color: COLORS.text,
//     margin: 0,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: COLORS.textSecondary,
//     margin: '8px 0 0 0',
//   },

//   // Stats Cards
//   statsGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
//     gap: '20px',
//     marginBottom: '32px',
//   },
//   statCard: {
//     background: '#fff',
//     padding: '24px',
//     borderRadius: '12px',
//     border: `1px solid ${COLORS.border}`,
//     display: 'flex',
//     alignItems: 'center',
//     gap: '16px',
//   },
//   statIcon: {
//     width: '56px',
//     height: '56px',
//     borderRadius: '12px',
//     background: COLORS.primaryLight,
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontSize: '24px',
//   },
//   statValue: {
//     fontSize: '28px',
//     fontWeight: '700',
//     color: COLORS.text,
//   },
//   statLabel: {
//     fontSize: '14px',
//     color: COLORS.textSecondary,
//     marginTop: '4px',
//   },
//   statSubtext: {
//     fontSize: '12px',
//     color: COLORS.success,
//     marginTop: '4px',
//   },

//   // Search
//   searchContainer: {
//     marginBottom: '24px',
//   },
//   searchInput: {
//     width: '100%',
//     padding: '14px 20px',
//     fontSize: '15px',
//     border: `1px solid ${COLORS.border}`,
//     borderRadius: '12px',
//     outline: 'none',
//   },

//   // Vendor Grid
//   vendorGrid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
//     gap: '20px',
//   },
//   vendorCard: {
//     background: '#fff',
//     padding: '24px',
//     borderRadius: '12px',
//     border: `1px solid ${COLORS.border}`,
//     cursor: 'pointer',
//     transition: 'all 0.2s',
//   },
//   vendorCardHeader: {
//     display: 'flex',
//     alignItems: 'flex-start',
//     gap: '16px',
//     marginBottom: '16px',
//   },
//   vendorIcon: {
//     width: '56px',
//     height: '56px',
//     borderRadius: '12px',
//     background: '#fff3e0',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontSize: '28px',
//   },
//   vendorName: {
//     fontSize: '18px',
//     fontWeight: '700',
//     color: COLORS.text,
//     marginBottom: '4px',
//   },
//   vendorEmail: {
//     fontSize: '14px',
//     color: COLORS.textSecondary,
//   },
//   vendorPhone: {
//     fontSize: '13px',
//     color: COLORS.textLight,
//     marginTop: '2px',
//   },
//   vendorAddress: {
//     fontSize: '13px',
//     color: COLORS.textLight,
//     marginTop: '2px',
//   },

//   divider: {
//     height: '1px',
//     background: COLORS.border,
//     margin: '16px 0',
//   },

//   vendorStats: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(4, 1fr)',
//     gap: '12px',
//     marginBottom: '16px',
//   },
//   vendorStat: {
//     textAlign: 'center',
//   },
//   vendorStatValue: {
//     fontSize: '18px',
//     fontWeight: '700',
//     color: COLORS.text,
//   },
//   vendorStatLabel: {
//     fontSize: '11px',
//     color: COLORS.textSecondary,
//     marginTop: '4px',
//   },

//   vendorCardFooter: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: '16px',
//     borderTop: `1px solid ${COLORS.border}`,
//   },
//   vendorFooterItem: {
//     fontSize: '13px',
//     color: COLORS.textLight,
//   },
//   activeButton: {
//     padding: '8px 16px',
//     background: '#e8f5e9',
//     color: '#2e7d32',
//     border: 'none',
//     borderRadius: '8px',
//     cursor: 'pointer',
//     fontWeight: '600',
//     fontSize: '13px',
//   },
//   inactiveButton: {
//     padding: '8px 16px',
//     background: '#f5f5f5',
//     color: '#757575',
//     border: 'none',
//     borderRadius: '8px',
//     cursor: 'pointer',
//     fontWeight: '600',
//     fontSize: '13px',
//   },

//   // Pagination
//   pagination: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: '16px',
//     marginTop: '32px',
//   },
//   paginationButton: {
//     padding: '10px 20px',
//     background: COLORS.primary,
//     color: '#fff',
//     border: 'none',
//     borderRadius: '8px',
//     cursor: 'pointer',
//     fontWeight: '600',
//     fontSize: '14px',
//   },
//   paginationInfo: {
//     fontSize: '14px',
//     color: COLORS.textSecondary,
//   },

//   loading: {
//     textAlign: 'center',
//     padding: '60px',
//     color: COLORS.textSecondary,
//     fontSize: '16px',
//   },
// };

// export default Vendors;

// worktracker-admin/src/pages/Vendors.tsx
// COMPLETE VENDOR MANAGEMENT PAGE

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorsApi } from '../services/api';
import { COLORS } from '../theme/colours';

interface Vendor {
  id: string;
  businessName: string;
  email: string;
  phone: string | null;
  address: string | null;
  totalOffers: number;
  activeOffers: number;
  totalRedemptions: number;
  uniqueCustomers: number;
  redemptionsThisMonth: number;
  createdAt: string;
  // Subscription
  subscriptionActive: boolean;
  subscriptionEnd: string | null;
  subscriptionRequestedAt: string | null;
}

const Vendors: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    loadVendors();
    loadStats();
  }, [page, search]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorsApi.getAll({ page, limit: 20, search });
      setVendors(response.data.vendors);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await vendorsApi.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleToggleStatus = async (vendorId: string, currentStatus: boolean) => {
    try {
      await vendorsApi.toggleStatus(vendorId, !currentStatus);
      loadVendors();
    } catch (error) {
      alert('Failed to toggle vendor status');
    }
  };

  const handleApproveSubscription = async (vendorId: string, shopName: string) => {
    if (!window.confirm(`Approve subscription for ${shopName}? This gives them 30 days access to create offers.`)) return;
    try {
      await vendorsApi.approveSubscription(vendorId);
      alert(`✅ Subscription approved for ${shopName}`);
      loadVendors();
    } catch (error) {
      alert('Failed to approve subscription');
    }
  };

  const handleCancelSubscription = async (vendorId: string, shopName: string) => {
    if (!window.confirm(`Cancel subscription for ${shopName}? They will lose access to create offers immediately.`)) return;
    try {
      await vendorsApi.cancelSubscription(vendorId);
      alert(`❌ Subscription cancelled for ${shopName}`);
      loadVendors();
    } catch (error) {
      alert('Failed to cancel subscription');
    }
  };

  // Pending subscription requests
  const pendingRequests = vendors.filter(v => v.subscriptionRequestedAt && !v.subscriptionActive);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🏪 Vendors</h1>
          <p style={styles.subtitle}>
            {pagination?.total || 0} total vendors
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🏪</div>
            <div>
              <div style={styles.statValue}>{stats.totalVendors}</div>
              <div style={styles.statLabel}>Total Vendors</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: '#e8f5e9' }}>✅</div>
            <div>
              <div style={styles.statValue}>{stats.activeVendors}</div>
              <div style={styles.statLabel}>Active Vendors</div>
              <div style={styles.statSubtext}>
                {Math.round((stats.activeVendors / stats.totalVendors) * 100)}% active
              </div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: '#fff3e0' }}>🆕</div>
            <div>
              <div style={styles.statValue}>{stats.newVendorsThisMonth}</div>
              <div style={styles.statLabel}>New This Month</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: '#f3e5f5' }}>🎁</div>
            <div>
              <div style={styles.statValue}>{stats.totalRedemptions.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Redemptions</div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Subscription Requests */}
      {pendingRequests.length > 0 && (
        <div style={adminStyles.pendingSection}>
          <h2 style={adminStyles.pendingTitle}>🔔 Pending Subscription Requests ({pendingRequests.length})</h2>
          <div style={adminStyles.pendingList}>
            {pendingRequests.map(vendor => (
              <div key={vendor.id} style={adminStyles.pendingCard}>
                <div style={adminStyles.pendingInfo}>
                  <span style={adminStyles.pendingName}>{vendor.businessName}</span>
                  <span style={adminStyles.pendingMeta}>
                    Requested: {new Date(vendor.subscriptionRequestedAt!).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleApproveSubscription(vendor.id, vendor.businessName)}
                  style={adminStyles.approveBtn}
                >
                  ✅ Approve (30 days)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="🔍 Search by business name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Vendors List */}
      {loading ? (
        <div style={styles.loading}>Loading vendors...</div>
      ) : (
        <>
          <div style={styles.vendorGrid}>
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                style={styles.vendorCard}
                onClick={() => navigate(`/vendors/${vendor.id}`)}
              >
                {/* Header */}
                <div style={styles.vendorCardHeader}>
                  <div style={styles.vendorIcon}>🏪</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.vendorName}>{vendor.businessName}</div>
                    <div style={styles.vendorEmail}>{vendor.email}</div>
                    {vendor.phone && (
                      <div style={styles.vendorPhone}>📞 {vendor.phone}</div>
                    )}
                    {vendor.address && (
                      <div style={styles.vendorAddress}>📍 {vendor.address}</div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div style={styles.divider} />

                <div style={styles.vendorStats}>
                  <div style={styles.vendorStat}>
                    <div style={styles.vendorStatValue}>
                      {vendor.totalRedemptions.toLocaleString()}
                    </div>
                    <div style={styles.vendorStatLabel}>Total Redemptions</div>
                  </div>

                  <div style={styles.vendorStat}>
                    <div style={styles.vendorStatValue}>
                      {vendor.uniqueCustomers}
                    </div>
                    <div style={styles.vendorStatLabel}>Unique Customers</div>
                  </div>

                  <div style={styles.vendorStat}>
                    <div style={styles.vendorStatValue}>
                      {vendor.activeOffers}/{vendor.totalOffers}
                    </div>
                    <div style={styles.vendorStatLabel}>Active Offers</div>
                  </div>

                  <div style={styles.vendorStat}>
                    <div style={{ ...styles.vendorStatValue, color: COLORS.success }}>
                      {vendor.redemptionsThisMonth}
                    </div>
                    <div style={styles.vendorStatLabel}>This Month</div>
                  </div>
                </div>

                {/* Footer */}
                <div style={styles.vendorCardFooter}>
                  <span style={styles.vendorFooterItem}>
                    📅 {new Date(vendor.createdAt).toLocaleDateString()}
                  </span>
                  {/* Subscription badge */}
                  {vendor.subscriptionActive ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={adminStyles.subActiveBadge}>
                        ✅ Subscribed · {vendor.subscriptionEnd ? Math.max(0, Math.ceil((new Date(vendor.subscriptionEnd).getTime() - Date.now()) / 86400000)) + 'd left' : ''}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancelSubscription(vendor.id, vendor.businessName); }}
                        style={adminStyles.cancelSubBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : vendor.subscriptionRequestedAt ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApproveSubscription(vendor.id, vendor.businessName); }}
                      style={adminStyles.approveBtn}
                    >
                      🔔 Approve Sub
                    </button>
                  ) : (
                    <span style={adminStyles.subInactiveBadge}>No Subscription</span>
                  )}
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

  // Vendor Grid
  vendorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px',
  },
  vendorCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  vendorCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '16px',
  },
  vendorIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    background: '#fff3e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
  },
  vendorName: {
    fontSize: '18px',
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: '4px',
  },
  vendorEmail: {
    fontSize: '14px',
    color: COLORS.textSecondary,
  },
  vendorPhone: {
    fontSize: '13px',
    color: COLORS.textLight,
    marginTop: '2px',
  },
  vendorAddress: {
    fontSize: '13px',
    color: COLORS.textLight,
    marginTop: '2px',
  },

  divider: {
    height: '1px',
    background: COLORS.border,
    margin: '16px 0',
  },

  vendorStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  vendorStat: {
    textAlign: 'center',
  },
  vendorStatValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: COLORS.text,
  },
  vendorStatLabel: {
    fontSize: '11px',
    color: COLORS.textSecondary,
    marginTop: '4px',
  },

  vendorCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: `1px solid ${COLORS.border}`,
  },
  vendorFooterItem: {
    fontSize: '13px',
    color: COLORS.textLight,
  },
  activeButton: {
    padding: '8px 16px',
    background: '#e8f5e9',
    color: '#2e7d32',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
  },
  inactiveButton: {
    padding: '8px 16px',
    background: '#f5f5f5',
    color: '#757575',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
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

const adminStyles: any = {
  pendingSection: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  pendingTitle: {
    fontSize: '18px', fontWeight: '700', color: '#92400e', margin: '0 0 16px 0',
  },
  pendingList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  pendingCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#fff', padding: '14px 16px', borderRadius: '10px',
    border: '1px solid #fde68a',
  },
  pendingInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  pendingName: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e' },
  pendingMeta: { fontSize: '12px', color: '#92400e' },
  approveBtn: {
    padding: '8px 16px', background: '#e8f5e9', color: '#2e7d32',
    border: '1px solid #a5d6a7', borderRadius: '8px',
    cursor: 'pointer', fontWeight: '600', fontSize: '13px',
  },
  cancelSubBtn: {
    padding: '6px 12px', background: '#fee2e2', color: '#dc2626',
    border: '1px solid #fca5a5', borderRadius: '8px',
    cursor: 'pointer', fontWeight: '600', fontSize: '12px',
  },
  subActiveBadge: {
    padding: '5px 10px', background: '#dcfce7', color: '#166534',
    borderRadius: '8px', fontSize: '12px', fontWeight: '600',
  },
  subInactiveBadge: {
    padding: '5px 10px', background: '#f5f5f5', color: '#757575',
    borderRadius: '8px', fontSize: '12px', fontWeight: '500',
  },
};

export default Vendors;