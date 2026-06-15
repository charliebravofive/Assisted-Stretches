const express = require('express');
const router = express.Router();
const store = require('../../store');
const { sendBookingConfirmationEmail, sendBookingCancellationEmail } = require('../../lib/mailer');

// GET /export — CSV download (must be before /:id)
router.get('/export', (req, res) => {
  const bookings = store.bookings.list();
  const header = 'ID,First Name,Last Name,Email,Phone,Product,Date,Time,Status,Payment Method,Gift Card Code,Notes,Created At\n';
  const rows = bookings.map(b => [
    b.id, b.first_name, b.last_name, b.email, b.phone, b.product_id,
    b.session_date, b.session_time, b.status || 'confirmed', b.payment_method,
    b.gift_card_code || '', (b.notes || '').replace(/,/g, ''), b.created_at,
  ].join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
  res.send(header + rows);
});

// POST / — admin manually creates a booking (no Stripe payment required)
router.post('/', (req, res) => {
  const { first_name, last_name, email, phone, session_date, session_time, product_id, payment_method, notes } = req.body;
  if (!first_name || !last_name || !email || !phone || !session_date || !session_time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const now = new Date().toISOString();
  const record = store.bookings.create({
    first_name, last_name, email, phone,
    product_id: product_id || 'session',
    session_date, session_time,
    payment_method: payment_method || 'manual',
    notes: notes || null,
    gift_card_code: null,
    stripe_payment_id: null,
    created_at: now,
  });
  store.clients.upsert({ first_name, last_name, email, phone, source: 'admin', created_at: now });

  // Send confirmation email to client (non-fatal)
  sendBookingConfirmationEmail({
    email, firstName: first_name, lastName: last_name, phone,
    sessionDate: session_date, sessionTime: session_time,
    productLabel: product_id || 'session', notes: notes || '',
  }).catch(err => console.error('Admin booking confirmation email failed (non-fatal):', err.message));

  res.status(201).json(record);
});

// GET / — list all bookings, sorted by session_date desc
router.get('/', (req, res) => {
  let bookings = store.bookings.list().filter(b => b.status !== 'cancelled');

  const { search, status } = req.query;
  if (search) {
    const q = search.toLowerCase();
    bookings = bookings.filter(b =>
      (b.first_name && b.first_name.toLowerCase().includes(q)) ||
      (b.last_name && b.last_name.toLowerCase().includes(q)) ||
      (b.email && b.email.toLowerCase().includes(q))
    );
  }
  if (status) {
    bookings = bookings.filter(b => b.status === status);
  }

  res.json(bookings);
});

// GET /:id — single booking
router.get('/:id', (req, res) => {
  const booking = store.bookings.findById(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Not found' });
  res.json(booking);
});

// PATCH /:id — update booking fields
router.patch('/:id', async (req, res) => {
  const { status, admin_notes, session_date, session_time, reason } = req.body;

  // Grab the booking before updating so we have original details for email
  const existing = store.bookings.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const allowed = {};
  if (status !== undefined) allowed.status = status;
  if (admin_notes !== undefined) allowed.admin_notes = admin_notes;
  if (session_date !== undefined) allowed.session_date = session_date;
  if (session_time !== undefined) allowed.session_time = session_time;

  const updated = store.bookings.update(req.params.id, allowed);
  if (!updated) return res.status(404).json({ error: 'Not found' });

  // Send cancellation email when status changes to cancelled
  if (status === 'cancelled' && existing.status !== 'cancelled') {
    try {
      await sendBookingCancellationEmail({
        first_name: existing.first_name,
        last_name: existing.last_name,
        email: existing.email,
        session_date: existing.session_date,
        session_time: existing.session_time,
        reason: reason || '',
      });
    } catch (mailErr) {
      console.error('Cancellation email failed (non-fatal):', mailErr.message);
    }
  }

  res.json(updated);
});

module.exports = router;
