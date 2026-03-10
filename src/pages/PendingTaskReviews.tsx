// // worktracker-admin/src/pages/PendingTaskReviews.tsx
// // Admin page to review, approve, and reject user task submissions

// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Paper,
//   Typography,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Chip,
//   Button,
//   TextField,
//   Grid,
//   Card,
//   CardContent,
//   IconButton,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Alert,
//   CircularProgress,
//   Stack,
//   Tooltip,
//   Avatar,
//   ToggleButton,
//   ToggleButtonGroup,
// } from '@mui/material';
// import {
//   CheckCircle,
//   Cancel,
//   HourglassEmpty,
//   Refresh,
//   Info,
//   EmojiEvents,
// } from '@mui/icons-material';
// import { format } from 'date-fns';
// import api from '../services/api';

// // ─────────────────────────────────────────────────────────────────────────────
// // TYPES
// // ─────────────────────────────────────────────────────────────────────────────

// interface PendingTask {
//   id: string;
//   createdAt: string;
//   beforePhotoUrl: string;
//   afterPhotoUrl: string;
//   objectCount: number;
//   status: string;
//   user: {
//     id: string;
//     fullName: string;
//     phone: string;
//     avatarUrl?: string;
//     city?: string;
//     firstTaskCompleted: boolean;
//     tasksCompleted: number;
//   };
//   task: {
//     id: string;
//     title: string;
//     category: string;
//     basePoints: number;
//     bonusPoints: number;
//   };
//   startedAt:        string | null;
//   completedAt:      string | null;
//   locationFlagged:  boolean;
//   locationDenied:   boolean;
//   imageHash:        string | null;
// }

// interface Stats {
//   pending: number;
//   approved: number;
//   rejected: number;
//   total: number;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────────────────────────────────────

// const formatTime = (dateStr: string | null) => {
//   if (!dateStr) return '—';
//   return format(new Date(dateStr), 'hh:mm a');
// };

// const getDuration = (start: string | null, end: string | null) => {
//   if (!start || !end) return '—';
//   const diffMs  = new Date(end).getTime() - new Date(start).getTime();
//   const diffMin = Math.floor(diffMs / 60000);
//   const diffSec = Math.floor((diffMs % 60000) / 1000);
//   if (diffMin === 0) return `${diffSec}s`;
//   return `${diffMin}m ${diffSec}s`;
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // QUICK REJECT REASONS
// // ─────────────────────────────────────────────────────────────────────────────

// const QUICK_REASONS = [
//   'Photos too blurry to verify',
//   'Before & after photos look the same',
//   'Task not clearly completed',
//   'Wrong task photos uploaded',
//   'Duplicate submission',
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────────────────────────────────────

// export default function PendingTaskReviews() {
//   const [tasks, setTasks]               = useState<PendingTask[]>([]);
//   const [stats, setStats]               = useState<Stats | null>(null);
//   const [loading, setLoading]           = useState(true);
//   const [page, setPage]                 = useState(1);
//   const [totalPages, setTotalPages]     = useState(1);
//   const [total, setTotal]               = useState(0);

//   // Detail modal
//   const [selected, setSelected]         = useState<PendingTask | null>(null);
//   const [detailOpen, setDetailOpen]     = useState(false);
//   const [photoView, setPhotoView]       = useState<'before' | 'after'>('before');

//   // Action modal
//   const [actionOpen, setActionOpen]     = useState(false);
//   const [actionType, setActionType]     = useState<'approve' | 'reject'>('approve');
//   const [bonusPoints, setBonusPoints]   = useState('0');
//   const [rejectReason, setRejectReason] = useState('');
//   const [processing, setProcessing]     = useState(false);

//   // Tab: 'regular' | 'first'
//   const [activeTab, setActiveTab]       = useState<'regular' | 'first'>('regular');
//   const [bulkApproving, setBulkApproving] = useState(false);

//   // ── Load data ─────────────────────────────────────────────────────────────
//   useEffect(() => { loadTasks(); }, [page, activeTab]);

//   const loadTasks = async () => {
//     try {
//       setLoading(true);
//       const response = await api.get(
//         `/tasksmanual/admin/pending?page=${page}&limit=20&isFirstTask=${activeTab === 'first'}`
//       );
//       const data = response.data;
//       setTasks(data.tasks);
//       setTotal(data.total);
//       setTotalPages(data.pages);

//       // Build stats from response
//       setStats({
//         pending:  data.total,
//         approved: 0, // not returned by this endpoint — only pending shown
//         rejected: 0,
//         total:    data.total,
//       });
//     } catch (error) {
//       console.error('Load pending tasks error:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Open detail modal ─────────────────────────────────────────────────────
//   const openDetail = (task: PendingTask) => {
//     setSelected(task);
//     setPhotoView('before');
//     setDetailOpen(true);
//   };

