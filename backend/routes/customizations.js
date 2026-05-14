const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search } = req.query;
    let q = 'SELECT c.*, u.name as user_name FROM customizations c LEFT JOIN ui_users u ON c.ui_user_id=u.id WHERE 1=1';
    const p = [];
    if (search) { p.push(`%${search}%`); q += ` AND (c.config_name ILIKE $${p.length} OR u.name ILIKE $${p.length})`; }
    q += ' ORDER BY c.last_used DESC';
    res.json((await pool.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  const r = await pool.query('SELECT * FROM customizations WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { ui_user_id, config_name, config_json, is_active, description } = req.body;
    const r = await pool.query('INSERT INTO customizations (ui_user_id,config_name,config_json,is_active,description) VALUES ($1,$2,$3,$4,$5) RETURNING *', [ui_user_id,config_name,config_json,is_active,description]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { ui_user_id, config_name, config_json, is_active, description } = req.body;
    const r = await pool.query('UPDATE customizations SET ui_user_id=$1,config_name=$2,config_json=$3,is_active=$4,description=$5 WHERE id=$6 RETURNING *', [ui_user_id,config_name,config_json,is_active,description,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  await pool.query('DELETE FROM customizations WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
