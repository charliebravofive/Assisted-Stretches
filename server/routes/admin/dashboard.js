const express = require('express');
const router = express.Router();
const store = require('../../store');

const PRICES = { session: 125, '5-pack': 575, '10-pack': 1000 };

function getPrice(product_id) {
  if (!product_id) return 0;
  const key = String(product_id).toLowerCase();
  if (key.includes('10')) return PRICES['10-pack'];
  if (key.includes('5')) return PRICES['5-pack'];
  return PRICES['session'];
}

router.get('/', (req, res) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];

  const monthStr = now.toISOString().slice(0, 7); // "YYYY-MM"

  const allBookings = store.bookings.list();
  const allClients = store.clients.list();
  const allGiftCards = store.giftCards.list();
  const allEnquiries = store.enquiries.list();

  // Upcoming sessions: next 7 days confirmed bookings
  const upcoming_sessions = allBookings
    .filter(b =>
      b.status === 'confirmed' &&
      b.session_date >= todayStr &&
      b.session_date <= sevenDaysStr
    )
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .map(b => ({
      id: b.id,
      name: b.name,
      email: b.email,
      session_date: b.session_date,
      session_time: b.session_time,
      product_id: b.product_id,
    }));

  // Sessions this month: confirmed bookings in current calendar month
  const sessions_this_month = allBookings.filter(b =>
    b.status === 'confirmed' &&
    b.session_date &&
    b.session_date.startsWith(monthStr)
  ).length;

  // Revenue this month: sum based on product prices
  const revenue_this_month = allBookings
    .filter(b =>
      b.status === 'confirmed' &&
      b.session_date &&
      b.session_date.startsWith(monthStr)
    )
    .reduce((sum, b) => sum + getPrice(b.product_id), 0);

  // Active gift cards
  const activeCards = allGiftCards.filter(g =>
    g.sessions_remaining > 0 && g.status !== 'voided'
  );
  const active_gift_cards = activeCards.length;
  const gift_card_liability = activeCards.reduce((sum, g) => sum + (g.sessions_remaining || 0), 0);

  // New clients this month
  const new_clients_this_month = allClients.filter(c =>
    c.created_at && c.created_at.startsWith(monthStr)
  ).length;

  // New enquiries
  const new_enquiries = allEnquiries.filter(e => e.status === 'new').length;

  // Period report (optional ?from=YYYY-MM-DD&to=YYYY-MM-DD)
  let period = null;
  const { from, to } = req.query;
  if (from || to) {
    const periodBookings = allBookings.filter(b => {
      if (!b.session_date) return false;
      if (['cancelled', 'no-show'].includes(b.status)) return false;
      if (from && b.session_date < from) return false;
      if (to && b.session_date > to) return false;
      return true;
    });

    let sessions_single = 0, sessions_5pack = 0, sessions_10pack = 0;
    let revenue_stripe = 0, revenue_gift_card = 0;

    periodBookings.forEach(b => {
      const key = String(b.product_id || '').toLowerCase();
      const price = getPrice(b.product_id);
      if (key.includes('10')) sessions_10pack++;
      else if (key.includes('5')) sessions_5pack++;
      else sessions_single++;

      if (b.payment_method === 'gift_card' || b.payment_method === 'gift-card') {
        revenue_gift_card += price;
      } else {
        revenue_stripe += price;
      }
    });

    period = {
      sessions_single,
      sessions_5pack,
      sessions_10pack,
      revenue_stripe,
      revenue_gift_card,
      total_revenue: revenue_stripe + revenue_gift_card,
    };
  }

  res.json({
    upcoming_sessions,
    sessions_this_month,
    revenue_this_month,
    active_gift_cards,
    gift_card_liability,
    new_clients_this_month,
    new_enquiries,
    ...(period !== null ? { period } : {}),
  });
});

module.exports = router;
