// Deep feature: Layout Variants + A/B Telemetry
// Per-intent layout variants (Vercel AI SDK generative-UI style) with traffic
// allocation, conversion-lift telemetry and time-to-first-action measurement.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// LIST variants with rolled-up telemetry (last 14 days).
router.get('/', async (req, res) => {
  try {
    const { intent_id, active } = req.query;
    const params = [];
    let where = '1=1';
    if (intent_id) { params.push(intent_id); where += ` AND v.intent_id = $${params.length}`; }
    if (active === 'true') where += ' AND v.is_active = true';
    const q = `
      SELECT v.*, n.label AS intent_label, n.slug AS intent_slug,
        COALESCE(t.impressions, 0) AS impressions,
        COALESCE(t.task_completions, 0) AS task_completions,
        COALESCE(t.conversions, 0) AS conversions,
        COALESCE(t.bounce_count, 0) AS bounce_count,
        COALESCE(t.avg_completion_ms, 0) AS avg_completion_ms,
        COALESCE(t.avg_ttfa_ms, 0) AS avg_ttfa_ms
      FROM layout_variants v
      LEFT JOIN intent_nodes n ON n.id = v.intent_id
      LEFT JOIN (
        SELECT variant_id,
          SUM(impressions)::int AS impressions,
          SUM(task_completions)::int AS task_completions,
          SUM(conversions)::int AS conversions,
          SUM(bounce_count)::int AS bounce_count,
          ROUND(AVG(avg_task_completion_ms)::numeric, 0) AS avg_completion_ms,
          ROUND(AVG(avg_time_to_first_action_ms)::numeric, 0) AS avg_ttfa_ms
        FROM variant_telemetry
        WHERE recorded_for >= CURRENT_DATE - INTERVAL '14 days'
        GROUP BY variant_id
      ) t ON t.variant_id = v.id
      WHERE ${where}
      ORDER BY v.intent_id, v.is_control DESC, v.variant_key`;
    const r = await pool.query(q, params);
    // Compute conversion lift vs control (per-intent).
    const grouped = {};
    r.rows.forEach(row => {
      if (!grouped[row.intent_id]) grouped[row.intent_id] = [];
      grouped[row.intent_id].push(row);
    });
    Object.values(grouped).forEach(rows => {
      const control = rows.find(v => v.is_control) || rows[0];
      const baseRate = (control.impressions || 0) > 0 ? (control.conversions || 0) / control.impressions : 0;
      rows.forEach(row => {
        const rate = row.impressions > 0 ? row.conversions / row.impressions : 0;
        row.conversion_rate = Number(rate.toFixed(4));
        row.conversion_lift_pct = baseRate > 0 ? Number((((rate - baseRate) / baseRate) * 100).toFixed(2)) : null;
      });
    });
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Variant detail incl. day-by-day telemetry.
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const v = await pool.query(
      `SELECT v.*, n.label AS intent_label, n.slug AS intent_slug
       FROM layout_variants v LEFT JOIN intent_nodes n ON n.id=v.intent_id
       WHERE v.id=$1`, [id]);
    if (!v.rows.length) return res.status(404).json({ error: 'Not found' });
    const series = await pool.query(
      `SELECT recorded_for, SUM(impressions)::int AS impressions,
         SUM(task_completions)::int AS task_completions,
         SUM(conversions)::int AS conversions,
         SUM(bounce_count)::int AS bounce_count,
         ROUND(AVG(avg_task_completion_ms)::numeric,0) AS avg_completion_ms,
         ROUND(AVG(avg_time_to_first_action_ms)::numeric,0) AS avg_ttfa_ms
       FROM variant_telemetry WHERE variant_id=$1
       GROUP BY recorded_for ORDER BY recorded_for DESC LIMIT 30`, [id]);
    res.json({ variant: v.rows[0], series: series.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE variant.
router.post('/', async (req, res) => {
  try {
    const { intent_id, variant_key, hypothesis, primitives_json, layout_json,
            copy_tone, density, is_control, is_active, traffic_pct } = req.body;
    if (!intent_id || !variant_key) return res.status(400).json({ error: 'intent_id and variant_key required' });
    const r = await pool.query(
      `INSERT INTO layout_variants
       (intent_id, variant_key, hypothesis, primitives_json, layout_json, copy_tone, density, is_control, is_active, traffic_pct)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [intent_id, variant_key, hypothesis || null, primitives_json || null, layout_json || null,
       copy_tone || 'terse', density || 'compact', !!is_control, is_active !== false, traffic_pct || 0]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { hypothesis, primitives_json, layout_json, copy_tone, density,
            is_control, is_active, traffic_pct } = req.body;
    const r = await pool.query(
      `UPDATE layout_variants SET hypothesis=$1, primitives_json=$2, layout_json=$3,
         copy_tone=$4, density=$5, is_control=$6, is_active=$7, traffic_pct=$8
       WHERE id=$9 RETURNING *`,
      [hypothesis, primitives_json, layout_json, copy_tone, density,
       !!is_control, !!is_active, traffic_pct || 0, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM layout_variants WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Pick a variant for an intent based on traffic_pct (server-side weighted random).
router.post('/pick', async (req, res) => {
  try {
    const { intent_id } = req.body;
    if (!intent_id) return res.status(400).json({ error: 'intent_id required' });
    const r = await pool.query(
      'SELECT * FROM layout_variants WHERE intent_id=$1 AND is_active=true',
      [intent_id]);
    const variants = r.rows;
    if (!variants.length) return res.status(404).json({ error: 'no active variants' });
    const totalPct = variants.reduce((s, v) => s + (v.traffic_pct || 0), 0) || variants.length;
    let pick = Math.random() * totalPct;
    let picked = variants[0];
    for (const v of variants) {
      pick -= (v.traffic_pct || 1);
      if (pick <= 0) { picked = v; break; }
    }
    res.json({ picked, considered: variants.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Record telemetry for a variant.
router.post('/:id/telemetry', async (req, res) => {
  try {
    const { ui_user_id, impressions, task_completions, conversions, bounce_count,
            avg_time_to_first_action_ms, avg_task_completion_ms } = req.body || {};
    const r = await pool.query(
      `INSERT INTO variant_telemetry
       (variant_id, ui_user_id, impressions, task_completions, conversions, bounce_count,
        avg_time_to_first_action_ms, avg_task_completion_ms, recorded_for)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_DATE) RETURNING *`,
      [req.params.id, ui_user_id || null, impressions || 0, task_completions || 0,
       conversions || 0, bounce_count || 0, avg_time_to_first_action_ms || 0,
       avg_task_completion_ms || 0]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
