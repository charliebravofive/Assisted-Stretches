import React, { useState } from 'react';
import { login } from './adminApi.js';

function BrandLogoInline({ height = 56 }) {
  const ratio = 700 / 1000;
  const w = height / ratio;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width={w} height={height} style={{ display: 'block' }}>
      <rect width="1000" height="700" fill="transparent" />
      <circle cx="500" cy="240" r="150" fill="rgba(255,255,255,0.06)" />
      <circle cx="500" cy="240" r="150" fill="none" stroke="#c8856a" strokeWidth="5" />
      <text x="500" y="298" fontFamily="Georgia, 'Times New Roman', serif" fontSize="160" fontWeight="700" textAnchor="middle" letterSpacing="-7">
        <tspan fill="#f0ece6">A</tspan><tspan fill="#c8856a">S</tspan>
      </text>
      <text x="500" y="476" fontFamily="Georgia, 'Times New Roman', serif" fontSize="58" fontWeight="700" fill="#f0ece6" textAnchor="middle" letterSpacing="4">ASSISTED</text>
      <text x="500" y="544" fontFamily="Georgia, 'Times New Roman', serif" fontSize="58" fontWeight="400" fontStyle="italic" fill="#c8856a" textAnchor="middle" letterSpacing="2">stretches</text>
    </svg>
  );
}

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(password);
      if (result.ok) {
        onLogin();
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('Network error — is the server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1816',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 14,
        padding: 40,
        width: 400,
        boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <BrandLogoInline height={80} />
        </div>
        <h1 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#1a1816', margin: '0 0 8px' }}>
          Admin Panel
        </h1>
        <p style={{ textAlign: 'center', color: '#888', fontSize: 14, margin: '0 0 28px' }}>
          Assisted Stretches · Brisbane
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #d4c4a8',
                borderRadius: 8,
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              autoFocus
            />
          </div>
          {error && (
            <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 12px', textAlign: 'center' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#d4a594' : '#c8856a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
