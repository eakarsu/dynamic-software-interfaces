const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, type, category } = req.query;
    let q = 'SELECT * FROM widgets WHERE 1=1';
    const p = [];
    if (search) { p.push(`%${search}%`); q += ` AND (name ILIKE $${p.length} OR description ILIKE $${p.length})`; }
    if (type) { p.push(type); q += ` AND type = $${p.length}`; }
    if (category) { p.push(category); q += ` AND category = $${p.length}`; }
    q += ' ORDER BY popularity DESC';
    res.json((await pool.query(q, p)).rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', verifyToken, async (req, res) => {
  const r = await pool.query('SELECT * FROM widgets WHERE id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, type, description, data_source, config_schema, category } = req.body;
    const r = await pool.query('INSERT INTO widgets (name,type,description,data_source,config_schema,category) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [name,type,description,data_source,config_schema,category]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, type, description, data_source, config_schema, category } = req.body;
    const r = await pool.query('UPDATE widgets SET name=$1,type=$2,description=$3,data_source=$4,config_schema=$5,category=$6 WHERE id=$7 RETURNING *', [name,type,description,data_source,config_schema,category,req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', verifyToken, async (req, res) => {
  await pool.query('DELETE FROM widgets WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
