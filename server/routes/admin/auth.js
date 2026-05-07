const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) return res.status(500).json({ error: 'Admin not configured' });
  const valid = await bcrypt.compare(password, hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password' });
  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '8h' });
  res.cookie('admin_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
  res.json({ ok: true, token });
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

const adminAuth = require('../../middleware/adminAuth');
router.get('/me', adminAuth, (req, res) => res.json({ ok: true }));

module.exports = router;
