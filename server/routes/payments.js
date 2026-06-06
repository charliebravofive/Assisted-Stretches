const express      = require('express');
const router       = require('express').Router();
const stripe       = require('stripe')(process.env.STRIPE_SECRET_KEY);
const store        = require('../store');
const reservations = require('../lib/slotReservations');

const PRICES = { 'session': 100, 'gift-session': 100 }; // cents — $1 TEST MODE (change back to 5000/12500 for production)

const STRIPE_PRODUCT_IDS = {
  'session':      'prod_UZKORgA5V4FhvL',
  'gift-session': 'prod_UZKTZ2E595kOSX',
};

// POST /api/payments/intent
router.post('/intent', async (req, res) => {
  try {
    const { product_id, session_date, session_time } = req.body;
    const amount = PRICES[product_id];
    if (!amount) return res.status(400).json({ error: 'Invalid product' });

    // ── Slot guard for session bookings ────────────────────────
    // Two checks before any card is charged:
    //   1. Confirmed bookings in the database (definitive)
    //   2. Active reservations (another client currently in payment)
    // Both checks + the reservation write happen synchronously, so
    // Node's single-threaded event loop ensures no two requests can
    // interleave here — making this effectively atomic.
    if (product_id === 'session' && session_date && session_time) {
      // 1. Confirmed booking exists?
      const confirmed = store.bookings.list().find(
        b => b.session_date === session_date &&
             b.session_time === session_time &&
             b.status !== 'cancelled'
      );
      if (confirmed) {
        return res.status(409).json({
          error: 'That time slot is already booked. Please choose a different time.',
        });
      }

      // 2. Another client is currently paying for this slot?
      if (reservations.isReserved(session_date, session_time)) {
        return res.status(409).json({
          error: 'That time slot is currently being booked by another client. Please choose a different time.',
        });
      }

      // Reserve the slot now — before the async Stripe call.
      // This closes the race-condition window.
      reservations.reserve(session_date, session_time, `pending-${Date.now()}`);
    }

    const stripeProductId = STRIPE_PRODUCT_IDS[product_id];
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
      metadata: {
        product_id,
        ...(stripeProductId ? { stripe_product_id: stripeProductId } : {}),
        ...(session_date ? { session_date, session_time } : {}),
      },
    });

    // Update the reservation with the real Intent ID so it can be matched
    // if the client cancels before paying (TTL auto-releases it anyway).
    if (product_id === 'session' && session_date && session_time) {
      reservations.reserve(session_date, session_time, intent.id);
    }

    res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err) {
    console.error('PaymentIntent error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
