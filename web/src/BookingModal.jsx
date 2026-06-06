import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { PRODUCTS } from "./products.js";

// ─── CONFIG ──────────────────────────────────────────────────
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY && STRIPE_KEY !== "pk_test_placeholder"
  ? loadStripe(STRIPE_KEY)
  : null;
const DEMO_MODE = !stripePromise;

// Consistent date format for session_date — always zero-padded DD/MM/YYYY
// so it matches exactly what the availability endpoint queries against.
const SESSION_DATE_OPTS = { day: "2-digit", month: "2-digit", year: "numeric" };
const fmtSessionDate = (d) => d?.toLocaleDateString("en-AU", SESSION_DATE_OPTS) ?? "";

const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];
const DAY_LABELS  = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// Real availability: Sunday=0, Friday=5, Saturday=6
const AVAILABLE_DAYS = new Set([0, 5, 6]);

// ── Business launch date ──────────────────────────────────────
const BUSINESS_OPEN_DATE = new Date(2026, 5, 20); // 20 June 2026 (Saturday)
BUSINESS_OPEN_DATE.setHours(0, 0, 0, 0);

function getBookingDateBounds() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  // Before opening: earliest bookable day is the launch date
  // After opening:  earliest bookable day is today (rolling)
  const minDate = now >= BUSINESS_OPEN_DATE ? now : BUSINESS_OPEN_DATE;
  const maxDate = new Date(minDate);
  maxDate.setMonth(maxDate.getMonth() + 3);
  return { minDate, maxDate };
}
const SLOTS_BY_DAY = {
  5: ["4:00 PM", "5:00 PM"],
  6: ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"],
  0: ["9:00 AM", "10:00 AM", "11:00 AM"],
};

function getSlotsForDate(date) {
  return SLOTS_BY_DAY[date.getDay()] || [];
}

function getGiftMaxDate(productId) {
  if (!productId) return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (productId === "5-pack")  { d.setMonth(d.getMonth() + 3); return d; }
  if (productId === "10-pack") { d.setMonth(d.getMonth() + 6); return d; }
  return null;
}

// ─── STYLES ──────────────────────────────────────────────────
const C = {
  charcoal: "#1A1816", forest: "#2D3D35", terracotta: "#C8856A",
  bone: "#F0ECE6", boneDark: "#E4DDD6", sand: "#D4C4A8",
  clay: "#9C5E3C", textSec: "#6B6054", white: "#FFFFFF",
};

const overlayStyle = {
  position: "fixed", inset: 0, zIndex: 1000,
  background: "rgba(26,24,22,0.72)", backdropFilter: "blur(6px)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
};

const sheetStyle = {
  background: C.bone, borderRadius: 16, width: "100%", maxWidth: 520,
  maxHeight: "96vh", overflowY: "auto",
  boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
  fontFamily: "'DM Sans', -apple-system, sans-serif",
};

const btn = (variant, extra = {}) => ({
  border: "none", cursor: "pointer", borderRadius: 8,
  fontFamily: "'DM Sans', sans-serif", fontWeight: 500, letterSpacing: "0.02em",
  transition: "all 0.2s",
  ...(variant === "primary" ? {
    background: C.terracotta, color: C.bone, padding: "14px 28px", fontSize: 15,
  } : variant === "ghost" ? {
    background: "transparent", color: C.textSec, padding: "14px 20px", fontSize: 14,
    border: `1px solid ${C.sand}`,
  } : {}),
  ...extra,
});

// ─── STEP BARS ───────────────────────────────────────────────
const STEP_LABELS_NEW      = ["Service","Date","Time","Details","Waiver","Payment"];
const STEP_LABELS_EXISTING = ["Service","Date","Time","Details","Payment"];

