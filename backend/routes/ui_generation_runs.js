// Deep feature: UI Generation Runs
// History of generative-UI runs with benchmark-style quality metrics
// (HumanEval pass / ComponentBench score / SWE-bench-style integrated-task score / axe-core a11y score)
// keyed to model + SDK (Vercel AI SDK / Anthropic SDK / OpenRouter) and intent.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// LIST runs with filters & joins.
router.get('/', async (req, res) => {
  try {
    const { intent_id, model, sdk, status, min_score } = req.query;
    const params = [];
    let where = '1=1';
    if (intent_id) { params.push(intent_id); where += ` AND r.intent_id = $${params.length}`; }
    if (model)     { params.push(model);     where += ` AND r.model = $${params.length}`; }
    if (sdk)       { params.push(sdk);       where += ` AND r.sdk = $${params.length}`; }
    if (status)    { params.push(status);    where += ` AND r.status = $${params.length}`; }
    if (min_score) { params.push(min_score); where += ` AND r.componentbench_score >= $${params.length}`; }
    const r = await pool.query(`
      SELECT r.id, r.intent_id, r.ui_user_id, r.model, r.sdk, r.prompt,
        r.tokens_in, r.tokens_out, r.latency_ms, r.cost_usd,
        r.humaneval_pass, r.componentbench_score, r.swebench_style_score, r.a11y_score,
        r.status, r.created_at,
        n.label AS intent_label, n.slug AS intent_slug,
        u.name AS ui_user_name
      FROM ui_generation_runs r
      LEFT JOIN intent_nodes n ON n.id = r.intent_id
      LEFT JOIN ui_users u ON u.id = r.ui_user_id
      WHERE ${where}
      ORDER BY r.created_at DESC LIMIT 200`, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Detail run including JSX + primitives.
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT r.*, n.label AS intent_label, n.slug AS intent_slug, u.name AS ui_user_name
      FROM ui_generation_runs r
      LEFT JOIN intent_nodes n ON n.id = r.intent_id
      LEFT JOIN ui_users u ON u.id = r.ui_user_id
      WHERE r.id=$1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Insert a run (called by AI generators).
router.post('/', async (req, res) => {
  try {
    const {
      intent_id, ui_user_id, model, sdk, prompt, generated_jsx,
      primitives_used, tokens_in, tokens_out, latency_ms, cost_usd,
      humaneval_pass, componentbench_score, swebench_style_score, a11y_score, status
    } = req.body;
    const r = await pool.query(
      `INSERT INTO ui_generation_runs
       (intent_id, ui_user_id, model, sdk, prompt, generated_jsx, primitives_used,
        tokens_in, tokens_out, latency_ms, cost_usd,
        humaneval_pass, componentbench_score, swebench_style_score, a11y_score, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [intent_id || null, ui_user_id || null, model || null, sdk || null,
       prompt || null, generated_jsx || null, primitives_used || null,
       tokens_in || 0, tokens_out || 0, latency_ms || 0, cost_usd || 0,
       !!humaneval_pass, componentbench_score || null, swebench_style_score || null,
       a11y_score || null, status || 'success']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Aggregate leaderboard: per-model averages on benchmark metrics.
router.get('/_leaderboard/models', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT model, sdk,
        COUNT(*)::int AS runs,
        ROUND(AVG(componentbench_score)::numeric, 3) AS avg_componentbench,
        ROUND(AVG(swebench_style_score)::numeric, 3) AS avg_swebench_style,
        ROUND(AVG(a11y_score)::numeric, 3) AS avg_a11y,
        ROUND(AVG(latency_ms)::numeric, 0) AS avg_latency_ms,
        ROUND(AVG(cost_usd)::numeric, 5) AS avg_cost_usd,
        ROUND(100.0 * SUM(CASE WHEN humaneval_pass THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 1) AS humaneval_pass_pct
      FROM ui_generation_runs
      WHERE model IS NOT NULL
      GROUP BY model, sdk
      ORDER BY avg_componentbench DESC NULLS LAST`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Aggregate: per-intent generation success.
router.get('/_leaderboard/intents', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT n.id, n.slug, n.label,
        COUNT(r.id)::int AS runs,
        ROUND(AVG(r.componentbench_score)::numeric, 3) AS avg_componentbench,
        ROUND(AVG(r.a11y_score)::numeric, 3) AS avg_a11y,
        ROUND(100.0 * SUM(CASE WHEN r.humaneval_pass THEN 1 ELSE 0 END) / NULLIF(COUNT(r.id),0), 1) AS humaneval_pass_pct
      FROM intent_nodes n
      LEFT JOIN ui_generation_runs r ON r.intent_id = n.id
      GROUP BY n.id, n.slug, n.label
      HAVING COUNT(r.id) > 0
      ORDER BY runs DESC NULLS LAST`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
