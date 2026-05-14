// Deep feature: Component Registry
// Library of real component primitives (shadcn / Radix / AG Grid / Recharts / Tremor / Tiptap / Monaco)
// that the LLM-driven layout selector picks from at runtime. Each entry tracks
// prop schema, default props, RSC support, bundle size, a11y role, usage.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// LIST primitives with filters; computes usage from ui_generation_runs JSON.
router.get('/', async (req, res) => {
  try {
    const { search, library, category, rsc } = req.query;
    const params = [];
    let where = '1=1';
    if (search) { params.push(`%${search}%`); where += ` AND (slug ILIKE $${params.length} OR display_name ILIKE $${params.length} OR description ILIKE $${params.length})`; }
    if (library) { params.push(library); where += ` AND library = $${params.length}`; }
    if (category) { params.push(category); where += ` AND category = $${params.length}`; }
    if (rsc === 'true') where += ' AND supports_rsc = true';
    if (rsc === 'false') where += ' AND supports_rsc = false';
    const r = await pool.query(
      `SELECT id, slug, display_name, library, category, description, default_props, docs_url,
              supports_rsc, a11y_role, bundle_kb, usage_count
       FROM component_primitives WHERE ${where}
       ORDER BY usage_count DESC, display_name ASC`, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single primitive (with prop_schema + example).
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM component_primitives WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    // join: which intents declare this primitive in expected_components
    const intents = await pool.query(
      `SELECT id, slug, label, category FROM intent_nodes
       WHERE expected_components ILIKE $1 ORDER BY trigger_count DESC LIMIT 25`,
      [`%${r.rows[0].slug}%`]);
    // Recent runs that used this primitive
    const runs = await pool.query(
      `SELECT id, model, sdk, componentbench_score, a11y_score, status, created_at
       FROM ui_generation_runs
       WHERE primitives_used::text ILIKE $1
       ORDER BY created_at DESC LIMIT 8`,
      [`%${r.rows[0].slug}%`]);
    res.json({ primitive: r.rows[0], used_by_intents: intents.rows, recent_runs: runs.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { slug, display_name, library, category, description, prop_schema, default_props,
            example_jsx, docs_url, supports_rsc, a11y_role, bundle_kb } = req.body;
    if (!slug || !display_name) return res.status(400).json({ error: 'slug and display_name required' });
    const r = await pool.query(
      `INSERT INTO component_primitives
       (slug, display_name, library, category, description, prop_schema, default_props,
        example_jsx, docs_url, supports_rsc, a11y_role, bundle_kb)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [slug, display_name, library || null, category || null, description || null,
       prop_schema || null, default_props || null, example_jsx || null, docs_url || null,
       supports_rsc !== false, a11y_role || null, bundle_kb || null]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { display_name, library, category, description, prop_schema, default_props,
            example_jsx, docs_url, supports_rsc, a11y_role, bundle_kb } = req.body;
    const r = await pool.query(
      `UPDATE component_primitives SET
         display_name=$1, library=$2, category=$3, description=$4, prop_schema=$5,
         default_props=$6, example_jsx=$7, docs_url=$8, supports_rsc=$9,
         a11y_role=$10, bundle_kb=$11
       WHERE id=$12 RETURNING *`,
      [display_name, library, category, description, prop_schema, default_props,
       example_jsx, docs_url, supports_rsc, a11y_role, bundle_kb, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM component_primitives WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Resolve a list of slugs (used by the runtime layout renderer).
router.post('/resolve', async (req, res) => {
  try {
    const slugs = Array.isArray(req.body?.slugs) ? req.body.slugs : [];
    if (!slugs.length) return res.json([]);
    const r = await pool.query(
      'SELECT slug, display_name, library, category, default_props, example_jsx, supports_rsc, bundle_kb FROM component_primitives WHERE slug = ANY($1)',
      [slugs]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Roll-ups: stats per library + total bundle size if all included.
router.get('/_stats/by-library', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT library,
        COUNT(*)::int AS component_count,
        ROUND(AVG(bundle_kb)::numeric, 2) AS avg_bundle_kb,
        SUM(bundle_kb)::numeric AS total_bundle_kb,
        SUM(usage_count)::int AS total_usage,
        SUM(CASE WHEN supports_rsc THEN 1 ELSE 0 END)::int AS rsc_supported
      FROM component_primitives
      WHERE library IS NOT NULL
      GROUP BY library
      ORDER BY total_usage DESC NULLS LAST`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