//   // ── Open action modal ─────────────────────────────────────────────────────
//   const openAction = (type: 'approve' | 'reject') => {
//     setActionType(type);
//     setBonusPoints('0');
//     setRejectReason('');
//     setDetailOpen(false);
//     setActionOpen(true);
//   };

//   // ── BULK APPROVE ALL FIRST TASKS ──────────────────────────────────────────
//   const handleBulkApprove = async () => {
//     const firstTasks = tasks.filter((t:any) => t.isFirstTask);
//     if (firstTasks.length === 0) return;

//     const confirmed = window.confirm(
//       `Approve all ${firstTasks.length} first-task submissions? Each user will earn their base points.`
//     );
//     if (!confirmed) return;

//     setBulkApproving(true);
//     let success = 0;
//     let failed  = 0;

//     for (const task of firstTasks) {
//       try {
//         await api.post(`/admin/pending-tasks/${task.id}/approve`, { bonusPoints: 0 });
//         success++;
//       } catch {
//         failed++;
//       }
//     }

//     setBulkApproving(false);
//     alert(`✅ Bulk approved: ${success} approved${failed > 0 ? `, ${failed} failed` : ''}. All users notified.`);
//     await loadTasks();
//   };

//   // ── APPROVE ───────────────────────────────────────────────────────────────
//   const handleApprove = async () => {
//     if (!selected) return;
//     try {
//       setProcessing(true);
//       await api.post(`/tasksmanual/admin/${selected.id}/approve`, {
//         bonusPoints: parseInt(bonusPoints || '0', 10),
//       });

//       const total = selected.task.basePoints + parseInt(bonusPoints || '0', 10);
//       alert(`✅ Approved! ${selected.user.fullName} earned ${total} points. User and followers have been notified.`);

//       setActionOpen(false);
//       await loadTasks();
//     } catch (error: any) {
//       alert('Error: ' + (error.response?.data?.message || 'Failed to approve'));
//     } finally {
//       setProcessing(false);
//     }
//   };

//   // ── REJECT ────────────────────────────────────────────────────────────────
//   const handleReject = async () => {
//     if (!selected) return;
//     if (!rejectReason.trim()) {
//       alert('Please enter a rejection reason');
//       return;
//     }
//     try {
//       setProcessing(true);
//       await api.post(`/tasksmanual/admin/${selected.id}/reject`, {
//         reason: rejectReason.trim(),
//       });

//       alert(`❌ Rejected. ${selected.user.fullName} has been notified with your reason.`);

//       setActionOpen(false);
//       await loadTasks();
//     } catch (error: any) {
//       alert('Error: ' + (error.response?.data?.message || 'Failed to reject'));
//     } finally {
//       setProcessing(false);
//     }
//   };

//   // ── Helpers ───────────────────────────────────────────────────────────────
//   const getCategoryColor = (cat: string): 'primary' | 'warning' | 'success' | 'secondary' | 'default' => {
//     const map: Record<string, any> = {
//       cleaning:   'primary',
//       cooking:    'warning',
//       organizing: 'success',
//       laundry:    'secondary',
//     };
//     return map[cat] || 'default';
//   };

//   // ─────────────────────────────────────────────────────────────────────────
//   // RENDER
//   // ─────────────────────────────────────────────────────────────────────────

//   return (
//     <Box sx={{ p: 3 }}>

//       {/* Page header */}
//       <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//         <Box>
//           <Typography variant="h4" gutterBottom>
//             📸 Task Reviews
//           </Typography>
//           <Typography variant="body2" color="text.secondary">
//             Review user task submissions and award points
//           </Typography>
//         </Box>
//         <Button
//           startIcon={<Refresh />}
//           variant="outlined"
//           onClick={loadTasks}
//           disabled={loading}
//         >
//           Refresh
//         </Button>
//       </Box>

//       {/* Tabs */}
//       <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
//         <ToggleButtonGroup
//           value={activeTab}
//           exclusive
//           onChange={(_, val) => { if (val) { setActiveTab(val); setPage(1); } }}
//           size="small"
//         >
//           <ToggleButton value="regular" sx={{ px: 3 }}>
//             ✅ Regular Tasks
//             {activeTab === 'regular' && total > 0 && (
//               <Chip label={total} size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: 10 }} />
//             )}
//           </ToggleButton>
//           <ToggleButton value="first" sx={{ px: 3 }}>
//             🎯 First Tasks (Onboarding)
//             {activeTab === 'first' && total > 0 && (
//               <Chip label={total} size="small" color="success" sx={{ ml: 1, height: 18, fontSize: 10 }} />
//             )}
//           </ToggleButton>
//         </ToggleButtonGroup>

