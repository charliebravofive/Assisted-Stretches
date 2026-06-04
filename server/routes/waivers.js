const express = require('express');
const router  = express.Router();
const store   = require('../store');
const { sendWaiverEmail } = require('../lib/mailer');

// POST /api/waivers — submit a new client waiver
router.post('/', (req, res) => {
  try {
    const {
      first_name, last_name, email, phone,
      date_of_birth, heard_about_us,
      sleep_hours, sleep_quality,
      water_litres, exercise_frequency, exercise_types, exercise_ability,
      injuries, surgeries, goals,
      agree_cancellation, agree_injuries_disclosed, agree_liability,
      signature,
    } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    if (!agree_cancellation || !agree_injuries_disclosed || !agree_liability) {
      return res.status(400).json({ error: 'All checkboxes must be accepted.' });
    }
    if (!signature) {
      return res.status(400).json({ error: 'Signature is required.' });
    }

    const waiver = store.waivers.create({
      first_name, last_name, email, phone,
      date_of_birth, heard_about_us,
      sleep_hours, sleep_quality,
      water_litres, exercise_frequency, exercise_types, exercise_ability,
      injuries, surgeries, goals,
      agree_cancellation, agree_injuries_disclosed, agree_liability,
      signature,
    });

    // Email a copy of the waiver to the studio (non-fatal)
    sendWaiverEmail({
      first_name, last_name, email, phone, date_of_birth, heard_about_us,
      sleep_hours, sleep_quality, water_litres,
      exercise_frequency, exercise_types, exercise_ability,
      injuries, surgeries, goals, signature,
    }).catch(err => console.error('Waiver email failed (non-fatal):', err.message));

    res.json({ success: true, id: waiver.id });
  } catch (err) {
    console.error('Waiver error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
