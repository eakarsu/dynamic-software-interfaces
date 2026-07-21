const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { verifyToken, signSession, COOKIE } = require('../middleware/auth');
const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase(); const password = String(req.body?.password || ''); const tenant = String(req.body?.tenant || '').trim().toLowerCase();
    if (!email || !tenant || !password || password.length > 200) return res.status(400).json({ error: 'Tenant, email, and password are required' });
    const result = await pool.query(`SELECT u.id,u.tenant_id,u.email,u.password_hash,u.name,u.role FROM users u JOIN tenants t ON t.id=u.tenant_id
      WHERE u.email=$1 AND t.slug=$2 AND u.active=TRUE AND t.active=TRUE`, [email,tenant]);
    if (!result.rows[0] || !await bcrypt.compare(password, result.rows[0].password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    res.cookie(COOKIE, signSession(user), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 8 * 60 * 60 * 1000 });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) { next(error); }
});
router.post('/logout', (_req, res) => { res.clearCookie(COOKIE, { path: '/', sameSite: 'strict', secure: process.env.NODE_ENV === 'production' }); res.json({ ok: true }); });
router.get('/me', verifyToken, (req, res) => res.json({ user: req.user }));
module.exports = router;
