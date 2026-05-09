const express = require('express');
const router  = express.Router();
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICES = { 'session': 12500, '5-pack': 57500, '10-pack': 100000 }; // cents

// POST /api/payments/intent
router.post('/intent', async (req, res) => {
  try {
    const { product_id } = req.body;
    const amount = PRICES[product_id];
    if (!amount) return res.status(400).json({ error: 'Invalid product' });

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
      metadata: { product_id },
    });

    res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err) {
    console.error('PaymentIntent error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
