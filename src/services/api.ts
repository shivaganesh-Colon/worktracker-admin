// src/services/api.ts - UPDATED with rules field
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Auth token injection ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Types ─────────────────────────────────────────────────────────────────────
export interface EngagementProgram {
  id:           string;
  title:        string;
  description:  string | null;
  type:         'weekly' | 'flash' | 'challenge' | 'monthly';
  points:       number | null;
  multiplier:   number | null;
  bonusPoints:  number | null;
  taskTarget:   number | null;
  durationDays: number | null;
  startDate:    string;
  endDate:      string | null;
  isActive:     boolean;
  rules:        any; // ← ADDED: JSON field for storing task IDs and other rules
  createdAt:    string;
  updatedAt:    string;
  participants?: UserProgram[];
}

export interface UserProgram {
  id:          string;
  userId:      string;
  programId:   string;
  progress:    number;
  completed:   boolean;
  joinedAt:    string;
  completedAt: string | null;
  user?: {
    id:       string;
    fullName: string;
    phone:    string;
    level:    number;
  };
  program?: EngagementProgram;
}

export interface CreateProgramPayload {
  title:        string;
  description?: string;
  type:         string;
  points?:      number;
  multiplier?:  number;
  bonusPoints?: number;
  taskTarget?:  number;
  durationDays?:number;
  startDate:    string;
  endDate?:     string;
  isActive?:    boolean;
  taskIds?:     string[]; // ← ADDED: Task IDs for task selection
}

export const loginAdmin = async (email: string, password: string) => {
  const res = await api.post('/admin/login', { email, password });
  return res.data;
};

// ── Engagement Program APIs ───────────────────────────────────────────────────
export const programsApi = {
  // GET all programs (admin sees all, including inactive)
  getAll: () =>
    api.get<{ success: boolean; programs: EngagementProgram[] }>('/programs/admin'),

  // GET single program + participants
  getById: (id: string) =>
    api.get<{ success: boolean; program: EngagementProgram }>(`/programs/admin/${id}`),

  // POST create new program
  create: (data: CreateProgramPayload) =>
    api.post<{ success: boolean; program: EngagementProgram }>('/programs/admin', data),

  // PUT update program
  update: (id: string, data: Partial<CreateProgramPayload>) =>
    api.put<{ success: boolean; program: EngagementProgram }>(`/programs/admin/${id}`, data),

  // DELETE program
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/programs/admin/${id}`),

  // PATCH toggle active status
  toggleActive: (id: string, isActive: boolean) =>
    api.patch<{ success: boolean }>(`/programs/admin/${id}/toggle`, { isActive }),

  // POST seed dummy data
  seed: () =>
    api.post<{ success: boolean; message: string }>('/programs/seed'),

  // GET participants of a program
  getParticipants: (id: string) =>
    api.get<{ success: boolean; participants: UserProgram[] }>(`/programs/admin/${id}/participants`),

  // GET dashboard stats
  getStats: () =>
    api.get<{
      success: boolean;
      stats: {
        totalPrograms:    number;
        activePrograms:   number;
        totalParticipants:number;
        completionRate:   number;
        byType: { type: string; count: number }[];
      };
    }>('/programs/admin/stats'),
};

// ── Dashboard stats API ───────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () =>
    api.get<{
      users:       number;
      vendors:     number;
      rewards:     number;
      redemptions: number;
    }>('/admin/stats'),
};

export default api;