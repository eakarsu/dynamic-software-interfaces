const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, persona } = req.query;
    let q = 'SELECT * FROM ui_users WHERE 1=1';
    const p = [];
    if (search) { p.push(`%${search}%`); q += ` AND (name ILIKE $${p.length} OR email ILIKE $${p.length})`; }
    if (persona) { p.push(persona); q += ` AND persona = $${p.length}`; }
    q += ' ORDER BY session_count DESC';
    res.json((await pool.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  const r = await pool.query('SELECT * FROM ui_users WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, email, role, persona, interface_layout, theme, density, active_since, satisfaction_score } = req.body;
    const r = await pool.query('INSERT INTO ui_users (name,email,role,persona,interface_layout,theme,density,active_since,satisfaction_score) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', [name,email,role,persona,interface_layout,theme,density,active_since,satisfaction_score]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, email, role, persona, interface_layout, theme, density, active_since, satisfaction_score } = req.body;
    const r = await pool.query('UPDATE ui_users SET name=$1,email=$2,role=$3,persona=$4,interface_layout=$5,theme=$6,density=$7,active_since=$8,satisfaction_score=$9 WHERE id=$10 RETURNING *', [name,email,role,persona,interface_layout,theme,density,active_since,satisfaction_score,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  await pool.query('DELETE FROM ui_users WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
