import React, { useState, useEffect } from 'react';
import { getGiftCards, updateGiftCard, issueGiftCard, resendGiftCard } from './adminApi.js';

const STATUS_COLORS = {
  active: { bg: '#dcfce7', color: '#166534' },
  voided: { bg: '#fee2e2', color: '#991b1b' },
  used: { bg: '#f3f4f6', color: '#6b7280' },
  expired: { bg: '#fef9c3', color: '#854d0e' },
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
      {status}
    </span>
  );
}

function computeDisplayStatus(card) {
  if (card.status === 'voided') return 'voided';
  const now = new Date().toISOString().split('T')[0];
  if (card.expiry_date && card.expiry_date < now) return 'expired';
  if (card.sessions_remaining === 0) return 'used';
  return 'active';
}

function IssueModal({ onClose, onIssued }) {
  const [form, setForm] = useState({ product_id: 'session', sessions: 1, recipient_name: '', recipient_email: '', admin_note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.recipient_email) { setError('Recipient email is required'); return; }
    setSaving(true);
    const result = await issueGiftCard(form);
    setSaving(false);
    if (result && result.code) {
      onIssued(result);
      onClose();
    } else {
      setError(result?.error || 'Failed to issue gift card');
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 32, width: 420, boxShadow: '0 8px 48px rgba(0,0,0,0.3)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#1a1816' }}>Issue Gift Card</h2>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Product</label>
          <select value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} style={selectStyle}>
            <option value="session">Single Session</option>
            <option value="5-pack">5-Pack</option>
            <option value="10-pack">10-Pack</option>
          </select>

          <label style={labelStyle}>Sessions</label>
          <input
            type="number"
            min={1}
            value={form.sessions}
            onChange={e => setForm(f => ({ ...f, sessions: Number(e.target.value) }))}
            style={inputStyle}
          />

          <label style={labelStyle}>Recipient Name</label>
          <input
            type="text"
            value={form.recipient_name}
            onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))}
            style={inputStyle}
            placeholder="Optional"
          />

          <label style={labelStyle}>Recipient Email *</label>
          <input
            type="email"
            value={form.recipient_email}
            onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))}
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Admin Note</label>
          <textarea
            value={form.admin_note}
            onChange={e => setForm(f => ({ ...f, admin_note: e.target.value }))}
            style={{ ...inputStyle, height: 70, resize: 'vertical' }}
            placeholder="Optional"
          />

          {error && <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="submit" disabled={saving} style={primaryBtnStyle}>
              {saving ? 'Issuing…' : 'Issue Card'}
            </button>
            <button type="button" onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GiftCardsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabFilter, setTabFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState({});
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adjustSessions, setAdjustSessions] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [resendState, setResendState] = useState({}); // { [cardId]: 'sending' | 'ok' | 'error' }

  function load() {
    setLoading(true);
    const qs = tabFilter ? `?status=${tabFilter}` : '';
    getGiftCards(qs)
      .then(d => Array.isArray(d) ? setCards(d) : setError(d.error || 'Error'))
      .catch(() => setError('Failed to load gift cards'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [tabFilter]);

  async function handleExpand(card) {
    if (expandedId === card.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(card.id);
    if (!expandedData[card.id]) {
      const detail = await fetch(`http://localhost:3001/api/admin/gift-cards/${card.id}`, { credentials: 'include' }).then(r => r.json());
      setExpandedData(prev => ({ ...prev, [card.id]: detail }));
    }
  }

  async function handleVoid(card) {
    if (!window.confirm(`Void gift card ${card.code}? This cannot be undone.`)) return;
    setSaving(true);
    const updated = await updateGiftCard(card.id, { status: 'voided' });
    setSaving(false);
    if (updated && !updated.error) setCards(prev => prev.map(c => c.id === card.id ? updated : c));
  }

  async function handleExtendExpiry(card) {
    if (!newExpiry) return;
    setSaving(true);
    const updated = await updateGiftCard(card.id, { expiry_date: newExpiry });
    setSaving(false);
    if (updated && !updated.error) {
      setCards(prev => prev.map(c => c.id === card.id ? updated : c));
      setNewExpiry('');
    }
  }

  async function handleAdjustSessions(card) {
    if (adjustSessions === '') return;
    setSaving(true);
    const updated = await updateGiftCard(card.id, { sessions_remaining: Number(adjustSessions) });
    setSaving(false);
    if (updated && !updated.error) {
      setCards(prev => prev.map(c => c.id === card.id ? updated : c));
      setAdjustSessions('');
    }
  }

  async function handleResend(card) {
    setResendState(prev => ({ ...prev, [card.id]: 'sending' }));
    try {
      const result = await resendGiftCard(card.id);
      if (result && result.success) {
        setResendState(prev => ({ ...prev, [card.id]: 'ok' }));
        setTimeout(() => setResendState(prev => { const s = { ...prev }; delete s[card.id]; return s; }), 3000);
      } else {
        setResendState(prev => ({ ...prev, [card.id]: 'error' }));
        setTimeout(() => setResendState(prev => { const s = { ...prev }; delete s[card.id]; return s; }), 4000);
      }
    } catch {
      setResendState(prev => ({ ...prev, [card.id]: 'error' }));
      setTimeout(() => setResendState(prev => { const s = { ...prev }; delete s[card.id]; return s; }), 4000);
    }
  }

  const tabs = ['', 'active', 'used', 'voided', 'expired'];
  const tabLabels = { '': 'All', active: 'Active', used: 'Used', voided: 'Voided', expired: 'Expired' };

  return (
    <div>
      {showIssueModal && (
        <IssueModal
          onClose={() => setShowIssueModal(false)}
          onIssued={card => { setCards(prev => [card, ...prev]); }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTabFilter(t)}
              style={{
                ...tabBtnStyle,
                background: tabFilter === t ? '#1e2a24' : '#fff',
                color: tabFilter === t ? '#fff' : '#1a1816',
              }}
            >
              {tabLabels[t]}
            </button>
          ))}
        </div>
        <button onClick={() => setShowIssueModal(true)} style={primaryBtnStyle}>
          + Issue Gift Card
        </button>
      </div>

      {loading && <div style={{ color: '#888' }}>Loading…</div>}
      {error && <div style={{ color: '#dc2626' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto', width: '100%' }}>
          {cards.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>No gift cards found</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: '#fafaf8' }}>
                  <th style={thStyle}>Code</th>
                  <th style={thStyle}>Sessions</th>
                  <th style={thStyle}>Purchaser</th>
                  <th style={thStyle}>Recipient</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Expiry</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card, i) => {
                  const displayStatus = computeDisplayStatus(card);
                  const detail = expandedData[card.id];
                  return (
                    <React.Fragment key={card.id}>
                      <tr
                        style={{ background: i % 2 === 0 ? '#fff' : '#fafaf8', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0ece6'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafaf8'}
                        onClick={() => handleExpand(card)}
                      >
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}>{card.code}</td>
                        <td style={tdStyle}>{card.sessions_remaining}/{card.sessions_total}</td>
                        <td style={tdStyle}>
                          <div>{card.purchaser_name}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{card.purchaser_email}</div>
                        </td>
                        <td style={tdStyle}>
                          <div>{card.recipient_name || '—'}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{card.recipient_email || ''}</div>
                        </td>
                        <td style={tdStyle}><StatusBadge status={displayStatus} /></td>
                        <td style={tdStyle}>{card.expiry_date || '—'}</td>
                        <td style={tdStyle}>
                          <span style={{ color: '#c8856a', fontSize: 12 }}>
                            {expandedId === card.id ? '▲' : '▼'}
                          </span>
                        </td>
                      </tr>
                      {expandedId === card.id && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0, background: '#fff' }}>
                            <div style={{ padding: 20, borderTop: '2px solid #c8856a', borderBottom: '1px solid #f0ece6' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <Field label="Card ID" value={card.id} />
                                <Field label="Product" value={card.product_id} />
                                <Field label="Purchase Date" value={card.purchase_date ? new Date(card.purchase_date).toLocaleDateString('en-AU') : '—'} />
                                <Field label="Admin Note" value={card.admin_note || card.admin_notes || '—'} />
                                <Field label="Issued By Admin" value={card.issued_by_admin ? 'Yes' : 'No'} />
                              </div>

                              {/* Associated bookings */}
                              {detail?.bookings && (
                                <div style={{ marginBottom: 16 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                                    Associated Bookings
                                  </div>
                                  {detail.bookings.length === 0 ? (
                                    <div style={{ color: '#aaa', fontSize: 13 }}>No bookings</div>
                                  ) : (
                                    detail.bookings.map(b => (
                                      <div key={b.id} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid #f0ece6' }}>
                                        {b.session_date} {b.session_time} — {b.name} ({b.status})
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                {displayStatus !== 'voided' && (
                                  <button onClick={() => handleVoid(card)} disabled={saving} style={dangerBtnStyle}>
                                    Void Card
                                  </button>
                                )}

                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#fafaf8', border: '1px solid #d4c4a8', borderRadius: 6, padding: '4px 10px' }}>
                                  <span style={{ fontSize: 12, color: '#666' }}>Extend expiry:</span>
                                  <input
                                    type="date"
                                    value={newExpiry}
                                    onChange={e => setNewExpiry(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none' }}
                                  />
                                  <button onClick={() => handleExtendExpiry(card)} disabled={saving || !newExpiry} style={smallPrimaryStyle}>
                                    Set
                                  </button>
                                </div>

                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: '#fafaf8', border: '1px solid #d4c4a8', borderRadius: 6, padding: '4px 10px' }}>
                                  <span style={{ fontSize: 12, color: '#666' }}>Sessions remaining:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={adjustSessions}
                                    onChange={e => setAdjustSessions(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', width: 50 }}
                                    placeholder={String(card.sessions_remaining)}
                                  />
                                  <button onClick={() => handleAdjustSessions(card)} disabled={saving || adjustSessions === ''} style={smallPrimaryStyle}>
                                    Set
                                  </button>
                                </div>

                                <button
                                  onClick={() => handleResend(card)}
                                  disabled={resendState[card.id] === 'sending'}
                                  style={{
                                    ...secondaryBtnStyle,
                                    ...(resendState[card.id] === 'ok' ? { color: '#166534', borderColor: '#166534' } : {}),
                                    ...(resendState[card.id] === 'error' ? { color: '#dc2626', borderColor: '#dc2626' } : {}),
                                  }}
                                >
                                  {resendState[card.id] === 'sending' ? 'Sending…'
                                    : resendState[card.id] === 'ok' ? 'Sent!'
                                    : resendState[card.id] === 'error' ? 'Failed'
                                    : 'Resend Email'}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
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
      <div style={{ fontSize: 14, color: '#1a1816' }}>{String(value)}</div>
    </div>
  );
}

const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 };
const tdStyle = { padding: '12px 16px', fontSize: 14, color: '#1a1816', borderTop: '1px solid #f0ece6' };
const tabBtnStyle = { padding: '8px 14px', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const primaryBtnStyle = { padding: '8px 16px', background: '#c8856a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const dangerBtnStyle = { padding: '8px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const secondaryBtnStyle = { padding: '8px 14px', background: '#fff', color: '#1a1816', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' };
const smallPrimaryStyle = { padding: '4px 10px', background: '#c8856a', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 4, marginTop: 12 };
const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const selectStyle = { width: '100%', padding: '8px 12px', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' };
