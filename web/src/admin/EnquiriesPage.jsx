import React, { useState, useEffect } from 'react';
import { getEnquiries, updateEnquiry } from './adminApi.js';

const STATUS_COLORS = {
  new: { bg: '#fff7ed', color: '#9a3412' },
  read: { bg: '#f3f4f6', color: '#6b7280' },
  replied: { bg: '#dcfce7', color: '#166534' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, fontFamily: 'sans-serif',
    }}>
      {status}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return dateStr; }
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabFilter, setTabFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [draftNote, setDraftNote] = useState({});
  const [draftStatus, setDraftStatus] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState({});

  function load() {
    setLoading(true);
    const qs = tabFilter ? `?status=${tabFilter}` : '';
    getEnquiries(qs)
      .then(d => Array.isArray(d) ? setEnquiries(d) : setError(d.error || 'Error'))
      .catch(() => setError('Failed to load enquiries'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [tabFilter]);

  function handleExpand(enq) {
    if (expandedId === enq.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(enq.id);
    setDraftNote(prev => ({ ...prev, [enq.id]: enq.admin_note || '' }));
    setDraftStatus(prev => ({ ...prev, [enq.id]: enq.status || 'new' }));
    // Auto-mark as read
    if (enq.status === 'new') {
      updateEnquiry(enq.id, { status: 'read' }).then(updated => {
        if (updated && !updated.error) {
          setEnquiries(prev => prev.map(e => e.id === enq.id ? updated : e));
          setDraftStatus(prev => ({ ...prev, [enq.id]: 'read' }));
        }
      });
    }
  }

  async function handleSave(enq) {
    setSaving(true);
    const updated = await updateEnquiry(enq.id, {
      status: draftStatus[enq.id] || enq.status,
      admin_note: draftNote[enq.id] ?? enq.admin_note,
    });
    setSaving(false);
    if (updated && !updated.error) {
      setEnquiries(prev => prev.map(e => e.id === enq.id ? updated : e));
      setSaveMsg(prev => ({ ...prev, [enq.id]: 'Saved!' }));
      setTimeout(() => setSaveMsg(prev => ({ ...prev, [enq.id]: '' })), 2000);
    }
  }

  const tabs = ['', 'new', 'read', 'replied'];
  const tabLabels = { '': 'All', new: 'New', read: 'Read', replied: 'Replied' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTabFilter(t)}
            style={{
              padding: '8px 14px',
              border: '1px solid #d4c4a8',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              background: tabFilter === t ? '#1e2a24' : '#fff',
              color: tabFilter === t ? '#fff' : '#1a1816',
            }}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: '#888' }}>Loading…</div>}
      {error && <div style={{ color: '#dc2626' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto', width: '100%' }}>
          {enquiries.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>No enquiries found</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: '#fafaf8' }}>
                  <th style={thStyle}>Received</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Message</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enq, i) => (
                  <React.Fragment key={enq.id}>
                    <tr
                      style={{
                        background: i % 2 === 0 ? '#fff' : '#fafaf8',
                        cursor: 'pointer',
                        borderLeft: enq.status === 'new' ? '3px solid #c8856a' : '3px solid transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0ece6'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafaf8'}
                      onClick={() => handleExpand(enq)}
                    >
                      <td style={tdStyle}>{formatDate(enq.received_at)}</td>
                      <td style={{ ...tdStyle, fontWeight: enq.status === 'new' ? 700 : 400 }}>{enq.name}</td>
                      <td style={tdStyle}>{enq.email}</td>
                      <td style={{ ...tdStyle, color: '#555', maxWidth: 320 }}>
                        {enq.message ? (enq.message.length > 80 ? enq.message.slice(0, 80) + '…' : enq.message) : '—'}
                      </td>
                      <td style={tdStyle}><StatusBadge status={enq.status} /></td>
                      <td style={tdStyle}>
                        <span style={{ color: '#c8856a', fontSize: 12 }}>
                          {expandedId === enq.id ? '▲' : '▼'}
                        </span>
                      </td>
                    </tr>
                    {expandedId === enq.id && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0, background: '#fff' }}>
                          <div style={{ padding: 20, borderTop: '2px solid #c8856a', borderBottom: '1px solid #f0ece6' }}>
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Full Message</div>
                              <div style={{ fontSize: 14, color: '#1a1816', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#fafaf8', padding: 14, borderRadius: 6 }}>
                                {enq.message}
                              </div>
                            </div>

                            {enq.phone && (
                              <div style={{ marginBottom: 16 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone: </span>
                                <span style={{ fontSize: 14 }}>{enq.phone}</span>
                              </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                              <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                                  Status
                                </label>
                                <select
                                  value={draftStatus[enq.id] || enq.status}
                                  onChange={e => setDraftStatus(prev => ({ ...prev, [enq.id]: e.target.value }))}
                                  style={selectStyle}
                                >
                                  <option value="new">New</option>
                                  <option value="read">Read</option>
                                  <option value="replied">Replied</option>
                                </select>
                              </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                                Admin Note
                              </label>
                              <textarea
                                value={draftNote[enq.id] ?? ''}
                                onChange={e => setDraftNote(prev => ({ ...prev, [enq.id]: e.target.value }))}
                                style={{ ...selectStyle, height: 80, resize: 'vertical' }}
                                placeholder="Internal note…"
                              />
                            </div>

                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <button onClick={() => handleSave(enq)} disabled={saving} style={primaryBtnStyle}>
                                {saving ? 'Saving…' : 'Save'}
                              </button>
                              <a
                                href={`mailto:${enq.email}?subject=Re: Your enquiry to Assisted Stretches`}
                                style={{ ...secondaryBtnStyle, textDecoration: 'none', display: 'inline-block' }}
                              >
                                Reply via Email
                              </a>
                              {saveMsg[enq.id] && (
                                <span style={{ color: '#166534', fontSize: 13 }}>{saveMsg[enq.id]}</span>
                              )}
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

const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 };
const tdStyle = { padding: '12px 16px', fontSize: 14, color: '#1a1816', borderTop: '1px solid #f0ece6' };
const primaryBtnStyle = { padding: '8px 16px', background: '#c8856a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const secondaryBtnStyle = { padding: '8px 14px', background: '#fff', color: '#1a1816', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const selectStyle = { width: '100%', padding: '8px 12px', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box' };
