// worktracker-admin/src/pages/PointsLedger.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, TextField, Grid, Card, CardContent,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Avatar, MenuItem, Select, FormControl, InputLabel,
  InputAdornment, Tooltip, Divider, Stack, Badge,
} from '@mui/material';
import {
  Search, Refresh, FilterList, Person, TrendingUp, TrendingDown,
  AccountBalanceWallet, EmojiEvents, Close, ArrowUpward, ArrowDownward,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface LedgerEntry {
  id: string;
  userId: string;
  type: string;
  source: string;
  sourceId: string | null;
  points: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    phone: string;
    avatarUrl?: string;
    city?: string;
    level: number;
    totalPoints: number;
    tasksCompleted: number;
  };
}

interface Stats {
  totalEarned: number;
  totalSpent: number;
  totalBonus: number;
  totalWithdrawals: number;
  entryCount: number;
  uniqueUsers: number;
}

interface UserLedger {
  user: any;
  summary: { type: string; _sum: { points: number }; _count: { id: number } }[];
  entries: Omit<LedgerEntry, 'user'>[];
  total: number;
  pages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
  earn:       'success',
  bonus:      'warning',
  spend:      'error',
  withdrawal: 'error',
};

const TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  earn:       { bg: '#DCFCE7', color: '#15803D', label: 'earn' },
  bonus:      { bg: '#FEF9C3', color: '#A16207', label: 'bonus' },
  spend:      { bg: '#FEE2E2', color: '#B91C1C', label: 'spend' },
  withdrawal: { bg: '#FEE2E2', color: '#B91C1C', label: 'withdrew' },
};

const SOURCE_LABELS: Record<string, string> = {
  task_complete:    '✅ Task',
  signup_bonus:     '🎁 Signup',
  first_task_bonus: '⭐ First Task',
  vendor_redeem:    '🛍️ Vendor',
  cash_withdrawal:  '💸 Withdrawal',
  achievement:      '🏆 Achievement',
  leaderboard:      '🥇 Leaderboard',
};