//         {/* Bulk approve button — only on first tasks tab */}
//         {activeTab === 'first' && tasks.length > 0 && (
//           <Button
//             variant="contained"
//             color="success"
//             size="small"
//             startIcon={bulkApproving ? <CircularProgress size={14} color="inherit" /> : <CheckCircle />}
//             onClick={handleBulkApprove}
//             disabled={bulkApproving}
//             sx={{ ml: 'auto' }}
//           >
//             {bulkApproving ? 'Approving...' : `Bulk Approve All ${tasks.length}`}
//           </Button>
//         )}
//       </Box>

//       {/* First task info banner */}
//       {activeTab === 'first' && (
//         <Alert severity="info" sx={{ mb: 2 }}>
//           <strong>Onboarding Tasks</strong> — These are first-time submissions from new users.
//           Default task is <strong>Bed Organizing</strong>. You can bulk approve all or review individually.
//           Users earn base points only (no bonus) on bulk approval.
//         </Alert>
//       )}

//       {/* Stats cards */}
//       <Grid container spacing={2} sx={{ mb: 3 }}>
//         <Grid item xs={12} sm={4}>
//           <Card>
//             <CardContent>
//               <Typography color="text.secondary" variant="body2" gutterBottom>
//                 Pending Review
//               </Typography>
//               <Typography variant="h4" color="warning.main">
//                 {loading ? '—' : total}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={4}>
//           <Card>
//             <CardContent>
//               <Typography color="text.secondary" variant="body2" gutterBottom>
//                 Current Page
//               </Typography>
//               <Typography variant="h4" color="text.primary">
//                 {page} / {totalPages}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={4}>
//           <Card>
//             <CardContent>
//               <Typography color="text.secondary" variant="body2" gutterBottom>
//                 Showing
//               </Typography>
//               <Typography variant="h4" color="primary.main">
//                 {tasks.length}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       {/* Table */}
//       <TableContainer component={Paper}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
//               <TableCell><strong>User</strong></TableCell>
//               <TableCell><strong>Task</strong></TableCell>
//               <TableCell><strong>Category</strong></TableCell>
//               <TableCell><strong>Location</strong></TableCell>
//               <TableCell><strong>Photos</strong></TableCell>
//               <TableCell><strong>Items</strong></TableCell>
//               <TableCell><strong>Points</strong></TableCell>
//               <TableCell><strong>Submitted</strong></TableCell>
//               <TableCell><strong>Duration</strong></TableCell>
//               <TableCell align="center"><strong>Action</strong></TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
//                   <CircularProgress />
//                 </TableCell>
//               </TableRow>
//             ) : tasks.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
//                   <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
//                   <Typography variant="h6">All caught up!</Typography>
//                   <Typography variant="body2" color="text.secondary">
//                     No pending submissions to review.
//                   </Typography>
//                 </TableCell>
//               </TableRow>
//             ) : (
//               tasks.map((task) => (
//                 <TableRow
//                   key={task.id}
//                   hover
//                   sx={(task as any).locationFlagged ? { backgroundColor: '#FFF5F5', '&:hover': { backgroundColor: '#FEE2E2' } } : {}}
//                 >

//                   {/* User */}
//                   <TableCell>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                       <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', fontSize: 14 }}>
//                         {task.user.fullName.charAt(0).toUpperCase()}
//                       </Avatar>
//                       <Box>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                           <Typography variant="body2" fontWeight={600}>
//                             {task.user.fullName}
//                           </Typography>
//                           {!task.user.firstTaskCompleted && (
//                             <Chip label="1st" size="small" color="success"
//                               sx={{ height: 16, fontSize: 9, fontWeight: 700 }} />
//                           )}
//                         </Box>
//                         <Typography variant="caption" color="text.secondary">
//                           {task.user.city || task.user.phone}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   </TableCell>

//                   {/* Task */}
//                   <TableCell>
//                     <Typography variant="body2" fontWeight={600}>
//                       {task.task.title}
//                     </Typography>
//                   </TableCell>

//                   {/* Category */}
//                   <TableCell>
//                     <Chip
//                       label={task.task.category}
//                       color={getCategoryColor(task.task.category)}
//                       size="small"
//                       sx={{ textTransform: 'capitalize' }}
//                     />
//                   </TableCell>

