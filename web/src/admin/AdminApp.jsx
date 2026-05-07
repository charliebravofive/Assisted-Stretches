import React, { useState, useEffect } from 'react';
import { checkAuth } from './adminApi.js';
import LoginPage from './LoginPage.jsx';
import AdminLayout from './AdminLayout.jsx';

export default function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    checkAuth()
      .then(res => {
        setAuthed(res && res.ok === true);
      })
      .catch(() => {
        setAuthed(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#1a1816',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ color: '#c8856a', fontSize: 18, fontFamily: 'Georgia, serif' }}>
          Loading…
        </div>
      </div>
    );
  }

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <AdminLayout
      currentPage={currentPage}
      setPage={setCurrentPage}
      onLogout={() => setAuthed(false)}
    />
  );
}
