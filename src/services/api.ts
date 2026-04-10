// worktracker-admin/src/services/api.ts - UPDATED WITH USERS, VENDORS & TASK REVIEWS
import axios from 'axios';

// const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';
// const BASE_URL =  'http://3.236.251.245:3000/api/v1';
// const BASE_URL =  'http://34.237.92.120:3000/api/v1';

const BASE_URL = 'https://api.homvika.com/api/v1';



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
// USERS API
// ══════════════════════════════════════════════════════════════════

export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),
  getById: (id: string) => api.get(`/admin/users/${id}`),
  getStats: () => api.get('/admin/users/stats'),
  deactivate: (id: string) => api.patch(`/admin/users/${id}/deactivate`),
  reactivate: (id: string) => api.patch(`/admin/users/${id}/reactivate`), // ✅ NEW
};

// ══════════════════════════════════════════════════════════════════
// VENDORS API
// ══════════════════════════════════════════════════════════════════

export const vendorsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/vendors', { params }),
  getById: (id: string) => api.get(`/admin/vendors/${id}`),
  getStats: () => api.get('/admin/vendors/stats'),
  toggleStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin/vendors/${id}/toggle-status`, { isActive }),
  delete: (id: string) => api.delete(`/admin/vendors/${id}`),
  // ✅ Subscription management
  approveSubscription: (vendorId: string) =>
    api.post(`/vendor/subscription/approve/${vendorId}`),
  cancelSubscription: (vendorId: string) =>
    api.post(`/vendor/subscription/cancel/${vendorId}`),
};

// ══════════════════════════════════════════════════════════════════
// ✅ TASK REVIEWS API
// ══════════════════════════════════════════════════════════════════

export const taskReviewsApi = {
  getPending: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/pending-tasks', { params }),
  approve: (userTaskId: string, bonusPoints = 0) =>
    api.post(`/admin/pending-tasks/${userTaskId}/approve`, { bonusPoints }),
  reject: (userTaskId: string, reason: string) =>
    api.post(`/admin/pending-tasks/${userTaskId}/reject`, { reason }),
};

// ══════════════════════════════════════════════════════════════════
// ✅ FEED TIP REVIEWS API
// ══════════════════════════════════════════════════════════════════

export const feedReviewsApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/feed-reviews', { params }),
  approve: (id: string) =>
    api.post(`/admin/feed-reviews/${id}/approve`),
  reject: (id: string) =>
    api.post(`/admin/feed-reviews/${id}/reject`),
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