/**
 * In-memory slot reservation store.
 *
 * Bridges the gap between PaymentIntent creation and booking confirmation.
 * When a client starts payment for a slot, that slot is "reserved" for 10
 * minutes — any other client who tries to book the same slot during that
 * window is rejected before their card is charged.
 *
 * Node.js is single-threaded, so all operations here are atomic — no
 * two requests can interleave inside a synchronous function.
 */

const TTL_MS = 10 * 60 * 1000; // 10 minutes

// Map<"DD/MM/YYYY|HH:MM AM/PM" , { expires: timestamp, intentId: string }>
const reservations = new Map();

/** Reserve a slot. Call this immediately before creating a Stripe PaymentIntent. */
function reserve(sessionDate, sessionTime, intentId) {
  const key = _key(sessionDate, sessionTime);
  reservations.set(key, { expires: Date.now() + TTL_MS, intentId });
  // Auto-release after TTL so stale locks can't block slots forever
  setTimeout(() => {
    const r = reservations.get(key);
    if (r && r.intentId === intentId) reservations.delete(key);
  }, TTL_MS);
}

/** Release a slot reservation. Call this after the booking is confirmed (or on payment failure). */
function release(sessionDate, sessionTime) {
  reservations.delete(_key(sessionDate, sessionTime));
}

/** Returns true if the slot is currently reserved by an in-progress payment. */
function isReserved(sessionDate, sessionTime) {
  const r = reservations.get(_key(sessionDate, sessionTime));
  if (!r) return false;
  if (Date.now() > r.expires) { reservations.delete(_key(sessionDate, sessionTime)); return false; }
  return true;
}

/** Returns all reserved time strings for a given date (DD/MM/YYYY format). */
function getReservedTimesForDate(sessionDate) {
  const result = [];
  for (const [key, r] of reservations) {
    if (Date.now() > r.expires) { reservations.delete(key); continue; }
    const [d, t] = key.split('||');
    if (d === sessionDate) result.push(t);
  }
  return result;
}

function _key(date, time) { return `${date}||${time}`; }

module.exports = { reserve, release, isReserved, getReservedTimesForDate };
