const express = require('express');
const router = express.Router();

router.post('/resolve', (req, res) => {
  const rules = Array.isArray(req.body?.rules) ? req.body.rules : [
    { id: 'compact_sales', component: 'lead-table', property: 'density', value: 'compact', priority: 7, persona: 'sales' },
    { id: 'accessible_ops', component: 'lead-table', property: 'density', value: 'comfortable', priority: 9, persona: 'ops' },
  ];
  const groups = new Map();
  for (const rule of rules) {
    const key = `${rule.component}:${rule.property}`;
    groups.set(key, [...(groups.get(key) || []), rule]);
  }
  const conflicts = [...groups.entries()]
    .filter(([, values]) => new Set(values.map((item) => item.value)).size > 1)
    .map(([key, values]) => {
      const winner = [...values].sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0))[0];
      return { key, winner: winner.id, values, action: 'Prefer highest priority rule and request persona-specific preview signoff.' };
    });
  res.json({ conflictCount: conflicts.length, conflicts, status: conflicts.length ? 'needs_review' : 'clean' });
});

module.exports = router;
