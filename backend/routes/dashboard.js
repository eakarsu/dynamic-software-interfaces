const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// Lightweight count helper that swallows missing-table / column errors
async function safeScalar(sql, params = []) {
  try {
    const r = await pool.query(sql, params);
    return r.rows[0] ? Object.values(r.rows[0])[0] : 0;
  } catch (_) {
    return 0;
  }
}

// GET /api/dashboard/stats — KPI snapshot + recent audit-log activity for the landing page.
// Domain: DynamicUI Studio — component specs (templates), widgets, design tokens (palette + density),
// A/B variants live (recent ai.ab-variants calls), recent customizations, and recent activity.
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const componentSpecs   = await safeScalar('SELECT COUNT(*)::int AS c FROM templates');
    const widgetsTotal     = await safeScalar('SELECT COUNT(*)::int AS c FROM widgets');
    // "Design tokens" = distinct primary colours + densities currently in use across the spec library.
    const distinctColors   = await safeScalar('SELECT COUNT(DISTINCT primary_color)::int AS c FROM templates WHERE primary_color IS NOT NULL');
    const distinctDensity  = await safeScalar('SELECT COUNT(DISTINCT density)::int AS c FROM templates WHERE density IS NOT NULL');
    const designTokens     = (distinctColors || 0) + (distinctDensity || 0);
    // A/B variants live in the last 7 days = recent successful ab-variants generations (action contains "ab-variants").
    const abVariantsLive   = await safeScalar(
      "SELECT COUNT(*)::int AS c FROM audit_log WHERE action ILIKE $1 AND created_at >= NOW() - INTERVAL '7 days'",
      ['%ab-variants%']
    );
    const recentCustom7d   = await safeScalar(
      "SELECT COUNT(*)::int AS c FROM customizations WHERE created_at >= NOW() - INTERVAL '7 days'"
    );
    const customizationsTotal = await safeScalar('SELECT COUNT(*)::int AS c FROM customizations');
    const interfaceUsers   = await safeScalar('SELECT COUNT(*)::int AS c FROM ui_users');
    const activeSessions7d = await safeScalar(
      "SELECT COUNT(*)::int AS c FROM ui_sessions WHERE started_at >= NOW() - INTERVAL '7 days'"
    );

    let recentActivity = [];
    try {
      const r = await pool.query(
        `SELECT a.id, a.action, a.target, a.created_at, u.email AS user_email
         FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
         ORDER BY a.created_at DESC LIMIT 10`
      );
      recentActivity = r.rows;
    } catch (_) { recentActivity = []; }

    res.json({
      kpis: {
        component_specs: componentSpecs,
        widgets: widgetsTotal,
        design_tokens: designTokens,
        ab_variants_live: abVariantsLive,
        recent_customizations: recentCustom7d,
        customizations_total: customizationsTotal,
        interface_users: interfaceUsers,
        active_sessions_7d: activeSessions7d
      },
      recent_activity: recentActivity,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
