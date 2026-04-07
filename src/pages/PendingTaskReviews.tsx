// worktracker-admin/src/pages/PendingTaskReviews.tsx
// Admin page to review, approve, and reject user task submissions

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Stack,
  Tooltip,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Refresh,
  Info,
  EmojiEvents,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface PendingTask {
  id: string;
  createdAt: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  objectCount: number;
  status: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl?: string;
    city?: string;
    firstTaskCompleted: boolean;
    tasksCompleted: number;
  };
  task: {
    id: string;
    title: string;
    category: string;
    basePoints: number;
    bonusPoints: number;
  };
  startedAt:            string | null;
  completedAt:          string | null;
  locationFlagged:      boolean;
  locationDenied:       boolean;
  imageHash:            string | null;
  beforePhotoLocation:  { lat: number; lng: number; accuracy: number } | null;
  afterPhotoLocation:   { lat: number; lng: number; accuracy: number } | null;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'hh:mm a');
};

const getDuration = (start: string | null, end: string | null) => {
  if (!start || !end) return '—';
  const diffMs  = new Date(end).getTime() - new Date(start).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffSec = Math.floor((diffMs % 60000) / 1000);
  if (diffMin === 0) return `${diffSec}s`;
  return `${diffMin}m ${diffSec}s`;
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION / DISTANCE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Haversine formula — returns metres between two GPS points
const haversineMeters = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Returns distance in metres between before/after photo locations of SAME user (info only)
const getPhotoDistance = (task: PendingTask): number | null => {
  const b = task.beforePhotoLocation;
  const a = task.afterPhotoLocation;
  if (!b || !a) return null;
  return Math.round(haversineMeters(b.lat, b.lng, a.lat, a.lng));
};

// Cross-user proximity — HIGH RISK only when 2+ DIFFERENT users submit from within 10m
// const getCrossUserRisk = (
//   task: PendingTask,
//   allTasks: PendingTask[]
// ): { isRisky: boolean; nearbyUsers: string[] } => {
//   const loc = task.afterPhotoLocation ?? task.beforePhotoLocation;
//   if (!loc) return { isRisky: false, nearbyUsers: [] };

//   const nearbyUsers: string[] = [];
//   for (const other of allTasks) {
//     if (other.id === task.id || other.user.id === task.user.id) continue;
//     const otherLoc = other.afterPhotoLocation ?? other.beforePhotoLocation;
//     if (!otherLoc) continue;
//     const dist = haversineMeters(loc.lat, loc.lng, otherLoc.lat, otherLoc.lng);
//     if (dist <= 10) nearbyUsers.push(other.user.fullName);
//   }
//   return { isRisky: nearbyUsers.length > 0, nearbyUsers };
// };
const getCrossUserRisk = (
  task: PendingTask,
  allTasks: PendingTask[]
): { isRisky: boolean; nearbyUsers: string[] } => {
  const loc = task.afterPhotoLocation ?? task.beforePhotoLocation;
  if (!loc) return { isRisky: false, nearbyUsers: [] };

  const nearbyUsers: string[] = [];
  for (const other of allTasks) {
    if (other.id === task.id || other.user.id === task.user.id) continue;
    
    // ✅ Only compare same task
    if (other.task.id !== task.task.id) continue;

    const otherLoc = other.afterPhotoLocation ?? other.beforePhotoLocation;
    if (!otherLoc) continue;
    const dist = haversineMeters(loc.lat, loc.lng, otherLoc.lat, otherLoc.lng);
    if (dist <= 10) nearbyUsers.push(other.user.fullName);
  }
  return { isRisky: nearbyUsers.length > 0, nearbyUsers };
};
type RiskLevel = 'high' | 'none' | 'ok';

const getRiskLevel = (task: PendingTask, allTasks?: PendingTask[]): RiskLevel => {
  if (allTasks) {
    const { isRisky } = getCrossUserRisk(task, allTasks);
    if (isRisky) return 'high';
  }
  if (task.locationDenied || (!task.beforePhotoLocation && !task.afterPhotoLocation)) return 'none';
  return 'ok';
};

interface RiskStyle {
  label: string;
  bg: string;
  color: string;
  border: string;
  rowBg: string;
  rowHover: string;
}

const RISK_STYLES: Record<RiskLevel, RiskStyle> = {
  high: { label: '🔴 High Risk',    bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', rowBg: '#FFF5F5', rowHover: '#FEE2E2' },
  none: { label: '⚫ No Location',  bg: '#F3F4F6', color: '#374151', border: '#D1D5DB', rowBg: '',        rowHover: '' },
  ok:   { label: '✅ OK',           bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', rowBg: '',        rowHover: '' },
};



const QUICK_REASONS = [
  'Photos too blurry to verify',
  'Before & after photos look the same',
  'Task not clearly completed',
  'Wrong task photos uploaded',
  'Duplicate submission',
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function PendingTaskReviews() {
  const [tasks, setTasks]               = useState<PendingTask[]>([]);
  const [stats, setStats]               = useState<Stats | null>(null);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);

  // Detail modal
  const [selected, setSelected]         = useState<PendingTask | null>(null);
  const [detailOpen, setDetailOpen]     = useState(false);
  const [photoView, setPhotoView]       = useState<'before' | 'after'>('before');

  // Action modal
  const [actionOpen, setActionOpen]     = useState(false);
  const [actionType, setActionType]     = useState<'approve' | 'reject'>('approve');
  const [bonusPoints, setBonusPoints]   = useState('0');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing]     = useState(false);

  // Tab: 'regular' | 'first'
  const [activeTab, setActiveTab]       = useState<'regular' | 'first'>('regular');
  const [bulkApproving, setBulkApproving] = useState(false);
  // Location risk filter
  const [riskFilter, setRiskFilter]     = useState<RiskLevel | 'all'>('all');

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const filteredTasksRef = useRef<PendingTask[]>([]);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => { loadTasks(); }, [page, activeTab]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/tasksmanual/admin/pending?page=${page}&limit=20&isFirstTask=${activeTab === 'first'}`
      );
      const data = response.data;
      setTasks(data.tasks);
      setTotal(data.total);
      setTotalPages(data.pages);

      // Build stats from response
      setStats({
        pending:  data.total,
        approved: 0, // not returned by this endpoint — only pending shown
        rejected: 0,
        total:    data.total,
      });
    } catch (error) {
      console.error('Load pending tasks error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredTasksRef.current.length - 1));
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'v':
        case 'Enter':
          if (!actionOpen && !detailOpen && filteredTasksRef.current[selectedIndex]) {
            openDetail(filteredTasksRef.current[selectedIndex]);
          }
          break;
        case 'a':
          if (!actionOpen && !detailOpen && filteredTasksRef.current[selectedIndex]) {
            setSelected(filteredTasksRef.current[selectedIndex]);
            openAction('approve');
          } else if (actionOpen && actionType === 'approve') {
            handleApprove();
          }
          break;
        case 'r':
          if (!actionOpen && !detailOpen && filteredTasksRef.current[selectedIndex]) {
            setSelected(filteredTasksRef.current[selectedIndex]);
            openAction('reject');
          } else if (actionOpen && actionType === 'reject') {
            handleReject();
          }
          break;
        case 'b':
          if (detailOpen) {
            setPhotoView(v => v === 'before' ? 'after' : 'before');
          }
          break;
        case 'Escape':
          if (actionOpen) setActionOpen(false);
          else if (detailOpen) setDetailOpen(false);
          break;
        case '?':
          setShowShortcuts(s => !s);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, detailOpen, actionOpen, actionType]);

  // Reset selectedIndex when tasks reload
  useEffect(() => { setSelectedIndex(0); }, [tasks, riskFilter]);

  // Auto-scroll selected row into view
  useEffect(() => {
    rowRefs.current[selectedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedIndex]);

  // ── Open detail modal ─────────────────────────────────────────────────────
  const openDetail = (task: PendingTask) => {
    setSelected(task);
    setPhotoView('before');
    setDetailOpen(true);
  };

  // ── Open action modal ─────────────────────────────────────────────────────
  const openAction = (type: 'approve' | 'reject') => {
    setActionType(type);
    setBonusPoints('0');
    setRejectReason('');
    setDetailOpen(false);
    setActionOpen(true);
  };

  // ── BULK APPROVE ALL FIRST TASKS ──────────────────────────────────────────
  const handleBulkApprove = async () => {
    const firstTasks = tasks.filter((t:any) => t.isFirstTask);
    if (firstTasks.length === 0) return;

    const confirmed = window.confirm(
      `Approve all ${firstTasks.length} first-task submissions? Each user will earn their base points.`
    );
    if (!confirmed) return;

    setBulkApproving(true);
    let success = 0;
    let failed  = 0;

    for (const task of firstTasks) {
      try {
        await api.post(`/admin/pending-tasks/${task.id}/approve`, { bonusPoints: 0 });
        success++;
      } catch {
        failed++;
      }
    }

    setBulkApproving(false);
    alert(`✅ Bulk approved: ${success} approved${failed > 0 ? `, ${failed} failed` : ''}. All users notified.`);
    await loadTasks();
  };

  // ── APPROVE ───────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selected) return;
    try {
      setProcessing(true);
      await api.post(`/tasksmanual/admin/${selected.id}/approve`, {
        bonusPoints: parseInt(bonusPoints || '0', 10),
      });

      const total = selected.task.basePoints + parseInt(bonusPoints || '0', 10);
      alert(`✅ Approved! ${selected.user.fullName} earned ${total} points. User and followers have been notified.`);

      setActionOpen(false);
      await loadTasks();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.message || 'Failed to approve'));
    } finally {
      setProcessing(false);
    }
  };

  // ── REJECT ────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }
    try {
      setProcessing(true);
      await api.post(`/tasksmanual/admin/${selected.id}/reject`, {
        reason: rejectReason.trim(),
      });

      alert(`❌ Rejected. ${selected.user.fullName} has been notified with your reason.`);

      setActionOpen(false);
      await loadTasks();
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.message || 'Failed to reject'));
    } finally {
      setProcessing(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getCategoryColor = (cat: string): 'primary' | 'warning' | 'success' | 'secondary' | 'default' => {
    const map: Record<string, any> = {
      cleaning:   'primary',
      cooking:    'warning',
      organizing: 'success',
      laundry:    'secondary',
    };
    return map[cat] || 'default';
  };

  // Risk counts for summary cards
  const riskCounts = {
    high: tasks.filter(t => getRiskLevel(t as PendingTask, tasks as PendingTask[]) === 'high').length,
    ok:   tasks.filter(t => getRiskLevel(t as PendingTask, tasks as PendingTask[]) === 'ok').length,
    none: tasks.filter(t => getRiskLevel(t as PendingTask, tasks as PendingTask[]) === 'none').length,
  };

  const filteredTasks = riskFilter === 'all'
    ? tasks
    : tasks.filter(t => getRiskLevel(t as PendingTask, tasks as PendingTask[]) === riskFilter);
  // Keep ref in sync so keyboard handler always has latest list
  filteredTasksRef.current = filteredTasks;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3 }}>

      {/* Page header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            📸 Task Reviews
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review user task submissions and award points
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          variant="outlined"
          onClick={loadTasks}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Keyboard shortcuts hint bar */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          ⌨️ Shortcuts:
        </Typography>
        {[
          { key: '↑↓ / J K', label: 'Navigate' },
          { key: 'V / Enter', label: 'View' },
          { key: 'A', label: 'Approve' },
          { key: 'R', label: 'Reject' },
          { key: 'B', label: 'Toggle Photo' },
          { key: 'Esc', label: 'Close' },
        ].map(({ key, label }) => (
          <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{
              px: 1, py: 0.2, borderRadius: 1, border: '1px solid #D1D5DB',
              backgroundColor: '#F9FAFB', fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
            }}>
              {key}
            </Box>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={activeTab}
          exclusive
          onChange={(_, val) => { if (val) { setActiveTab(val); setPage(1); } }}
          size="small"
        >
          <ToggleButton value="regular" sx={{ px: 3 }}>
            ✅ Regular Tasks
            {activeTab === 'regular' && total > 0 && (
              <Chip label={total} size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: 10 }} />
            )}
          </ToggleButton>
          <ToggleButton value="first" sx={{ px: 3 }}>
            🎯 First Tasks (Onboarding)
            {activeTab === 'first' && total > 0 && (
              <Chip label={total} size="small" color="success" sx={{ ml: 1, height: 18, fontSize: 10 }} />
            )}
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Bulk approve button — only on first tasks tab */}
        {activeTab === 'first' && tasks.length > 0 && (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={bulkApproving ? <CircularProgress size={14} color="inherit" /> : <CheckCircle />}
            onClick={handleBulkApprove}
            disabled={bulkApproving}
            sx={{ ml: 'auto' }}
          >
            {bulkApproving ? 'Approving...' : `Bulk Approve All ${tasks.length}`}
          </Button>
        )}
      </Box>

      {/* First task info banner */}
      {activeTab === 'first' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Onboarding Tasks</strong> — These are first-time submissions from new users.
          Default task is <strong>Bed Organizing</strong>. You can bulk approve all or review individually.
          Users earn base points only (no bonus) on bulk approval.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(['all', 'high', 'ok', 'none'] as const).map((level) => {
          const count  = level === 'all' ? tasks.length : riskCounts[level];
          const style  = level === 'all'
            ? { label: '📋 All', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' }
            : RISK_STYLES[level];
          const active = riskFilter === level;
          return (
            <Grid item xs={6} sm={3} md={3} key={level}>
              <Card
                onClick={() => setRiskFilter(level)}
                sx={{
                  cursor: 'pointer',
                  border: active ? `2px solid ${style.border}` : '2px solid transparent',
                  backgroundColor: active ? style.bg : '#fff',
                  transition: 'all 0.15s',
                  '&:hover': { backgroundColor: style.bg, transform: 'translateY(-1px)', boxShadow: 2 },
                }}
              >
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                    {style.label}
                  </Typography>
                  <Typography variant="h4" sx={{ color: style.color, fontWeight: 800 }}>
                    {loading ? '—' : count}
                  </Typography>
                  {level === 'high' && <Typography variant="caption" color="text.secondary">2 users within 10m</Typography>}
                  {level === 'ok'   && <Typography variant="caption" color="text.secondary">no farming detected</Typography>}
                  {level === 'none' && <Typography variant="caption" color="text.secondary">no GPS data</Typography>}
                  {level === 'all'  && <Typography variant="caption" color="text.secondary">click to reset filter</Typography>}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {riskFilter !== 'all' && (
        <Alert
          severity={riskFilter === 'high' ? 'error' : 'info'}
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={() => setRiskFilter('all')}>Clear Filter</Button>
          }
        >
          Showing <strong>{RISK_STYLES[riskFilter].label}</strong> submissions only
          {riskFilter === 'high' && ' — Two or more different users submitted from within 10 metres of each other. Possible group farming.'}
          {riskFilter === 'ok'   && ' — No farming detected. Normal submissions.'}
          {riskFilter === 'none' && ' — No GPS captured. Cannot verify location. Check photos manually.'}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
              <TableCell><strong>User</strong></TableCell>
              <TableCell><strong>Task</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Location</strong></TableCell>
              <TableCell><strong>Distance</strong></TableCell>
              <TableCell><strong>Photos</strong></TableCell>
              <TableCell><strong>Items</strong></TableCell>
              <TableCell><strong>Points</strong></TableCell>
              <TableCell><strong>Submitted</strong></TableCell>
              <TableCell><strong>Duration</strong></TableCell>
              <TableCell align="center"><strong>Action</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6">All caught up!</Typography>
                  <Typography variant="body2" color="text.secondary">
                    No pending submissions to review.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task, index) => {
                const risk      = getRiskLevel(task as PendingTask, tasks as PendingTask[]);
                const rs        = RISK_STYLES[risk];
                const dist      = getPhotoDistance(task as PendingTask);
                const crossUser = getCrossUserRisk(task as PendingTask, tasks as PendingTask[]);
                const isSelected = index === selectedIndex;
                return (
                <TableRow
                  key={task.id}
                  ref={(el) => { rowRefs.current[index] = el; }}
                  hover
                  onClick={() => setSelectedIndex(index)}
                  sx={{
                    cursor: 'pointer',
                    ...(rs.rowBg ? { backgroundColor: rs.rowBg, '&:hover': { backgroundColor: rs.rowHover } } : {}),
                    ...(isSelected ? {
                      backgroundColor: '#EFF6FF !important',
                      borderLeft: '4px solid #3B82F6',
                      boxShadow: 'inset 0 0 0 1px #BFDBFE',
                    } : {}),
                  }}
                >

                  {/* User */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', fontSize: 14 }}>
                        {task.user.fullName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {task.user.fullName}
                          </Typography>
                          {!task.user.firstTaskCompleted && (
                            <Chip label="1st" size="small" color="success"
                              sx={{ height: 16, fontSize: 9, fontWeight: 700 }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {task.user.city || task.user.phone}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Task */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {task.task.title}
                    </Typography>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Chip
                      label={task.task.category}
                      color={getCategoryColor(task.task.category)}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>

                  {/* Location — cross-user farming only */}
                  <TableCell>
                    <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                      <Chip
                        label={rs.label}
                        size="small"
                        sx={{ bgcolor: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, fontWeight: 700, fontSize: 11 }}
                      />
                      {crossUser.isRisky && (
                        <Typography variant="caption" fontWeight={700} sx={{ color: '#991B1B', fontSize: 10 }}>
                          👥 Near: {crossUser.nearbyUsers.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  {/* Distance — before vs after photos (info only, no risk) */}
                  <TableCell>
                    {dist !== null ? (
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        {dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km`}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Box
                        component="img"
                        src={task.beforePhotoUrl}
                        alt="before"
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          objectFit: 'cover',
                          border: '2px solid #E5E7EB',
                          cursor: 'pointer',
                        }}
                        onClick={() => openDetail(task)}
                      />
                      <Box
                        component="img"
                        src={task.afterPhotoUrl}
                        alt="after"
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1,
                          objectFit: 'cover',
                          border: '2px solid #6366F1',
                          cursor: 'pointer',
                        }}
                        onClick={() => { openDetail(task); setPhotoView('after'); }}
                      />
                    </Box>
                  </TableCell>

                  {/* Item count */}
                  <TableCell>
                    {task.objectCount > 0
                      ? <Chip label={`${task.objectCount} items`} size="small" variant="outlined" />
                      : <Typography variant="caption" color="text.secondary">—</Typography>
                    }
                  </TableCell>

                  {/* Points */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="warning.main">
                      {task.task.basePoints} pts
                    </Typography>
                    {task.task.bonusPoints > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        +{task.task.bonusPoints} bonus
                      </Typography>
                    )}
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(task.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(task.createdAt), 'hh:mm a')}
                    </Typography>
                  </TableCell>

                  {/* Duration */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {getDuration(task.startedAt, task.completedAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatTime(task.startedAt)} → {formatTime(task.completedAt)}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {isSelected && (
                        <Chip
                          label={`#${index + 1}`}
                          size="small"
                          color="primary"
                          sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
                        />
                      )}
                      <Tooltip title="View Details (V)">
                        <IconButton
                          size="small"
                          onClick={() => openDetail(task)}
                        >
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approve (A)">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => { setSelected(task); openAction('approve'); }}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject (R)">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => { setSelected(task); openAction('reject'); }}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>

                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
          <Button
            variant="outlined"
            disabled={page === 1 || loading}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <Typography sx={{ alignSelf: 'center', px: 2 }}>
            Page {page} of {totalPages}
          </Typography>
          <Button
            variant="outlined"
            disabled={page === totalPages || loading}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </Box>
      )}

      {/* ── DETAIL MODAL ──────────────────────────────────────────────────── */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submission Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={2} sx={{ mt: 1 }}>

              {/* User info */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">User</Typography>
                <Typography variant="body1" fontWeight={600}>{selected.user.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selected.user.phone} · {selected.user.city || 'Unknown city'}
                </Typography>
              </Box>

              {/* Task info */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Task</Typography>
                <Typography variant="body1" fontWeight={600}>{selected.task.title}</Typography>
                <Chip
                  label={selected.task.category}
                  color={getCategoryColor(selected.task.category)}
                  size="small"
                  sx={{ mt: 0.5, textTransform: 'capitalize' }}
                />
              </Box>

              {/* Points */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Points</Typography>
                <Typography variant="h5" color="warning.main" fontWeight={700}>
                  {selected.task.basePoints} pts base
                </Typography>
                {selected.task.bonusPoints > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    +{selected.task.bonusPoints} bonus available
                  </Typography>
                )}
              </Box>

              {/* Item count */}
              {selected.objectCount > 0 && (
                <Alert severity="info" icon={<EmojiEvents />}>
                  User reported washing <strong>{selected.objectCount} items</strong>
                </Alert>
              )}

              {/* Submitted at */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Submitted</Typography>
                <Typography variant="body2">
                  {format(new Date(selected.createdAt), 'PPpp')}
                </Typography>
              </Box>

              {/* Cross-user farming alert */}
              {(() => {
                const crossUser = getCrossUserRisk(selected as PendingTask, tasks as PendingTask[]);
                if (!crossUser.isRisky) return null;
                return (
                  <Alert severity="error" icon={false}>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      🔴 Location Farming Detected
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                      This submission was made within <strong>10 metres</strong> of another user.
                      Strongly suggests group farming — multiple people submitting from the same spot.
                    </Typography>
                    <Typography variant="caption" fontWeight={700}>
                      👥 Same location as: {crossUser.nearbyUsers.join(', ')}
                    </Typography>
                  </Alert>
                );
              })()}

              {/* Photo distance info — info only, no risk judgment */}
              {(() => {
                const dist = getPhotoDistance(selected as PendingTask);
                const distStr = dist !== null
                  ? (dist < 1000 ? `${dist} metres` : `${(dist / 1000).toFixed(1)} km`)
                  : null;
                return (
                  <Box sx={{ backgroundColor: '#F9FAFB', borderRadius: 2, p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      📍 Photo Distance (Before → After)
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {distStr ? `${distStr} apart` : 'No GPS data — user denied location permission'}
                    </Typography>
                    {distStr && (
                      <Typography variant="caption" color="text.secondary">
                        Distance between where the before and after photos were taken.
                      </Typography>
                    )}
                  </Box>
                );
              })()}
              {(selected.startedAt || selected.completedAt) && (
                <Box sx={{ backgroundColor: '#F9FAFB', borderRadius: 2, p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    ⏱️ Task Timing
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Started</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selected.startedAt ? format(new Date(selected.startedAt), 'hh:mm:ss a') : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Completed</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selected.completedAt ? format(new Date(selected.completedAt), 'hh:mm:ss a') : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', pt: 1, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Total Duration</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {getDuration(selected.startedAt, selected.completedAt)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Photo toggle */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Photos
                </Typography>
                <ToggleButtonGroup
                  value={photoView}
                  exclusive
                  onChange={(_, val) => val && setPhotoView(val)}
                  size="small"
                  sx={{ mb: 1.5 }}
                >
                  <ToggleButton value="before">Before</ToggleButton>
                  <ToggleButton value="after">After</ToggleButton>
                </ToggleButtonGroup>

                <Box
                  component="img"
                  src={photoView === 'before' ? selected.beforePhotoUrl : selected.afterPhotoUrl}
                  alt={photoView}
                  sx={{
                    width: '100%',
                    maxHeight: 320,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '2px solid #E5E7EB',
                  }}
                />

                {/* Thumbnails */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Box
                    component="img"
                    src={selected.beforePhotoUrl}
                    alt="before"
                    onClick={() => setPhotoView('before')}
                    sx={{
                      width: 72,
                      height: 56,
                      borderRadius: 1,
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: photoView === 'before' ? '2px solid #6366F1' : '2px solid #E5E7EB',
                      opacity: photoView === 'before' ? 1 : 0.6,
                    }}
                  />
                  <Box
                    component="img"
                    src={selected.afterPhotoUrl}
                    alt="after"
                    onClick={() => setPhotoView('after')}
                    sx={{
                      width: 72,
                      height: 56,
                      borderRadius: 1,
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: photoView === 'after' ? '2px solid #6366F1' : '2px solid #E5E7EB',
                      opacity: photoView === 'after' ? 1 : 0.6,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
                    Click to toggle
                  </Typography>
                </Box>
              </Box>

            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => openAction('reject')}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => openAction('approve')}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── ACTION MODAL (Approve / Reject) ───────────────────────────────── */}
      <Dialog
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {actionType === 'approve' ? '✅ Approve Submission' : '❌ Reject Submission'}
        </DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>{selected.user.fullName}</strong> — {selected.task.title}
              </Typography>

              {/* APPROVE PANEL */}
              {actionType === 'approve' && (
                <>
                  <Box sx={{ backgroundColor: '#F9FAFB', borderRadius: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Base Points</Typography>
                      <Typography variant="body2" fontWeight={600}>{selected.task.basePoints}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Bonus Points</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => setBonusPoints(String(Math.max(0, parseInt(bonusPoints || '0') - 5)))}
                          sx={{ border: '1px solid #E5E7EB', width: 28, height: 28 }}
                        >
                          <Typography fontSize={16}>−</Typography>
                        </IconButton>
                        <TextField
                          value={bonusPoints}
                          onChange={(e) => setBonusPoints(e.target.value)}
                          size="small"
                          inputProps={{ style: { textAlign: 'center', width: 48 } }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => setBonusPoints(String(parseInt(bonusPoints || '0') + 5))}
                          sx={{ border: '1px solid #6366F1', bgcolor: 'primary.main', width: 28, height: 28, '&:hover': { bgcolor: 'primary.dark' } }}
                        >
                          <Typography fontSize={16} color="white">+</Typography>
                        </IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', pt: 1 }}>
                      <Typography variant="body1" fontWeight={700}>Total</Typography>
                      <Typography variant="h6" color="warning.main" fontWeight={800}>
                        {selected.task.basePoints + parseInt(bonusPoints || '0', 10)} pts
                      </Typography>
                    </Box>
                  </Box>
                  <Alert severity="info" sx={{ fontSize: 12 }}>
                    User will be notified and all their followers will get a push notification 🎉
                  </Alert>
                </>
              )}

              {/* REJECT PANEL */}
              {actionType === 'reject' && (
                <>
                  <Box>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Quick Reasons
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {QUICK_REASONS.map((reason) => (
                        <Chip
                          key={reason}
                          label={reason}
                          size="small"
                          onClick={() => setRejectReason(reason)}
                          color={rejectReason === reason ? 'error' : 'default'}
                          variant={rejectReason === reason ? 'filled' : 'outlined'}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Rejection Reason *"
                    placeholder="Or type a custom reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    helperText="User will see this reason so they can improve"
                  />
                </>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            onClick={actionType === 'approve' ? handleApprove : handleReject}
            disabled={processing}
          >
            {processing
              ? <CircularProgress size={18} color="inherit" />
              : actionType === 'approve'
                ? `Approve & Award ${selected ? selected.task.basePoints + parseInt(bonusPoints || '0', 10) : 0} pts`
                : 'Reject & Notify User'
            }
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}