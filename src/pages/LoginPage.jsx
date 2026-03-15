import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { login, signup } from '../api/api';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (localStorage.getItem('token')) {
    return <Navigate to="/dashboard" replace />;
  }

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await login(email, password);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userEmail', email);
        window.location.href = '/dashboard';
      } else {
        await signup(email, phoneNumber, password);
        setSuccessMsg('Account created! Please sign in.');
        setMode('login');
        setPassword('');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">🚛</span>
          <div>
            <div className="login-brand">Smart Logistics</div>
            <div className="login-tagline">Fleet Management System</div>
          </div>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {error && <div className="login-alert login-error">{error}</div>}
        {successMsg && <div className="login-alert login-success">{successMsg}</div>}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading
              ? 'Please wait…'
              : mode === 'login'
              ? 'Sign In →'
              : 'Create Account →'}
          </button>
        </form>

        <p className="login-footer-note">
          Smart Logistics &amp; Fleet Utilization System · v1.0
        </p>
      </div>
    </div>
  );
}
