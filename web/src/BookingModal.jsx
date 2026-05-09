import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// ─── CONFIG ──────────────────────────────────────────────────
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY && STRIPE_KEY !== "pk_test_placeholder"
  ? loadStripe(STRIPE_KEY)
  : null;
const DEMO_MODE = !stripePromise;

export const PRODUCTS = [
  { id: "session", label: "Single Session", price: 125, per: null,  desc: "1 × 60-min assisted stretch session", badge: null },
  { id: "5-pack",  label: "5-Pack",         price: 575, per: 115,   desc: "5 × 60-min sessions · Valid 6 months", badge: "Popular" },
  { id: "10-pack", label: "10-Pack",         price: 1000, per: 100,  desc: "10 × 60-min sessions · Valid 12 months", badge: null },
];

const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];
const DAY_LABELS  = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// Real availability: Monday=1, Friday=5, Saturday=6
const AVAILABLE_DAYS = new Set([1, 5, 6]);
const SLOTS_BY_DAY = {
  1: ["4:00 PM", "5:00 PM"],
  5: ["4:00 PM", "5:00 PM"],
  6: ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"],
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
  maxHeight: "92vh", overflowY: "auto",
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
const STEP_LABELS = ["Service","Date","Time","Details","Payment"];

function StepBar({ step, compact = false }) {
  const circleSize = compact ? 22 : 28;
  const fontSize   = compact ? 11 : 12;
  const labelSize  = compact ? 9  : 10;
  return (
    <div style={{ display: "flex", alignItems: "center", padding: compact ? "0" : "0 28px" }}>
      {STEP_LABELS.map((label, i) => {
        const done = i < step, cur = i === step;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEP_LABELS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: circleSize, height: circleSize, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize, fontWeight: 600, background: done ? C.forest : cur ? C.terracotta : C.boneDark, color: done || cur ? C.bone : C.textSec, transition: "all 0.3s" }}>
                {done ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: labelSize, color: cur ? C.terracotta : done ? C.forest : C.textSec, fontWeight: cur ? 600 : 400, whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: done ? C.forest : C.boneDark, margin: "0 4px", marginBottom: compact ? 14 : 18, transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const GIFT_STEP_LABELS = ["Details", "Payment", "Service", "Date", "Time"];

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
  { sessions: 1,  product: PRODUCTS[0], price: "$125",   saving: null,       tagline: "One hour where the world stops." },
  { sessions: 5,  product: PRODUCTS[1], price: "$575",   saving: "Save $50", tagline: "A real reset." },
  { sessions: 10, product: PRODUCTS[2], price: "$1,000", saving: "Save $250",tagline: "For the person that is committed to taking assisted stretching seriously." },
];

// ─── DATE STEP ───────────────────────────────────────────────
function DateStep({ value, onChange, maxDate, sessionNum, maxSessions, availableDays, holidays = [] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredHoliday, setHoveredHoliday] = useState(null);

  const year = view.getFullYear(), month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const liveAvailDays = availableDays || AVAILABLE_DAYS;
  const dayDate       = d => new Date(year, month, d);
  const isPast        = d => dayDate(d) < today;
  const isUnavailable = d => !liveAvailDays.has(dayDate(d).getDay());
  const isAfterMax    = d => maxDate && dayDate(d) > maxDate;

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

  const isDisabled    = d => isPast(d) || isUnavailable(d) || isAfterMax(d) || !!getHoliday(d);
  const isSelected = d => value && value.getDate() === d && value.getMonth() === month && value.getFullYear() === year;
  const isToday    = d => dayDate(d).getTime() === today.getTime();

  const canPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const maxView = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1) : null;
  const canNext = !maxView || new Date(year, month + 1, 1) <= maxView;

  const rangeNote = maxDate
    ? `Bookings must be within ${maxDate.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}`
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
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: C.forest, marginBottom: 8 }}>Pick a date</h2>
      {maxSessions > 1 && <div style={{ fontSize: 12, fontWeight: 600, color: C.terracotta, letterSpacing: "0.08em", marginBottom: 6 }}>Session {sessionNum} of {maxSessions}</div>}
      <p style={{ fontSize: 14, color: C.textSec, marginBottom: 24, lineHeight: 1.6 }}>Available Monday (4–6 pm), Friday (4–6 pm) and Saturday (8 am–1 pm). Select a day to see times.</p>
      <div style={{ background: C.white, borderRadius: 12, padding: "20px", border: `1px solid ${C.boneDark}`, position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => canPrev && setView(new Date(year, month - 1, 1))} style={{ background: "none", border: "none", cursor: canPrev ? "pointer" : "default", fontSize: 20, color: canPrev ? C.forest : C.boneDark, padding: "4px 8px", lineHeight: 1 }}>‹</button>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 600, color: C.forest }}>{MONTH_NAMES[month]} {year}</span>
          <button onClick={() => canNext && setView(new Date(year, month + 1, 1))} style={{ background: "none", border: "none", cursor: canNext ? "pointer" : "default", fontSize: 20, color: canNext ? C.forest : C.boneDark, padding: "4px 8px", lineHeight: 1 }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
          {DAY_LABELS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: C.clay, letterSpacing: "0.05em", paddingBottom: 6 }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
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
                {holiday && !isPast(d) && (
                  <span style={{ position: "absolute", top: 0, right: 0, width: 5, height: 5, borderRadius: "50%", background: C.terracotta }} />
                )}
              </button>
            );
          })}
        </div>
        {/* Coming soon overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(255,255,255,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "all", cursor: "default",
        }}>
          <div style={{
            transform: "rotate(-35deg)",
            fontSize: 28, fontWeight: 800,
            color: "#CC0000",
            letterSpacing: "0.04em",
            textAlign: "center",
            lineHeight: 1.3,
            userSelect: "none",
            textShadow: "0 1px 4px rgba(0,0,0,0.15)",
            whiteSpace: "nowrap",
          }}>
            OPENING JULY 2027
          </div>
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
      {rangeNote && <p style={{ fontSize: 12, color: C.clay, marginTop: 10, textAlign: "center" }}>📅 {rangeNote}</p>}
    </div>
  );
}

// ─── TIME STEP ───────────────────────────────────────────────
function TimeStep({ date, value, onChange, sessionNum, maxSessions, takenSlots, slotsByDay }) {
  const slots = slotsByDay ? (slotsByDay[date.getDay()] || []) : getSlotsForDate(date);
  const counter = maxSessions > 1 ? `Session ${sessionNum} of ${maxSessions}` : null;
  const taken = takenSlots || [];
  return (
    <div>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: C.forest, marginBottom: 4 }}>Pick a time</h2>
      <p style={{ fontSize: 14, color: C.textSec, marginBottom: counter ? 6 : 24, lineHeight: 1.6 }}>{date.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</p>
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
                const active = selectedProduct?.id === d.product.id;
                return (
                  <button key={d.sessions} onClick={() => onProductSelect(d.product)} style={{ background: active ? C.forest : C.white, color: active ? C.bone : C.forest, border: `1.5px solid ${active ? C.forest : C.boneDark}`, borderRadius: 10, padding: "16px 18px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{d.sessions === 1 ? "1 session" : `${d.sessions} sessions`}</span>
                        {d.saving && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: C.terracotta, color: C.bone, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.06em" }}>{d.saving}</span>}
                      </div>
                      <span style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 400, flexShrink: 0 }}>{d.price}</span>
                    </div>
                    <div style={{ fontSize: 12.5, marginTop: 4, opacity: 0.65, fontStyle: "italic" }}>{d.tagline}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: C.textSec, background: C.white, border: `1px solid ${C.boneDark}`, borderRadius: 8, padding: "10px 14px", lineHeight: 1.6 }}>
              📧 Digital gift card — sent instantly to the recipient's email. Valid for 12 months.
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
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [useGift, setUseGift] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true); setError(null);
    try {
      // 1. Create PaymentIntent on server
      const intentRes = await fetch("/api/payments/intent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: booking.product?.id }),
      });
      const { clientSecret, paymentIntentId, error: intentErr } = await intentRes.json();
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
            session_date: booking.date?.toLocaleDateString("en-AU"),
            session_time: booking.time, notes: booking.contact.notes,
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
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, color: C.forest, marginBottom: 8 }}>Payment</h2>
      <p style={{ fontSize: 14, color: C.textSec, marginBottom: 24, lineHeight: 1.6 }}>
        Your card will be charged <strong style={{ color: C.forest }}>${booking.product?.price?.toLocaleString()}</strong> once confirmed.
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
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.clay, letterSpacing: "0.08em", marginBottom: 8, display: "block" }}>CARD DETAILS</label>
            <div style={{ padding: "14px", border: `1.5px solid ${C.boneDark}`, borderRadius: 8, background: C.white }}>
              <CardElement options={{ style: { base: { fontSize: "15px", color: C.forest, fontFamily: "'DM Sans', sans-serif", "::placeholder": { color: C.sand } }, invalid: { color: "#e53e3e" } } }} />
            </div>
          </div>
          {DEMO_MODE && <div style={{ background: "#FFF8E7", border: "1px solid #F0C040", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#7A5500", marginBottom: 16 }}><strong>Demo mode</strong> — add your Stripe key to <code>.env</code> to enable real payments.</div>}
          {error && <div style={{ color: "#c53030", fontSize: 13.5, marginBottom: 12 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...btn("primary"), width: "100%", opacity: loading ? 0.7 : 1, cursor: loading ? "default" : "pointer", fontSize: 16, padding: "16px" }}>
            {loading ? "Processing…" : `Confirm & Pay $${booking.product?.price?.toLocaleString()}`}
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
          body: JSON.stringify({ first_name: booking.contact.firstName, last_name: booking.contact.lastName, email: booking.contact.email, phone: booking.contact.phone, product_id: booking.product?.id, session_date: booking.date?.toLocaleDateString("en-AU"), session_time: booking.time, notes: booking.contact.notes }),
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
            {loading ? "Processing…" : `Confirm & Pay $${booking.product?.price?.toLocaleString()}`}
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
        <div>📍 <strong style={{ color: C.forest }}>Location:</strong> [Studio address — add yours here]</div>
        <div>🕐 <strong style={{ color: C.forest }}>Arrive:</strong> 5 minutes early in comfortable clothing</div>
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
          { id: 'session', label: 'Single Session', price: p.session || 125,    per: null,                                              desc: '1 × 60-min assisted stretch session', badge: null },
          { id: '5-pack',  label: '5-Pack',          price: p['5-pack'] || 575,  per: Math.round((p['5-pack'] || 575) / 5),              desc: '5 × 60-min sessions · Valid 6 months', badge: 'Popular' },
          { id: '10-pack', label: '10-Pack',          price: p['10-pack'] || 1000, per: Math.round((p['10-pack'] || 1000) / 10),          desc: '10 × 60-min sessions · Valid 12 months', badge: null },
        ];
        setLiveProducts(products);

        // Build available days Set from av.days array of day numbers
        if (av.days) setLiveAvailDays(new Set(av.days));

        // Build slots by day number
        if (av.slots) {
          const numericSlots = {};
          Object.entries(av.slots).forEach(([k, v]) => { numericSlots[Number(k)] = v; });
          setLiveSlotsByDay(numericSlots);
        }

        // Store holidays for calendar display
        if (data.holidays) setLiveHolidays(data.holidays);
      })
      .catch(() => {}); // keep defaults on error
  }, []);

  // Regular booking state (steps 0–4)
  const [step,       setStep]      = useState(0);
  const [product,    setProduct]   = useState(null);
  const [date,       setDate]      = useState(null);
  const [time,       setTime]      = useState(null);
  const [contact,    setContact]   = useState({});
  const [done,       setDone]      = useState(false);
  const [takenSlots, setTakenSlots] = useState([]);

  // Gift card flow state (giftStep 0–4)
  // 0=Details/denomination, 1=Payment, 2=Service(confirmation), 3=Date, 4=Time
  const [giftStep,     setGiftStep]    = useState(0);
  const [giftProduct,  setGiftProduct] = useState(null);
  const [giftContact,  setGiftContact] = useState({});
  const [giftDate,     setGiftDate]    = useState(null);
  const [giftTime,     setGiftTime]    = useState(null);
  const [giftDone,     setGiftDone]    = useState(false);
  const [giftCode,     setGiftCode]    = useState(null);
  const [giftSessions, setGiftSessions] = useState([]); // confirmed { date, time }[]

  const isGiftCardFlow = initialStep === 3;

  useEffect(() => {
    if (isOpen || mode === 'page') {
      setStep(initialProduct ? 1 : 0);
      setProduct(initialProduct || null);
      setDate(null); setTime(null); setContact({}); setDone(false);
      setGiftStep(0);
      setGiftProduct(null); setGiftContact({}); setGiftDate(null); setGiftTime(null);
      setGiftDone(false); setGiftCode(null); setGiftSessions([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Fetch taken slots whenever date changes in regular booking flow
  useEffect(() => {
    if (!date) { setTakenSlots([]); return; }
    const ddmmyyyy = date.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" });
    fetch(`/api/bookings/availability?date=${encodeURIComponent(ddmmyyyy)}`)
      .then(r => r.json())
      .then(d => setTakenSlots(d.taken || []))
      .catch(() => setTakenSlots([]));
  }, [date]);

  if (mode !== 'page' && !isOpen) return null;

  const giftMaxDate      = getGiftMaxDate(giftProduct?.id);
  const maxGiftSessions  = giftProduct?.id === "5-pack" ? 5 : giftProduct?.id === "10-pack" ? 10 : 1;
  const giftSessionNum   = giftSessions.length + 1; // 1-indexed, current session being booked

  // ── Gift card flow canNext
  const giftCanNext =
    giftStep === 0 ? (!!(giftProduct && giftContact.firstName && giftContact.lastName && giftContact.email && giftContact.phone)) :
    giftStep === 2 ? true :   // "Service" step is just info — always can continue
    giftStep === 3 ? !!giftDate :
    giftStep === 4 ? !!giftTime :
    false;

  // ── Regular flow canNext
  const isGiftCardFlowStep3 = false; // never in gift card flow for regular
  const regCanNext = [
    !!product,
    !!date,
    !!time,
    !!(contact.firstName && contact.lastName && contact.email && contact.phone),
    true,
  ][step] ?? false;

  const canNext = isGiftCardFlow ? giftCanNext : regCanNext;

  const giftBooking = { product: giftProduct, date: giftDate, time: giftTime, contact: giftContact, sessions: giftSessions };
  const regBooking  = { product, date, time, contact };

  const handleGiftPaymentSuccess = (_method, code) => { setGiftCode(code); setGiftStep(2); };
  const handleRegPaymentSuccess  = () => setDone(true);

  const handleNext = async () => {
    if (isGiftCardFlow) {
      if (giftStep === 4) {
        // Redeem one session credit and record booking
        if (giftCode) {
          try {
            await fetch("/api/gift-cards/redeem", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: giftCode,
                booking: {
                  first_name: giftContact.firstName, last_name: giftContact.lastName,
                  email: giftContact.email, phone: giftContact.phone,
                  session_date: giftDate?.toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" }),
                  session_time: giftTime, notes: null,
                },
              }),
            });
          } catch (_) {}
        }
        const newSessions = [...giftSessions, { date: giftDate, time: giftTime }];
        setGiftSessions(newSessions);
        setGiftDate(null);
        setGiftTime(null);
        if (newSessions.length < maxGiftSessions) {
          setGiftStep(3); // loop back to date for next session
        } else {
          setGiftDone(true);
        }
      } else {
        setGiftStep(s => s + 1);
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const finishBookingEarly = () => setGiftDone(true);

  const handleBack = () => {
    if (isGiftCardFlow) {
      if (giftStep > 0 && giftStep !== 1) setGiftStep(s => s - 1);
    } else {
      setStep(s => s - 1);
    }
  };

  const paymentNode = DEMO_MODE
    ? <DemoPaymentForm booking={isGiftCardFlow ? giftBooking : regBooking} onSuccess={isGiftCardFlow ? handleGiftPaymentSuccess : handleRegPaymentSuccess} isGiftFlow={isGiftCardFlow} />
    : <Elements stripe={stripePromise} options={{ appearance: { theme: "stripe" } }}>
        <PaymentForm booking={isGiftCardFlow ? giftBooking : regBooking} onSuccess={isGiftCardFlow ? handleGiftPaymentSuccess : handleRegPaymentSuccess} isGiftFlow={isGiftCardFlow} />
      </Elements>;

  const isDone = isGiftCardFlow ? giftDone : done;

  // Determine if current view needs nav buttons
  // Gift: step 1 (payment) and step 4 with time selected trigger their own buttons
  const showNavBtns = !isDone && (
    isGiftCardFlow
      ? (giftStep === 0 || giftStep === 2 || giftStep === 3 || giftStep === 4)
      : (step < 4)
  );

  const nextLabel =
    isGiftCardFlow
      ? (giftStep === 0 ? "Continue to payment →" : giftStep === 2 ? "Choose a date →" : giftStep === 3 ? "Choose a time →" : "Confirm booking →")
      : (step === 3 ? "Continue to payment →" : "Continue →");

  // ── Page mode render ──────────────────────────────────────
  if (mode === 'page') {
    return (
      <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
        {!isDone && (
          <div style={{ marginBottom: 20 }}>
            <StepBar step={step} compact />
          </div>
        )}
        <div>
          {isDone ? (
            <Confirmation booking={regBooking} onClose={onClose} isGiftFlow={false} />
          ) : (
            <>
              {step === 0 && <PagePricingStep selected={product} onSelect={setProduct} products={liveProducts} />}
              {step === 1 && <DateStep value={date} onChange={setDate} availableDays={liveAvailDays} holidays={liveHolidays} />}
              {step === 2 && <TimeStep date={date} value={time} onChange={setTime} takenSlots={takenSlots} slotsByDay={liveSlotsByDay} />}
              {step === 3 && <ContactStep value={contact} onChange={setContact} isGiftCard={false} />}
              {step === 4 && paymentNode}

              {showNavBtns && (
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  {step > 0 && <button onClick={handleBack} style={btn("ghost", { flex: 1 })}>← Back</button>}
                  <button onClick={() => canNext && handleNext()} style={{ ...btn("primary"), flex: 2, cursor: canNext ? "pointer" : "not-allowed" }}>
                    {step === 3 ? "Continue to payment →" : "Continue →"}
                  </button>
                </div>
              )}
              {step === 4 && (
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
        <div style={{ padding: "24px 28px 20px", borderBottom: `1px solid ${C.boneDark}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15, color: C.textSec, fontStyle: "italic" }}>Assisted Stretches</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: C.textSec, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>

        {/* Step bar */}
        {!isDone && (
          <div style={{ padding: "20px 28px 16px" }}>
            {isGiftCardFlow ? <GiftStepBar giftStep={giftStep} /> : <StepBar step={step} />}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "8px 28px 28px" }}>
          {isDone ? (
            <Confirmation booking={isGiftCardFlow ? giftBooking : regBooking} onClose={onClose} isGiftFlow={isGiftCardFlow} />
          ) : isGiftCardFlow ? (
            <>
              {giftStep === 0 && <ContactStep value={giftContact} onChange={setGiftContact} isGiftCard selectedProduct={giftProduct} onProductSelect={setGiftProduct} />}
              {giftStep === 1 && paymentNode}
              {giftStep === 2 && <GiftServiceStep product={giftProduct} maxSessions={maxGiftSessions} />}
              {giftStep === 3 && <DateStep value={giftDate} onChange={setGiftDate} maxDate={giftMaxDate} sessionNum={giftSessionNum} maxSessions={maxGiftSessions} availableDays={liveAvailDays} holidays={liveHolidays} />}
              {giftStep === 4 && <TimeStep date={giftDate} value={giftTime} onChange={setGiftTime} sessionNum={giftSessionNum} maxSessions={maxGiftSessions} slotsByDay={liveSlotsByDay} />}

              {showNavBtns && (
                <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                  {giftStep > 0 && giftStep !== 1 && giftSessions.length === 0 && (
                    <button onClick={handleBack} style={btn("ghost", { flex: 1 })}>← Back</button>
                  )}
                  <button onClick={handleNext} disabled={!canNext} style={{ ...btn("primary"), flex: 2, opacity: canNext ? 1 : 0.45, cursor: canNext ? "pointer" : "default" }}>
                    {nextLabel}
                  </button>
                </div>
              )}
              {maxGiftSessions > 1 && giftSessions.length > 0 && (giftStep === 3 || giftStep === 4) && (
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <button onClick={finishBookingEarly} style={{ background: "none", border: "none", color: C.textSec, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
                    Done for now — book remaining sessions later with my gift card code
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
              {step === 1 && <DateStep value={date} onChange={setDate} availableDays={liveAvailDays} holidays={liveHolidays} />}
              {step === 2 && <TimeStep date={date} value={time} onChange={setTime} takenSlots={takenSlots} slotsByDay={liveSlotsByDay} />}
              {step === 3 && <ContactStep value={contact} onChange={setContact} isGiftCard={false} />}
              {step === 4 && paymentNode}

              {showNavBtns && (
                <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
                  {step > 0 && <button onClick={handleBack} style={btn("ghost", { flex: 1 })}>← Back</button>}
                  <button onClick={handleNext} disabled={!canNext} style={{ ...btn("primary"), flex: 2, opacity: canNext ? 1 : 0.45, cursor: canNext ? "pointer" : "default" }}>
                    {step === 3 ? "Continue to payment →" : "Continue →"}
                  </button>
                </div>
              )}
              {step === 4 && (
                <button onClick={handleBack} style={{ ...btn("ghost"), width: "100%", marginTop: 12 }}>← Back</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
