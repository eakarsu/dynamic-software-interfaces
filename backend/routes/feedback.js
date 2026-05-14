const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, status } = req.query;
    let q = 'SELECT f.*, u.name as user_name, t.name as template_name FROM feedback f LEFT JOIN ui_users u ON f.ui_user_id=u.id LEFT JOIN templates t ON f.template_id=t.id WHERE 1=1';
    const p = [];
    if (search) { p.push(`%${search}%`); q += ` AND (f.comments ILIKE $${p.length} OR u.name ILIKE $${p.length})`; }
    if (status) { p.push(status); q += ` AND f.status = $${p.length}`; }
    q += ' ORDER BY f.submitted_at DESC';
    res.json((await pool.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  const r = await pool.query('SELECT * FROM feedback WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { ui_user_id, template_id, rating, category, comments, status } = req.body;
    const r = await pool.query('INSERT INTO feedback (ui_user_id,template_id,rating,category,comments,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [ui_user_id,template_id,rating,category,comments,status||'new']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { ui_user_id, template_id, rating, category, comments, status } = req.body;
    const r = await pool.query('UPDATE feedback SET ui_user_id=$1,template_id=$2,rating=$3,category=$4,comments=$5,status=$6 WHERE id=$7 RETURNING *', [ui_user_id,template_id,rating,category,comments,status,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  await pool.query('DELETE FROM feedback WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
