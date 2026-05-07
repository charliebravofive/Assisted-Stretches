const jwt = require('jsonwebtoken');
module.exports = function adminAuth(req, res, next) {
  const token = (req.cookies && req.cookies.admin_token) || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorised' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
