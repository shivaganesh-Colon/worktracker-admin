// worktracker-admin/src/services/api.ts - UPDATED WITH USERS & VENDORS
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auth token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ══════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════

export interface EngagementProgram {
  id: string;
  title: string;
  description: string | null;
  type: 'weekly' | 'flash' | 'challenge' | 'monthly';
  points: number | null;
  multiplier: number | null;
  bonusPoints: number | null;
  taskTarget: number | null;
  durationDays: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  rules: any;
  createdAt: string;
  updatedAt: string;
  participants?: UserProgram[];
}

export interface UserProgram {
  id: string;
  userId: string;
  programId: string;
  progress: number;
  completed: boolean;
  joinedAt: string;
  completedAt: string | null;
  user?: {
    id: string;
    fullName: string;
    phone: string;
    level: number;
  };
  program?: EngagementProgram;
}

export interface CreateProgramPayload {
  title: string;
  description?: string;
  type: string;
  points?: number;
  multiplier?: number;
  bonusPoints?: number;
  taskTarget?: number;
  durationDays?: number;
  startDate: string;
  endDate?: string;
  isActive?: boolean;
  taskIds?: string[];
}

// ══════════════════════════════════════════════════════════════════
// AUTH API
// ══════════════════════════════════════════════════════════════════

export const loginAdmin = async (email: string, password: string) => {
  const res = await api.post('/admin/login', { email, password });
  return res.data;
};

// ══════════════════════════════════════════════════════════════════
// PROGRAMS API
// ══════════════════════════════════════════════════════════════════

export const programsApi = {
  getAll: () => api.get<{ success: boolean; programs: EngagementProgram[] }>('/programs/admin'),
  getById: (id: string) =>
    api.get<{ success: boolean; program: EngagementProgram }>(`/programs/admin/${id}`),
  create: (data: CreateProgramPayload) =>
    api.post<{ success: boolean; program: EngagementProgram }>('/programs/admin', data),
  update: (id: string, data: Partial<CreateProgramPayload>) =>
    api.put<{ success: boolean; program: EngagementProgram }>(`/programs/admin/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean }>(`/programs/admin/${id}`),
  toggleActive: (id: string, isActive: boolean) =>
    api.patch<{ success: boolean }>(`/programs/admin/${id}/toggle`, { isActive }),
  seed: () => api.post<{ success: boolean; message: string }>('/programs/seed'),
  getParticipants: (id: string) =>
    api.get<{ success: boolean; participants: UserProgram[] }>(
      `/programs/admin/${id}/participants`
    ),
  getStats: () =>
    api.get<{
      success: boolean;
      stats: {
        totalPrograms: number;
        activePrograms: number;
        totalParticipants: number;
        completionRate: number;
        byType: { type: string; count: number }[];
      };
    }>('/programs/admin/stats'),
};

// ══════════════════════════════════════════════════════════════════
// ✅ USERS API (NEW)
// ══════════════════════════════════════════════════════════════════

export const usersApi = {
  // GET all users with pagination & search
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),

  // GET single user details
  getById: (id: string) => api.get(`/admin/users/${id}`),

  // GET user statistics
  getStats: () => api.get('/admin/users/stats'),

  // PATCH deactivate user
  deactivate: (id: string) => api.patch(`/admin/users/${id}/deactivate`),
};

// ══════════════════════════════════════════════════════════════════
// ✅ VENDORS API (NEW)
// ══════════════════════════════════════════════════════════════════

export const vendorsApi = {
  // GET all vendors with pagination & search
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/vendors', { params }),

  // GET single vendor details
  getById: (id: string) => api.get(`/admin/vendors/${id}`),

  // GET vendor statistics
  getStats: () => api.get('/admin/vendors/stats'),

  // PATCH toggle vendor status (activate/deactivate)
  toggleStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin/vendors/${id}/toggle-status`, { isActive }),

  // DELETE vendor
  delete: (id: string) => api.delete(`/admin/vendors/${id}`),
};

// ══════════════════════════════════════════════════════════════════
// DASHBOARD API
// ══════════════════════════════════════════════════════════════════

export const dashboardApi = {
  getStats: () =>
    api.get<{
      users: number;
      vendors: number;
      rewards: number;
      redemptions: number;
    }>('/admin/stats'),
};

export default api;