const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// Allowed tables for export / search
const TABLES = {
  ui_users: { cols: ['id','name','email','role','persona','interface_layout','theme','density','active_since','session_count','satisfaction_score'], search: ['name','email','role','persona'] },
  templates: { cols: ['id','name','description','layout','target_persona','primary_color','density','widgets_json','usage_count','rating','created_at'], search: ['name','description','layout','target_persona'] },
  widgets: { cols: ['id','name','type','description','data_source','config_schema','category','popularity'], search: ['name','description','data_source','category'] },
  ui_sessions: { cols: ['id','ui_user_id','started_at','ended_at','duration_mins','layout_used','actions_count','satisfaction_rating','device_type'], search: ['layout_used','device_type'] },
  customizations: { cols: ['id','ui_user_id','config_name','config_json','is_active','created_at','last_used','description'], search: ['config_name','description'] },
  feedback: { cols: ['id','ui_user_id','template_id','rating','category','comments','submitted_at','status'], search: ['category','comments','status'] }
};

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  let s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (s.includes('"')) s = s.replace(/"/g, '""');
  if (/[",\n\r]/.test(s)) s = `"${s}"`;
  return s;
}

// 6. CSV Export
router.get('/export/:table', verifyToken, async (req, res) => {
  try {
    const meta = TABLES[req.params.table];
    if (!meta) return res.status(400).json({ error: 'Unknown table' });
    const r = await pool.query(`SELECT ${meta.cols.join(',')} FROM ${req.params.table} ORDER BY id`);
    const header = meta.cols.join(',');
    const lines = r.rows.map(row => meta.cols.map(c => csvEscape(row[c])).join(','));
    const csv = [header, ...lines].join('\n');
    try {
      await pool.query('INSERT INTO audit_log (user_id, action, target, payload) VALUES ($1,$2,$3,$4)',
        [req.user.id, 'export.csv', req.params.table, JSON.stringify({ rows: r.rows.length })]);
    } catch (_) {}
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.table}.csv"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. Global search + filter across known tables
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q, table, limit } = req.query;
    if (!q || !q.trim()) return res.json({ results: [] });
    const lim = Math.min(parseInt(limit) || 25, 100);
    const targets = table && TABLES[table] ? [table] : Object.keys(TABLES);
    const out = [];
    for (const t of targets) {
      const meta = TABLES[t];
      const conds = meta.search.map((c, i) => `${c}::text ILIKE $1`).join(' OR ');
      const sql = `SELECT ${meta.cols.join(',')} FROM ${t} WHERE ${conds} LIMIT ${lim}`;
      try {
        const r = await pool.query(sql, [`%${q}%`]);
        r.rows.forEach(row => out.push({ table: t, row }));
      } catch (_) { /* skip table on error */ }
    }
    try {
      await pool.query('INSERT INTO audit_log (user_id, action, target, payload) VALUES ($1,$2,$3,$4)',
        [req.user.id, 'search', table || 'all', JSON.stringify({ q, count: out.length })]);
    } catch (_) {}
    res.json({ results: out, total: out.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 8. Audit Log
router.get('/audit-log', verifyToken, async (req, res) => {
  try {
    const { action, target, limit } = req.query;
    const lim = Math.min(parseInt(limit) || 100, 500);
    const params = [];
    let where = ' WHERE 1=1';
    if (action) { params.push(`%${action}%`); where += ` AND action ILIKE $${params.length}`; }
    if (target) { params.push(`%${target}%`); where += ` AND target ILIKE $${params.length}`; }
    const r = await pool.query(
      `SELECT a.id, a.user_id, u.email AS user_email, a.action, a.target, a.payload, a.created_at
       FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ${where}
       ORDER BY a.created_at DESC LIMIT ${lim}`, params
    );
    res.json(r.rows);
  } catch (err) {
    if (/relation .* does not exist/i.test(err.message)) {
      return res.status(503).json({ error: 'audit_log table missing — run schema.sql' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/audit-log', verifyToken, async (req, res) => {
  try {
    const { action, target, payload } = req.body;
    if (!action) return res.status(400).json({ error: 'action required' });
    const r = await pool.query(
      'INSERT INTO audit_log (user_id, action, target, payload) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, action, target || null, payload ? JSON.stringify(payload).slice(0, 4000) : null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
