import React, { useState, useEffect } from 'react';
import { logout, getDashboard } from './adminApi.js';
import DashboardPage from './DashboardPage.jsx';
import BookingsPage from './BookingsPage.jsx';
import GiftCardsPage from './GiftCardsPage.jsx';
import ClientsPage from './ClientsPage.jsx';
import EnquiriesPage from './EnquiriesPage.jsx';
import ConfigPage from './ConfigPage.jsx';
import WaiversPage from './WaiversPage.jsx';

function BrandLogoSmall() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width={60} height={42} style={{ display: 'block' }}>
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

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  bookings: 'Bookings',
  'gift-cards': 'Gift Cards',
  clients: 'Clients',
  enquiries: 'Enquiries',
  config: 'Configuration',
  waivers: 'Waivers',
};

export default function AdminLayout({ currentPage, setPage, onLogout }) {
  const [newEnquiries, setNewEnquiries] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    getDashboard().then(d => {
      if (d && typeof d.new_enquiries === 'number') setNewEnquiries(d.new_enquiries);
    }).catch(() => {});
  }, [currentPage]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'gift-cards', label: 'Gift Cards', icon: '🎁' },
    { id: 'clients', label: 'Clients', icon: '👥' },
    { id: 'enquiries', label: 'Enquiries', icon: '✉️', badge: newEnquiries },
    { id: 'waivers', label: 'Waivers', icon: '📋' },
    { id: 'config', label: 'Config', icon: '⚙️' },
  ];

  async function handleLogout() {
    await logout();
    onLogout();
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'bookings': return <BookingsPage />;
      case 'gift-cards': return <GiftCardsPage />;
      case 'clients': return <ClientsPage />;
      case 'enquiries': return <EnquiriesPage />;
      case 'waivers': return <WaiversPage />;
      case 'config': return <ConfigPage />;
      default: return <DashboardPage />;
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 150, transition: 'opacity 0.25s',
          }}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: 240,
        minWidth: 240,
        background: '#1e2a24',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: isMobile ? (sidebarOpen ? 0 : -240) : 0,
        bottom: 0,
        zIndex: 200,
        transition: 'left 0.25s ease',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <BrandLogoSmall />
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navItems.map(item => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setPage(item.id); if (isMobile) setSidebarOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '11px 20px',
                  background: active ? 'rgba(200,133,106,0.15)' : 'transparent',
                  border: 'none',
                  borderLeft: active ? '3px solid #c8856a' : '3px solid transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,1)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    background: '#dc2626',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '1px 7px',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'sans-serif',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              color: 'rgba(255,255,255,0.6)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{
          height: 60,
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(o => !o)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 22, color: '#1a1816', padding: '4px 6px', lineHeight: 1,
                }}
                aria-label="Toggle menu"
              >
                ☰
              </button>
            )}
            <span style={{ fontSize: 14, color: '#888', fontWeight: 400 }}>
              Assisted Stretches Admin
            </span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1816' }}>
            {PAGE_TITLES[currentPage] || 'Admin'}
          </span>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, background: '#f5f4f1', padding: 28 }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