function StepBar({ step, compact = false, labels = STEP_LABELS_NEW }) {
  const circleSize = compact ? 22 : 28;
  const fontSize   = compact ? 11 : 12;
  const labelSize  = compact ? 9  : 10;
  return (
    <div style={{ display: "flex", alignItems: "center", padding: compact ? "0" : "0 28px" }}>
      {labels.map((label, i) => {
        const done = i < step, cur = i === step;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: circleSize, height: circleSize, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize, fontWeight: 600, background: done ? C.forest : cur ? C.terracotta : C.boneDark, color: done || cur ? C.bone : C.textSec, transition: "all 0.3s" }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: labelSize, color: cur ? C.terracotta : done ? C.forest : C.textSec, fontWeight: cur ? 600 : 400, whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: done ? C.forest : C.boneDark, margin: "0 4px", marginBottom: compact ? 14 : 18, transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const GIFT_STEP_LABELS = ["Details", "Payment", "Confirm"];

function GiftStepBar({ giftStep }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 28px" }}>
      {GIFT_STEP_LABELS.map((label, i) => {
        const done = i < giftStep, cur = i === giftStep;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < GIFT_STEP_LABELS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, background: done ? C.forest : cur ? C.terracotta : C.boneDark, color: done || cur ? C.bone : C.textSec, transition: "all 0.3s" }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 10, color: cur ? C.terracotta : done ? C.forest : C.textSec, fontWeight: cur ? 600 : 400, whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < GIFT_STEP_LABELS.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: done ? C.forest : C.boneDark, margin: "0 4px", marginBottom: 18, transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── STEP 0: PAGE PRICING CARDS ──────────────────────────────
const PAGE_PLANS = [
  { save: "—",        validity: "Use anytime", best: "Trying it out" },
  { save: "Save $50", validity: "6 months",    best: "Building a habit", recommended: true },
  { save: "Save $250",validity: "12 months",   best: "Athletes & regulars" },
];

function PagePricingStep({ selected, onSelect, products }) {
  const displayProducts = products || PRODUCTS;
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.16em", color: C.clay, marginBottom: 6 }}>CHOOSE YOUR PATH</div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, color: C.forest, marginBottom: 4, lineHeight: 1.1 }}>How many sessions?</h2>
        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>Select a plan, then pick your date and time.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, alignItems: "stretch" }}>
        {displayProducts.map((p, i) => {
          const plan = PAGE_PLANS[i] || {};
          const isSelected = selected?.id === p.id;
          return (
            <div key={p.id} onClick={() => onSelect(p)} style={{
              background: isSelected ? C.forest : C.white, color: isSelected ? C.bone : C.forest,
              borderRadius: 14, padding: "32px 28px", position: "relative",
              border: isSelected ? "none" : `1.5px solid ${C.boneDark}`,
              cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: isSelected ? "0 8px 32px rgba(45,61,53,0.2)" : "none",
              display: "flex", flexDirection: "column",
            }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.transform = "none"; }}
            >
              {plan.recommended && !isSelected && (
                <div style={{ position: "absolute", top: -11, left: 18, background: C.terracotta, color: C.bone, fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 20, letterSpacing: "0.08em" }}>POPULAR</div>
              )}
              <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.65, marginBottom: 6 }}>{p.label}</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 38, fontWeight: 400, marginBottom: 4 }}>${p.price.toLocaleString()}</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>{p.per ? `$${p.per}/session` : "$125/session"}</div>
              <div style={{ fontSize: 13, lineHeight: 2.1, borderTop: `1px solid ${isSelected ? "rgba(242,237,228,0.15)" : C.boneDark}`, paddingTop: 14, flex: 1 }}>
                <div><span style={{ opacity: 0.55 }}>Save:</span> {plan.save || "—"}</div>
                <div><span style={{ opacity: 0.55 }}>Valid:</span> {plan.validity || "Use anytime"}</div>
                <div><span style={{ opacity: 0.55 }}>Best for:</span> {plan.best || "—"}</div>
              </div>
              {isSelected && <div style={{ marginTop: 16, textAlign: "center", fontSize: 12.5, fontWeight: 600, color: C.terracotta, background: "rgba(200,133,106,0.18)", borderRadius: 6, padding: "6px 0" }}>✓ Selected</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── STEP 0: SERVICE SELECT ───────────────────────────────────
function ServiceStep({ selected, onSelect, initialProduct, products }) {
  useEffect(() => { if (initialProduct) onSelect(initialProduct); }, []);
  const displayProducts = products || PRODUCTS;
  return (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: C.forest, marginBottom: 8 }}>Choose your session</h2>
      <p style={{ fontSize: 14, color: C.textSec, marginBottom: 24, lineHeight: 1.6 }}>Select a single session or save with a pack.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {displayProducts.map(p => {
          const active = selected?.id === p.id;
          return (
            <button key={p.id} onClick={() => onSelect(p)} style={{ background: active ? C.forest : C.white, color: active ? C.bone : C.forest, border: `1.5px solid ${active ? C.forest : C.boneDark}`, borderRadius: 10, padding: "18px 20px", cursor: "pointer", textAlign: "left", transition: "all 0.2s", position: "relative" }}>
              {p.badge && <span style={{ position: "absolute", top: -10, right: 16, background: C.terracotta, color: C.bone, fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 20, letterSpacing: "0.08em" }}>{p.badge}</span>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{p.label}</span>
                <span style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400 }}>${p.price.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 13, marginTop: 4, opacity: 0.65 }}>{p.desc}</div>
              {p.per && <div style={{ fontSize: 12, marginTop: 6, color: active ? C.sand : C.clay, fontWeight: 500 }}>${p.per}/session</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── GIFT CARD DENOMINATIONS ─────────────────────────────────
const GIFT_DENOMS = [
  { sessions: 1, product: PRODUCTS[0], price: "$125", saving: null, tagline: "One hour where the world stops." },
];

// ─── DATE STEP ───────────────────────────────────────────────
function DateStep({ value, onChange, minDate, maxDate, sessionNum, maxSessions, availableDays, holidays = [] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Effective earliest selectable date (business open date or today, whichever is later)
  const effectiveMin = minDate || today;
  const [view, setView] = useState(new Date(effectiveMin.getFullYear(), effectiveMin.getMonth(), 1));
  const [hoveredHoliday, setHoveredHoliday] = useState(null);

  const year = view.getFullYear(), month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const liveAvailDays = availableDays || AVAILABLE_DAYS;
  const dayDate        = d => new Date(year, month, d);
  const isBeforeMin    = d => dayDate(d) < effectiveMin;
  const isUnavailable  = d => !liveAvailDays.has(dayDate(d).getDay());
  const isAfterMax     = d => maxDate && dayDate(d) > maxDate;

  // Holiday check — returns holiday object or null
  const getHoliday = d => {
    const dd = dayDate(d);
    return holidays.find(h => {
      const [sd, sm, sy] = h.start.split('/');
      const [ed, em, ey] = h.end.split('/');
      const start = new Date(Number(sy), Number(sm) - 1, Number(sd));
      const end   = new Date(Number(ey), Number(em) - 1, Number(ed));
      return dd >= start && dd <= end;
    }) || null;
  };

  const isDisabled = d => isBeforeMin(d) || isUnavailable(d) || isAfterMax(d) || !!getHoliday(d);
  const isSelected = d => value && value.getDate() === d && value.getMonth() === month && value.getFullYear() === year;
  const isToday    = d => dayDate(d).getTime() === today.getTime();

  const minView = new Date(effectiveMin.getFullYear(), effectiveMin.getMonth(), 1);
  const canPrev  = new Date(year, month, 1) > minView;
  const maxView  = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : null;
  const canNext  = !maxView || new Date(year, month + 1, 1) <= maxView;

  // Note shown under calendar — shows both opening date (if pre-launch) and booking window
  const isPreLaunch = today < BUSINESS_OPEN_DATE;
  const rangeNote = maxDate
    ? (isPreLaunch
        ? `Bookings open from ${BUSINESS_OPEN_DATE.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })} · up to 3 months in advance`
        : `Bookings available up to ${maxDate.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`)
    : null;

  // Holidays visible in the current month view
  const visibleHolidays = holidays.filter(h => {
    const [sd, sm, sy] = h.start.split('/');
    const [ed, em, ey] = h.end.split('/');
    const start = new Date(Number(sy), Number(sm) - 1, Number(sd));
    const end   = new Date(Number(ey), Number(em) - 1, Number(ed));
    const viewStart = new Date(year, month, 1);
    const viewEnd   = new Date(year, month + 1, 0);
    return start <= viewEnd && end >= viewStart;
  });

  return (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 400, color: C.forest, marginBottom: 4 }}>Pick a date</h2>
      {maxSessions > 1 && <div style={{ fontSize: 12, fontWeight: 600, color: C.terracotta, letterSpacing: "0.08em", marginBottom: 4 }}>Session {sessionNum} of {maxSessions}</div>}
      <p style={{ fontSize: 13, color: C.textSec, marginBottom: isPreLaunch ? 6 : 12, lineHeight: 1.5 }}>Available Friday (4–6 pm), Saturday (8 am–4 pm) and Sunday (9 am–12 pm). Select a day to see times.</p>
      {isPreLaunch && (
        <div style={{ background: "#FFF8E7", border: "1px solid #F0C040", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#7A5500", marginBottom: 12, lineHeight: 1.5 }}>
          📅 <strong>Opening {BUSINESS_OPEN_DATE.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}</strong> — you can book ahead for sessions from that date.
        </div>
      )}
      <div style={{ background: C.white, borderRadius: 12, padding: "14px 16px", border: `1px solid ${C.boneDark}`, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <button onClick={() => canPrev && setView(new Date(year, month - 1, 1))} style={{ background: "none", border: "none", cursor: canPrev ? "pointer" : "default", fontSize: 20, color: canPrev ? C.forest : C.boneDark, padding: "4px 8px", lineHeight: 1 }}>‹</button>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, color: C.forest }}>{MONTH_NAMES[month]} {year}</span>
          <button onClick={() => canNext && setView(new Date(year, month + 1, 1))} style={{ background: "none", border: "none", cursor: canNext ? "pointer" : "default", fontSize: 20, color: canNext ? C.forest : C.boneDark, padding: "4px 8px", lineHeight: 1 }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
          {DAY_LABELS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: C.clay, letterSpacing: "0.05em", paddingBottom: 4 }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const holiday = getHoliday(d);
            const disabled = isDisabled(d), selected = isSelected(d), tod = isToday(d);
            const bgColor = selected ? C.terracotta : holiday ? "#F5EBE4" : "transparent";
            const textColor = disabled ? (holiday ? "#D4956A" : "#C4B8AE") : selected ? C.bone : C.forest;
            return (
              <button
                key={i}
                onClick={() => !disabled && onChange(dayDate(d))}
                disabled={disabled}
                title={holiday ? `Studio closed: ${holiday.name}` : undefined}
                onMouseEnter={() => holiday && setHoveredHoliday(holiday.name)}
                onMouseLeave={() => setHoveredHoliday(null)}
                style={{
                  aspectRatio: "1", borderRadius: "50%", border: "none",
                  cursor: disabled ? "default" : "pointer",
                  background: bgColor, color: textColor,
                  fontWeight: selected || tod ? 600 : 400, fontSize: 13.5,
                  outline: tod && !selected ? `1.5px solid ${C.terracotta}` : "none",
                  outlineOffset: -2, transition: "all 0.15s",
                  position: "relative",
                }}
              >
                {d}
                {holiday && !isBeforeMin(d) && (
                  <span style={{ position: "absolute", top: 0, right: 0, width: 5, height: 5, borderRadius: "50%", background: C.terracotta }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {hoveredHoliday && (
        <p style={{ fontSize: 12, color: C.clay, marginTop: 8, textAlign: "center" }}>🏖️ Studio closed: {hoveredHoliday}</p>
      )}
      {visibleHolidays.length > 0 && !hoveredHoliday && (
        <div style={{ marginTop: 10 }}>
          {visibleHolidays.map(h => (
            <p key={h.id} style={{ fontSize: 12, color: C.clay, margin: "4px 0", textAlign: "center" }}>
              🏖️ <strong>{h.name}</strong>: {h.start === h.end ? h.start : `${h.start} – ${h.end}`}
            </p>
          ))}
        </div>
      )}
      {rangeNote && <p style={{ fontSize: 11.5, color: C.clay, marginTop: 6, textAlign: "center", lineHeight: 1.5 }}>{rangeNote}</p>}
    </div>
  );
}

// ─── TIME STEP ───────────────────────────────────────────────
function TimeStep({ date, value, onChange, sessionNum, maxSessions, takenSlots, slotsByDay }) {
  const dayNum = date.getDay();
  const slots = slotsByDay
    ? (slotsByDay[dayNum] || slotsByDay[String(dayNum)] || [])
    : getSlotsForDate(date);
  const counter = maxSessions > 1 ? `Session ${sessionNum} of ${maxSessions}` : null;
  const taken = Array.isArray(takenSlots) ? takenSlots : [];
  return (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: C.forest, marginBottom: 4 }}>Pick a time</h2>
      <p style={{ fontSize: 14, color: C.textSec, marginBottom: 6, lineHeight: 1.6 }}>{date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</p>
      <p style={{ fontSize: 12.5, color: C.clay, marginBottom: counter ? 6 : 16, lineHeight: 1.5 }}>Tap a time to continue →</p>
      {counter && <div style={{ fontSize: 12, fontWeight: 600, color: C.terracotta, letterSpacing: "0.08em", marginBottom: 20 }}>{counter}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {slots.map(slot => {
          const isSelected = value === slot;
          const isBooked = taken.includes(slot);
          return (
            <button
              key={slot}
              onClick={() => !isBooked && onChange(slot)}
              disabled={isBooked}
              style={{
                padding: "14px 0", borderRadius: 8,
                border: `1.5px solid ${isBooked ? "#ddd" : isSelected ? C.terracotta : C.sand}`,
                background: isBooked ? "#f5f5f5" : isSelected ? C.terracotta : C.white,
                color: isBooked ? "#bbb" : isSelected ? C.bone : C.forest,
                cursor: isBooked ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 500, transition: "all 0.15s",
                position: "relative",
              }}
            >
              {slot}
              {isBooked && <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>Booked</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CUSTOMER TYPE STEP ──────────────────────────────────────
function IconNewClient({ color }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Person head */}
      <circle cx="18" cy="13" r="6" stroke={color} strokeWidth="2" fill="none" />
      {/* Person body */}
      <path d="M6 36c0-7 5-11 12-11s12 4 12 11" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Plus sign */}
      <line x1="34" y1="24" x2="34" y2="36" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="28" y1="30" x2="40" y2="30" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function IconReturningClient({ color }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Person head */}
      <circle cx="18" cy="13" r="6" stroke={color} strokeWidth="2" fill="none" />
      {/* Person body */}
      <path d="M6 36c0-7 5-11 12-11s12 4 12 11" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Checkmark badge */}
      <circle cx="34" cy="30" r="7" fill={color} />
      <path d="M30.5 30l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function CustomerTypeStep({ value, onChange }) {
  const optStyle = (selected) => ({
    flex: 1, padding: "28px 20px", borderRadius: 12, cursor: "pointer", textAlign: "center",
    border: `2px solid ${selected ? C.forest : C.boneDark}`,
    background: selected ? C.forest : C.white,
    color: selected ? C.bone : C.forest,
    transition: "all 0.2s",
  });
  return (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: C.forest, marginBottom: 8 }}>Welcome</h2>
      <p style={{ fontSize: 14, color: C.textSec, marginBottom: 28, lineHeight: 1.6 }}>Is this your first visit to Assisted Stretches?</p>
      <div style={{ display: "flex", gap: 14 }}>
        <div onClick={() => onChange("new")} style={optStyle(value === "new")}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <IconNewClient color={value === "new" ? C.bone : C.forest} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>New client</div>
          <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>First visit — you'll complete a short health waiver</div>
        </div>
        <div onClick={() => onChange("returning")} style={optStyle(value === "returning")}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <IconReturningClient color={value === "returning" ? C.bone : C.forest} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Returning client</div>
          <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>Welcome back — skip straight to booking</div>
        </div>
      </div>
    </div>
  );
}

// ─── WAIVER STEP ─────────────────────────────────────────────
function WaiverStep({ value, onChange }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 8, border: `1.5px solid ${C.boneDark}`, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.forest, background: C.white, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11.5, fontWeight: 600, color: C.clay, letterSpacing: "0.08em", marginBottom: 5, display: "block" };
  const areaStyle  = { ...inputStyle, resize: "vertical", minHeight: 80 };
  const f = (key) => ({ value: value[key] || "", onChange: e => onChange({ ...value, [key]: e.target.value }) });

  // Canvas signature helpers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = C.forest;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return [src.clientX - r.left, src.clientY - r.top];
    };
    const start = (e) => { e.preventDefault(); drawing.current = true; const [x,y] = pos(e); ctx.beginPath(); ctx.moveTo(x,y); };
    const move  = (e) => { e.preventDefault(); if (!drawing.current) return; const [x,y] = pos(e); ctx.lineTo(x,y); ctx.stroke(); };
    const end   = ()  => { drawing.current = false; onChange(v => ({ ...v, signature: canvas.toDataURL() })); };

    canvas.addEventListener("mousedown",  start);
    canvas.addEventListener("mousemove",  move);
    canvas.addEventListener("mouseup",    end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove",  move,  { passive: false });
    canvas.addEventListener("touchend",   end);
    return () => {
      canvas.removeEventListener("mousedown",  start);
      canvas.removeEventListener("mousemove",  move);
      canvas.removeEventListener("mouseup",    end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove",  move);
      canvas.removeEventListener("touchend",   end);
    };
  }, []);

  const clearSig = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onChange(v => ({ ...v, signature: null }));
  };

  const row = (label, key, type="text", placeholder="") => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} placeholder={placeholder} {...f(key)} style={inputStyle} />
    </div>
  );
  const area = (label, key, placeholder="") => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <textarea placeholder={placeholder} {...f(key)} style={areaStyle} />
    </div>
  );
  const check = (key, text) => (
    <label style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14, cursor: "pointer" }}>
      <input type="checkbox" checked={!!value[key]} onChange={e => onChange(v => ({ ...v, [key]: e.target.checked }))}
        style={{ marginTop: 3, width: 16, height: 16, accentColor: C.forest, flexShrink: 0 }} />
      <span style={{ fontSize: 13.5, color: C.forest, lineHeight: 1.55 }}>{text}</span>
    </label>
  );

  return (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400, color: C.forest, marginBottom: 6 }}>New Client Waiver</h2>
      <p style={{ fontSize: 13.5, color: C.textSec, marginBottom: 20, lineHeight: 1.6 }}>Please answer all questions prior to arriving at your first stretch appointment.</p>

      {row("Date of Birth", "date_of_birth", "date")}
      {row("How did you hear about us?", "heard_about_us", "text", "e.g. Google, Instagram, friend…")}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div><label style={labelStyle}>Hours of sleep per night?</label><input type="number" min="1" max="24" {...f("sleep_hours")} style={inputStyle} /></div>
        <div><label style={labelStyle}>Sleep quality (1–10)?</label><input type="number" min="1" max="10" {...f("sleep_quality")} style={inputStyle} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div><label style={labelStyle}>Litres of water per day?</label><input type="number" min="0" step="0.5" {...f("water_litres")} style={inputStyle} /></div>
        <div><label style={labelStyle}>Times you exercise per week?</label><input type="number" min="0" {...f("exercise_frequency")} style={inputStyle} /></div>
      </div>

      {area("What type of exercise do you participate in regularly?", "exercise_types", "e.g. gym, running, yoga…")}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Rate your ability to exercise (1–10) — 1 = can't exercise, 10 = unstoppable</label>
        <input type="number" min="1" max="10" {...f("exercise_ability")} style={inputStyle} />
      </div>
      {area("Do you have any pre-existing injuries? If so, please explain.", "injuries", "Describe any injuries…")}
      {area("Have you had any surgeries? If so, please explain and give a rough date.", "surgeries", "Describe surgeries and dates…")}
      {area("What do you want to get out of stretching?", "goals", "Your goals…")}

      <div style={{ borderTop: `1px solid ${C.boneDark}`, paddingTop: 16, marginBottom: 16 }}>
        {check("agree_cancellation", "I accept the 24hr cancellation policy and agree to pay the cancellation fee in the event I cancel within 24hrs of my appointment time.")}
        {check("agree_injuries_disclosed", "I have notified my practitioner of all current and past injuries, pains, surgeries and treatments.")}
        {check("agree_liability", "I understand that flexibility training may make any pre-existing injuries or conditions worse, but wish to continue with treatment and will not hold Assisted Stretches at fault for any future complications I may experience.")}
      </div>

      <div>
        <label style={labelStyle}>Signature</label>
        <div style={{ border: `1.5px solid ${C.boneDark}`, borderRadius: 8, background: C.white, position: "relative" }}>
          <canvas ref={canvasRef} width={440} height={120} style={{ width: "100%", height: 120, display: "block", borderRadius: 8, cursor: "crosshair", touchAction: "none" }} />
          <button onClick={clearSig} style={{ position: "absolute", top: 8, right: 8, background: "none", border: `1px solid ${C.sand}`, borderRadius: 4, padding: "2px 10px", fontSize: 12, color: C.textSec, cursor: "pointer" }}>Clear</button>
        </div>
        <p style={{ fontSize: 11.5, color: C.textSec, marginTop: 6 }}>Draw your signature above using your mouse or finger.</p>
      </div>
    </div>
  );
}

// ─── CONTACT STEP (regular + gift card) ──────────────────────
function ContactStep({ value, onChange, isGiftCard, selectedProduct, onProductSelect }) {
  const field = key => ({ value: value[key] || "", onChange: e => onChange({ ...value, [key]: e.target.value }) });
  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${C.boneDark}`, fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, color: C.forest, background: C.white, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: C.clay, letterSpacing: "0.08em", marginBottom: 6, display: "block" };
  const sectionLabel = { fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: C.textSec, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${C.boneDark}` };

  return (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: C.forest, marginBottom: 8 }}>
        {isGiftCard ? "Choose your gift card" : "Your details"}
      </h2>
      <p style={{ fontSize: 14, color: C.textSec, marginBottom: 24, lineHeight: 1.6 }}>
        {isGiftCard ? "Select a digital gift card, then fill in the details below." : "We'll send a confirmation to your email."}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {isGiftCard && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 4 }}>
              {GIFT_DENOMS.map(d => {
                const isSelected = selectedProduct?.id === d.product.id;
                return (
                  <button key={d.product.id} onClick={() => onProductSelect(d.product)}
                    style={{ width: "100%", textAlign: "left", padding: "14px 18px", borderRadius: 10, border: `1.5px solid ${isSelected ? C.forest : C.boneDark}`, background: isSelected ? C.forest : C.white, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 15, color: isSelected ? C.white : C.forest }}>{d.sessions === 1 ? "1 session" : `${d.sessions} sessions`}</span>
                      {d.saving && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: C.terracotta, color: C.white, borderRadius: 4, padding: "2px 6px" }}>Save {d.saving}</span>}
                      <div style={{ fontSize: 12.5, marginTop: 3, opacity: 0.65, fontStyle: "italic", color: isSelected ? C.white : C.textSec }}>{d.tagline}</div>
                    </div>
                    <span style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 400, color: isSelected ? C.white : C.forest }}>{d.price}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: C.textSec, background: C.white, border: `1px solid ${C.boneDark}`, borderRadius: 8, padding: "10px 14px", lineHeight: 1.6 }}>
              Gift card — sent instantly to the recipient's email. Valid for 6 months.
            </div>
          </>
        )}

        {isGiftCard && (
          <>
            <div style={sectionLabel}>GIFT RECIPIENT</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>RECIPIENT NAME</label>
                <input style={inputStyle} placeholder="Alex Smith" {...field("recipientName")} onFocus={e => e.target.style.borderColor = C.terracotta} onBlur={e => e.target.style.borderColor = C.boneDark} />
              </div>
              <div>
                <label style={labelStyle}>RECIPIENT EMAIL</label>
                <input style={inputStyle} type="email" placeholder="alex@example.com" {...field("recipientEmail")} onFocus={e => e.target.style.borderColor = C.terracotta} onBlur={e => e.target.style.borderColor = C.boneDark} />
              </div>
            </div>
            <div style={{ ...sectionLabel, marginTop: 4 }}>YOUR DETAILS</div>
          </>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>FIRST NAME</label>
            <input style={inputStyle} placeholder="Jane" {...field("firstName")} onFocus={e => e.target.style.borderColor = C.terracotta} onBlur={e => e.target.style.borderColor = C.boneDark} />
          </div>
          <div>
            <label style={labelStyle}>LAST NAME</label>
            <input style={inputStyle} placeholder="Smith" {...field("lastName")} onFocus={e => e.target.style.borderColor = C.terracotta} onBlur={e => e.target.style.borderColor = C.boneDark} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>EMAIL</label>
          <input style={inputStyle} type="email" placeholder="jane@example.com" {...field("email")} onFocus={e => e.target.style.borderColor = C.terracotta} onBlur={e => e.target.style.borderColor = C.boneDark} />
        </div>
        <div>
          <label style={labelStyle}>PHONE</label>
          <input style={inputStyle} type="tel" placeholder="04xx xxx xxx" {...field("phone")} onFocus={e => e.target.style.borderColor = C.terracotta} onBlur={e => e.target.style.borderColor = C.boneDark} />
        </div>
        <div>
          <label style={labelStyle}>{isGiftCard ? "WRITE A GIFT MESSAGE (optional)" : "ANYTHING WE SHOULD KNOW? (optional)"}</label>
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: isGiftCard ? 110 : 80, fontSize: isGiftCard ? 12.5 : 14.5 }}
            placeholder={isGiftCard ? `e.g. "For the person who calls touching their toes a personal best."` : "Injuries, goals, areas to focus on…"}
            {...field("notes")}
            onFocus={e => e.target.style.borderColor = C.terracotta}
            onBlur={e => e.target.style.borderColor = C.boneDark}
          />
        </div>
      </div>
    </div>
  );
}

