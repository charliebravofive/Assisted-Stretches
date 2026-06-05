const express = require('express');
const router  = express.Router();
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const store   = require('../store');

const PRICES = { 'session': 5000, 'gift-session': 12500 }; // cents — session is $50 deposit

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

    // ── Slot availability check BEFORE charging the card ──────
    // For session bookings, verify the slot is still free.
    // This prevents a customer from being charged for an already-taken slot.
    if (product_id === 'session' && session_date && session_time) {
      const conflict = store.bookings.list().find(
        b => b.session_date === session_date &&
             b.session_time === session_time &&
             b.status !== 'cancelled'
      );
      if (conflict) {
        return res.status(409).json({
          error: 'That time slot was just booked by someone else. Please go back and choose another time — you have not been charged.',
        });
      }
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

    res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err) {
    console.error('PaymentIntent error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