//                   {/* Location badge */}
//                   <TableCell>
//                     {(task as any).locationFlagged ? (
//                       <Tooltip title="Another user submitted from the same location within 2 hours — possible household sharing or fraud">
//                         <Chip
//                           label="🚩 Flagged"
//                           size="small"
//                           sx={{
//                             bgcolor: '#FEE2E2',
//                             color: '#991B1B',
//                             fontWeight: 700,
//                             fontSize: 11,
//                             border: '1px solid #FCA5A5',
//                           }}
//                         />
//                       </Tooltip>
//                     ) : (task as any).locationDenied ? (
//                       <Tooltip title="User denied location permission — cannot verify physical location">
//                         <Chip
//                           label="⚠️ No Location"
//                           size="small"
//                           sx={{
//                             bgcolor: '#FEF3C7',
//                             color: '#92400E',
//                             fontWeight: 600,
//                             fontSize: 11,
//                             border: '1px solid #FCD34D',
//                           }}
//                         />
//                       </Tooltip>
//                     ) : (
//                       <Tooltip title="Location verified at photo capture moment">
//                         <Chip
//                           label="📍 Verified"
//                           size="small"
//                           sx={{
//                             bgcolor: '#D1FAE5',
//                             color: '#065F46',
//                             fontWeight: 600,
//                             fontSize: 11,
//                             border: '1px solid #6EE7B7',
//                           }}
//                         />
//                       </Tooltip>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     <Box sx={{ display: 'flex', gap: 1 }}>
//                       <Box
//                         component="img"
//                         src={task.beforePhotoUrl}
//                         alt="before"
//                         sx={{
//                           width: 48,
//                           height: 48,
//                           borderRadius: 1,
//                           objectFit: 'cover',
//                           border: '2px solid #E5E7EB',
//                           cursor: 'pointer',
//                         }}
//                         onClick={() => openDetail(task)}
//                       />
//                       <Box
//                         component="img"
//                         src={task.afterPhotoUrl}
//                         alt="after"
//                         sx={{
//                           width: 48,
//                           height: 48,
//                           borderRadius: 1,
//                           objectFit: 'cover',
//                           border: '2px solid #6366F1',
//                           cursor: 'pointer',
//                         }}
//                         onClick={() => { openDetail(task); setPhotoView('after'); }}
//                       />
//                     </Box>
//                   </TableCell>

//                   {/* Item count */}
//                   <TableCell>
//                     {task.objectCount > 0
//                       ? <Chip label={`${task.objectCount} items`} size="small" variant="outlined" />
//                       : <Typography variant="caption" color="text.secondary">—</Typography>
//                     }
//                   </TableCell>

//                   {/* Points */}
//                   <TableCell>
//                     <Typography variant="body2" fontWeight={700} color="warning.main">
//                       {task.task.basePoints} pts
//                     </Typography>
//                     {task.task.bonusPoints > 0 && (
//                       <Typography variant="caption" color="text.secondary">
//                         +{task.task.bonusPoints} bonus
//                       </Typography>
//                     )}
//                   </TableCell>

//                   {/* Date */}
//                   <TableCell>
//                     <Typography variant="body2">
//                       {format(new Date(task.createdAt), 'MMM dd, yyyy')}
//                     </Typography>
//                     <Typography variant="caption" color="text.secondary">
//                       {format(new Date(task.createdAt), 'hh:mm a')}
//                     </Typography>
//                   </TableCell>

//                   {/* Duration */}
//                   <TableCell>
//                     <Typography variant="body2" fontWeight={600}>
//                       {getDuration(task.startedAt, task.completedAt)}
//                     </Typography>
//                     <Typography variant="caption" color="text.secondary" display="block">
//                       {formatTime(task.startedAt)} → {formatTime(task.completedAt)}
//                     </Typography>
//                   </TableCell>

//                   {/* Actions */}
//                   <TableCell align="center">
//                     <Stack direction="row" spacing={1} justifyContent="center">
//                       <Tooltip title="View Details">
//                         <IconButton
//                           size="small"
//                           onClick={() => openDetail(task)}
//                         >
//                           <Info fontSize="small" />
//                         </IconButton>
//                       </Tooltip>
//                       <Tooltip title="Approve">
//                         <IconButton
//                           size="small"
//                           color="success"
//                           onClick={() => { setSelected(task); openAction('approve'); }}
//                         >
//                           <CheckCircle fontSize="small" />
//                         </IconButton>
//                       </Tooltip>
//                       <Tooltip title="Reject">
//                         <IconButton
//                           size="small"
//                           color="error"
//                           onClick={() => { setSelected(task); openAction('reject'); }}
//                         >
//                           <Cancel fontSize="small" />
//                         </IconButton>
//                       </Tooltip>
//                     </Stack>
//                   </TableCell>

//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
//           <Button
//             variant="outlined"
//             disabled={page === 1 || loading}
//             onClick={() => setPage(p => p - 1)}
//           >
//             Previous
//           </Button>
//           <Typography sx={{ alignSelf: 'center', px: 2 }}>
//             Page {page} of {totalPages}
//           </Typography>
//           <Button
//             variant="outlined"
//             disabled={page === totalPages || loading}
//             onClick={() => setPage(p => p + 1)}
//           >
//             Next
//           </Button>
//         </Box>
//       )}