// ─── GIFT CODE PANEL (in regular payment form) ───────────────
function GiftCodePanel({ onSuccess, booking }) {
  const [code, setCode]       = useState("");
  const [status, setStatus]   = useState(null); // null | "checking" | { valid, ... } | { error }
  const [loading, setLoading] = useState(false);

  const validate = async () => {
    setStatus("checking");
    try {
      const res  = await fetch("/api/gift-cards/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ valid: false, error: "Network error — please try again." });
    }
  };

  const redeem = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gift-cards/redeem", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          booking: {
            first_name: booking.contact.firstName, last_name: booking.contact.lastName,
            email: booking.contact.email, phone: booking.contact.phone,
            session_date: booking.date?.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" }),
            session_time: booking.time, notes: booking.contact.notes || null,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess("gift_card");
      } else {
        setStatus({ valid: false, error: data.error || "Redemption failed." });
      }
    } catch {
      setStatus({ valid: false, error: "Network error — please try again." });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${C.boneDark}`, fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, color: C.forest, background: C.white, outline: "none", boxSizing: "border-box", letterSpacing: "0.04em" };

  return (
    <div style={{ background: C.white, border: `1px solid ${C.boneDark}`, borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.clay, letterSpacing: "0.08em", marginBottom: 10 }}>REDEEM GIFT CARD</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="AS-XXXX-XXXX"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setStatus(null); }}
          onFocus={e => e.target.style.borderColor = C.terracotta}
          onBlur={e => e.target.style.borderColor = C.boneDark}
        />
        <button onClick={validate} disabled={!code.trim() || status === "checking"} style={{ ...btn("ghost", { padding: "12px 18px", fontSize: 13, whiteSpace: "nowrap" }), opacity: !code.trim() ? 0.5 : 1 }}>
          {status === "checking" ? "…" : "Validate"}
        </button>
      </div>
      {status && status !== "checking" && (
        status.valid ? (
          <div>
            <div style={{ fontSize: 13, color: "#276749", background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 6, padding: "8px 12px", marginBottom: 10 }}>
              ✓ Valid — <strong>{status.sessions_remaining}</strong> session{status.sessions_remaining !== 1 ? "s" : ""} remaining
            </div>
            <button onClick={redeem} disabled={loading} style={{ ...btn("primary"), width: "100%", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Booking…" : "Book with gift card"}
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#C53030", background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: 6, padding: "8px 12px" }}>
            {status.error || "Invalid gift card code."}
          </div>
        )
      )}
    </div>
  );
}

// ─── PAYMENT FORM (Stripe) ────────────────────────────────────
function PaymentForm({ booking, onSuccess, isGiftFlow }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [useGift,        setUseGift]        = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [prAvailable,    setPrAvailable]    = useState(false);

  // ── Apple Pay / Google Pay via Stripe Payment Request ──────
  useEffect(() => {
    if (!stripe) return;

    // Amount in cents
    const depositCents = isGiftFlow
      ? (booking.product?.price ?? 125) * 100   // full product price for gift cards
      : 100;   // $1 TEST — change back to 5000

    const label = isGiftFlow
      ? (booking.product?.label ?? "Gift Card")
      : "Session Deposit";

    const pr = stripe.paymentRequest({
      country:  "AU",
      currency: "aud",
      total: { label, amount: depositCents },
      requestPayerName:  true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setPrAvailable(true);
      }
    });

    pr.on("paymentmethod", async ev => {
      setLoading(true); setError(null);
      try {
        // 1. Create PaymentIntent (also validates slot is still free)
        const intentRes = await fetch("/api/payments/intent", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: isGiftFlow ? "gift-session" : booking.product?.id,
            ...(!isGiftFlow && booking.date && booking.time ? {
              session_date: fmtSessionDate(booking.date),
              session_time: booking.time,
            } : {}),
          }),
        });
        const intentData = await intentRes.json();
        const { clientSecret, error: intentErr } = intentData;
        if (intentErr) throw new Error(intentErr);

        // 2. Confirm with the payment method from the wallet sheet
        const { error: confirmErr, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );
        if (confirmErr) { ev.complete("fail"); throw new Error(confirmErr.message); }

        // 3. Complete the sheet (close Apple Pay / Google Pay UI)
        ev.complete("success");

        if (paymentIntent.status === "requires_action") {
          const { error: actionErr } = await stripe.confirmCardPayment(clientSecret);
          if (actionErr) throw new Error(actionErr.message);
        }

        // 4. Record booking / gift card
        let giftCode = null;
        if (isGiftFlow) {
          const res = await fetch("/api/gift-cards/purchase", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id:           booking.product?.id,
              purchaser_first_name: booking.contact.firstName,
              purchaser_last_name:  booking.contact.lastName,
              purchaser_email:      booking.contact.email,
              purchaser_phone:      booking.contact.phone,
              recipient_name:       booking.contact.recipientName  || null,
              recipient_email:      booking.contact.recipientEmail || null,
              gift_message:         booking.contact.notes          || null,
              stripe_payment_id:    paymentIntent.id,
            }),
          });
          const data = await res.json();
          giftCode = data.code || null;
        } else {
          await fetch("/api/bookings", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              first_name: booking.contact.firstName, last_name: booking.contact.lastName,
              email: booking.contact.email, phone: booking.contact.phone,
              product_id:   booking.product?.id,
              session_date: fmtSessionDate(booking.date),
              session_time: booking.time,
              notes:        booking.contact.notes,
              stripe_payment_id: paymentIntent.id,
            }),
          });
        }
        onSuccess("stripe", giftCode);
      } catch (err) {
        setError(err.message || "Payment failed.");
      } finally {
        setLoading(false);
      }
    });

    return () => { pr.off("paymentmethod"); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setError(null);
    try {
      // 0. Pre-flight: re-check availability right before charging the card
      //    so the user gets an instant, clear message if the slot was taken
      //    while they were filling in their details.
      if (!isGiftFlow && booking.date && booking.time) {
        const ddmmyyyy = fmtSessionDate(booking.date);
        const avRes = await fetch(`/api/bookings/availability?date=${encodeURIComponent(ddmmyyyy)}`);
        const avData = await avRes.json().catch(() => ({}));
        const nowTaken = Array.isArray(avData.taken) ? avData.taken : [];
        if (nowTaken.includes(booking.time)) {
          throw new Error("Sorry, that time slot was just booked by someone else. Please go back and choose a different time.");
        }
      }

      // 1. Create PaymentIntent on server (also validates slot is still free)
      const intentRes = await fetch("/api/payments/intent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: isGiftFlow ? 'gift-session' : booking.product?.id,
          // Pass slot details so server can verify availability before charging
          ...(!isGiftFlow && booking.date && booking.time ? {
            session_date: fmtSessionDate(booking.date),
            session_time: booking.time,
          } : {}),
        }),
      });
      const intentText = await intentRes.text();
      if (!intentText) throw new Error("Server returned an empty response. Please check the server is running.");
      let intentData;
      try { intentData = JSON.parse(intentText); } catch { throw new Error("Server error: " + intentText.slice(0, 120)); }
      const { clientSecret, paymentIntentId, error: intentErr } = intentData;
      if (intentErr) throw new Error(intentErr);

      // 2. Confirm card payment with Stripe
      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (stripeErr) throw new Error(stripeErr.message);
      if (paymentIntent.status !== "succeeded") throw new Error("Payment not completed.");

      // 3. Record booking / gift card on server
      let giftCode = null;
      if (isGiftFlow) {
        const res = await fetch("/api/gift-cards/purchase", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: booking.product?.id,
            purchaser_first_name: booking.contact.firstName,
            purchaser_last_name:  booking.contact.lastName,
            purchaser_email:      booking.contact.email,
            purchaser_phone:      booking.contact.phone,
            recipient_name:  booking.contact.recipientName  || null,
            recipient_email: booking.contact.recipientEmail || null,
            gift_message:    booking.contact.notes          || null,
            stripe_payment_id: paymentIntent.id,
          }),
        });
        const data = await res.json();
        giftCode = data.code || null;
      } else {
        await fetch("/api/bookings", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: booking.contact.firstName, last_name: booking.contact.lastName,
            email: booking.contact.email, phone: booking.contact.phone,
            product_id: booking.product?.id,
            session_date: fmtSessionDate(booking.date),
            session_time: booking.time, notes: booking.contact.notes,
            stripe_payment_id: paymentIntent.id,
          }),
        });
        // Persist this booking in localStorage so the slot stays grayed out
        // immediately for this client, even before the next server poll.
        try {
          const _key = `${fmtSessionDate(booking.date)}||${booking.time}`;
          const _existing = JSON.parse(localStorage.getItem("as_confirmed_bookings") || "[]");
          if (!_existing.includes(_key))
            localStorage.setItem("as_confirmed_bookings", JSON.stringify([..._existing, _key]));
        } catch (_) {}
        // Submit waiver separately (non-fatal)
        if (booking.waiver?.signature) {
          fetch("/api/waivers", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              first_name: booking.contact.firstName, last_name: booking.contact.lastName,
              email: booking.contact.email, phone: booking.contact.phone,
              ...booking.waiver,
            }),
          }).catch(() => {});
        }
      }
      onSuccess("stripe", giftCode);
    } catch (err) {
      setError(err.message || "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: C.forest, marginBottom: 8 }}>Payment</h2>
      <p style={{ fontSize: 14, color: C.textSec, marginBottom: 24, lineHeight: 1.6 }}>
        A <strong style={{ color: C.forest }}>$1 deposit</strong> is charged now to secure your booking. The remaining balance is payable on the day.
      </p>
      <BookingSummary booking={booking} isGiftFlow={isGiftFlow} />
      {!isGiftFlow && (
        <div style={{ marginBottom: 16 }}>
          <button type="button" onClick={() => setUseGift(g => !g)} style={{ background: "none", border: "none", color: C.terracotta, fontSize: 13.5, fontWeight: 500, cursor: "pointer", padding: 0, marginBottom: useGift ? 12 : 0 }}>
            {useGift ? "▾ Use gift card code" : "▸ Have a gift card code?"}
          </button>
          {useGift && <GiftCodePanel onSuccess={onSuccess} booking={booking} />}
        </div>
      )}
      {!useGift && (
        <>
          {/* ── Apple Pay / Google Pay button ── */}
          {prAvailable && paymentRequest && (
            <div style={{ marginBottom: 16 }}>
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      type:   "default",
                      theme:  "dark",
                      height: "48px",
                    },
                  },
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 4px" }}>
                <div style={{ flex: 1, height: 1, background: C.boneDark }} />
                <span style={{ fontSize: 12, color: C.textSec, fontWeight: 500, letterSpacing: "0.06em" }}>OR PAY BY CARD</span>
                <div style={{ flex: 1, height: 1, background: C.boneDark }} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.clay, letterSpacing: "0.08em", marginBottom: 8, display: "block" }}>CARD DETAILS</label>
            <div style={{ padding: "14px", border: `1.5px solid ${C.boneDark}`, borderRadius: 8, background: C.white }}>
              <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: "15px", color: C.forest, fontFamily: "'DM Sans', sans-serif", "::placeholder": { color: C.sand } }, invalid: { color: "#e53e3e" } } }} />
            </div>
          </div>
          {DEMO_MODE && <div style={{ background: "#FFF8E7", border: "1px solid #F0C040", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#7A5500", marginBottom: 16 }}><strong>Demo mode</strong> — add your Stripe key to <code>.env</code> to enable real payments.</div>}
          {error && <div style={{ color: "#c53030", fontSize: 13.5, marginBottom: 12 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...btn("primary"), width: "100%", opacity: loading ? 0.7 : 1, cursor: loading ? "default" : "pointer", fontSize: 16, padding: "16px" }}>
            {loading ? "Processing…" : "Confirm & Pay $1 Deposit"}
          </button>
        </>
      )}
      <p style={{ fontSize: 12, color: C.textSec, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>🔒 Secured by Stripe · Cancel or reschedule up to 24 hours before</p>
    </form>
  );
}

function DemoPaymentForm({ booking, onSuccess, isGiftFlow }) {
  const [loading, setLoading] = useState(false);
  const [card, setCard]       = useState({ number: "", expiry: "", cvc: "" });
  const [useGift, setUseGift] = useState(false);

  const formatCard   = v => v.replace(/\D/g,"").replace(/(.{4})/g,"$1 ").trim().slice(0,19);
  const formatExpiry = v => { const d = v.replace(/\D/g,""); return d.length > 2 ? d.slice(0,2)+"/"+d.slice(2,4) : d; };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    let giftCode = null;
    if (isGiftFlow) {
      try {
        const res  = await fetch("/api/gift-cards/purchase", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: booking.product?.id,
            purchaser_first_name: booking.contact.firstName,
            purchaser_last_name:  booking.contact.lastName,
            purchaser_email:      booking.contact.email,
            purchaser_phone:      booking.contact.phone,
            recipient_name:  booking.contact.recipientName  || null,
            recipient_email: booking.contact.recipientEmail || null,
            gift_message:    booking.contact.notes          || null,
          }),
        });
        const data = await res.json();
        giftCode = data.code || null;
      } catch (_) {}
    } else {
      try {
        await fetch("/api/bookings", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ first_name: booking.contact.firstName, last_name: booking.contact.lastName, email: booking.contact.email, phone: booking.contact.phone, product_id: booking.product?.id, session_date: fmtSessionDate(booking.date), session_time: booking.time, notes: booking.contact.notes }),
        });
      } catch (_) {}
    }
    setLoading(false);
    onSuccess("stripe", giftCode);
  };

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${C.boneDark}`, fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, color: C.forest, background: C.white, outline: "none", boxSizing: "border-box" };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: C.forest, marginBottom: 8 }}>Payment</h2>
      <p style={{ fontSize: 14, color: C.textSec, marginBottom: 20, lineHeight: 1.6 }}>
        Total: <strong style={{ color: C.forest }}>${booking.product?.price?.toLocaleString()}</strong>
      </p>
      <BookingSummary booking={booking} isGiftFlow={isGiftFlow} />
      {!isGiftFlow && (
        <div style={{ marginBottom: 16 }}>
          <button type="button" onClick={() => setUseGift(g => !g)} style={{ background: "none", border: "none", color: C.terracotta, fontSize: 13.5, fontWeight: 500, cursor: "pointer", padding: 0, marginBottom: useGift ? 12 : 0 }}>
            {useGift ? "▾ Use gift card code" : "▸ Have a gift card code?"}
          </button>
          {useGift && <GiftCodePanel onSuccess={onSuccess} booking={booking} />}
        </div>
      )}
      {!useGift && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.clay, letterSpacing: "0.08em", marginBottom: 6, display: "block" }}>CARD NUMBER</label>
              <input style={inputStyle} placeholder="1234 5678 9012 3456" value={card.number} onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))} maxLength={19} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.clay, letterSpacing: "0.08em", marginBottom: 6, display: "block" }}>EXPIRY</label>
                <input style={inputStyle} placeholder="MM/YY" value={card.expiry} onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))} maxLength={5} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.clay, letterSpacing: "0.08em", marginBottom: 6, display: "block" }}>CVC</label>
                <input style={inputStyle} placeholder="123" value={card.cvc} onChange={e => setCard(c => ({ ...c, cvc: e.target.value.replace(/\D/g,"").slice(0,4) }))} maxLength={4} />
              </div>
            </div>
          </div>
          <div style={{ background: "#FFF8E7", border: "1px solid #F0C040", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#7A5500", marginBottom: 16 }}>
            <strong>Demo mode</strong> — add your Stripe publishable key to <code>.env</code> to enable real payments.
          </div>
          <button type="submit" disabled={loading} style={{ ...btn("primary"), width: "100%", opacity: loading ? 0.7 : 1, cursor: loading ? "default" : "pointer", fontSize: 16, padding: "16px" }}>
            {loading ? "Processing…" : "Confirm & Pay $1 Deposit"}
          </button>
        </>
      )}
      <p style={{ fontSize: 12, color: C.textSec, textAlign: "center", marginTop: 12 }}>🔒 Cancel or reschedule up to 24 hours before your session</p>
    </form>
  );
}

