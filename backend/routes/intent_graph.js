// Deep feature: Intent Graph
// Nodes = what the user is trying to accomplish (NOT screens).
// Edges = observed transitions / refinements between intents.
// Powers the "morphing UI" runtime: each intent maps to expected components.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// LIST nodes with optional filtering, joins child counts + outgoing edge degree.
router.get('/nodes', async (req, res) => {
  try {
    const { search, category } = req.query;
    const params = [];
    let where = '1=1';
    if (search) { params.push(`%${search}%`); where += ` AND (label ILIKE $${params.length} OR description ILIKE $${params.length} OR signal_keywords ILIKE $${params.length})`; }
    if (category) { params.push(category); where += ` AND category = $${params.length}`; }
    const q = `
      SELECT n.*,
        (SELECT COUNT(*)::int FROM intent_edges e WHERE e.from_intent_id = n.id) AS out_degree,
        (SELECT COUNT(*)::int FROM intent_edges e WHERE e.to_intent_id = n.id) AS in_degree,
        (SELECT COUNT(*)::int FROM intent_nodes c WHERE c.parent_id = n.id) AS child_count,
        (SELECT COUNT(*)::int FROM layout_variants v WHERE v.intent_id = n.id AND v.is_active = true) AS variant_count
      FROM intent_nodes n
      WHERE ${where}
      ORDER BY trigger_count DESC, n.id ASC`;
    const r = await pool.query(q, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SINGLE node + outgoing/incoming edges + recent generations.
router.get('/nodes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const node = await pool.query('SELECT * FROM intent_nodes WHERE id=$1', [id]);
    if (!node.rows.length) return res.status(404).json({ error: 'Not found' });
    const outgoing = await pool.query(
      `SELECT e.*, n.label AS to_label, n.slug AS to_slug
       FROM intent_edges e JOIN intent_nodes n ON n.id = e.to_intent_id
       WHERE e.from_intent_id = $1 ORDER BY e.transition_count DESC`, [id]);
    const incoming = await pool.query(
      `SELECT e.*, n.label AS from_label, n.slug AS from_slug
       FROM intent_edges e JOIN intent_nodes n ON n.id = e.from_intent_id
       WHERE e.to_intent_id = $1 ORDER BY e.transition_count DESC`, [id]);
    const variants = await pool.query(
      'SELECT id, variant_key, hypothesis, is_control, traffic_pct, is_active FROM layout_variants WHERE intent_id=$1 ORDER BY is_control DESC, variant_key',
      [id]);
    const runs = await pool.query(
      `SELECT id, model, sdk, componentbench_score, swebench_style_score, a11y_score, status, created_at
       FROM ui_generation_runs WHERE intent_id=$1 ORDER BY created_at DESC LIMIT 8`, [id]);
    res.json({ node: node.rows[0], outgoing: outgoing.rows, incoming: incoming.rows, variants: variants.rows, runs: runs.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Full graph for visualization (nodes + edges).
router.get('/graph', async (req, res) => {
  try {
    const n = await pool.query('SELECT id, slug, label, category, trigger_count, success_rate, parent_id FROM intent_nodes ORDER BY id');
    const e = await pool.query('SELECT id, from_intent_id, to_intent_id, edge_type, transition_count, avg_dwell_ms FROM intent_edges ORDER BY transition_count DESC');
    res.json({ nodes: n.rows, edges: e.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE node.
router.post('/nodes', async (req, res) => {
  try {
    const { slug, label, description, category, parent_id, signal_keywords, expected_components } = req.body;
    if (!slug || !label) return res.status(400).json({ error: 'slug and label required' });
    const r = await pool.query(
      `INSERT INTO intent_nodes (slug, label, description, category, parent_id, signal_keywords, expected_components)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [slug, label, description || null, category || null, parent_id || null, signal_keywords || null, expected_components || null]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// UPDATE node.
router.put('/nodes/:id', async (req, res) => {
  try {
    const { label, description, category, parent_id, signal_keywords, expected_components } = req.body;
    const r = await pool.query(
      `UPDATE intent_nodes SET label=$1, description=$2, category=$3, parent_id=$4, signal_keywords=$5, expected_components=$6
       WHERE id=$7 RETURNING *`,
      [label, description, category, parent_id || null, signal_keywords, expected_components, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Record an observed trigger of an intent (for runtime telemetry).
router.post('/nodes/:id/trigger', async (req, res) => {
  try {
    const { success, completion_ms } = req.body || {};
    const id = parseInt(req.params.id, 10);
    const cur = await pool.query('SELECT trigger_count, success_rate, median_completion_ms FROM intent_nodes WHERE id=$1', [id]);
    if (!cur.rows.length) return res.status(404).json({ error: 'Not found' });
    const old = cur.rows[0];
    const newCount = (old.trigger_count || 0) + 1;
    const oldSucc = Number(old.success_rate) || 0;
    const succObs = success === true ? 1 : success === false ? 0 : oldSucc;
    const newSucc = (oldSucc * (newCount - 1) + succObs) / newCount;
    const newMed = completion_ms ? Math.round(((old.median_completion_ms || 0) + completion_ms) / 2) : old.median_completion_ms;
    const r = await pool.query(
      'UPDATE intent_nodes SET trigger_count=$1, success_rate=$2, median_completion_ms=$3 WHERE id=$4 RETURNING *',
      [newCount, newSucc, newMed, id]);
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// EDGE create.
router.post('/edges', async (req, res) => {
  try {
    const { from_intent_id, to_intent_id, edge_type } = req.body;
    if (!from_intent_id || !to_intent_id) return res.status(400).json({ error: 'from_intent_id and to_intent_id required' });
    const r = await pool.query(
      'INSERT INTO intent_edges (from_intent_id, to_intent_id, edge_type) VALUES ($1,$2,$3) RETURNING *',
      [from_intent_id, to_intent_id, edge_type || 'follows']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE node (cascade clears edges).
router.delete('/nodes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM intent_nodes WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Category roll-up for dashboard widgets.
router.get('/categories', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT category,
        COUNT(*)::int AS node_count,
        SUM(trigger_count)::int AS total_triggers,
        ROUND(AVG(success_rate)::numeric, 3) AS avg_success_rate,
        ROUND(AVG(median_completion_ms)::numeric, 0) AS avg_completion_ms
      FROM intent_nodes
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY total_triggers DESC NULLS LAST`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
