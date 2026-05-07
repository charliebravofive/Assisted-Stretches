const express = require('express');
const router = express.Router();
const store = require('../../store');
const { sendGiftCardEmail } = require('../../lib/mailer');

const LABELS = { 'session': 'Single Session', '5-pack': '5-Pack', '10-pack': '10-Pack' };
const SESSIONS = { 'session': 1, '5-pack': 5, '10-pack': 10 };

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// GET / — list all gift cards, sorted by purchase_date desc
router.get('/', (req, res) => {
  let cards = store.giftCards.list();
  const { status } = req.query;
  if (status) {
    const now = new Date().toISOString().split('T')[0];
    if (status === 'active') {
      cards = cards.filter(c => c.status !== 'voided' && c.sessions_remaining > 0 && (!c.expiry_date || c.expiry_date >= now));
    } else if (status === 'used') {
      cards = cards.filter(c => c.sessions_remaining === 0 && c.status !== 'voided');
    } else if (status === 'expired') {
      cards = cards.filter(c => c.expiry_date && c.expiry_date < now && c.status !== 'voided');
    } else {
      cards = cards.filter(c => c.status === status);
    }
  }
  res.json(cards);
});

// GET /:id — single card + associated bookings
router.get('/:id', (req, res) => {
  const card = store.giftCards.findById(req.params.id);
  if (!card) return res.status(404).json({ error: 'Not found' });
  const bookings = store.bookings.list().filter(b => b.gift_card_code === card.code);
  res.json({ ...card, bookings });
});

// PATCH /:id — update card fields
router.patch('/:id', (req, res) => {
  const { status, expiry_date, sessions_remaining } = req.body;
  const allowed = {};
  if (status !== undefined) allowed.status = status;
  if (expiry_date !== undefined) allowed.expiry_date = expiry_date;
  if (sessions_remaining !== undefined) allowed.sessions_remaining = Number(sessions_remaining);

  const updated = store.giftCards.update(req.params.id, allowed);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// POST /issue — create gift card manually
router.post('/issue', (req, res) => {
  const { product_id, sessions, recipient_name, recipient_email, admin_note } = req.body;
  if (!product_id || !sessions || !recipient_email) {
    return res.status(400).json({ error: 'product_id, sessions, and recipient_email are required' });
  }

  // Generate a unique code
  let code = randomCode();
  while (store.giftCards.findByCode(code)) {
    code = randomCode();
  }

  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);

  const card = store.giftCards.create({
    code,
    product_id,
    sessions_total: Number(sessions),
    sessions_remaining: Number(sessions),
    purchaser_name: 'Admin',
    purchaser_email: 'admin',
    recipient_name: recipient_name || null,
    recipient_email,
    admin_note: admin_note || null,
    purchase_date: new Date().toISOString(),
    expiry_date: expiry.toISOString().split('T')[0],
    status: 'active',
    issued_by_admin: true,
  });

  res.status(201).json(card);
});

// POST /:id/resend — resend gift card email
router.post('/:id/resend', async (req, res) => {
  const card = store.giftCards.findById(Number(req.params.id));
  if (!card) return res.status(404).json({ error: 'Not found' });
  try {
    const productLabel = LABELS[card.product_id] || card.product_id || 'Gift Card';
    const sessions = card.sessions_purchased || card.sessions_total || SESSIONS[card.product_id] || 1;
    const recipientEmail = card.recipient_email || card.purchaser_email;
    const recipientName  = card.recipient_name  || card.purchaser_name ||
      (card.purchaser_first_name ? `${card.purchaser_first_name} ${card.purchaser_last_name}` : 'Valued Customer');
    const purchaserName  = card.purchaser_name  ||
      (card.purchaser_first_name ? `${card.purchaser_first_name} ${card.purchaser_last_name}` : 'Admin');
    const expiryDate = card.expiry_date
      ? new Date(card.expiry_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'No expiry';

    await sendGiftCardEmail({
      code: card.code,
      productLabel,
      sessions,
      expiryDate,
      recipientName,
      recipientEmail,
      purchaserName,
      giftMessage: card.gift_message || null,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
