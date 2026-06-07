import React, { useState, useEffect } from 'react';
import { getClients, getClient, updateClient, deleteClient, exportClients } from './adminApi.js';

const STATUS_COLORS = {
  confirmed: { bg: '#dcfce7', color: '#166534' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
  'no-show': { bg: '#f3f4f6', color: '#6b7280' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600, fontFamily: 'sans-serif',
    }}>
      {status}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return dateStr; }
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [expandedData, setExpandedData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  function load() {
    setLoading(true);
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    getClients(qs)
      .then(d => Array.isArray(d) ? setClients(d) : setError(d.error || 'Error'))
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search]);

  async function handleExpand(client) {
    if (expandedId === client.id) {
      setExpandedId(null);
      setEditingId(null);
      return;
    }
    setExpandedId(client.id);
    setEditingId(null);
    if (!expandedData[client.id]) {
      const detail = await getClient(client.id);
      setExpandedData(prev => ({ ...prev, [client.id]: detail }));
    }
  }

  function startEdit(client) {
    setEditingId(client.id);
    setEditFields({
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      phone: client.phone || '',
      admin_note: client.admin_note || '',
    });
  }

  async function handleDelete(clientId) {
    setDeletingId(clientId);
    try {
      const result = await deleteClient(clientId);
      if (result && !result.error) {
        setClients(prev => prev.filter(c => c.id !== clientId));
        setExpandedId(null);
        setConfirmDeleteId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function saveEdit(clientId) {
    setEditSaving(true);
    try {
      const updated = await updateClient(clientId, editFields);
      if (updated && !updated.error) {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, ...updated } : c));
        setExpandedData(prev => ({
          ...prev,
          [clientId]: prev[clientId] ? { ...prev[clientId], ...updated } : prev[clientId],
        }));
        setEditingId(null);
      }
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inputStyle}
        />
        <button
          onClick={exportClients}
          style={{ padding: '8px 16px', background: '#fff', color: '#1a1816', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        >
          ↓ Export to Excel
        </button>
      </div>

      {loading && <div style={{ color: '#888' }}>Loading…</div>}
      {error && <div style={{ color: '#dc2626' }}>{error}</div>}

      {!loading && !error && (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflowX: 'auto', width: '100%' }}>
          {clients.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>No clients found</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: '#fafaf8' }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Source</th>
                  <th style={thStyle}>First Seen</th>
                  <th style={thStyle}>Sessions</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => {
                  const detail = expandedData[client.id];
                  const sessionCount = detail?.bookings?.filter(b => b.status === 'confirmed').length ?? '—';
                  return (
                    <React.Fragment key={client.id}>
                      <tr
                        style={{ background: i % 2 === 0 ? '#fff' : '#fafaf8', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0ece6'}
                        onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafaf8'}
                        onClick={() => handleExpand(client)}
                      >
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{client.name}</td>
                        <td style={tdStyle}>{client.email}</td>
                        <td style={tdStyle}>{client.phone || '—'}</td>
                        <td style={tdStyle}>{client.source || '—'}</td>
                        <td style={tdStyle}>{formatDate(client.created_at)}</td>
                        <td style={tdStyle}>{detail ? sessionCount : '—'}</td>
                        <td style={tdStyle}>
                          <span style={{ color: '#c8856a', fontSize: 12 }}>
                            {expandedId === client.id ? '▲' : '▼'}
                          </span>
                        </td>
                      </tr>
                      {expandedId === client.id && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0, background: '#fff' }}>
                            <div style={{ padding: 20, borderTop: '2px solid #c8856a', borderBottom: '1px solid #f0ece6' }}>
                              {!detail ? (
                                <div style={{ color: '#888' }}>Loading…</div>
                              ) : (
                                <>
                                  {/* Edit / inline form */}
                                  {editingId === client.id ? (
                                    <div style={{ marginBottom: 20, padding: 16, background: '#fafaf8', border: '1px solid #f0ece6', borderRadius: 8 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Edit Client</div>
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                        <div>
                                          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>First Name</label>
                                          <input value={editFields.first_name} onChange={e => setEditFields(f => ({ ...f, first_name: e.target.value }))} style={editInputStyle} />
                                        </div>
                                        <div>
                                          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Last Name</label>
                                          <input value={editFields.last_name} onChange={e => setEditFields(f => ({ ...f, last_name: e.target.value }))} style={editInputStyle} />
                                        </div>
                                        <div>
                                          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Phone</label>
                                          <input value={editFields.phone} onChange={e => setEditFields(f => ({ ...f, phone: e.target.value }))} style={editInputStyle} />
                                        </div>
                                        <div>
                                          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 3 }}>Admin Note</label>
                                          <input value={editFields.admin_note} onChange={e => setEditFields(f => ({ ...f, admin_note: e.target.value }))} style={editInputStyle} placeholder="Internal note…" />
                                        </div>
                                      </div>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => saveEdit(client.id)} disabled={editSaving} style={{ padding: '7px 14px', background: '#c8856a', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                                          {editSaving ? 'Saving…' : 'Save'}
                                        </button>
                                        <button onClick={() => setEditingId(null)} style={{ padding: '7px 14px', background: '#fff', color: '#1a1816', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ marginBottom: 16 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <button onClick={() => startEdit(client)} style={{ padding: '7px 14px', background: '#fff', color: '#1a1816', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                                          Edit Client
                                        </button>
                                        {confirmDeleteId === client.id ? (
                                          <>
                                            <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>Delete this client?</span>
                                            <button
                                              onClick={() => handleDelete(client.id)}
                                              disabled={deletingId === client.id}
                                              style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                                            >
                                              {deletingId === client.id ? 'Deleting…' : 'Yes, delete'}
                                            </button>
                                            <button onClick={() => setConfirmDeleteId(null)} style={{ padding: '7px 14px', background: '#fff', color: '#1a1816', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                                              Cancel
                                            </button>
                                          </>
                                        ) : (
                                          <button onClick={() => setConfirmDeleteId(client.id)} style={{ padding: '7px 14px', background: '#fff', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                                            Delete Client
                                          </button>
                                        )}
                                        {detail.admin_note && (
                                          <span style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>Note: {detail.admin_note}</span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Bookings */}
                                  <div style={{ marginBottom: 20 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                                      Bookings ({detail.bookings?.length || 0})
                                    </div>
                                    {detail.bookings?.length > 0 ? (
                                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead>
                                          <tr style={{ background: '#fafaf8' }}>
                                            <th style={miniThStyle}>Date</th>
                                            <th style={miniThStyle}>Time</th>
                                            <th style={miniThStyle}>Product</th>
                                            <th style={miniThStyle}>Status</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {detail.bookings.map(b => (
                                            <tr key={b.id}>
                                              <td style={miniTdStyle}>{formatDate(b.session_date)}</td>
                                              <td style={miniTdStyle}>{b.session_time || '—'}</td>
                                              <td style={miniTdStyle}>{b.product_id || '—'}</td>
                                              <td style={miniTdStyle}><StatusBadge status={b.status} /></td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <div style={{ color: '#aaa', fontSize: 13 }}>No bookings</div>
                                    )}
                                  </div>

                                  {/* Gift Cards */}
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                                      Gift Cards ({detail.gift_cards?.length || 0})
                                    </div>
                                    {detail.gift_cards?.length > 0 ? (
                                      detail.gift_cards.map(gc => (
                                        <div key={gc.id} style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid #f0ece6', display: 'flex', gap: 20 }}>
                                          <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}>{gc.code}</span>
                                          <span>{gc.product_id}</span>
                                          <span>{gc.sessions_remaining}/{gc.sessions_total} sessions</span>
                                          <span>Expires: {gc.expiry_date || '—'}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <div style={{ color: '#aaa', fontSize: 13 }}>No gift cards</div>
                                    )}
                                  </div>
                                </>
                              )}
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

const inputStyle = { padding: '8px 14px', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 14, outline: 'none', fontFamily: 'inherit', minWidth: 300 };
const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 };
const tdStyle = { padding: '12px 16px', fontSize: 14, color: '#1a1816', borderTop: '1px solid #f0ece6' };
const miniThStyle = { padding: '6px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase' };
const miniTdStyle = { padding: '6px 12px', fontSize: 13, color: '#1a1816', borderTop: '1px solid #f0ece6' };
const editInputStyle = { width: '100%', padding: '7px 10px', border: '1px solid #d4c4a8', borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
