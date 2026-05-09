require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/payments',   require('./routes/payments'));
app.use('/api/gift-cards', require('./routes/giftCards'));
app.use('/api/bookings',   require('./routes/bookings'));
app.use('/api/contact',    require('./routes/contact'));

// Public config (pricing + availability only — no sensitive data)
const fs = require('fs');
const path = require('path');
app.get('/api/config', (req, res) => {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/config.json'), 'utf8'));
    res.json({
      pricing: cfg.pricing || {},
      availability: cfg.availability || {},
      holidays: cfg.holidays || [],
    });
  } catch { res.json({ pricing: {}, availability: {}, holidays: [] }); }
});

// Admin routes
app.use('/api/admin', require('./routes/admin/auth'));
const adminAuth = require('./middleware/adminAuth');
app.use('/api/admin/bookings',   adminAuth, require('./routes/admin/bookings'));
app.use('/api/admin/gift-cards', adminAuth, require('./routes/admin/giftCards'));
app.use('/api/admin/clients',    adminAuth, require('./routes/admin/clients'));
app.use('/api/admin/enquiries',  adminAuth, require('./routes/admin/enquiries'));
app.use('/api/admin/dashboard',  adminAuth, require('./routes/admin/dashboard'));
app.use('/api/admin/config',     adminAuth, require('./routes/admin/config'));

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Assisted Stretches API → http://localhost:${PORT}`);
  console.log(`Email: ${process.env.RESEND_API_KEY ? 'Resend configured' : 'Demo mode (no email)'}`);
});
