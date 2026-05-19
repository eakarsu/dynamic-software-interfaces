// Deep feature: Design Tokens (Tailwind / Radix / shadcn naming)
// Three-tier tokens (primitive -> semantic -> component) with dark-mode
// overrides; supports CSS-variable export, Tailwind-config export, and JSON.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// LIST tokens
router.get('/', async (req, res) => {
  try {
    const { search, category, tier, source } = req.query;
    const params = [];
    let where = '1=1';
    if (search) { params.push(`%${search}%`); where += ` AND (token_key ILIKE $${params.length} OR description ILIKE $${params.length})`; }
    if (category) { params.push(category); where += ` AND category = $${params.length}`; }
    if (tier)     { params.push(tier);     where += ` AND tier = $${params.length}`; }
    if (source)   { params.push(source);   where += ` AND source = $${params.length}`; }
    const r = await pool.query(`SELECT * FROM design_tokens WHERE ${where} ORDER BY category, tier, token_key`, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM design_tokens WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    // resolve references
    const t = r.rows[0];
    let resolved = t.token_value;
    if (t.ref_token_key) {
      const ref = await pool.query('SELECT token_value FROM design_tokens WHERE token_key=$1', [t.ref_token_key]);
      if (ref.rows.length) resolved = ref.rows[0].token_value;
    }
    res.json({ ...t, resolved_value: resolved });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { token_key, token_value, category, tier, ref_token_key, source, description, dark_mode_value } = req.body;
    if (!token_key || !token_value) return res.status(400).json({ error: 'token_key and token_value required' });
    const r = await pool.query(
      `INSERT INTO design_tokens (token_key, token_value, category, tier, ref_token_key, source, description, dark_mode_value)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [token_key, token_value, category || null, tier || 'primitive', ref_token_key || null,
       source || 'custom', description || null, dark_mode_value || null]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { token_value, category, tier, ref_token_key, source, description, dark_mode_value } = req.body;
    const r = await pool.query(
      `UPDATE design_tokens SET token_value=$1, category=$2, tier=$3, ref_token_key=$4,
         source=$5, description=$6, dark_mode_value=$7 WHERE id=$8 RETURNING *`,
      [token_value, category, tier, ref_token_key, source, description, dark_mode_value, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM design_tokens WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// EXPORT as CSS variables (with :root and .dark blocks).
router.get('/export/css', async (_req, res) => {
  try {
    const r = await pool.query('SELECT token_key, token_value, dark_mode_value FROM design_tokens ORDER BY token_key');
    const toVar = k => '--' + k.replace(/\./g, '-');
    const lines = [':root {'];
    r.rows.forEach(t => lines.push(`  ${toVar(t.token_key)}: ${t.token_value};`));
    lines.push('}');
    lines.push('.dark {');
    r.rows.forEach(t => { if (t.dark_mode_value) lines.push(`  ${toVar(t.token_key)}: ${t.dark_mode_value};`); });
    lines.push('}');
    res.type('text/css').send(lines.join('\n'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// EXPORT as Tailwind config snippet.
router.get('/export/tailwind', async (_req, res) => {
  try {
    const r = await pool.query("SELECT token_key, token_value FROM design_tokens WHERE category='color' ORDER BY token_key");
    const colors = {};
    r.rows.forEach(t => {
      const parts = t.token_key.split('.'); // e.g. color.brand.500
      if (parts[0] !== 'color') return;
      const family = parts[1] || 'misc';
      const shade = parts[2] || 'DEFAULT';
      colors[family] = colors[family] || {};
      colors[family][shade] = t.token_value;
    });
    const cfg = { theme: { extend: { colors } } };
    res.type('application/json').send(JSON.stringify(cfg, null, 2));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// EXPORT as JSON (full set).
router.get('/export/json', async (_req, res) => {
  try {
    const r = await pool.query('SELECT * FROM design_tokens ORDER BY category, tier, token_key');
    res.json({ count: r.rows.length, tokens: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Roll-up stats by category and tier.
router.get('/_stats/summary', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT category, tier, COUNT(*)::int AS n,
        SUM(CASE WHEN dark_mode_value IS NOT NULL THEN 1 ELSE 0 END)::int AS dark_override_count
      FROM design_tokens GROUP BY category, tier ORDER BY category, tier`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
