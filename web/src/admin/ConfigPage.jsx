import React, { useState, useEffect } from 'react';
import { getConfig, updateConfig } from './adminApi.js';

// Day number -> name mapping
const DAY_NAMES = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
const ALL_DAY_NUMS = [0, 1, 2, 3, 4, 5, 6];

export default function ConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [newSlots, setNewSlots] = useState({});
  const [newBlock, setNewBlock] = useState({ date: '', time: '' });
  const [newHoliday, setNewHoliday] = useState({ name: '', start: '', end: '' });

  useEffect(() => {
    getConfig()
      .then(d => {
        if (d && d.error) setError(d.error);
        else setConfig(d);
      })
      .catch(() => setError('Failed to load config'))
      .finally(() => setLoading(false));
  }, []);

  function updatePrice(key, val) {
    setConfig(prev => ({
      ...prev,
      pricing: { ...prev.pricing, [key]: Number(val) },
    }));
  }

  // availability.days is an array of day numbers e.g. [1, 5, 6]
  // availability.slots is { "1": [...], "5": [...], "6": [...] }
  function getDays() {
    return config?.availability?.days || [];
  }
  function getSlots(dayNum) {
    return config?.availability?.slots?.[String(dayNum)] || [];
  }

  function toggleDay(dayNum) {
    setConfig(prev => {
      const days = prev.availability?.days || [];
      const slots = prev.availability?.slots || {};
      const hasDayNum = days.includes(dayNum);
      const newDays = hasDayNum ? days.filter(d => d !== dayNum) : [...days, dayNum].sort((a, b) => a - b);
      const newSlotsCopy = { ...slots };
      if (hasDayNum) delete newSlotsCopy[String(dayNum)];
      else newSlotsCopy[String(dayNum)] = [];
      return { ...prev, availability: { ...prev.availability, days: newDays, slots: newSlotsCopy } };
    });
  }

  function removeSlot(dayNum, slot) {
    setConfig(prev => {
      const slots = { ...(prev.availability?.slots || {}) };
      slots[String(dayNum)] = (slots[String(dayNum)] || []).filter(s => s !== slot);
      return { ...prev, availability: { ...prev.availability, slots } };
    });
  }

  function addSlot(dayNum) {
    const slot = (newSlots[dayNum] || '').trim();
    if (!slot) return;
    setConfig(prev => {
      const slots = { ...(prev.availability?.slots || {}) };
      const key = String(dayNum);
      slots[key] = [...(slots[key] || []), slot];
      return { ...prev, availability: { ...prev.availability, slots } };
    });
    setNewSlots(prev => ({ ...prev, [dayNum]: '' }));
  }

  function addBlockedSlot() {
    const { date, time } = newBlock;
    if (!date || !time) return;
    const [y, m, d] = date.split('-');
    const formatted = `${d}/${m}/${y}`;
    setConfig(prev => ({
      ...prev,
      blocked_slots: [...(prev.blocked_slots || []), { date: formatted, time }],
    }));
    setNewBlock({ date: '', time: '' });
  }

  function removeBlockedSlot(index) {
    setConfig(prev => ({
      ...prev,
      blocked_slots: (prev.blocked_slots || []).filter((_, i) => i !== index),
    }));
  }

  function addHoliday() {
    const { name, start, end } = newHoliday;
    if (!name.trim() || !start || !end) return;
    if (end < start) return;
    const fmt = iso => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
    const entry = { id: Date.now(), name: name.trim(), start: fmt(start), end: fmt(end) };
    setConfig(prev => ({ ...prev, holidays: [...(prev.holidays || []), entry] }));
    setNewHoliday({ name: '', start: '', end: '' });
  }

  function removeHoliday(id) {
    setConfig(prev => ({ ...prev, holidays: (prev.holidays || []).filter(h => h.id !== id) }));
  }

  // Format DD/MM/YYYY for display
  function fmtDate(dmy) {
    if (!dmy) return '';
    const [d, m, y] = dmy.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function holidayDays(h) {
    const parse = s => { const [d,m,y] = s.split('/'); return new Date(Number(y),Number(m)-1,Number(d)); };
    const diff = Math.round((parse(h.end) - parse(h.start)) / 86400000) + 1;
    return diff === 1 ? '1 day' : `${diff} days`;
  }

  function isPast(h) {
    const [d,m,y] = h.end.split('/');
    return new Date(Number(y),Number(m)-1,Number(d)) < new Date(new Date().setHours(0,0,0,0));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg('');
    try {
      const result = await updateConfig(config);
      if (result.ok) {
        setSaveMsg('Configuration saved successfully.');
      } else {
        setSaveMsg('Error: ' + (result.error || 'Failed to save'));
      }
    } catch {
      setSaveMsg('Network error — could not save.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 4000);
    }
  }

  if (loading) return <div style={{ color: '#888' }}>Loading…</div>;
  if (error) return <div style={{ color: '#dc2626' }}>{error}</div>;
  if (!config) return null;

  const activeDayNums = getDays();
  const inactiveDayNums = ALL_DAY_NUMS.filter(d => !activeDayNums.includes(d));

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Pricing */}
      <div style={cardStyle}>
        <h2 style={sectionHeadStyle}>Pricing</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {[
            { key: 'session', label: 'Single Session' },
            { key: '5-pack', label: '5-Pack' },
            { key: '10-pack', label: '10-Pack' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 16, color: '#666' }}>$</span>
                <input
                  type="number"
                  min={0}
                  value={config.pricing?.[key] ?? ''}
                  onChange={e => updatePrice(key, e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div style={cardStyle}>
        <h2 style={sectionHeadStyle}>Availability</h2>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px' }}>
          Configure which days and time slots are available for booking.
        </p>

        {/* Active days */}
        {activeDayNums.map(dayNum => (
          <div key={dayNum} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f0ece6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1816' }}>{DAY_NAMES[dayNum]}</span>
              <button
                onClick={() => toggleDay(dayNum)}
                style={{ ...secondaryBtnStyle, fontSize: 12, padding: '4px 10px', color: '#dc2626', borderColor: '#dc2626' }}
              >
                Remove Day
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {getSlots(dayNum).map(slot => (
                <div key={slot} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: '#f0ece6', borderRadius: 20, padding: '4px 12px', fontSize: 13,
                }}>
                  {slot}
                  <button
                    onClick={() => removeSlot(dayNum, slot)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="e.g. 2:00 PM"
                value={newSlots[dayNum] || ''}
                onChange={e => setNewSlots(prev => ({ ...prev, [dayNum]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addSlot(dayNum)}
                style={{ ...inputStyle, width: 140 }}
              />
              <button onClick={() => addSlot(dayNum)} style={smallPrimaryStyle}>Add Slot</button>
            </div>
          </div>
        ))}

        {/* Add inactive day */}
        {inactiveDayNums.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Add a day
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {inactiveDayNums.map(dayNum => (
                <button
                  key={dayNum}
                  onClick={() => toggleDay(dayNum)}
                  style={{ ...secondaryBtnStyle, fontSize: 12 }}
                >
                  + {DAY_NAMES[dayNum]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Planned Holidays */}
      <div style={cardStyle}>
        <h2 style={sectionHeadStyle}>Planned Holidays</h2>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px' }}>
          Block entire date ranges for holidays or studio closures. No bookings can be made on these dates.
        </p>

        {(config.holidays || []).length > 0 ? (
          <div style={{ marginBottom: 20 }}>
            {[...(config.holidays || [])].sort((a, b) => a.start.split('/').reverse().join('') > b.start.split('/').reverse().join('') ? 1 : -1).map(h => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: isPast(h) ? '#fafaf8' : '#fff8f5',
                border: `1px solid ${isPast(h) ? '#f0ece6' : '#f0c4a8'}`,
                borderRadius: 8, marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{isPast(h) ? '📅' : '🏖️'}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isPast(h) ? '#888' : '#1a1816' }}>
                      {h.name}
                      {isPast(h) && <span style={{ marginLeft: 8, fontSize: 11, color: '#aaa', fontWeight: 400 }}>past</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                      {fmtDate(h.start)}{h.start !== h.end ? ` → ${fmtDate(h.end)}` : ''} · {holidayDays(h)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeHoliday(h.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>No holidays scheduled.</div>
        )}

        {/* Add holiday form */}
        <div style={{ background: '#fafaf8', border: '1px solid #f0ece6', borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>
            Add holiday period
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                placeholder="e.g. Christmas break"
                value={newHoliday.name}
                onChange={e => setNewHoliday(h => ({ ...h, name: e.target.value }))}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <label style={labelStyle}>From</label>
              <input
                type="date"
                value={newHoliday.start}
                onChange={e => setNewHoliday(h => ({ ...h, start: e.target.value, end: h.end || e.target.value }))}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <label style={labelStyle}>To</label>
              <input
                type="date"
                value={newHoliday.end}
                min={newHoliday.start}
                onChange={e => setNewHoliday(h => ({ ...h, end: e.target.value }))}
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
          </div>
          <button
            onClick={addHoliday}
            disabled={!newHoliday.name.trim() || !newHoliday.start || !newHoliday.end}
            style={{ ...smallPrimaryStyle, opacity: (!newHoliday.name.trim() || !newHoliday.start || !newHoliday.end) ? 0.45 : 1 }}
          >
            + Add Holiday
          </button>
        </div>
      </div>

      {/* Blocked Slots */}
      <div style={cardStyle}>
        <h2 style={sectionHeadStyle}>Blocked Slots</h2>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px' }}>
          Block specific date + time combinations (e.g. holidays, maintenance). These won't be bookable.
        </p>

        {(config.blocked_slots || []).length > 0 ? (
          <div style={{ marginBottom: 20 }}>
            {(config.blocked_slots || []).map((slot, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fafaf8', border: '1px solid #f0ece6', borderRadius: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14, color: '#1a1816' }}>
                  <strong>{slot.date}</strong> — {slot.time}
                </span>
                <button
                  onClick={() => removeBlockedSlot(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>No blocked slots.</div>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={newBlock.date}
            onChange={e => setNewBlock(b => ({ ...b, date: e.target.value }))}
            style={{ ...inputStyle, width: 160 }}
          />
          <select
            value={newBlock.time}
            onChange={e => setNewBlock(b => ({ ...b, time: e.target.value }))}
            style={{ ...inputStyle, width: 150 }}
          >
            <option value="">Select time…</option>
            {['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button onClick={addBlockedSlot} style={smallPrimaryStyle}>Add Block</button>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        {saveMsg && (
          <span style={{ fontSize: 13, color: saveMsg.startsWith('Error') ? '#dc2626' : '#166534' }}>
            {saveMsg}
          </span>
        )}
      </div>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  borderRadius: 10,
  padding: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  marginBottom: 20,
};

const sectionHeadStyle = {
  margin: '0 0 20px',
  fontSize: 16,
  fontWeight: 700,
  color: '#1a1816',
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#444',
  marginBottom: 6,
};

const inputStyle = {
  padding: '8px 12px',
  border: '1px solid #d4c4a8',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const primaryBtnStyle = {
  padding: '10px 20px',
  background: '#c8856a',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 600,
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

const smallPrimaryStyle = {
  padding: '7px 14px',
  background: '#c8856a',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