// ─── BOOKING SUMMARY ─────────────────────────────────────────
function BookingSummary({ booking, isGiftFlow }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.boneDark}`, borderRadius: 10, padding: "16px 18px", marginBottom: 20, fontSize: 13.5, lineHeight: 2, color: C.textSec }}>
      {isGiftFlow ? (
        <>
          <div><span style={{ color: C.forest, fontWeight: 500 }}>Gift card:</span> {booking.product?.label}</div>
          {booking.contact?.recipientName  && <div><span style={{ color: C.forest, fontWeight: 500 }}>Recipient:</span> {booking.contact.recipientName}</div>}
          {booking.contact?.recipientEmail && <div><span style={{ color: C.forest, fontWeight: 500 }}>Sent to:</span> {booking.contact.recipientEmail}</div>}
          <div><span style={{ color: C.forest, fontWeight: 500 }}>Delivery:</span> Digital · instant</div>
        </>
      ) : (
        <>
          <div><span style={{ color: C.forest, fontWeight: 500 }}>Service:</span> {booking.product?.label}</div>
          {booking.date && <div><span style={{ color: C.forest, fontWeight: 500 }}>Date:</span> {booking.date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>}
          {booking.time && <div><span style={{ color: C.forest, fontWeight: 500 }}>Time:</span> {booking.time}</div>}
          <div><span style={{ color: C.forest, fontWeight: 500 }}>Name:</span> {booking.contact?.firstName} {booking.contact?.lastName}</div>
        </>
      )}
    </div>
  );
}

// ─── GIFT SERVICE STEP (after payment) ───────────────────────
function GiftServiceStep({ product, maxSessions }) {
  const multi = maxSessions > 1;
  return (
    <div>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.forest, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, fontSize: 24 }}>✓</div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: C.forest, marginBottom: 12 }}>Gift card purchased.</h2>
      <p style={{ fontSize: 15, color: C.textSec, lineHeight: 1.7, marginBottom: 8 }}>
        Your <strong style={{ color: C.forest }}>{product?.label}</strong> gift card code has been generated and will be emailed to the recipient.
      </p>
      <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7 }}>
        {multi
          ? `Now let's book the sessions — you can schedule all ${maxSessions} now, or book the first one and come back later with your gift card code.`
          : "Now let's book the session. Pick a date and time below."}
      </p>
    </div>
  );
}