//       {/* ── DETAIL MODAL ──────────────────────────────────────────────────── */}
//       <Dialog
//         open={detailOpen}
//         onClose={() => setDetailOpen(false)}
//         maxWidth="sm"
//         fullWidth
//       >
//         <DialogTitle>Submission Details</DialogTitle>
//         <DialogContent>
//           {selected && (
//             <Stack spacing={2} sx={{ mt: 1 }}>

//               {/* User info */}
//               <Box>
//                 <Typography variant="subtitle2" color="text.secondary">User</Typography>
//                 <Typography variant="body1" fontWeight={600}>{selected.user.fullName}</Typography>
//                 <Typography variant="body2" color="text.secondary">
//                   {selected.user.phone} · {selected.user.city || 'Unknown city'}
//                 </Typography>
//               </Box>

//               {/* Task info */}
//               <Box>
//                 <Typography variant="subtitle2" color="text.secondary">Task</Typography>
//                 <Typography variant="body1" fontWeight={600}>{selected.task.title}</Typography>
//                 <Chip
//                   label={selected.task.category}
//                   color={getCategoryColor(selected.task.category)}
//                   size="small"
//                   sx={{ mt: 0.5, textTransform: 'capitalize' }}
//                 />
//               </Box>

//               {/* Points */}
//               <Box>
//                 <Typography variant="subtitle2" color="text.secondary">Points</Typography>
//                 <Typography variant="h5" color="warning.main" fontWeight={700}>
//                   {selected.task.basePoints} pts base
//                 </Typography>
//                 {selected.task.bonusPoints > 0 && (
//                   <Typography variant="caption" color="text.secondary">
//                     +{selected.task.bonusPoints} bonus available
//                   </Typography>
//                 )}
//               </Box>

//               {/* Item count */}
//               {selected.objectCount > 0 && (
//                 <Alert severity="info" icon={<EmojiEvents />}>
//                   User reported washing <strong>{selected.objectCount} items</strong>
//                 </Alert>
//               )}

//               {/* Submitted at */}
//               <Box>
//                 <Typography variant="subtitle2" color="text.secondary">Submitted</Typography>
//                 <Typography variant="body2">
//                   {format(new Date(selected.createdAt), 'PPpp')}
//                 </Typography>
//               </Box>

//               {/* Location fraud info */}
//               {(selected as any).locationFlagged ? (
//                 <Alert severity="error" icon={false}>
//                   <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
//                     🚩 Location Flagged
//                   </Typography>
//                   <Typography variant="caption">
//                     Another user submitted the same task from within 50 metres of this location within the last 2 hours.
//                     This may indicate household sharing or photo fraud. Review photos carefully before approving.
//                   </Typography>
//                 </Alert>
//               ) : (selected as any).locationDenied ? (
//                 <Alert severity="warning" icon={false}>
//                   <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
//                     ⚠️ No Location Data
//                   </Typography>
//                   <Typography variant="caption">
//                     User denied location permission. Physical location cannot be verified.
//                     Review photos extra carefully.
//                   </Typography>
//                 </Alert>
//               ) : (
//                 <Alert severity="success" icon={false}>
//                   <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
//                     📍 Location Verified
//                   </Typography>
//                   <Typography variant="caption">
//                     GPS location was captured at the moment photos were taken. No location conflicts detected.
//                   </Typography>
//                 </Alert>
//               )}
//               {(selected.startedAt || selected.completedAt) && (
//                 <Box sx={{ backgroundColor: '#F9FAFB', borderRadius: 2, p: 2 }}>
//                   <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//                     ⏱️ Task Timing
//                   </Typography>
//                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                     <Typography variant="caption" color="text.secondary">Started</Typography>
//                     <Typography variant="body2" fontWeight={600}>
//                       {selected.startedAt ? format(new Date(selected.startedAt), 'hh:mm:ss a') : '—'}
//                     </Typography>
//                   </Box>
//                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
//                     <Typography variant="caption" color="text.secondary">Completed</Typography>
//                     <Typography variant="body2" fontWeight={600}>
//                       {selected.completedAt ? format(new Date(selected.completedAt), 'hh:mm:ss a') : '—'}
//                     </Typography>
//                   </Box>
//                   <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', pt: 1, mt: 0.5 }}>
//                     <Typography variant="caption" color="text.secondary">Total Duration</Typography>
//                     <Typography variant="body2" fontWeight={700} color="primary.main">
//                       {getDuration(selected.startedAt, selected.completedAt)}
//                     </Typography>
//                   </Box>
//                 </Box>
//               )}

