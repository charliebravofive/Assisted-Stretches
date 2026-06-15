import React, { useState, useEffect } from 'react';
import { api } from './adminApi.js';

const S = {
  card: { background: '#fff', border: '1px solid #e8e0d4', borderRadius: 10, padding: '20px 24px', marginBottom: 12 },
  label: { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#9C5E3C', marginBottom: 4, display: 'block', textTransform: 'uppercase' },
  value: { fontSize: 14.5, color: '#2D3D35', lineHeight: 1.5 },
  badge: (c) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c === 'green' ? '#d4edda' : '#f8d7da', color: c === 'green' ? '#155724' : '#721c24' }),
};

function Field({ label, value }) {
  if (!value && value !== false) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={S.label}>{label}</span>
      <div style={S.value}>{String(value)}</div>
    </div>
  );
}

function WaiverDetail({ waiver, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#F0ECE6', borderRadius: 14, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #E4DDD6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2D3D35' }}>{waiver.first_name} {waiver.last_name}</div>
            <div style={{ fontSize: 13, color: '#6B6054', marginTop: 2 }}>{waiver.email} · Submitted {new Date(waiver.submitted_at).toLocaleDateString('en-AU')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6B6054', padding: '0 4px' }}>×</button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Field label="Date of Birth"     value={waiver.date_of_birth} />
            <Field label="Heard About Us"    value={waiver.heard_about_us} />
            <Field label="Sleep (hrs/night)" value={waiver.sleep_hours} />
            <Field label="Sleep Quality"     value={waiver.sleep_quality ? `${waiver.sleep_quality}/10` : null} />
            <Field label="Water (L/day)"     value={waiver.water_litres} />
            <Field label="Exercise / week"   value={waiver.exercise_frequency} />
            <Field label="Exercise Ability"  value={waiver.exercise_ability ? `${waiver.exercise_ability}/10` : null} />
          </div>
          <Field label="Exercise Types"  value={waiver.exercise_types} />
          <Field label="Pre-existing Injuries" value={waiver.injuries || 'None disclosed'} />
          <Field label="Surgeries"       value={waiver.surgeries || 'None disclosed'} />
          <Field label="Goals"           value={waiver.goals} />

          <div style={{ borderTop: '1px solid #E4DDD6', paddingTop: 16, marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: '#9C5E3C', marginBottom: 10, textTransform: 'uppercase' }}>Consent</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['24hr Cancellation Policy', waiver.agree_cancellation],
                ['Injuries Disclosed',        waiver.agree_injuries_disclosed],
                ['Liability Waiver',          waiver.agree_liability],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: '#2D3D35' }}>
                  <span style={{ fontSize: 16 }}>{val ? '✅' : '❌'}</span> {lbl}
                </div>
              ))}
            </div>
          </div>

          {waiver.signature && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: '#9C5E3C', marginBottom: 8, textTransform: 'uppercase' }}>Signature</div>
              <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 8, padding: 8, display: 'inline-block' }}>
                <img src={waiver.signature} alt="Signature" style={{ maxWidth: '100%', height: 100, display: 'block' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WaiversPage() {
  const [waivers,  setWaivers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [detail,   setDetail]   = useState(null);

  useEffect(() => {
    api('/api/admin/waivers').then(setWaivers).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const purgeAll = async () => {
    if (!window.confirm('Permanently delete all waivers? This cannot be undone.')) return;
    await api('/api/admin/waivers', { method: 'DELETE' });
    setWaivers([]);
  };

  const openDetail = async (w) => {
    try {
      const full = await api(`/api/admin/waivers/${w.id}`);
      setDetail(full);
    } catch { setDetail(w); }
  };

  const filtered = waivers.filter(w => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (w.first_name || '').toLowerCase().includes(q) ||
      (w.last_name  || '').toLowerCase().includes(q) ||
      (w.email      || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {detail && <WaiverDetail waiver={detail} onClose={() => setDetail(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#2D3D35', margin: 0 }}>Client Waivers</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 8, border: '1.5px solid #E4DDD6', fontSize: 14, color: '#2D3D35', outline: 'none', width: 260 }}
          />
          {waivers.length > 0 && (
            <button onClick={purgeAll} style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid #fee2e2', background: '#fee2e2', color: '#991b1b', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Delete all
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#6B6054', fontSize: 14 }}>Loading waivers…</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #E4DDD6', borderRadius: 10, padding: 40, textAlign: 'center', color: '#6B6054' }}>
          {search ? 'No waivers match your search.' : 'No waivers submitted yet.'}
        </div>
      ) : (
        <div>
          {filtered.map(w => (
            <div key={w.id} onClick={() => openDetail(w)} style={{ ...S.card, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: '#2D3D35', marginBottom: 3 }}>{w.first_name} {w.last_name}</div>
                <div style={{ fontSize: 13, color: '#6B6054' }}>{w.email}</div>
                {w.goals && <div style={{ fontSize: 12.5, color: '#9C5E3C', marginTop: 4, fontStyle: 'italic' }}>"{w.goals.slice(0, 80)}{w.goals.length > 80 ? '…' : ''}"</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
                <div style={{ fontSize: 12.5, color: '#6B6054', marginBottom: 6 }}>
                  {new Date(w.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <span style={S.badge(w.agree_cancellation ? 'green' : 'red')}>Cancellation</span>
                  <span style={S.badge(w.agree_liability ? 'green' : 'red')}>Liability</span>
                </div>
                <div style={{ fontSize: 12, color: '#C8856A', marginTop: 6 }}>View full waiver →</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
