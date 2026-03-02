// worktracker-admin/src/pages/Settings.tsx
// ADMIN SETTINGS PAGE - Configure conversion rates, bonuses, etc.

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Save,
  Refresh,
  AttachMoney,
  EmojiEvents,
  TrendingUp,
} from '@mui/icons-material';
import api from '../services/api';

export default function Settings() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [conversionRate, setConversionRate] = useState(0.25);
  const [minWithdrawalPoints, setMinWithdrawalPoints] = useState(100);
  const [maxWithdrawalPoints, setMaxWithdrawalPoints] = useState(10000);
  const [signupBonusPoints, setSignupBonusPoints] = useState(30);
  const [firstTaskBonus, setFirstTaskBonus] = useState(20);
  const [defaultTaskPoints, setDefaultTaskPoints] = useState(50);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings');
      const data = response.data.settings;
      
      setSettings(data);
      setConversionRate(data.conversionRate);
      setMinWithdrawalPoints(data.minWithdrawalPoints);
      setMaxWithdrawalPoints(data.maxWithdrawalPoints);
      setSignupBonusPoints(data.signupBonusPoints);
      setFirstTaskBonus(data.firstTaskBonus);
      setDefaultTaskPoints(data.defaultTaskPoints);
    } catch (error) {
      console.error('Load settings error:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setMessage('');

      const response = await api.patch('/settings/admin', {
        conversionRate,
        minWithdrawalPoints,
        maxWithdrawalPoints,
        signupBonusPoints,
        firstTaskBonus,
        defaultTaskPoints,
      });

      setMessage('Settings updated successfully! Changes will apply immediately.');
      setSettings(response.data.settings);
      
      // Auto-hide success message
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const calculateExamples = () => {
    return [
      { points: 100, rupees: Math.floor(100 * conversionRate) },
      { points: 200, rupees: Math.floor(200 * conversionRate) },
      { points: 500, rupees: Math.floor(500 * conversionRate) },
      { points: 1000, rupees: Math.floor(1000 * conversionRate) },
      { points: 5000, rupees: Math.floor(5000 * conversionRate) },
    ];
  };

  const getRatioLabel = () => {
    if (conversionRate === 0.25) return '1:4 (100 points = ₹25)';
    if (conversionRate === 0.50) return '1:2 (100 points = ₹50)';
    if (conversionRate === 0.10) return '1:10 (100 points = ₹10)';
    return `${conversionRate} per point`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          ⚙️ App Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure conversion rates, bonuses, and limits
        </Typography>
      </Box>

      {/* Messages */}
      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Settings */}
        <Grid item xs={12} md={6}>
          {/* Conversion Rate */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Conversion Rate
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                How many rupees per point users get when withdrawing
              </Typography>

              <Box sx={{ px: 2 }}>
                <Slider
                  value={conversionRate}
                  onChange={(_, value) => setConversionRate(value as number)}
                  min={0.10}
                  max={1.00}
                  step={0.05}
                  marks={[
                    { value: 0.10, label: '₹0.10' },
                    { value: 0.25, label: '₹0.25' },
                    { value: 0.50, label: '₹0.50' },
                    { value: 1.00, label: '₹1.00' },
                  ]}
                  valueLabelDisplay="on"
                  valueLabelFormat={(value) => `₹${value.toFixed(2)}`}
                />
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Current: {getRatioLabel()}</strong>
                <br />
                100 points = ₹{Math.floor(100 * conversionRate)}
              </Alert>

              <TextField
                fullWidth
                label="Conversion Rate"
                type="number"
                value={conversionRate}
                onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                inputProps={{ min: 0.01, max: 1, step: 0.01 }}
                sx={{ mt: 2 }}
                helperText="Enter value between 0.01 and 1.00"
              />
            </CardContent>
          </Card>

          {/* Withdrawal Limits */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Withdrawal Limits
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Minimum Withdrawal Points"
                type="number"
                value={minWithdrawalPoints}
                onChange={(e) => setMinWithdrawalPoints(parseInt(e.target.value))}
                sx={{ mb: 2 }}
                helperText={`Minimum ₹${Math.floor(minWithdrawalPoints * conversionRate)}`}
              />

              <TextField
                fullWidth
                label="Maximum Withdrawal Points"
                type="number"
                value={maxWithdrawalPoints}
                onChange={(e) => setMaxWithdrawalPoints(parseInt(e.target.value))}
                helperText={`Maximum ₹${Math.floor(maxWithdrawalPoints * conversionRate)}`}
              />
            </CardContent>
          </Card>

          {/* User Bonuses */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiEvents sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  User Bonuses
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Signup Bonus Points"
                type="number"
                value={signupBonusPoints}
                onChange={(e) => setSignupBonusPoints(parseInt(e.target.value))}
                sx={{ mb: 2 }}
                helperText={`New users get ${signupBonusPoints} points (₹${Math.floor(signupBonusPoints * conversionRate)})`}
              />

              <TextField
                fullWidth
                label="First Task Bonus Points"
                type="number"
                value={firstTaskBonus}
                onChange={(e) => setFirstTaskBonus(parseInt(e.target.value))}
                sx={{ mb: 2 }}
                helperText={`First task gives ${firstTaskBonus} extra points`}
              />

              <TextField
                fullWidth
                label="Default Task Points"
                type="number"
                value={defaultTaskPoints}
                onChange={(e) => setDefaultTaskPoints(parseInt(e.target.value))}
                helperText="Base points for completing a task"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Preview */}
        <Grid item xs={12} md={6}>
          {/* Conversion Examples */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💰 Conversion Preview
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                How points convert to money
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Points</strong></TableCell>
                      <TableCell><strong>Money</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculateExamples().map((example) => (
                      <TableRow key={example.points}>
                        <TableCell>{example.points.toLocaleString()} pts</TableCell>
                        <TableCell>
                          <Typography variant="body2" color="success.main" fontWeight="600">
                            ₹{example.rupees}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* User Journey Example */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 User Journey Example
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>1. New User Signs Up</strong>
                  </Typography>
                  <Typography variant="body2">
                    Gets {signupBonusPoints} points (₹{Math.floor(signupBonusPoints * conversionRate)})
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>2. Completes First Task</strong>
                  </Typography>
                  <Typography variant="body2">
                    Gets {defaultTaskPoints + firstTaskBonus} points 
                    (₹{Math.floor((defaultTaskPoints + firstTaskBonus) * conversionRate)})
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="body2">
                    <strong>3. Total After Onboarding</strong>
                  </Typography>
                  <Typography variant="body2" fontWeight="700">
                    {signupBonusPoints + defaultTaskPoints + firstTaskBonus} points 
                    = ₹{Math.floor((signupBonusPoints + defaultTaskPoints + firstTaskBonus) * conversionRate)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Impact Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Current Settings Summary
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Conversion Ratio
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {getRatioLabel()}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Min Withdrawal
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {minWithdrawalPoints} pts (₹{Math.floor(minWithdrawalPoints * conversionRate)})
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Max Withdrawal
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {maxWithdrawalPoints.toLocaleString()} pts (₹{Math.floor(maxWithdrawalPoints * conversionRate)})
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Signup Bonus
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {signupBonusPoints} pts (₹{Math.floor(signupBonusPoints * conversionRate)})
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadSettings}
          disabled={saving}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
}