//               {/* Photo toggle */}
//               <Box>
//                 <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//                   Photos
//                 </Typography>
//                 <ToggleButtonGroup
//                   value={photoView}
//                   exclusive
//                   onChange={(_, val) => val && setPhotoView(val)}
//                   size="small"
//                   sx={{ mb: 1.5 }}
//                 >
//                   <ToggleButton value="before">Before</ToggleButton>
//                   <ToggleButton value="after">After</ToggleButton>
//                 </ToggleButtonGroup>

//                 <Box
//                   component="img"
//                   src={photoView === 'before' ? selected.beforePhotoUrl : selected.afterPhotoUrl}
//                   alt={photoView}
//                   sx={{
//                     width: '100%',
//                     maxHeight: 320,
//                     objectFit: 'cover',
//                     borderRadius: 2,
//                     border: '2px solid #E5E7EB',
//                   }}
//                 />

//                 {/* Thumbnails */}
//                 <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
//                   <Box
//                     component="img"
//                     src={selected.beforePhotoUrl}
//                     alt="before"
//                     onClick={() => setPhotoView('before')}
//                     sx={{
//                       width: 72,
//                       height: 56,
//                       borderRadius: 1,
//                       objectFit: 'cover',
//                       cursor: 'pointer',
//                       border: photoView === 'before' ? '2px solid #6366F1' : '2px solid #E5E7EB',
//                       opacity: photoView === 'before' ? 1 : 0.6,
//                     }}
//                   />
//                   <Box
//                     component="img"
//                     src={selected.afterPhotoUrl}
//                     alt="after"
//                     onClick={() => setPhotoView('after')}
//                     sx={{
//                       width: 72,
//                       height: 56,
//                       borderRadius: 1,
//                       objectFit: 'cover',
//                       cursor: 'pointer',
//                       border: photoView === 'after' ? '2px solid #6366F1' : '2px solid #E5E7EB',
//                       opacity: photoView === 'after' ? 1 : 0.6,
//                     }}
//                   />
//                   <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
//                     Click to toggle
//                   </Typography>
//                 </Box>
//               </Box>

//             </Stack>
//           )}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setDetailOpen(false)}>Close</Button>
//           <Button
//             variant="outlined"
//             color="error"
//             onClick={() => openAction('reject')}
//           >
//             Reject
//           </Button>
//           <Button
//             variant="contained"
//             color="success"
//             onClick={() => openAction('approve')}
//           >
//             Approve
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* ── ACTION MODAL (Approve / Reject) ───────────────────────────────── */}
//       <Dialog
//         open={actionOpen}
//         onClose={() => setActionOpen(false)}
//         maxWidth="xs"
//         fullWidth
//       >
//         <DialogTitle>
//           {actionType === 'approve' ? '✅ Approve Submission' : '❌ Reject Submission'}
//         </DialogTitle>
//         <DialogContent>
//           {selected && (
//             <Stack spacing={2} sx={{ mt: 1 }}>
//               <Typography variant="body2" color="text.secondary">
//                 <strong>{selected.user.fullName}</strong> — {selected.task.title}
//               </Typography>

//               {/* APPROVE PANEL */}
//               {actionType === 'approve' && (
//                 <>
//                   <Box sx={{ backgroundColor: '#F9FAFB', borderRadius: 2, p: 2 }}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
//                       <Typography variant="body2" color="text.secondary">Base Points</Typography>
//                       <Typography variant="body2" fontWeight={600}>{selected.task.basePoints}</Typography>
//                     </Box>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
//                       <Typography variant="body2" color="text.secondary">Bonus Points</Typography>
//                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                         <IconButton
//                           size="small"
//                           onClick={() => setBonusPoints(String(Math.max(0, parseInt(bonusPoints || '0') - 5)))}
//                           sx={{ border: '1px solid #E5E7EB', width: 28, height: 28 }}
//                         >
//                           <Typography fontSize={16}>−</Typography>
//                         </IconButton>
//                         <TextField
//                           value={bonusPoints}
//                           onChange={(e) => setBonusPoints(e.target.value)}
//                           size="small"
//                           inputProps={{ style: { textAlign: 'center', width: 48 } }}
//                         />
//                         <IconButton
//                           size="small"
//                           onClick={() => setBonusPoints(String(parseInt(bonusPoints || '0') + 5))}
//                           sx={{ border: '1px solid #6366F1', bgcolor: 'primary.main', width: 28, height: 28, '&:hover': { bgcolor: 'primary.dark' } }}
//                         >
//                           <Typography fontSize={16} color="white">+</Typography>
//                         </IconButton>
//                       </Box>
//                     </Box>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', pt: 1 }}>
//                       <Typography variant="body1" fontWeight={700}>Total</Typography>
//                       <Typography variant="h6" color="warning.main" fontWeight={800}>
//                         {selected.task.basePoints + parseInt(bonusPoints || '0', 10)} pts
//                       </Typography>
//                     </Box>
//                   </Box>
//                   <Alert severity="info" sx={{ fontSize: 12 }}>
//                     User will be notified and all their followers will get a push notification 🎉
//                   </Alert>
//                 </>
//               )}

