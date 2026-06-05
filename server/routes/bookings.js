const express      = require('express');
const router       = express.Router();
const fs           = require('fs');
const path         = require('path');
const store        = require('../store');
const reservations = require('../lib/slotReservations');
const { sendBookingConfirmationEmail } = require('../lib/mailer');

const CONFIG_FILE = path.join(__dirname, '../data/config.json');

const PRODUCT_LABELS = {
  'session':  '60 minute studio stretch session',
  '5-pack':   '5-Pack — 60 minute studio stretch sessions',
  '10-pack':  '10-Pack — 60 minute studio stretch sessions',
};

function readConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch { return {}; }
}

// Parse "DD/MM/YYYY" → midnight Date (local)
function parseDMY(str) {
  const [d, m, y] = (str || '').split('/');
  return new Date(Number(y), Number(m) - 1, Number(d));
}

// Returns the matching holiday object if dateStr (DD/MM/YYYY) falls within any holiday range
function findHoliday(dateStr, holidays = []) {
  const d = parseDMY(dateStr);
  return holidays.find(h => {
    const start = parseDMY(h.start);
    const end   = parseDMY(h.end);
    return d >= start && d <= end;
  });
}

// GET /api/bookings/availability?date=DD/MM/YYYY
router.get('/availability', (req, res) => {
  const { date } = req.query;
  const config = readConfig();

  // Holiday check — entire day blocked
  const holiday = findHoliday(date, config.holidays || []);
  if (holiday) {
    return res.json({ date, taken: 'all', holiday: true, holidayName: holiday.name });
  }

  // Confirmed bookings
  const confirmed = store.bookings.list()
    .filter(b => b.session_date === date && b.status !== 'cancelled')
    .map(b => b.session_time);

  // Blocked slots from config
  const blocked = (config.blocked_slots || [])
    .filter(s => s.date === date)
    .map(s => s.time);

  // In-progress reservations (another client is currently paying for this slot)
  const reserved = reservations.getReservedTimesForDate(date);

  const allTaken = [...new Set([...confirmed, ...blocked, ...reserved])];
  res.json({ date, taken: allTaken, holiday: false });
});

// POST /api/bookings  (Stripe-paid session booking)
router.post('/', async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone,
      product_id, session_date, session_time,
      notes, stripe_payment_id,
    } = req.body;

    if (!first_name || !last_name || !email || !phone || !product_id || !session_date || !session_time)
      return res.status(400).json({ error: 'Missing required fields' });

    // Holiday check
    const cfg = readConfig();
    const holiday = findHoliday(session_date, cfg.holidays || []);
    if (holiday) return res.status(409).json({ error: `Studio is closed for ${holiday.name}.` });

    // Final double-booking guard (synchronous — atomic in Node.js single-threaded model)
    const existing = store.bookings.list().find(
      b => b.session_date === session_date && b.session_time === session_time && b.status !== 'cancelled'
    );
    if (existing) return res.status(409).json({ error: 'That slot is already booked.' });

    const now    = new Date().toISOString();
    const record = store.bookings.create({
      gift_card_code: null,
      first_name, last_name, email, phone,
      product_id, session_date, session_time,
      notes: notes || null,
      payment_method: 'stripe',
      stripe_payment_id: stripe_payment_id || null,
      created_at: now,
    });

    // Release the in-progress reservation — booking is now confirmed
    reservations.release(session_date, session_time);

    store.clients.upsert({ first_name, last_name, email, phone, source: 'booking', created_at: now });

    try {
      await sendBookingConfirmationEmail({
        email, firstName: first_name, lastName: last_name, phone,
        sessionDate: session_date, sessionTime: session_time,
        productLabel: PRODUCT_LABELS[product_id] || product_id,
        notes: notes || null,
      });
    } catch (mailErr) {
      console.error('Confirmation email failed (non-fatal):', mailErr.message);
    }

    res.status(201).json({ success: true, booking_id: record.id });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

module.exports = router;
