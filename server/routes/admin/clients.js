const express = require('express');
const router = express.Router();
const store = require('../../store');

// GET /export — CSV download (must be before /:id)
router.get('/export', (req, res) => {
  const clients = store.clients.list();
  const esc = v => `"${String(v || '').replace(/"/g, '""')}"`;
  const header = 'ID,First Name,Last Name,Email,Phone,Source,Admin Note,Created At\n';
  const rows = clients.map(c => [
    c.id, esc(c.first_name), esc(c.last_name), esc(c.email), esc(c.phone),
    esc(c.source), esc(c.admin_note), esc(c.created_at),
  ].join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="clients.csv"');
  res.send(header + rows);
});

// GET / — list clients sorted by created_at desc
router.get('/', (req, res) => {
  let clients = store.clients.list();
  const { search } = req.query;
  if (search) {
    const q = search.toLowerCase();
    clients = clients.filter(c =>
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  }
  res.json(clients);
});

// GET /:id — client + all their bookings + gift cards
router.get('/:id', (req, res) => {
  const clients = store.clients.list();
  const client = clients.find(c => c.id === Number(req.params.id));
  if (!client) return res.status(404).json({ error: 'Not found' });

  const bookings = store.bookings.list().filter(b => b.email === client.email);
  const giftCards = store.giftCards.list().filter(g =>
    g.purchaser_email === client.email || g.recipient_email === client.email
  );

  res.json({ ...client, bookings, gift_cards: giftCards });
});

// PATCH /:id — update client fields
router.patch('/:id', (req, res) => {
  const { first_name, last_name, phone, admin_note } = req.body;
  const client = store.clients.update(Number(req.params.id), { first_name, last_name, phone, admin_note });
  if (!client) return res.status(404).json({ error: 'Not found' });
  res.json(client);
});

// DELETE /:id — permanently remove a client record
router.delete('/:id', (req, res) => {
  const ok = store.clients.delete(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
