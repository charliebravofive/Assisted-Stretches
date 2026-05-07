const express = require('express');
const router = express.Router();
const { sendContactEnquiryEmail } = require('../lib/mailer');
const store = require('../store');

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ error: 'Name, email and message are required' });

    await sendContactEnquiryEmail({ name, email, phone: phone || null, message });

    store.enquiries.create({
      name,
      email,
      phone: phone || null,
      message,
      received_at: new Date().toISOString(),
      status: 'new',
      admin_note: null,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact route error:', err);
    res.status(500).json({ error: 'Failed to send enquiry' });
  }
});

module.exports = router;
