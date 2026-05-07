const express = require('express');
const router  = express.Router();
const store   = require('../store');
const { generateUniqueCode } = require('../lib/codeGenerator');
const { sendGiftCardEmail, sendBookingConfirmationEmail } = require('../lib/mailer');

const SESSIONS = { 'session': 1, '5-pack': 5, '10-pack': 10 };
const LABELS   = { 'session': 'Single Session', '5-pack': '5-Pack', '10-pack': '10-Pack' };
const EXPIRY_MONTHS = { 'session': 12, '5-pack': 6, '10-pack': 12 };

// POST /api/gift-cards/purchase
router.post('/purchase', async (req, res) => {
  try {
    const {
      product_id, purchaser_first_name, purchaser_last_name,
      purchaser_email, purchaser_phone,
      recipient_name, recipient_email, gift_message,
      stripe_payment_id,
    } = req.body;

    if (!SESSIONS[product_id])
      return res.status(400).json({ error: 'Invalid product_id' });
    if (!purchaser_first_name || !purchaser_last_name || !purchaser_email || !purchaser_phone)
      return res.status(400).json({ error: 'Missing purchaser details' });

    const sessions = SESSIONS[product_id];
    const now      = new Date();
    const expiry   = new Date(now);
    expiry.setMonth(expiry.getMonth() + EXPIRY_MONTHS[product_id]);

    const code = generateUniqueCode(store);

    const gc = store.giftCards.create({
      code, product_id,
      sessions_purchased: sessions, sessions_remaining: sessions,
      purchaser_first_name, purchaser_last_name, purchaser_email, purchaser_phone,
      recipient_name: recipient_name || null,
      recipient_email: recipient_email || null,
      gift_message: gift_message || null,
      stripe_payment_id: stripe_payment_id || null,
      purchase_date: now.toISOString(),
      expiry_date:   expiry.toISOString(),
      booked_date: null, booked_time: null,
      status: 'active',
    });

    store.clients.upsert({
      first_name: purchaser_first_name, last_name: purchaser_last_name,
      email: purchaser_email, phone: purchaser_phone,
      source: 'gift_card_purchase', created_at: now.toISOString(),
    });

    const emailTo   = recipient_email || purchaser_email;
    const nameTo    = recipient_name  || `${purchaser_first_name} ${purchaser_last_name}`;
    const expiryStr = expiry.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

    await sendGiftCardEmail({
      recipientEmail: emailTo, recipientName: nameTo,
      purchaserName:  `${purchaser_first_name} ${purchaser_last_name}`,
      code, productLabel: LABELS[product_id], sessions,
      expiryDate: expiryStr, giftMessage: gift_message || null,
    });

    res.status(201).json({
      success: true, code,
      sessions_purchased: sessions, sessions_remaining: sessions,
      expiry_date: expiry.toISOString(),
    });
  } catch (err) {
    console.error('Gift card purchase error:', err);
    res.status(500).json({ error: 'Failed to create gift card' });
  }
});

// POST /api/gift-cards/validate
router.post('/validate', (req, res) => {
  try {
    const code = (req.body.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ valid: false, error: 'Code is required' });

    const gc = store.giftCards.findByCode(code);
    if (!gc)                        return res.json({ valid: false, error: 'Gift card not found' });
    if (gc.status !== 'active')     return res.json({ valid: false, error: 'Gift card is no longer active' });
    if (gc.sessions_remaining <= 0) return res.json({ valid: false, error: 'No sessions remaining on this gift card' });
    if (new Date(gc.expiry_date) < new Date()) return res.json({ valid: false, error: 'Gift card has expired' });

    res.json({ valid: true, sessions_remaining: gc.sessions_remaining, product_id: gc.product_id });
  } catch (err) {
    console.error('Validate error:', err);
    res.status(500).json({ valid: false, error: 'Validation failed' });
  }
});

// POST /api/gift-cards/redeem  (use one credit to book a session)
router.post('/redeem', async (req, res) => {
  try {
    const { code, booking } = req.body;
    if (!code || !booking) return res.status(400).json({ error: 'code and booking are required' });

    const normalised = code.trim().toUpperCase();
    const gc         = store.giftCards.findByCode(normalised);

    if (!gc)                        return res.status(404).json({ error: 'Gift card not found' });
    if (gc.status !== 'active')     return res.status(400).json({ error: 'Gift card is not active' });
    if (gc.sessions_remaining <= 0) return res.status(400).json({ error: 'No sessions remaining' });

    const remaining = gc.sessions_remaining - 1;
    store.giftCards.update(normalised, {
      sessions_remaining: remaining,
      booked_date: booking.session_date,
      booked_time: booking.session_time,
      status: remaining === 0 ? 'used' : 'active',
    });

    const bookingRecord = store.bookings.create({
      gift_card_code: normalised,
      first_name: booking.first_name, last_name: booking.last_name,
      email: booking.email, phone: booking.phone,
      product_id: gc.product_id,
      session_date: booking.session_date, session_time: booking.session_time,
      notes: booking.notes || null,
      payment_method: 'gift_card',
      created_at: new Date().toISOString(),
    });

    store.clients.upsert({
      first_name: booking.first_name, last_name: booking.last_name,
      email: booking.email, phone: booking.phone,
      source: 'gift_card_redemption', created_at: new Date().toISOString(),
    });

    await sendBookingConfirmationEmail({
      email: booking.email, firstName: booking.first_name,
      sessionDate: booking.session_date, sessionTime: booking.session_time,
      productLabel: 'Assisted Stretch Session',
    });

    res.json({ success: true, booking_id: bookingRecord.id, sessions_remaining: remaining });
  } catch (err) {
    console.error('Redeem error:', err);
    res.status(500).json({ error: err.message || 'Redemption failed' });
  }
});

// GET /api/gift-cards/:code
router.get('/:code', (req, res) => {
  const gc = store.giftCards.findByCode(req.params.code.trim().toUpperCase());
  if (!gc) return res.status(404).json({ error: 'Not found' });
  const { id: _id, ...safe } = gc;
  res.json(safe);
});

module.exports = router;
