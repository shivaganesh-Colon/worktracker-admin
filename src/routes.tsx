// worktracker-admin/src/routes.tsx
// UPDATED: Add Settings page

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/Dashboard';
import Programs from './pages/Programs';
import ProgramForm from './pages/ProgramForm';
import ProgramDetail from './pages/ProgramDetail';
import Login from './pages/login';
import Tasks from './pages/Tasks';
import TaskSuggestions from './pages/TaskSuggestions';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Vendors from './pages/Vendors';
import VendorDetail from './pages/VendorDetail';
import Withdrawals from './pages/Withdrawals';
import Settings from './pages/Settings'; // ✅ NEW
import { COLORS } from './theme/colours';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: '📊 Dashboard', exact: true },
  { path: '/programs', label: '🏆 Programs' },
  { path: '/tasks', label: '✅ Tasks' },
  { path: '/task-suggestions', label: '💡 Suggestions' },
  { path: '/users', label: '👥 Users' },
  { path: '/vendors', label: '🏪 Vendors' },
  { path: '/withdrawals', label: '💰 Withdrawals' },
  { path: '/settings', label: '⚙️ Settings' }, // ✅ NEW
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={sidebarStyles.sidebar}>
        <div style={sidebarStyles.logo}>
          <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary }}>
            WorkTracker
          </span>
          <span style={{ fontSize: 11, color: COLORS.textLight, display: 'block' }}>
            Admin Panel
          </span>
        </div>

        <nav>
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);
            return (
              <div
                key={item.path}
                style={{
                  ...sidebarStyles.navItem,
                  ...(isActive ? sidebarStyles.navItemActive : {}),
                }}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </div>
            );
          })}
        </nav>

        <div style={sidebarStyles.footer}>
          <button
            style={sidebarStyles.logoutBtn}
            onClick={() => {
              localStorage.removeItem('admin_token');
              window.location.href = '/login';
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
};

const sidebarStyles: any = {
  sidebar: {
    width: 220,
    background: '#fff',
    borderRight: `1px solid ${COLORS.border}`,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0',
    position: 'sticky' as const,
    top: 0,
    height: '100vh',
  },
  logo: {
    padding: '0 20px 24px',
    borderBottom: `1px solid ${COLORS.border}`,
    marginBottom: 12,
  },
  navItem: {
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 500,
    borderRadius: '0 8px 8px 0',
    marginRight: 8,
    transition: 'all 0.15s',
  },
  navItemActive: {
    background: COLORS.primaryLight,
    color: COLORS.primary,
    fontWeight: 700,
  },
  footer: {
    marginTop: 'auto',
    padding: '16px 20px',
    borderTop: `1px solid ${COLORS.border}`,
  },
  logoutBtn: {
    width: '100%',
    padding: '10px',
    background: COLORS.errorLight,
    color: COLORS.error,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => (
  <BrowserRouter>
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <AdminDashboard />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Programs */}
      <Route
        path="/programs"
        element={
          <PrivateRoute>
            <Layout>
              <Programs />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/programs/create"
        element={
          <PrivateRoute>
            <Layout>
              <ProgramForm />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/programs/:id"
        element={
          <PrivateRoute>
            <Layout>
              <ProgramDetail />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/programs/:id/edit"
        element={
          <PrivateRoute>
            <Layout>
              <ProgramForm />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Tasks */}
      <Route
        path="/tasks"
        element={
          <PrivateRoute>
            <Layout>
              <Tasks />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/task-suggestions"
        element={
          <PrivateRoute>
            <Layout>
              <TaskSuggestions />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Users */}
      <Route
        path="/users"
        element={
          <PrivateRoute>
            <Layout>
              <Users />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/users/:id"
        element={
          <PrivateRoute>
            <Layout>
              <UserDetail />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Vendors */}
      <Route
        path="/vendors"
        element={
          <PrivateRoute>
            <Layout>
              <Vendors />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/vendors/:id"
        element={
          <PrivateRoute>
            <Layout>
              <VendorDetail />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Withdrawals */}
      <Route
        path="/withdrawals"
        element={
          <PrivateRoute>
            <Layout>
              <Withdrawals />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* ✅ NEW: Settings */}
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Layout>
              <Settings />
            </Layout>
          </PrivateRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
