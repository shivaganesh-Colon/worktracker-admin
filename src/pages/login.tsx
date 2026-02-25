// src/pages/login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../services/api';
import { COLORS } from '../theme/colours';

export default function Login() {
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await loginAdmin(email, password);
      // ✅ FIX: use 'admin_token' consistently (api.ts interceptor reads this key)
      localStorage.setItem('admin_token', res.token);
      navigate('/');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Allow Enter key to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoRow}>
          <span style={s.logo}>WorkTracker</span>
          <span style={s.logoSub}>Admin Panel</span>
        </div>

        <h2 style={s.title}>Sign in</h2>
        <p style={s.subtitle}>Enter your admin credentials</p>

        {/* Error */}
        {error && <div style={s.errorBox}>{error}</div>}

        {/* Email */}
        <label style={s.label}>Email</label>
        <input
          placeholder="admin@worktracker.com"
          value={email}
          type="email"
          onChange={e => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          style={s.input}
        />

        {/* Password */}
        <label style={s.label}>Password</label>
        <input
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          style={s.input}
        />

        {/* Submit */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ ...s.button, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '⏳ Signing in...' : '🔐 Sign In'}
        </button>

        {/* Default creds hint (remove in production!) */}
        <p style={s.hint}>
          Default: admin@worktracker.com / Admin@123
        </p>
      </div>
    </div>
  );
}

const s: any = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: COLORS.background,
  },
  card: {
    width: 380,
    padding: '32px 28px',
    background: '#fff',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 24,
  },
  logo: {
    fontSize: 20,
    fontWeight: 800,
    color: COLORS.primary,
  },
  logoSub: {
    fontSize: 12,
    color: COLORS.textLight,
    background: COLORS.primaryLight,
    padding: '2px 8px',
    borderRadius: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.text,
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    margin: '0 0 20px',
  },
  errorBox: {
    background: COLORS.errorLight,
    color: COLORS.error,
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    marginBottom: 16,
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: 8,
    fontSize: 14,
    color: COLORS.text,
    background: '#fff',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: COLORS.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
  },
  hint: {
    textAlign: 'center' as const,
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 16,
    padding: '8px',
    background: COLORS.background,
    borderRadius: 6,
  },
};