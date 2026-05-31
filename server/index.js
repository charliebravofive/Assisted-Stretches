require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const path         = require('path');
const fs           = require('fs');

const app     = express();
const PORT    = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// In production the frontend is served from the same origin — CORS only
// needed for local dev where Vite runs on a separate port.
const corsOrigins = IS_PROD
  ? false  // same-origin in production; browser won't send cross-origin requests
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ── API routes ────────────────────────────────────────────────
app.use('/api/payments',   require('./routes/payments'));
app.use('/api/gift-cards', require('./routes/giftCards'));
app.use('/api/bookings',   require('./routes/bookings'));
app.use('/api/contact',    require('./routes/contact'));
app.use('/api/waivers',    require('./routes/waivers'));

// Public config (pricing + availability only — no sensitive data)
app.get('/api/config', (_req, res) => {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/config.json'), 'utf8'));
    res.json({
      pricing:      cfg.pricing      || {},
      availability: cfg.availability || {},
      holidays:     cfg.holidays     || [],
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
app.use('/api/admin/waivers',    adminAuth, require('./routes/admin/waivers'));

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── Apple Pay domain verification (Stripe) ────────────────────
// Stripe writes the file content into the APPLE_PAY_DOMAIN_ASSOC env var
// after you register your domain in the Stripe Dashboard.
app.get('/.well-known/apple-developer-merchantid-domain-association', (_req, res) => {
  const content = process.env.APPLE_PAY_DOMAIN_ASSOC;
  if (!content) return res.status(404).send('Not configured');
  res.setHeader('Content-Type', 'text/plain');
  res.send(content);
});

// ── Serve built frontend in production ────────────────────────
if (IS_PROD) {
  const distPath = path.join(__dirname, '../web/dist');
  app.use(express.static(distPath));
  // SPA fallback — all non-API routes return index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Assisted Stretches API → http://localhost:${PORT}`);
  console.log(`Mode:  ${IS_PROD ? 'production' : 'development'}`);
  console.log(`Email: ${process.env.RESEND_API_KEY ? 'Resend configured' : 'Demo mode (no email)'}`);
});
