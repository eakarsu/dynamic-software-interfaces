const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search } = req.query;
    let q = 'SELECT s.*, u.name as user_name FROM ui_sessions s LEFT JOIN ui_users u ON s.ui_user_id=u.id WHERE 1=1';
    const p = [];
    if (search) { p.push(`%${search}%`); q += ` AND (u.name ILIKE $${p.length} OR s.layout_used ILIKE $${p.length})`; }
    q += ' ORDER BY s.started_at DESC';
    res.json((await pool.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  const r = await pool.query('SELECT * FROM ui_sessions WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { ui_user_id, started_at, ended_at, duration_mins, layout_used, actions_count, satisfaction_rating, device_type } = req.body;
    const r = await pool.query('INSERT INTO ui_sessions (ui_user_id,started_at,ended_at,duration_mins,layout_used,actions_count,satisfaction_rating,device_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [ui_user_id,started_at,ended_at,duration_mins,layout_used,actions_count,satisfaction_rating,device_type]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { ui_user_id, started_at, ended_at, duration_mins, layout_used, actions_count, satisfaction_rating, device_type } = req.body;
    const r = await pool.query('UPDATE ui_sessions SET ui_user_id=$1,started_at=$2,ended_at=$3,duration_mins=$4,layout_used=$5,actions_count=$6,satisfaction_rating=$7,device_type=$8 WHERE id=$9 RETURNING *', [ui_user_id,started_at,ended_at,duration_mins,layout_used,actions_count,satisfaction_rating,device_type,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  await pool.query('DELETE FROM ui_sessions WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
