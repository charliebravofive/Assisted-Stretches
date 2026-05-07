import React, { useState, useEffect } from 'react';
import { getDashboard } from './adminApi.js';

function StatCard({ label, value, subtitle, color }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 10,
      padding: 24,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 12, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: color || '#c8856a', lineHeight: 1 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function startOfMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Period report state
  const [periodFrom, setPeriodFrom] = useState(startOfMonthStr());
  const [periodTo, setPeriodTo] = useState(todayStr());
  const [periodData, setPeriodData] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(d => {
        if (d && d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  async function runPeriodReport() {
    setPeriodLoading(true);
    setPeriodError('');
    setPeriodData(null);
    try {
      const d = await getDashboard({ from: periodFrom, to: periodTo });
      if (d && d.error) setPeriodError(d.error);
      else setPeriodData(d.period || null);
    } catch {
      setPeriodError('Failed to load period report');
    } finally {
      setPeriodLoading(false);
    }
  }

  if (loading) return <div style={{ color: '#888', padding: 20 }}>Loading…</div>;
  if (error) return <div style={{ color: '#dc2626', padding: 20 }}>{error}</div>;
  if (!data) return null;

  return (
    <div>
      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <StatCard
          label="Sessions This Month"
          value={data.sessions_this_month}
        />
        <StatCard
          label="Revenue This Month"
          value={`$${(data.revenue_this_month || 0).toLocaleString()}`}
        />
        <StatCard
          label="Active Gift Cards"
          value={data.active_gift_cards}
          subtitle={`${data.gift_card_liability} sessions outstanding`}
        />
        <StatCard
          label="New Clients This Month"
          value={data.new_clients_this_month}
        />
        <StatCard
          label="New Enquiries"
          value={data.new_enquiries}
          color={data.new_enquiries > 0 ? '#dc2626' : '#c8856a'}
        />
      </div>

      {/* Upcoming sessions */}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0ece6' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1816' }}>
            Upcoming Sessions (Next 7 Days)
          </h2>
        </div>
        {data.upcoming_sessions && data.upcoming_sessions.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafaf8' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Product</th>
              </tr>
            </thead>
            <tbody>
              {data.upcoming_sessions.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafaf8' }}>
                  <td style={tdStyle}>{formatDate(s.session_date)}</td>
                  <td style={tdStyle}>{s.session_time || '—'}</td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{s.email}</div>
                  </td>
                  <td style={tdStyle}>{s.product_id || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>
            No upcoming sessions
          </div>
        )}
      </div>

      {/* Period Report */}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0ece6' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1816' }}>Period Report</h2>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>From</label>
              <input
                type="date"
                value={periodFrom}
                onChange={e => setPeriodFrom(e.target.value)}
                style={{ padding: '7px 10px', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>To</label>
              <input
                type="date"
                value={periodTo}
                onChange={e => setPeriodTo(e.target.value)}
                style={{ padding: '7px 10px', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <button
              onClick={runPeriodReport}
              disabled={periodLoading}
              style={{ padding: '8px 18px', background: '#C8856A', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: periodLoading ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: 600, opacity: periodLoading ? 0.7 : 1 }}
            >
              {periodLoading ? 'Loading…' : 'Run Report'}
            </button>
          </div>

          {periodError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{periodError}</div>}

          {periodData && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#fafaf8' }}>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Type</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Sessions</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#fff' }}>
                  <td style={tdStyle}>Single Sessions</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{periodData.sessions_single}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>${(periodData.sessions_single * 125).toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#fafaf8' }}>
                  <td style={tdStyle}>5-Packs</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{periodData.sessions_5pack}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>${(periodData.sessions_5pack * 575).toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#fff' }}>
                  <td style={tdStyle}>10-Packs</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{periodData.sessions_10pack}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>${(periodData.sessions_10pack * 1000).toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#fafaf8' }}>
                  <td style={{ ...tdStyle, color: '#666' }}>via Stripe</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>—</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#666' }}>${periodData.revenue_stripe.toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#fff' }}>
                  <td style={{ ...tdStyle, color: '#666' }}>via Gift Card</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>—</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#666' }}>${periodData.revenue_gift_card.toLocaleString()}</td>
                </tr>
                <tr style={{ background: '#2D3D35' }}>
                  <td style={{ ...tdStyle, color: '#F0ECE6', fontWeight: 700 }}>Total Revenue</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#F0ECE6' }}>
                    {periodData.sessions_single + periodData.sessions_5pack + periodData.sessions_10pack}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#C8856A', fontWeight: 700 }}>${periodData.total_revenue.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          )}

          {!periodData && !periodLoading && !periodError && (
            <div style={{ color: '#aaa', fontSize: 13 }}>Select a date range and click Run Report.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 700,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: 14,
  color: '#1a1816',
  borderTop: '1px solid #f0ece6',
};
