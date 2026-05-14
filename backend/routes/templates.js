const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, layout, target_persona } = req.query;
    let q = 'SELECT * FROM templates WHERE 1=1';
    const p = [];
    if (search) { p.push(`%${search}%`); q += ` AND (name ILIKE $${p.length} OR description ILIKE $${p.length})`; }
    if (layout) { p.push(layout); q += ` AND layout = $${p.length}`; }
    if (target_persona) { p.push(target_persona); q += ` AND target_persona = $${p.length}`; }
    q += ' ORDER BY rating DESC, usage_count DESC';
    res.json((await pool.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  const r = await pool.query('SELECT * FROM templates WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, layout, target_persona, primary_color, density, widgets_json } = req.body;
    const r = await pool.query('INSERT INTO templates (name,description,layout,target_persona,primary_color,density,widgets_json) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [name,description,layout,target_persona,primary_color,density,widgets_json]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, description, layout, target_persona, primary_color, density, widgets_json } = req.body;
    const r = await pool.query('UPDATE templates SET name=$1,description=$2,layout=$3,target_persona=$4,primary_color=$5,density=$6,widgets_json=$7 WHERE id=$8 RETURNING *', [name,description,layout,target_persona,primary_color,density,widgets_json,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  await pool.query('DELETE FROM templates WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