const initFilters = {
  search: '', type: '', source: '', dateFrom: '', dateTo: '',
  sortBy: 'createdAt', sortOrder: 'desc',
};

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, sub }: any) => (
  <Card sx={{ height: '100%', borderLeft: `4px solid ${color}` }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5, color }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
        <Box sx={{ p: 1, borderRadius: 2, backgroundColor: color + '18' }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
// USER LEDGER DIALOG
// ─────────────────────────────────────────────────────────────────────────────
const UserLedgerDialog = ({ userId, onClose }: { userId: string; onClose: () => void }) => {
  const [data, setData] = useState<UserLedger | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/points-ledger/user/${userId}?page=${p}&limit=30`);
      setData(res.data);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [userId]);

  const totalEarned  = data?.summary.find(s => s.type === 'earn')?._sum.points || 0;
  const totalBonus   = data?.summary.find(s => s.type === 'bonus')?._sum.points || 0;
  const totalSpent   = data?.summary.find(s => s.type === 'spend')?._sum.points || 0;
  const totalWithdraw = data?.summary.find(s => s.type === 'withdrawal')?._sum.points || 0;

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>User Ledger</Typography>
          {data && (
            <Typography variant="body2" color="text.secondary">
              {data.user.fullName} · {data.user.phone} · {data.user.city || 'No city'}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading && !data ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : data ? (
          <>
            {/* User summary chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Box sx={{ px: 1.5, py: 0.6, borderRadius: 2, backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp sx={{ fontSize: 14, color: '#15803D' }} />
                <Typography variant="caption" fontWeight={700} color="#15803D">Earned: +{totalEarned.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 0.6, borderRadius: 2, backgroundColor: '#FEF9C3', border: '1px solid #FCD34D', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EmojiEvents sx={{ fontSize: 14, color: '#A16207' }} />
                <Typography variant="caption" fontWeight={700} color="#A16207">Bonus: +{totalBonus.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 0.6, borderRadius: 2, backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingDown sx={{ fontSize: 14, color: '#B91C1C' }} />
                <Typography variant="caption" fontWeight={700} color="#B91C1C">Spent: {totalSpent.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 0.6, borderRadius: 2, backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccountBalanceWallet sx={{ fontSize: 14, color: '#B91C1C' }} />
                <Typography variant="caption" fontWeight={700} color="#B91C1C">Withdrawn: {Math.abs(totalWithdraw).toLocaleString()}</Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 0.6, borderRadius: 2, backgroundColor: '#EDE9FE', border: '1px solid #A78BFA', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontWeight={800} color="#6D28D9">⭐ Balance: {data.user.totalPoints.toLocaleString()} pts</Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 0.6, borderRadius: 2, backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1' }}>
                <Typography variant="caption" fontWeight={600} color="#475569">Lv {data.user.level}</Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 0.6, borderRadius: 2, backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1' }}>
                <Typography variant="caption" fontWeight={600} color="#475569">{data.user.tasksCompleted} tasks</Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Entries table */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: '#F9FAFB' } }}>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell align="right">Points</TableCell>
                    <TableCell align="right">Balance After</TableCell>
                    <TableCell>Note</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.entries.map(e => (
                    <TableRow key={e.id} hover>
                      <TableCell>
                        <Typography variant="caption" display="block">{format(new Date(e.createdAt), 'MMM dd, yyyy')}</Typography>
                        <Typography variant="caption" color="text.secondary">{format(new Date(e.createdAt), 'hh:mm a')}</Typography>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const ts = TYPE_STYLES[e.type] || { bg: '#F3F4F6', color: '#374151', label: e.type };
                          return (
                            <Box sx={{
                              display: 'inline-block', px: 1.5, py: 0.4,
                              borderRadius: 2, backgroundColor: ts.bg, color: ts.color,
                              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                            }}>
                              {ts.label}
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{SOURCE_LABELS[e.source] || e.source}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          fontWeight={800}
                          fontSize={14}
                          color={e.points > 0 ? '#15803D' : '#B91C1C'}
                        >
                          {e.points > 0 ? '+' : ''}{e.points.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}>{e.balanceAfter.toLocaleString()}</Typography>
                        <Typography variant="caption" color="text.disabled">pts</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.note || '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {data.pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                <Button size="small" disabled={page === 1} onClick={() => load(page - 1)}>Previous</Button>
                <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                  Page {page} of {data.pages}
                </Typography>
                <Button size="small" disabled={page === data.pages} onClick={() => load(page + 1)}>Next</Button>
              </Box>
            )}
          </>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function PointsLedgerPage() {
  const [entries, setEntries]         = useState<LedgerEntry[]>([]);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [topEarners, setTopEarners]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  const [filters, setFilters]         = useState(initFilters);
  const [appliedFilters, setApplied]  = useState(initFilters);
  const [showFilters, setShowFilters] = useState(false);

  const [drillUserId, setDrillUserId] = useState<string | null>(null);

  // ── Load entries ───────────────────────────────────────────────────────────
  const loadEntries = useCallback(async (p = 1, f = appliedFilters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page:      String(p),
        limit:     '50',
        sortBy:    f.sortBy,
        sortOrder: f.sortOrder,
        ...(f.search   && { search:   f.search }),
        ...(f.type     && { type:     f.type }),
        ...(f.source   && { source:   f.source }),
        ...(f.dateFrom && { dateFrom: f.dateFrom }),
        ...(f.dateTo   && { dateTo:   f.dateTo }),
      });

      const res = await api.get(`/admin/points-ledger?${params}`);
      setEntries(res.data.entries);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
      setPage(p);
    } catch (e) {
      console.error('loadEntries error:', e);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  // ── Load stats ─────────────────────────────────────────────────────────────
  const loadStats = async () => {
    try {
      const res = await api.get('/admin/points-ledger/stats');
      setStats(res.data.stats);
      setTopEarners(res.data.topEarners);
    } catch (e) {
      console.error('loadStats error:', e);
    }
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadEntries(1, appliedFilters); }, [appliedFilters]);

  const applyFilters = () => { setApplied({ ...filters }); };
  const resetFilters = () => { setFilters(initFilters); setApplied(initFilters); };

  const handleSort = (col: string) => {
    const newOrder = appliedFilters.sortBy === col && appliedFilters.sortOrder === 'desc' ? 'asc' : 'desc';
    setApplied(f => ({ ...f, sortBy: col, sortOrder: newOrder }));
  };

  const SortIcon = ({ col }: { col: string }) =>
    appliedFilters.sortBy === col
      ? appliedFilters.sortOrder === 'desc' ? <ArrowDownward sx={{ fontSize: 14 }} /> : <ArrowUpward sx={{ fontSize: 14 }} />
      : null;

  return (
    <Box sx={{ p: 3, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>💰 Points Ledger</Typography>
          <Typography variant="body2" color="text.secondary">
            Full transaction history — {total.toLocaleString()} entries across {stats?.uniqueUsers.toLocaleString() || '—'} users
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<FilterList />}
            variant={showFilters ? 'contained' : 'outlined'}
            onClick={() => setShowFilters(s => !s)}
            size="small"
          >
            Filters
          </Button>
          <Button startIcon={<Refresh />} variant="outlined" size="small"
            onClick={() => { loadEntries(page); loadStats(); }} disabled={loading}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <StatCard label="Total Earned"     value={stats.totalEarned}      color="#10B981" icon={<TrendingUp />}            sub="all time" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Bonuses Given"    value={stats.totalBonus}       color="#F59E0B" icon={<EmojiEvents />}           sub="all time" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Total Withdrawn"  value={stats.totalWithdrawals} color="#EF4444" icon={<AccountBalanceWallet />}  sub="all time" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Total Entries"    value={stats.entryCount}       color="#6366F1" icon={<Person />}                sub={`${stats.uniqueUsers} users`} />
          </Grid>
        </Grid>
      )}

      {/* Top Earners this week */}
      {topEarners.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>🏆 Top Earners This Week</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {topEarners.map((e, i) => e.user && (
              <Box
                key={e.user.id}
                onClick={() => setDrillUserId(e.user.id)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 1.5, borderRadius: 2, cursor: 'pointer',
                  backgroundColor: i === 0 ? '#FEF3C7' : '#F9FAFB',
                  border: '1px solid', borderColor: i === 0 ? '#F59E0B' : '#E5E7EB',
                  '&:hover': { backgroundColor: '#F3F4F6' },
                  minWidth: 180,
                }}
              >
                <Typography fontWeight={700} color={i === 0 ? '#D97706' : 'text.secondary'} sx={{ width: 20 }}>
                  #{i + 1}
                </Typography>
                <Avatar src={e.user.avatarUrl} sx={{ width: 32, height: 32 }}>
                  {e.user.fullName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{e.user.fullName}</Typography>
                  <Typography variant="caption" color="success.main" fontWeight={700}>+{e.weeklyPoints.toLocaleString()} pts</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {/* Filter panel */}
      {showFilters && (
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #E0E7FF' }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>🔍 Filters</Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="Search name or phone"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
                onKeyDown={e => e.key === 'Enter' && applyFilters()}
              />
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="earn">Earn</MenuItem>
                  <MenuItem value="bonus">Bonus</MenuItem>
                  <MenuItem value="spend">Spend</MenuItem>
                  <MenuItem value="withdrawal">Withdrawal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select label="Source" value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="task_complete">Task Complete</MenuItem>
                  <MenuItem value="signup_bonus">Signup Bonus</MenuItem>
                  <MenuItem value="first_task_bonus">First Task Bonus</MenuItem>
                  <MenuItem value="vendor_redeem">Vendor Redeem</MenuItem>
                  <MenuItem value="cash_withdrawal">Cash Withdrawal</MenuItem>
                  <MenuItem value="achievement">Achievement</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth size="small" label="From date" type="date" InputLabelProps={{ shrink: true }}
                value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth size="small" label="To date" type="date" InputLabelProps={{ shrink: true }}
                value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" size="small" onClick={applyFilters}>Apply Filters</Button>
                <Button variant="outlined"  size="small" onClick={resetFilters}>Reset</Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1E293B' }}>
                {[
                  { label: 'User',        col: null },
                  { label: 'Date',        col: 'createdAt' },
                  { label: 'Type',        col: 'type' },
                  { label: 'Source',      col: 'source' },
                  { label: 'Points',      col: 'points' },
                  { label: 'Balance',     col: 'balanceAfter' },
                  { label: 'Note',        col: null },
                  { label: 'Actions',     col: null },
                ].map(({ label, col }) => (
                  <TableCell
                    key={label}
                    sx={{ color: '#fff', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5,
                      cursor: col ? 'pointer' : 'default', userSelect: 'none',
                      '&:hover': col ? { backgroundColor: '#334155' } : {},
                    }}
                    onClick={() => col && handleSort(col)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {label} {col && <SortIcon col={col} />}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No entries found
                  </TableCell>
                </TableRow>
              ) : entries.map((entry, idx) => (
                <TableRow key={entry.id} hover sx={{
                  backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFAFA',
                  '&:hover': { backgroundColor: '#F0F4FF' },
                  borderLeft: entry.points > 0 ? '3px solid #10B981' : '3px solid #EF4444',
                }}>

                  {/* User */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={entry.user.avatarUrl} sx={{ width: 34, height: 34, fontSize: 14 }}>
                        {entry.user.fullName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                          {entry.user.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.user.phone}
                        </Typography>
                        {entry.user.city && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            📍 {entry.user.city}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <Typography variant="body2">{format(new Date(entry.createdAt), 'MMM dd, yyyy')}</Typography>
                    <Typography variant="caption" color="text.secondary">{format(new Date(entry.createdAt), 'hh:mm a')}</Typography>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    {(() => {
                      const ts = TYPE_STYLES[entry.type] || { bg: '#F3F4F6', color: '#374151', label: entry.type };
                      return (
                        <Box sx={{
                          display: 'inline-block',
                          px: 1.5, py: 0.4,
                          borderRadius: 2,
                          backgroundColor: ts.bg,
                          color: ts.color,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}>
                          {ts.label}
                        </Box>
                      );
                    })()}
                  </TableCell>

                  {/* Source */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {SOURCE_LABELS[entry.source] || entry.source}
                    </Typography>
                  </TableCell>

                  {/* Points */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        fontWeight={800}
                        fontSize={15}
                        color={entry.points > 0 ? '#15803D' : '#B91C1C'}
                      >
                        {entry.points > 0 ? '+' : ''}{entry.points.toLocaleString()}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Balance after */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="#1E293B">
                      {entry.balanceAfter.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">pts</Typography>
                  </TableCell>

                  {/* Note */}
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Tooltip title={entry.note || ''}>
                      <Typography variant="caption" color="text.secondary" sx={{
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {entry.note || '—'}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <Tooltip title="View full user ledger">
                      <IconButton size="small" onClick={() => setDrillUserId(entry.user.id)}
                        sx={{ color: '#6366F1' }}>
                        <Person fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, borderTop: '1px solid #E5E7EB' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {entries.length} of {total.toLocaleString()} entries
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button size="small" variant="outlined" disabled={page === 1} onClick={() => loadEntries(page - 1)}>
              Previous
            </Button>
            <Typography variant="body2" sx={{ px: 1 }}>
              Page {page} of {totalPages}
            </Typography>
            <Button size="small" variant="outlined" disabled={page === totalPages} onClick={() => loadEntries(page + 1)}>
              Next
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* User drill-down dialog */}
      {drillUserId && (
        <UserLedgerDialog userId={drillUserId} onClose={() => setDrillUserId(null)} />
      )}
    </Box>
  );
}