//               {/* REJECT PANEL */}
//               {actionType === 'reject' && (
//                 <>
//                   <Box>
//                     <Typography variant="body2" fontWeight={600} gutterBottom>
//                       Quick Reasons
//                     </Typography>
//                     <Stack direction="row" flexWrap="wrap" gap={1}>
//                       {QUICK_REASONS.map((reason) => (
//                         <Chip
//                           key={reason}
//                           label={reason}
//                           size="small"
//                           onClick={() => setRejectReason(reason)}
//                           color={rejectReason === reason ? 'error' : 'default'}
//                           variant={rejectReason === reason ? 'filled' : 'outlined'}
//                           sx={{ cursor: 'pointer' }}
//                         />
//                       ))}
//                     </Stack>
//                   </Box>
//                   <TextField
//                     fullWidth
//                     multiline
//                     rows={3}
//                     label="Rejection Reason *"
//                     placeholder="Or type a custom reason..."
//                     value={rejectReason}
//                     onChange={(e) => setRejectReason(e.target.value)}
//                     helperText="User will see this reason so they can improve"
//                   />
//                 </>
//               )}
//             </Stack>
//           )}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setActionOpen(false)} disabled={processing}>
//             Cancel
//           </Button>
//           <Button
//             variant="contained"
//             color={actionType === 'approve' ? 'success' : 'error'}
//             onClick={actionType === 'approve' ? handleApprove : handleReject}
//             disabled={processing}
//           >
//             {processing
//               ? <CircularProgress size={18} color="inherit" />
//               : actionType === 'approve'
//                 ? `Approve & Award ${selected ? selected.task.basePoints + parseInt(bonusPoints || '0', 10) : 0} pts`
//                 : 'Reject & Notify User'
//             }
//           </Button>
//         </DialogActions>
//       </Dialog>

//     </Box>
//   );
// }

// worktracker-admin/src/pages/PendingTaskReviews.tsx
// Admin page to review, approve, and reject user task submissions

import React, { useState, useEffect } from 'react';
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

// Returns distance in metres between before/after photo locations, or null
const getPhotoDistance = (task: PendingTask): number | null => {
  const b = task.beforePhotoLocation;
  const a = task.afterPhotoLocation;
  if (!b || !a) return null;
  return Math.round(haversineMeters(b.lat, b.lng, a.lat, a.lng));
};

type RiskLevel = 'high' | 'medium' | 'low' | 'none';

