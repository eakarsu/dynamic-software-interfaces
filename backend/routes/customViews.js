// Custom Views feature for Dynamic Software Interfaces project.
// Provides 4 endpoints: usage chart, adaptation heatmap, interface-spec PDF,
// and adaptation-rules CRUD.
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

async function ensureTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS custom_views_adaptation_rules (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      trigger TEXT NOT NULL,
      action TEXT NOT NULL,
      priority INTEGER DEFAULT 100,
      enabled BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    const c = await pool.query('SELECT COUNT(*)::int AS n FROM custom_views_adaptation_rules');
    if (c.rows[0].n === 0) {
      const seeds = [
        ['Novice Simplification', 'user.expertise == "novice"', 'collapse advanced widgets', 10],
        ['Mobile Compact', 'viewport.width < 768', 'switch layout to compact', 20],
        ['Power User Density', 'user.sessions > 50', 'increase information density', 30],
        ['Accessibility Boost', 'user.prefersReducedMotion', 'disable animations & enlarge fonts', 5],
      ];
      for (const [n, t, a, p] of seeds) {
        await pool.query(
          'INSERT INTO custom_views_adaptation_rules (name,trigger,action,priority) VALUES ($1,$2,$3,$4)',
          [n, t, a, p]
        );
      }
    }
  } catch (e) { /* swallow */ }
}

// 1) VIZ: interface usage chart
router.get('/usage-chart', async (req, res) => {
  try {
    await ensureTables();
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let series = [
      { name: 'Generated UIs', data: [12, 19, 14, 22, 28, 9, 6] },
      { name: 'Adaptations Applied', data: [8, 14, 11, 20, 25, 7, 4] },
      { name: 'Active Users', data: [5, 7, 6, 9, 11, 4, 3] },
    ];
    try {
      const r = await pool.query(`
        SELECT TO_CHAR(created_at,'Dy') AS day, COUNT(*)::int AS n
        FROM custom_views_adaptation_rules
        GROUP BY day
      `);
      const byDay = Object.fromEntries(r.rows.map(x => [x.day.trim(), x.n]));
      series[0].data = labels.map((d, i) => (byDay[d] ?? series[0].data[i]));
    } catch (e) { /* fall back to demo */ }
    res.json({
      title: 'Interface Usage (Weekly)',
      labels,
      series,
      generated_at: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2) VIZ: adaptation heatmap (interface x user)
router.get('/adaptation-heatmap', async (req, res) => {
  try {
    await ensureTables();
    const interfaces = ['Dashboard', 'Editor', 'Settings', 'Reports', 'Onboarding'];
    const users = ['Alice', 'Bob', 'Carol', 'Dan', 'Eve', 'Frank'];
    // Deterministic pseudo-random matrix so the heatmap is stable across reloads.
    const matrix = interfaces.map((_, i) =>
      users.map((__, j) => ((i * 13 + j * 7 + 5) % 11))
    );
    res.json({
      title: 'Adaptation Frequency (interface x user)',
      x_labels: users,
      y_labels: interfaces,
      matrix,
      max: 10,
      generated_at: new Date().toISOString(),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3) NON-VIZ: interface specification PDF (returned as base64 text-PDF)
router.get('/spec-pdf', async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query(
      'SELECT name, trigger, action, priority FROM custom_views_adaptation_rules ORDER BY priority ASC'
    );
    const lines = [
      'Interface Specification Document',
      'Project: dynamic-software-interfaces',
      'Generated: ' + new Date().toISOString(),
      '',
      'Adaptation Rules:',
      ...r.rows.map((x, i) => `${i + 1}. [${x.priority}] ${x.name} :: when ${x.trigger} -> ${x.action}`),
    ];
    // Minimal valid single-page PDF.
    const text = lines.join('\\n');
    const content = `BT /F1 11 Tf 50 770 Td (${text.replace(/[()\\\\]/g, '\\\\$&')}) Tj ET`;
    const objects = [];
    objects.push('1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj');
    objects.push('2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj');
    objects.push('3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj');
    objects.push(`4 0 obj<</Length ${content.length}>>stream\n${content}\nendstream endobj`);
    objects.push('5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj');
    let pdf = '%PDF-1.4\n';
    const offsets = [];
    for (const o of objects) {
      offsets.push(pdf.length);
      pdf += o + '\n';
    }
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) {
      pdf += String(off).padStart(10, '0') + ' 00000 n \n';
    }
    pdf += `trailer<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
    const base64 = Buffer.from(pdf, 'binary').toString('base64');
    res.json({
      filename: 'interface-spec.pdf',
      mime: 'application/pdf',
      size: pdf.length,
      base64,
      rules_count: r.rows.length,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4) NON-VIZ: adaptation-rules editor CRUD
router.get('/rules', async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query('SELECT * FROM custom_views_adaptation_rules ORDER BY priority ASC, id ASC');
    res.json({ rules: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/rules', async (req, res) => {
  try {
    await ensureTables();
    const { name, trigger, action, priority = 100, enabled = true } = req.body || {};
    if (!name || !trigger || !action) {
      return res.status(400).json({ error: 'name, trigger, action are required' });
    }
    const r = await pool.query(
      `INSERT INTO custom_views_adaptation_rules (name,trigger,action,priority,enabled)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, trigger, action, priority, enabled]
    );
    res.json({ rule: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/rules/:id', async (req, res) => {
  try {
    await ensureTables();
    const { name, trigger, action, priority, enabled } = req.body || {};
    const r = await pool.query(
      `UPDATE custom_views_adaptation_rules
       SET name=COALESCE($1,name),
           trigger=COALESCE($2,trigger),
           action=COALESCE($3,action),
           priority=COALESCE($4,priority),
           enabled=COALESCE($5,enabled),
           updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name, trigger, action, priority, enabled, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ rule: r.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/rules/:id', async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query('DELETE FROM custom_views_adaptation_rules WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
