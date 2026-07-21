const jwt = require('jsonwebtoken');
const pool = require('../db');
const COOKIE = 'dsi_session';

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
  return secret;
}

async function verifyToken(req, res, next) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, jwtSecret(), { issuer: 'dynamic-ui-platform', audience: 'dynamic-ui-web', algorithms: ['HS256'] });
    const current = await pool.query(`SELECT id,tenant_id,email,name,role FROM users WHERE id=$1 AND tenant_id=$2 AND active=TRUE`, [payload.sub, payload.tenantId]);
    if (!current.rows[0] || current.rows[0].role !== payload.role) return res.status(401).json({ error: 'Session revoked' });
    req.user = current.rows[0]; next();
  } catch (error) { if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Invalid session' }); next(error); }
}

function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Insufficient permission' });
}

function signSession(user) {
  return jwt.sign({ tenantId: user.tenant_id, role: user.role }, jwtSecret(), { subject: String(user.id), issuer: 'dynamic-ui-platform', audience: 'dynamic-ui-web', algorithm: 'HS256', expiresIn: '8h' });
}

module.exports = { verifyToken, requireRole, signSession, COOKIE };