// ─── CONFIRMATION ─────────────────────────────────────────────
function Confirmation({ booking, onClose, isGiftFlow }) {
  if (isGiftFlow) {
    return (
      <div style={{ textAlign: "center", padding: "12px 0" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.forest, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 28 }}>✓</div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 400, color: C.forest, marginBottom: 12 }}>All done.</h2>
        <p style={{ fontSize: 15, color: C.textSec, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 16px" }}>
          Your <strong style={{ color: C.forest }}>{booking.product?.label}</strong> gift card has been sent to{" "}
          <strong style={{ color: C.forest }}>{booking.contact?.recipientEmail || booking.contact?.email}</strong>.
        </p>
        {booking.sessions?.length > 0 && (
          <div style={{ background: C.white, border: `1px solid ${C.boneDark}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24, textAlign: "left", fontSize: 13.5, lineHeight: 2, color: C.textSec }}>
            {booking.sessions.map((s, i) => (
              <div key={i}>📅 <strong style={{ color: C.forest }}>Session {i + 1}:</strong> {s.date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })} at {s.time}</div>
            ))}
            <div>📧 <strong style={{ color: C.forest }}>Confirmation sent to:</strong> {booking.contact?.email}</div>
          </div>
        )}
        <button onClick={onClose} style={{ ...btn("primary"), padding: "14px 40px", fontSize: 15 }}>Done</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "12px 0" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.forest, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 28 }}>✓</div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 400, color: C.forest, marginBottom: 12 }}>You're booked.</h2>
      <p style={{ fontSize: 15, color: C.textSec, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 28px" }}>
        A confirmation has been sent to <strong style={{ color: C.forest }}>{booking.contact?.email}</strong>. We'll see you on{" "}
        {booking.date?.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })} at {booking.time}.
      </p>
      <div style={{ background: C.white, border: `1px solid ${C.boneDark}`, borderRadius: 12, padding: "20px 24px", marginBottom: 28, textAlign: "left", fontSize: 13.5, lineHeight: 2.1, color: C.textSec }}>
        <div>📍 <strong style={{ color: C.forest }}>Location:</strong> 41 Barton Parade, Balmoral QLD 4171</div>
        <div>🚗 <strong style={{ color: C.forest }}>Parking:</strong> Street parking available on Barton Parade</div>
        <div>🪑 <strong style={{ color: C.forest }}>On arrival:</strong> Make yourself comfortable on the sofa on the front porch — I'll collect you for your appointment</div>
        <div>↩️ <strong style={{ color: C.forest }}>Cancel / reschedule:</strong> Up to 24 hours before</div>
      </div>
      <button onClick={onClose} style={{ ...btn("primary"), padding: "14px 40px", fontSize: 15 }}>Done</button>
    </div>
  );
}

// ─── MAIN MODAL ───────────────────────────────────────────────
export default function BookingModal({ isOpen, onClose, initialProduct, initialStep, mode = 'modal' }) {
  // Live config state from API
  const [liveProducts,   setLiveProducts]   = useState(null);
  const [liveAvailDays,  setLiveAvailDays]  = useState(null);
  const [liveSlotsByDay, setLiveSlotsByDay] = useState(null);
  const [liveHolidays,   setLiveHolidays]   = useState([]);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        const p = data.pricing || {};
        const av = data.availability || {};

        // Build products from server pricing
        const products = [
          { id: 'session', label: 'Single Session', price: p.session || 125, per: null, desc: '1 × 60-min assisted stretch session', badge: null },
        ];
        setLiveProducts(products);

        // Build available days Set from av.days array of day numbers
        if (av.days) setLiveAvailDays(new Set(av.days));

        // Build slots by day number — use string keys to avoid any numeric coercion issues
        if (av.slots) {
          const numericSlots = {};
          Object.entries(av.slots).forEach(([k, v]) => {
            numericSlots[Number(k)] = v;
          });
          setLiveSlotsByDay(numericSlots);
        }

        // Store holidays for calendar display
        if (data.holidays) setLiveHolidays(data.holidays);
      })
      .catch(() => {}); // keep defaults on error
  }, []);

  // Regular booking state (steps 0–5)
  const [customerType, setCustomerType] = useState(null); // 'new' | 'existing' | null
  const [step,       setStep]      = useState(0);
  const [product,    setProduct]   = useState(null);
  const [date,       setDate]      = useState(null);
  const [time,       setTime]      = useState(null);
  const [contact,    setContact]   = useState({});
  const [waiver,     setWaiver]    = useState({});
  const [done,       setDone]      = useState(false);
  const [takenSlots, setTakenSlots] = useState([]);

  // Gift card flow state (giftStep 0–2)
  // 0=Details/denomination, 1=Payment, 2=Confirm
  const [giftStep,     setGiftStep]    = useState(0);
  const [giftProduct,  setGiftProduct] = useState(PRODUCTS[0]);
  const [giftContact,  setGiftContact] = useState({});
  const [giftDate,     setGiftDate]    = useState(null);
  const [giftTime,     setGiftTime]    = useState(null);
  const [giftDone,     setGiftDone]    = useState(false);
  const [giftCode,     setGiftCode]    = useState(null);
  const [giftSessions, setGiftSessions] = useState([]); // confirmed { date, time }[]

  const isGiftCardFlow = initialStep === 3;

  // ── Booking date bounds (3-month rolling window from launch date) ──
  const { minDate: bookingMinDate, maxDate: bookingMaxDate } = getBookingDateBounds();

  useEffect(() => {
    if (isOpen || mode === 'page') {
      setCustomerType(null);
      setStep(initialProduct ? 1 : 0);
      setProduct(initialProduct || null);
      setDate(null); setTime(null); setContact({}); setWaiver({}); setDone(false);
      setGiftStep(0);
      setGiftProduct(PRODUCTS[0]); setGiftContact({}); setGiftDate(null); setGiftTime(null);
      setGiftDone(false); setGiftCode(null); setGiftSessions([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Persistent local bookings ─────────────────────────────────────────────
  // Store confirmed bookings in localStorage so this browser always shows
  // its own booked slots as grayed out — even after a page refresh.
  const LOCAL_BOOKINGS_KEY = "as_confirmed_bookings";
  const getLocalBookings = () => { try { return JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || "[]"); } catch { return []; } };
  const saveLocalBooking = (date, time) => {
    const existing = getLocalBookings();
    const key = `${fmtSessionDate(date)}||${time}`;
    if (!existing.includes(key)) localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify([...existing, key]));
  };
  const getLocalTakenForDate = (d) => {
    const ddmmyyyy = fmtSessionDate(d);
    return getLocalBookings().filter(k => k.startsWith(ddmmyyyy + "||")).map(k => k.split("||")[1]);
  };

  // Fetch taken slots — merges server response with locally-stored confirmed bookings
  const fetchAvailability = (d) => {
    if (!d) { setTakenSlots([]); return; }
    const ddmmyyyy = fmtSessionDate(d);
    const local = getLocalTakenForDate(d);
    fetch(`/api/bookings/availability?date=${encodeURIComponent(ddmmyyyy)}`)
      .then(r => r.json())
      .then(data => {
        const server = Array.isArray(data.taken) ? data.taken : [];
        setTakenSlots([...new Set([...server, ...local])]);
      })
      .catch(() => { setTakenSlots(local); }); // fallback to local on network error
  };

  useEffect(() => { fetchAvailability(date); }, [date]);

  // When the user arrives at the time step (step 2), do an immediate
  // fresh fetch so any slots reserved since the date was selected are
  // already greyed out before the user taps anything.
  // Poll every 5 seconds to catch real-time reservations from other clients.
  useEffect(() => {
    if (step !== 2 || !date) return;
    fetchAvailability(date);
    const id = setInterval(() => fetchAvailability(date), 5000);
    return () => clearInterval(id);
  }, [step, date]);

  if (mode !== 'page' && !isOpen) return null;

  const giftMaxDate      = getGiftMaxDate(giftProduct?.id);
  const maxGiftSessions  = giftProduct?.id === "5-pack" ? 5 : giftProduct?.id === "10-pack" ? 10 : 1;
  const giftSessionNum   = giftSessions.length + 1; // 1-indexed, current session being booked

  // ── Gift card flow canNext
  const giftCanNext =
    giftStep === 0 ? (!!(giftProduct && giftContact.firstName && giftContact.lastName && giftContact.email && giftContact.phone)) :
    giftStep === 2 ? true :
    false;

  // ── Regular flow canNext
  const isNewPatient = customerType === 'new';
  const regCanNext = [
    !!product,
    !!date,
    !!time,
    !!(contact.firstName && contact.lastName && contact.email && contact.phone),
    isNewPatient ? !!(waiver.agree_cancellation && waiver.agree_injuries_disclosed && waiver.agree_liability && waiver.signature) : true,
    true,
  ][step] ?? false;

  const canNext = isGiftCardFlow ? giftCanNext : regCanNext;

  const giftBooking = { product: giftProduct, date: giftDate, time: giftTime, contact: giftContact, sessions: giftSessions };
  const regBooking  = { product, date, time, contact, waiver };

  const handleGiftPaymentSuccess = (_method, code) => { setGiftCode(code); setGiftStep(2); };
  const handleRegPaymentSuccess  = async () => { setDone(true); };

  const handleNext = async () => {
    if (isGiftCardFlow) {
      if (giftStep === 2) {
        setGiftDone(true);
      } else {
        setGiftStep(s => s + 1);
      }
    } else {
      // Existing patients skip the waiver step (4) — jump straight to payment (5)
      if (!isNewPatient && step === 3) { setStep(5); return; }
      setStep(s => s + 1);
    }
  };

  const finishBookingEarly = () => setGiftDone(true);

  const handleBack = () => {
    if (isGiftCardFlow) {
      if (giftStep > 0 && giftStep !== 1) setGiftStep(s => s - 1);
    } else {
      // Existing patients at payment (5) go back to details (3), not waiver
      if (!isNewPatient && step === 5) { setStep(3); return; }
      // At step 0 (Service), go back to patient type selection
      if (step === 0) { setCustomerType(null); return; }
      setStep(s => s - 1);
    }
  };

  const paymentNode = DEMO_MODE
    ? <DemoPaymentForm booking={isGiftCardFlow ? giftBooking : regBooking} onSuccess={isGiftCardFlow ? handleGiftPaymentSuccess : handleRegPaymentSuccess} isGiftFlow={isGiftCardFlow} />
    : <Elements stripe={stripePromise} options={{ appearance: { theme: "stripe" } }}>
        <PaymentForm booking={isGiftCardFlow ? giftBooking : regBooking} onSuccess={isGiftCardFlow ? handleGiftPaymentSuccess : handleRegPaymentSuccess} isGiftFlow={isGiftCardFlow} />
      </Elements>;

  const isDone = isGiftCardFlow ? giftDone : done;
  // (customer type / waiver pre-steps removed — collected separately or at studio)

  // Determine if current view needs nav buttons
  const showNavBtns = !isDone && (
    isGiftCardFlow
      ? (giftStep === 0 || giftStep === 2)
      : (step < 5)
  );

  const nextLabel =
    isGiftCardFlow
      ? (giftStep === 0 ? "Continue to payment →" : "Done ✓")
      : (step === 4 || (step === 3 && !isNewPatient) ? "Continue to payment →" : "Continue →");

  // ── Page mode render ──────────────────────────────────────
  if (mode === 'page') {
    return (
      <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
        {!isDone && customerType !== null && (
          <div style={{ marginBottom: 20 }}>
            <StepBar step={step} compact labels={isNewPatient ? STEP_LABELS_NEW : STEP_LABELS_EXISTING} />
          </div>
        )}
        <div>
          {isDone ? (
            <Confirmation booking={regBooking} onClose={onClose} isGiftFlow={false} />
          ) : customerType === null ? (
            <CustomerTypeStep value={customerType} onChange={type => setCustomerType(type)} />
          ) : (
            <>
              {step === 0 && <PagePricingStep selected={product} onSelect={setProduct} products={liveProducts} />}
              {step === 1 && <DateStep value={date} onChange={d => { setDate(d); setTime(null); }} minDate={bookingMinDate} maxDate={bookingMaxDate} availableDays={liveAvailDays} holidays={liveHolidays} />}
              {step === 2 && <TimeStep date={date} value={time} onChange={t => { setTime(t); setTimeout(() => setStep(3), 180); }} takenSlots={takenSlots} slotsByDay={liveSlotsByDay} />}
              {step === 3 && <ContactStep value={contact} onChange={setContact} isGiftCard={false} />}
              {step === 4 && <WaiverStep value={waiver} onChange={setWaiver} />}
              {step === 5 && paymentNode}

              {showNavBtns && step !== 2 && (
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <button onClick={handleBack} style={btn("ghost", { flex: 1 })}>← Back</button>
                  <button onClick={() => canNext && handleNext()} style={{ ...btn("primary"), flex: 2, cursor: canNext ? "pointer" : "not-allowed", opacity: canNext ? 1 : 0.45 }}>
                    {nextLabel}
                  </button>
                </div>
              )}
              {step === 2 && (
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <button onClick={handleBack} style={btn("ghost", { flex: 1 })}>← Back</button>
                </div>
              )}
              {step === 5 && (
                <button onClick={handleBack} style={{ ...btn("ghost"), width: "100%", marginTop: 10 }}>← Back</button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Modal mode render ─────────────────────────────────────
  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={sheetStyle}>
        {/* Header */}
        <div style={{ padding: "14px 24px 12px", borderBottom: `1px solid ${C.boneDark}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.textSec, fontStyle: "italic" }}>Assisted Stretches</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: C.textSec, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>

        {/* Step bar — hidden on customer type pre-screen */}
        {!isDone && customerType !== null && (
          <div style={{ padding: "10px 24px 8px" }}>
            {isGiftCardFlow ? <GiftStepBar giftStep={giftStep} /> : <StepBar step={step} labels={isNewPatient ? STEP_LABELS_NEW : STEP_LABELS_EXISTING} />}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "6px 24px 20px" }}>
          {isDone ? (
            <Confirmation booking={isGiftCardFlow ? giftBooking : regBooking} onClose={onClose} isGiftFlow={isGiftCardFlow} />
          ) : !isGiftCardFlow && customerType === null ? (
            <CustomerTypeStep value={customerType} onChange={type => { setCustomerType(type); }} />
          ) : isGiftCardFlow ? (
            <>
              {giftStep === 0 && <ContactStep value={giftContact} onChange={setGiftContact} isGiftCard selectedProduct={giftProduct} onProductSelect={setGiftProduct} />}
              {giftStep === 1 && paymentNode}
              {giftStep === 2 && <GiftServiceStep product={giftProduct} maxSessions={maxGiftSessions} />}

              {showNavBtns && (
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  {giftStep > 0 && giftStep !== 1 && giftSessions.length === 0 && (
                    <button onClick={handleBack} style={btn("ghost", { flex: 1 })}>← Back</button>
                  )}
                  <button onClick={handleNext} disabled={!canNext} style={{ ...btn("primary"), flex: 2, opacity: canNext ? 1 : 0.45, cursor: canNext ? "pointer" : "default" }}>
                    {nextLabel}
                  </button>
                </div>
              )}
              {giftStep === 1 && (
                <button onClick={() => setGiftStep(0)} style={{ ...btn("ghost"), width: "100%", marginTop: 12 }}>← Back</button>
              )}
            </>
          ) : (
            <>
              {step === 0 && <ServiceStep selected={product} onSelect={setProduct} initialProduct={initialProduct} products={liveProducts} />}
              {step === 1 && <DateStep value={date} onChange={d => { setDate(d); setTime(null); }} minDate={bookingMinDate} maxDate={bookingMaxDate} availableDays={liveAvailDays} holidays={liveHolidays} />}
              {step === 2 && <TimeStep date={date} value={time} onChange={t => { setTime(t); setTimeout(() => setStep(3), 180); }} takenSlots={takenSlots} slotsByDay={liveSlotsByDay} />}
              {step === 3 && <ContactStep value={contact} onChange={setContact} isGiftCard={false} />}
              {step === 4 && <WaiverStep value={waiver} onChange={setWaiver} />}
              {step === 5 && paymentNode}

              {showNavBtns && step !== 2 && (
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  {step > 0 && <button onClick={handleBack} style={btn("ghost", { flex: 1 })}>← Back</button>}
                  <button onClick={handleNext} disabled={!canNext} style={{ ...btn("primary"), flex: step > 0 ? 2 : 1, opacity: canNext ? 1 : 0.45, cursor: canNext ? "pointer" : "default" }}>
                    {step === 4 ? "Continue to payment →" : "Continue →"}
                  </button>
                </div>
              )}
              {/* Time step: show back button only, auto-advances on selection */}
              {step === 2 && (
                <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                  <button onClick={handleBack} style={btn("ghost", { flex: 1 })}>← Back</button>
                </div>
              )}
              {step === 5 && (
                <button onClick={handleBack} style={{ ...btn("ghost"), width: "100%", marginTop: 12 }}>← Back</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