// Risk classification
//   high   — distance < 10 m (photos taken at exact same spot — suspicious)
//   medium — distance 10–50 m (nearby — flag for review)
//   low    — distance > 50 m (moved around — likely genuine)
//   none   — no location data
const getRiskLevel = (task: PendingTask): RiskLevel => {
  if (task.locationDenied || (!task.beforePhotoLocation && !task.afterPhotoLocation)) return 'none';
  const d = getPhotoDistance(task);
  if (d === null) return 'none';
  if (d < 10)  return 'high';
  if (d < 50)  return 'medium';
  return 'low';
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
  high:   { label: '🔴 High Risk',    bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', rowBg: '#FFF5F5', rowHover: '#FEE2E2' },
  medium: { label: '🟡 Review',       bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', rowBg: '#FFFBEB', rowHover: '#FEF3C7' },
  low:    { label: '🟢 Looks Good',   bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7', rowBg: '',        rowHover: '' },
  none:   { label: '⚫ No Location',  bg: '#F3F4F6', color: '#374151', border: '#D1D5DB', rowBg: '',        rowHover: '' },
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
    high:   tasks.filter(t => getRiskLevel(t as PendingTask) === 'high').length,
    medium: tasks.filter(t => getRiskLevel(t as PendingTask) === 'medium').length,
    low:    tasks.filter(t => getRiskLevel(t as PendingTask) === 'low').length,
    none:   tasks.filter(t => getRiskLevel(t as PendingTask) === 'none').length,
  };

  // Apply risk filter
  const filteredTasks = riskFilter === 'all'
    ? tasks
    : tasks.filter(t => getRiskLevel(t as PendingTask) === riskFilter);

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

      {/* Risk breakdown cards — clickable filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(['all', 'high', 'medium', 'low', 'none'] as const).map((level) => {
          const count  = level === 'all' ? tasks.length : riskCounts[level];
          const style  = level === 'all'
            ? { label: '📋 All',          bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' }
            : RISK_STYLES[level];
          const active = riskFilter === level;
          return (
            <Grid item xs={6} sm={level === 'all' ? 12 : 6} md={level === 'all' ? 2.4 : 2.4} key={level}>
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
                  {level === 'high'   && <Typography variant="caption" color="text.secondary">distance &lt; 10m</Typography>}
                  {level === 'medium' && <Typography variant="caption" color="text.secondary">distance 10–50m</Typography>}
                  {level === 'low'    && <Typography variant="caption" color="text.secondary">distance &gt; 50m</Typography>}
                  {level === 'none'   && <Typography variant="caption" color="text.secondary">no GPS data</Typography>}
                  {level === 'all'    && <Typography variant="caption" color="text.secondary">click to reset filter</Typography>}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Active filter banner */}
      {riskFilter !== 'all' && (
        <Alert
          severity={riskFilter === 'high' ? 'error' : riskFilter === 'medium' ? 'warning' : 'info'}
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={() => setRiskFilter('all')}>Clear Filter</Button>
          }
        >
          Showing <strong>{RISK_STYLES[riskFilter].label}</strong> submissions only
          {riskFilter === 'high'   && ' — Before & after photos taken within 10 metres. Likely never moved. Review carefully.'}
          {riskFilter === 'medium' && ' — Photos taken within 50 metres. May be legitimate (same home). Verify photos.'}
          {riskFilter === 'low'    && ' — Good movement between photos. Low fraud risk.'}
          {riskFilter === 'none'   && ' — No GPS captured. Cannot verify location. Check photos manually.'}
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
              filteredTasks.map((task) => {
                const risk = getRiskLevel(task as PendingTask);
                const rs   = RISK_STYLES[risk];
                const dist = getPhotoDistance(task as PendingTask);
                return (
                <TableRow
                  key={task.id}
                  hover
                  sx={rs.rowBg ? { backgroundColor: rs.rowBg, '&:hover': { backgroundColor: rs.rowHover } } : {}}
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

                  {/* Location — distance + risk badge */}
                  <TableCell>
                    <Tooltip title={
                      risk === 'high'   ? 'Before & after photos taken < 10m apart — user likely never moved. High fraud risk.' :
                      risk === 'medium' ? 'Photos taken 10–50m apart — possible same building. Review carefully.' :
                      risk === 'low'    ? 'Photos taken > 50m apart — user moved between shots. Looks genuine.' :
                                         'No GPS data captured. User denied location permission.'
                    }>
                      <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                        <Chip
                          label={rs.label}
                          size="small"
                          sx={{ bgcolor: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, fontWeight: 700, fontSize: 11 }}
                        />
                        {dist !== null ? (
                          <Typography variant="caption" fontWeight={700} sx={{ color: rs.color, fontSize: 11 }}>
                            📏 {dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km`} apart
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: 11 }}>
                            no GPS
                          </Typography>
                        )}
                      </Box>
                    </Tooltip>
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
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => openDetail(task)}
                        >
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approve">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => { setSelected(task); openAction('approve'); }}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
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

              {/* Location fraud info — with actual distance */}
              {(() => {
                const risk = getRiskLevel(selected as PendingTask);
                const dist = getPhotoDistance(selected as PendingTask);
                const distStr = dist !== null
                  ? (dist < 1000 ? `${dist} metres` : `${(dist / 1000).toFixed(1)} km`)
                  : null;
                if (risk === 'high') return (
                  <Alert severity="error" icon={false}>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      🔴 High Risk — Photos {distStr} apart
                    </Typography>
                    <Typography variant="caption">
                      Before and after photos were taken less than 10 metres apart. The user likely never moved.
                      This is a strong indicator of a fake submission. Reject unless photos clearly show real work.
                    </Typography>
                  </Alert>
                );
                if (risk === 'medium') return (
                  <Alert severity="warning" icon={false}>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      🟡 Review — Photos {distStr} apart
                    </Typography>
                    <Typography variant="caption">
                      Photos taken within 50 metres of each other. Could be a large home or the same building.
                      Not conclusive — verify by looking at the photos carefully.
                    </Typography>
                  </Alert>
                );
                if (risk === 'low') return (
                  <Alert severity="success" icon={false}>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      🟢 Looks Good — Photos {distStr} apart
                    </Typography>
                    <Typography variant="caption">
                      Before and after photos were taken more than 50 metres apart. User moved around — low fraud risk.
                    </Typography>
                  </Alert>
                );
                return (
                  <Alert severity="info" icon={false}>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      ⚫ No Location Data
                    </Typography>
                    <Typography variant="caption">
                      User denied location permission. Distance between photos cannot be calculated.
                      Review the photos manually to verify the task was actually done.
                    </Typography>
                  </Alert>
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