// worktracker-admin/src/pages/Withdrawals.tsx
// ADMIN WITHDRAWALS MANAGEMENT PAGE

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
  MenuItem,
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
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  Payment,
  Refresh,
  Info,
  Search,
  FilterList,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../services/api';

interface Withdrawal {
  id: string;
  userId: string;
  user: {
    fullName: string;
    phone: string;
    email?: string;
  };
  pointsRedeemed: number;
  amountInRupees: number;
  paymentMethod: string;
  phoneNumber: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  transactionId?: string;
  rejectionReason?: string;
  createdAt: string;
  paidAt?: string;
}

interface Stats {
  pending: number;
  approved: number;
  paid: number;
  rejected: number;
  total: number;
}

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected withdrawal for detail modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  // Process modal state
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, [statusFilter, searchQuery]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/admin/withdrawals', { params });
      setWithdrawals(response.data.withdrawals);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Load withdrawals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    try {
      setProcessing(true);
      await api.patch(`/admin/withdrawals/${withdrawalId}/approve`);
      await loadWithdrawals();
      setDetailModalOpen(false);
      alert('✅ Withdrawal approved successfully!');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to approve'));
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedWithdrawal) return;
    if (!transactionId.trim()) {
      alert('Please enter transaction ID');
      return;
    }

    try {
      setProcessing(true);
      await api.patch(`/admin/withdrawals/${selectedWithdrawal.id}/mark-paid`, {
        transactionId,
      });
      await loadWithdrawals();
      setProcessModalOpen(false);
      setDetailModalOpen(false);
      setTransactionId('');
      alert('✅ Payment marked successfully!');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to mark as paid'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;
    if (!rejectionReason.trim()) {
      alert('Please enter rejection reason');
      return;
    }

    try {
      setProcessing(true);
      await api.patch(`/admin/withdrawals/${selectedWithdrawal.id}/reject`, {
        reason: rejectionReason,
      });
      await loadWithdrawals();
      setProcessModalOpen(false);
      setDetailModalOpen(false);
      setRejectionReason('');
      alert('✅ Withdrawal rejected and points refunded!');
    } catch (error: any) {
      alert('Error: ' + (error.response?.data?.error || 'Failed to reject'));
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'paid': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Pending />;
      case 'approved': return <CheckCircle />;
      case 'paid': return <Payment />;
      case 'rejected': return <Cancel />;
      default: return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          💰 Cash Withdrawals
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage user withdrawal requests
        </Typography>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Pending
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {stats.pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Approved
                </Typography>
                <Typography variant="h4" color="info.main">
                  {stats.approved}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Paid
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.paid}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Rejected
                </Typography>
                <Typography variant="h4" color="error.main">
                  {stats.rejected}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total
                </Typography>
                <Typography variant="h4">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={5} sx={{ textAlign: 'right' }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadWithdrawals}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Payment Method</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : withdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No withdrawals found
                </TableCell>
              </TableRow>
            ) : (
              withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {withdrawal.user.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {withdrawal.user.phone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {withdrawal.pointsRedeemed} pts
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      ₹{withdrawal.amountInRupees}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={withdrawal.paymentMethod.toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="caption" display="block">
                      {withdrawal.phoneNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      // icon={getStatusIcon(withdrawal.status)}
                      label={withdrawal.status.toUpperCase()}
                      color={getStatusColor(withdrawal.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(withdrawal.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(withdrawal.createdAt), 'hh:mm a')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal);
                          setDetailModalOpen(true);
                        }}
                      >
                        <Info />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Withdrawal Details
        </DialogTitle>
        <DialogContent>
          {selectedWithdrawal && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              {/* User Info */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  User
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedWithdrawal.user.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedWithdrawal.user.phone}
                </Typography>
              </Box>

              {/* Amount */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="h5" color="success.main">
                  ₹{selectedWithdrawal.amountInRupees}
                </Typography>
                <Typography variant="caption">
                  {selectedWithdrawal.pointsRedeemed} points redeemed
                </Typography>
              </Box>

              {/* Payment Details */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Payment Details
                </Typography>
                <Typography variant="body2">
                  Method: {selectedWithdrawal.paymentMethod.toUpperCase()}
                </Typography>
                <Typography variant="body2">
                  Phone: {selectedWithdrawal.phoneNumber}
                </Typography>
              </Box>

              {/* Status */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  // icon={getStatusIcon(selectedWithdrawal.status)}
                  label={selectedWithdrawal.status.toUpperCase()}
                  color={getStatusColor(selectedWithdrawal.status)}
                />
              </Box>

              {/* Transaction ID (if paid) */}
              {selectedWithdrawal.transactionId && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {selectedWithdrawal.transactionId}
                  </Typography>
                </Box>
              )}

              {/* Rejection Reason (if rejected) */}
              {selectedWithdrawal.rejectionReason && (
                <Alert severity="error">
                  <strong>Rejection Reason:</strong>
                  <br />
                  {selectedWithdrawal.rejectionReason}
                </Alert>
              )}

              {/* Dates */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Requested
                </Typography>
                <Typography variant="body2">
                  {format(new Date(selectedWithdrawal.createdAt), 'PPpp')}
                </Typography>
              </Box>

              {selectedWithdrawal.paidAt && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Paid
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(selectedWithdrawal.paidAt), 'PPpp')}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailModalOpen(false)}>
            Close
          </Button>
          {selectedWithdrawal?.status === 'pending' && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setProcessModalOpen(true);
                  setDetailModalOpen(false);
                }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleApprove(selectedWithdrawal.id)}
                disabled={processing}
              >
                Approve
              </Button>
            </>
          )}
          {selectedWithdrawal?.status === 'approved' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                setProcessModalOpen(true);
                setDetailModalOpen(false);
              }}
            >
              Mark as Paid
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Process Modal (Mark Paid / Reject) */}
      <Dialog
        open={processModalOpen}
        onClose={() => setProcessModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {selectedWithdrawal?.status === 'approved' ? 'Mark as Paid' : 'Reject Withdrawal'}
        </DialogTitle>
        <DialogContent>
          {selectedWithdrawal?.status === 'approved' ? (
            <TextField
              autoFocus
              fullWidth
              label="Transaction ID / UTR"
              placeholder="Enter Paytm/PhonePe transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              helperText="Enter the transaction ID from your payment"
              sx={{ mt: 2 }}
            />
          ) : (
            <TextField
              autoFocus
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason"
              placeholder="Why are you rejecting this withdrawal?"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              helperText="User will see this reason (points will be refunded)"
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={selectedWithdrawal?.status === 'approved' ? 'success' : 'error'}
            onClick={selectedWithdrawal?.status === 'approved' ? handleMarkPaid : handleReject}
            disabled={processing}
          >
            {processing ? 'Processing...' : selectedWithdrawal?.status === 'approved' ? 'Mark as Paid' : 'Reject & Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}