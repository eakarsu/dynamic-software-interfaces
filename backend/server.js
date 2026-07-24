require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const pool = require('./db');
const path = require('node:path');
const { verifyToken } = require('./middleware/auth');

const app = express();
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin(origin, callback) {
  const allowed = process.env.FRONTEND_ORIGIN;
  if (!origin || origin === allowed) return callback(null, true);
  callback(new Error('Origin not allowed'));
}, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE'] }));
app.use(express.json({ limit: '256kb', type: 'application/json' }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== process.env.FRONTEND_ORIGIN) return res.status(403).json({ error: 'Origin rejected' });
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ready' }); }
  catch { res.status(503).json({ status: 'unavailable' }); }
});
app.use('/api', verifyToken);
app.use('/api/connectors', require('./routes/connectors'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/runtime-ai', require('./routes/runtimeAi'));
if (process.env.NODE_ENV === 'production') {
  const frontend = process.env.FRONTEND_DIST || path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontend, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(frontend, 'index.html')));
}
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((error, _req, res, _next) => {
  const status = Number(error.status) || (error.name === 'ZodError' ? 400 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'Internal service error' : error.message });
});

if (require.main === module) {
  const port = Number(process.env.BACKEND_PORT);
  const host = process.env.BACKEND_HOST;
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || host !== '127.0.0.1') throw new Error('BACKEND_PORT and BACKEND_HOST=127.0.0.1 are required');
  app.listen(port, host, () => console.log(`Dynamic UI platform listening on http://${host}:${port}`));
}
module.exports = app;
