import React, { useState, useEffect } from 'react';
import { getBookings, updateBooking, exportBookings } from './adminApi.js';

const STATUS_COLORS = {
  confirmed: { bg: '#dcfce7', color: '#166534' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
  'no-show': { bg: '#f3f4f6', color: '#6b7280' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      borderRadius: 20,
      padding: '3px 10px',
      fontSize: 12,
      fontWeight: 600,
      fontFamily: 'sans-serif',
    }}>
      {status || 'unknown'}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [reschedule, setReschedule] = useState({ date: '', time: '' });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (statusFilter) params.push(`status=${statusFilter}`);
    const qs = params.length ? '?' + params.join('&') : '';
    getBookings(qs)
      .then(d => Array.isArray(d) ? setBookings(d) : setError(d.error || 'Error'))
      .catch(() => setError('Failed to load bookings'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search, statusFilter]);

  async function patch(id, fields) {
    setSaving(true);
    const updated = await updateBooking(id, fields);
    setSaving(false);
    if (updated && !updated.error) {
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
    }
    return updated;
  }

  async function handleCancel(booking) {
    const reason = window.prompt('Cancellation reason (optional):') ?? '';
    if (reason === null) return;
    await patch(booking.id, { status: 'cancelled', admin_notes: reason || booking.admin_notes });
  }

  async function handleNoShow(booking) {
    if (!window.confirm('Mark as no-show?')) return;
    await patch(booking.id, { status: 'no-show' });
  }

  async function handleReschedule(booking) {
    if (!reschedule.date && !reschedule.time) return;
    const fields = {};
    if (reschedule.date) fields.session_date = reschedule.date;
    if (reschedule.time) fields.session_time = reschedule.time;
    await patch(booking.id, fields);
    setReschedule({ date: '', time: '' });
  }

  const statusButtons = ['', 'confirmed', 'cancelled', 'no-show'];
  const statusLabels = { '': 'All', confirmed: 'Confirmed', cancelled: 'Cancelled', 'no-show': 'No-show' };

  return (
    <div>
      {/* Filters + Export */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {statusButtons.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  ...btnStyle,
                  background: statusFilter === s ? '#1e2a24' : '#fff',
                  color: statusFilter === s ? '#fff' : '#1a1816',
                }}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => exportBookings()}
          style={{ ...btnStyle, background: '#2D3D35', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}
        >
          Export CSV
        </button>
      </div>

      {loading && <div style={{ color: '#888' }}>Loading…</div>}
      {error && <div style={{ color: '#dc2626' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto', width: '100%' }}>
          {bookings.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>No bookings found</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: '#fafaf8' }}>
                  <th style={thStyle}>Date ↓</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Client</th>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <React.Fragment key={b.id}>
                    <tr
                      style={{ background: i % 2 === 0 ? '#fff' : '#fafaf8', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0ece6'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafaf8'}
                      onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                    >
                      <td style={tdStyle}>{formatDate(b.session_date)}</td>
                      <td style={tdStyle}>{b.session_time || '—'}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{b.name}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{b.email}</div>
                      </td>
                      <td style={tdStyle}>{b.product_id || '—'}</td>
                      <td style={tdStyle}>{b.payment_method || '—'}</td>
                      <td style={tdStyle}><StatusBadge status={b.status} /></td>
                      <td style={tdStyle}>
                        <span style={{ color: '#c8856a', fontSize: 12 }}>
                          {expandedId === b.id ? '▲' : '▼'}
                        </span>
                      </td>
                    </tr>
                    {expandedId === b.id && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0, background: '#fff' }}>
                          <div style={{ padding: 20, borderTop: '2px solid #c8856a', borderBottom: '1px solid #f0ece6' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                              <Field label="Booking ID" value={b.id} />
                              <Field label="Phone" value={b.phone || '—'} />
                              <Field label="Gift Card Code" value={b.gift_card_code || '—'} />
                              <Field label="Session Date" value={formatDate(b.session_date)} />
                              <Field label="Session Time" value={b.session_time || '—'} />
                              <Field label="Status" value={b.status} />
                              <Field label="Admin Notes" value={b.admin_notes || '—'} />
                              <Field label="Created" value={b.created_at ? new Date(b.created_at).toLocaleString('en-AU') : '—'} />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                              {b.status !== 'cancelled' && (
                                <button onClick={() => handleCancel(b)} disabled={saving} style={dangerBtnStyle}>
                                  Cancel Booking
                                </button>
                              )}
                              {b.status !== 'no-show' && b.status !== 'cancelled' && (
                                <button onClick={() => handleNoShow(b)} disabled={saving} style={secondaryBtnStyle}>
                                  Mark No-show
                                </button>
                              )}
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fafaf8', border: '1px solid #d4c4a8', borderRadius: 6, padding: '4px 10px' }}>
                                <span style={{ fontSize: 12, color: '#666' }}>Reschedule:</span>
                                <input
                                  type="date"
                                  value={reschedule.date}
                                  onChange={e => setReschedule(r => ({ ...r, date: e.target.value }))}
                                  style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none' }}
                                />
                                <input
                                  type="text"
                                  placeholder="e.g. 10:00 AM"
                                  value={reschedule.time}
                                  onChange={e => setReschedule(r => ({ ...r, time: e.target.value }))}
                                  style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', width: 100 }}
                                />
                                <button
                                  onClick={() => handleReschedule(b)}
                                  disabled={saving || (!reschedule.date && !reschedule.time)}
                                  style={primaryBtnStyle}
                                >
                                  Confirm
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1a1816' }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  padding: '8px 14px',
  border: '1px solid #d4c4a8',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  minWidth: 240,
};

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

const btnStyle = {
  padding: '8px 14px',
  border: '1px solid #d4c4a8',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const primaryBtnStyle = {
  padding: '6px 14px',
  background: '#c8856a',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const dangerBtnStyle = {
  padding: '8px 14px',
  background: '#dc2626',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const secondaryBtnStyle = {
  padding: '8px 14px',
  background: '#fff',
  color: '#1a1816',
  border: '1px solid #d4c4a8',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
