// Deep feature: Intent Classifier (few-shot, structured-output)
// Manages the labeled example set used to classify utterances -> intent slug
// via a structured-output prompt. Provides a /classify endpoint that returns
// {intent_slug, confidence, params} given an utterance + recent context.
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// LIST examples
router.get('/examples', async (req, res) => {
  try {
    const { intent_id, split, search } = req.query;
    const params = [];
    let where = '1=1';
    if (intent_id) { params.push(intent_id); where += ` AND e.intent_id = $${params.length}`; }
    if (split)     { params.push(split);     where += ` AND e.split = $${params.length}`; }
    if (search)    { params.push(`%${search}%`); where += ` AND e.utterance ILIKE $${params.length}`; }
    const r = await pool.query(`
      SELECT e.id, e.intent_id, e.utterance, e.context_json, e.expected_output, e.split,
             e.confidence_observed, e.is_correct, e.created_at,
             n.slug AS intent_slug, n.label AS intent_label
      FROM intent_classifier_examples e
      LEFT JOIN intent_nodes n ON n.id = e.intent_id
      WHERE ${where}
      ORDER BY e.id DESC LIMIT 200`, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Single example.
router.get('/examples/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT e.*, n.slug AS intent_slug, n.label AS intent_label
       FROM intent_classifier_examples e LEFT JOIN intent_nodes n ON n.id=e.intent_id
       WHERE e.id=$1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create example.
router.post('/examples', async (req, res) => {
  try {
    const { intent_id, utterance, context_json, expected_output, split } = req.body;
    if (!intent_id || !utterance) return res.status(400).json({ error: 'intent_id and utterance required' });
    const r = await pool.query(
      `INSERT INTO intent_classifier_examples
       (intent_id, utterance, context_json, expected_output, split)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [intent_id, utterance, context_json || null, expected_output || null, split || 'train']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/examples/:id', async (req, res) => {
  try {
    const { utterance, context_json, expected_output, split, is_correct, confidence_observed } = req.body;
    const r = await pool.query(
      `UPDATE intent_classifier_examples SET utterance=$1, context_json=$2, expected_output=$3,
         split=$4, is_correct=$5, confidence_observed=$6
       WHERE id=$7 RETURNING *`,
      [utterance, context_json, expected_output, split, is_correct, confidence_observed, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/examples/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM intent_classifier_examples WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CLASSIFY: keyword-overlap baseline (deterministic, no key needed) +
// optional OpenRouter structured-output call. Returns the top-K intents.
router.post('/classify', async (req, res) => {
  try {
    const { utterance, context, top_k } = req.body || {};
    if (!utterance) return res.status(400).json({ error: 'utterance required' });
    const k = Math.min(5, Math.max(1, parseInt(top_k, 10) || 3));
    const nodes = await pool.query('SELECT id, slug, label, category, signal_keywords, expected_components FROM intent_nodes');
    const u = String(utterance).toLowerCase();
    const scored = nodes.rows.map(n => {
      const kws = String(n.signal_keywords || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
      let hits = 0;
      kws.forEach(kw => { if (kw && u.includes(kw)) hits += 1; });
      // label/slug fuzzy bonus
      if (u.includes(String(n.label || '').toLowerCase())) hits += 2;
      if (u.includes(String(n.slug || '').toLowerCase().replace(/-/g, ' '))) hits += 1;
      const conf = kws.length ? Math.min(0.99, hits / (kws.length + 1)) : 0;
      return { intent_id: n.id, intent_slug: n.slug, intent_label: n.label, confidence: Number(conf.toFixed(3)),
               expected_components: n.expected_components, hits };
    }).filter(s => s.hits > 0)
      .sort((a, b) => b.hits - a.hits || b.confidence - a.confidence);
    const top = scored.slice(0, k);
    res.json({
      utterance,
      context: context || null,
      top: top.length ? top : [{ intent_id: null, intent_slug: 'unknown', confidence: 0, expected_components: null }],
      method: 'few-shot-keyword-overlap',
      candidates_total: scored.length
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// EVAL: run classify across the dev/test split and report accuracy.
router.post('/evaluate', async (req, res) => {
  try {
    const split = (req.body && req.body.split) || 'dev';
    const rows = await pool.query(
      `SELECT e.id, e.utterance, e.intent_id, n.slug AS intent_slug
       FROM intent_classifier_examples e
       LEFT JOIN intent_nodes n ON n.id = e.intent_id
       WHERE e.split = $1`, [split]);
    const all = await pool.query('SELECT id, slug, signal_keywords FROM intent_nodes');
    const nodes = all.rows;
    let correct = 0;
    const results = rows.rows.map(ex => {
      const u = String(ex.utterance).toLowerCase();
      const scored = nodes.map(n => {
        const kws = String(n.signal_keywords || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
        let hits = 0; kws.forEach(kw => { if (kw && u.includes(kw)) hits += 1; });
        return { id: n.id, slug: n.slug, hits };
      }).sort((a, b) => b.hits - a.hits);
      const top = scored[0];
      const predicted = (top && top.hits > 0) ? top.slug : 'unknown';
      const ok = predicted === ex.intent_slug;
      if (ok) correct += 1;
      return { example_id: ex.id, gold: ex.intent_slug, predicted, ok };
    });
    const acc = results.length ? Number((correct / results.length).toFixed(3)) : 0;
    res.json({ split, n: results.length, correct, accuracy: acc, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Stats: per-intent example counts split by train/dev/test.
router.get('/_stats', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT n.id, n.slug, n.label,
        SUM(CASE WHEN e.split='train' THEN 1 ELSE 0 END)::int AS train_count,
        SUM(CASE WHEN e.split='dev' THEN 1 ELSE 0 END)::int AS dev_count,
        SUM(CASE WHEN e.split='test' THEN 1 ELSE 0 END)::int AS test_count,
        COUNT(e.id)::int AS total
      FROM intent_nodes n
      LEFT JOIN intent_classifier_examples e ON e.intent_id = n.id
      GROUP BY n.id, n.slug, n.label
      ORDER BY total DESC`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
