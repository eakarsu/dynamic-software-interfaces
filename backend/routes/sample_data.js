const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// Pick n items from arr without replacement (or with replacement if n > arr.length)
function pick(arr, n) {
  const out = [];
  const used = new Set();
  while (out.length < n) {
    const i = Math.floor(Math.random() * arr.length);
    if (used.has(i) && used.size < arr.length) continue;
    used.add(i);
    out.push(arr[i]);
    if (used.size >= arr.length && out.length < n) used.clear();
  }
  return out;
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDecimal(min, max, p = 2) { return +(Math.random() * (max - min) + min).toFixed(p); }
function randDate(daysBack = 365) {
  const d = new Date(Date.now() - randInt(1, daysBack) * 86400000);
  return d.toISOString().slice(0, 10);
}
function randTimestamp(daysBack = 60) {
  return new Date(Date.now() - randInt(1, daysBack) * 86400000 - randInt(0, 86400000));
}

const PERSONAS = ['power_user','casual','analyst','executive','developer','designer','marketer','support'];
const LAYOUTS = ['grid','dashboard','sidebar','split','focus','kanban','timeline','minimal'];
const THEMES = ['dark','light','solarized','dracula','high_contrast','sepia'];
const DENSITIES = ['compact','comfortable','spacious'];
const COLORS = ['#4f46e5','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
const DEVICES = ['desktop','tablet','mobile','laptop'];

const COMPONENT_SPECS = [
  { name: 'Atlas Analytics Dashboard', description: 'Executive analytics layout with KPI tiles, trend chart, and recent activity feed.', layout: 'dashboard', target_persona: 'executive', primary_color: '#4f46e5', density: 'comfortable', widgets_json: '["kpi_tile","trend_chart","activity_feed"]' },
  { name: 'Halo Developer Console', description: 'Code-first surface with logs, deployments, and a command palette for engineers.', layout: 'split', target_persona: 'developer', primary_color: '#0ea5e9', density: 'compact', widgets_json: '["logs_stream","deploys","cmdk"]' },
  { name: 'Lumen Marketing Hub', description: 'Campaign-centric layout with funnels, A/B tiles, and content calendar.', layout: 'grid', target_persona: 'marketer', primary_color: '#ec4899', density: 'comfortable', widgets_json: '["funnel","ab_tile","content_cal"]' },
  { name: 'Pulse Support Workbench', description: 'Inbox-style ticket view with SLA timers and macros sidebar.', layout: 'sidebar', target_persona: 'support', primary_color: '#10b981', density: 'compact', widgets_json: '["ticket_list","sla_timer","macros"]' },
  { name: 'Prism Design System Browser', description: 'Token, component, and pattern explorer with live preview.', layout: 'split', target_persona: 'designer', primary_color: '#8b5cf6', density: 'spacious', widgets_json: '["token_grid","component_preview","spec_panel"]' },
  { name: 'North Star Casual Home', description: 'Minimal home for occasional users — recents, search, and three actions.', layout: 'minimal', target_persona: 'casual', primary_color: '#14b8a6', density: 'spacious', widgets_json: '["recent","search","quick_actions"]' },
  { name: 'Ledger Analyst Cockpit', description: 'Multi-pane data analyst view: query, table, and chart side-by-side.', layout: 'split', target_persona: 'analyst', primary_color: '#f59e0b', density: 'compact', widgets_json: '["sql_editor","result_table","chart"]' },
  { name: 'Rapid Power User Grid', description: 'Information-dense grid for power users — every shortcut in reach.', layout: 'grid', target_persona: 'power_user', primary_color: '#ef4444', density: 'compact', widgets_json: '["dense_grid","shortcuts","watchlist"]' },
];

const WIDGETS = [
  { name: 'KPI Tile', type: 'metric', description: 'Single-number KPI with delta sparkline and target indicator.', data_source: 'metrics_api', config_schema: '{"label":"string","metric":"string","format":"number|currency|percent"}', preview_url: '/previews/kpi_tile.png', category: 'analytics', popularity: 92 },
  { name: 'Trend Chart', type: 'chart', description: 'Line chart with smoothing, threshold bands, and brushable range.', data_source: 'timeseries_api', config_schema: '{"series":"string[]","interval":"day|hour"}', preview_url: '/previews/trend_chart.png', category: 'analytics', popularity: 88 },
  { name: 'Activity Feed', type: 'list', description: 'Reverse-chronological events with avatar, action, and timestamp.', data_source: 'events_api', config_schema: '{"limit":"number","filters":"object"}', preview_url: '/previews/activity.png', category: 'social', popularity: 74 },
  { name: 'Command Palette', type: 'overlay', description: 'Ctrl-K palette with fuzzy search and recent commands.', data_source: 'command_registry', config_schema: '{"hotkey":"string"}', preview_url: '/previews/cmdk.png', category: 'navigation', popularity: 81 },
  { name: 'Funnel Card', type: 'visualization', description: 'Step funnel with drop-off rates and segment compare.', data_source: 'analytics_api', config_schema: '{"steps":"string[]"}', preview_url: '/previews/funnel.png', category: 'analytics', popularity: 67 },
  { name: 'A/B Variant Tile', type: 'card', description: 'Side-by-side A/B variant with lift, p-value, and decision badge.', data_source: 'experiments_api', config_schema: '{"experiment_id":"string"}', preview_url: '/previews/ab.png', category: 'experimentation', popularity: 59 },
  { name: 'Token Swatch Grid', type: 'gallery', description: 'Color, spacing, and typography token swatches with copy-to-clipboard.', data_source: 'design_tokens', config_schema: '{"category":"color|spacing|type"}', preview_url: '/previews/tokens.png', category: 'design_system', popularity: 71 },
  { name: 'Logs Stream', type: 'stream', description: 'Tail-style logs with level filters and search highlighting.', data_source: 'logs_api', config_schema: '{"source":"string","level":"info|warn|error"}', preview_url: '/previews/logs.png', category: 'developer', popularity: 78 },
  { name: 'SLA Timer', type: 'badge', description: 'Countdown badge with color stages — green, amber, breached red.', data_source: 'tickets_api', config_schema: '{"thresholds":"object"}', preview_url: '/previews/sla.png', category: 'support', popularity: 64 },
  { name: 'Content Calendar', type: 'calendar', description: 'Month grid with scheduled posts, channels, and status dots.', data_source: 'cms_api', config_schema: '{"channels":"string[]"}', preview_url: '/previews/calendar.png', category: 'marketing', popularity: 55 },
];

const UI_USER_NAMES = [
  ['Ada Patel','ada.patel@example.com'], ['Bo Tanaka','bo.tanaka@example.com'],
  ['Chen Wu','chen.wu@example.com'], ['Diego Romero','diego.romero@example.com'],
  ['Elif Aydin','elif.aydin@example.com'], ['Farah Naz','farah.naz@example.com'],
  ['Gus Hartley','gus.hartley@example.com'], ['Hana Kim','hana.kim@example.com'],
  ['Ivo Petrov','ivo.petrov@example.com'], ['Jia Liu','jia.liu@example.com'],
];

const CUSTOMIZATION_CONFIGS = [
  { config_name: 'Compact Dark Cockpit', description: 'Compact dark theme with sidebar collapsed and trend chart pinned.', config_json: '{"theme":"dark","density":"compact","sidebar":"collapsed","pinned":["trend_chart"]}' },
  { config_name: 'Executive Morning Brief', description: 'KPI-first layout, weekly digest in feed, large readable type.', config_json: '{"theme":"light","density":"spacious","first":"kpi_tile","feed":"weekly"}' },
  { config_name: 'Designer Token Workbench', description: 'Two-pane token explorer with live preview on the right.', config_json: '{"layout":"split","preview":"right","panel":"tokens"}' },
  { config_name: 'Support Inbox Zero', description: 'SLA timers always-on, macros sidebar pinned, autorefresh 15s.', config_json: '{"sla":"always","macros":"pinned","refresh":15}' },
  { config_name: 'Analyst SQL First', description: 'SQL editor takes 50% width, query history pinned, dark theme.', config_json: '{"editor":"50%","history":"pinned","theme":"dark"}' },
  { config_name: 'Marketer Funnel Focus', description: 'Funnel widget enlarged, A/B tiles below, content calendar collapsed.', config_json: '{"funnel":"large","ab":"below","calendar":"collapsed"}' },
  { config_name: 'Developer Logs Tail', description: 'Logs stream full-height, error filter on, command palette hotkey changed.', config_json: '{"logs":"full","filter":"error","hotkey":"cmd+j"}' },
  { config_name: 'Casual Minimal Home', description: 'Three-action minimal home, big search, no extra widgets.', config_json: '{"layout":"minimal","search":"large","extras":false}' },
];

const FEEDBACK_CATEGORIES = ['layout','performance','copy','accessibility','color','feature_request','bug'];
const FEEDBACK_STATUSES = ['new','triaged','in_progress','resolved','wontfix'];
const FEEDBACK_COMMENTS = [
  'The trend chart legend overlaps the y-axis on narrow viewports.',
  'Love the new dark theme — text contrast feels right for long sessions.',
  'A/B variant tile would be more useful with a clear decision button.',
  'Command palette latency dropped after the latest deploy, very snappy now.',
  'Compact density is too tight on mobile — buttons get hard to tap.',
  'Color palette suggestions from the brand AI tool nailed our voice.',
  'SLA badge red state is hard to distinguish from amber for color-blind users.',
  'Could the content calendar support multi-channel filtering at once?',
  'KPI tile delta arrows would be clearer with words like "up" / "down".',
  'Customization save toast disappears too fast — needs a few more seconds.',
];

router.post('/sample-data/:entity', verifyToken, async (req, res) => {
  const entity = req.params.entity;
  try {
    let inserted = 0;

    if (entity === 'ui_users') {
      const sample = pick(UI_USER_NAMES, randInt(5, Math.min(10, UI_USER_NAMES.length)));
      for (const [name, baseEmail] of sample) {
        const email = baseEmail.replace('@', `+${Date.now().toString(36)}${randInt(10,99)}@`);
        await pool.query(
          `INSERT INTO ui_users (name,email,role,persona,interface_layout,theme,density,active_since,session_count,satisfaction_score)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [name, email, pick(['admin','member','viewer'],1)[0], pick(PERSONAS,1)[0], pick(LAYOUTS,1)[0],
           pick(THEMES,1)[0], pick(DENSITIES,1)[0], randDate(720), randInt(1,500), randDecimal(2.5,5.0,1)]
        );
        inserted++;
      }
    } else if (entity === 'templates') {
      const sample = pick(COMPONENT_SPECS, randInt(5, Math.min(10, COMPONENT_SPECS.length)));
      for (const t of sample) {
        await pool.query(
          `INSERT INTO templates (name,description,layout,target_persona,primary_color,density,widgets_json,usage_count,rating)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [`${t.name} ${randInt(100,999)}`, t.description, t.layout, t.target_persona, t.primary_color, t.density, t.widgets_json, randInt(0, 5000), randDecimal(3.5, 5.0, 1)]
        );
        inserted++;
      }
    } else if (entity === 'widgets') {
      const sample = pick(WIDGETS, randInt(5, Math.min(10, WIDGETS.length)));
      for (const w of sample) {
        await pool.query(
          `INSERT INTO widgets (name,type,description,data_source,config_schema,preview_url,category,popularity)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [`${w.name} v${randInt(1,9)}`, w.type, w.description, w.data_source, w.config_schema, w.preview_url, w.category, w.popularity + randInt(-10,10)]
        );
        inserted++;
      }
    } else if (entity === 'ui_sessions') {
      const userIds = (await pool.query('SELECT id FROM ui_users ORDER BY id DESC LIMIT 50')).rows.map(r => r.id);
      if (!userIds.length) return res.status(400).json({ error: 'No ui_users exist — seed ui_users first.' });
      const n = randInt(5, 10);
      for (let i = 0; i < n; i++) {
        const start = randTimestamp(60);
        const dur = randInt(2, 240);
        const end = new Date(start.getTime() + dur * 60000);
        await pool.query(
          `INSERT INTO ui_sessions (ui_user_id,started_at,ended_at,duration_mins,layout_used,actions_count,satisfaction_rating,device_type)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [pick(userIds,1)[0], start, end, dur, pick(LAYOUTS,1)[0], randInt(1, 400), randInt(1,5), pick(DEVICES,1)[0]]
        );
        inserted++;
      }
    } else if (entity === 'customizations') {
      const userIds = (await pool.query('SELECT id FROM ui_users ORDER BY id DESC LIMIT 50')).rows.map(r => r.id);
      if (!userIds.length) return res.status(400).json({ error: 'No ui_users exist — seed ui_users first.' });
      const sample = pick(CUSTOMIZATION_CONFIGS, randInt(5, Math.min(10, CUSTOMIZATION_CONFIGS.length)));
      for (const c of sample) {
        await pool.query(
          `INSERT INTO customizations (ui_user_id,config_name,config_json,is_active,last_used,description)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [pick(userIds,1)[0], c.config_name, c.config_json, Math.random() > 0.3, randTimestamp(30), c.description]
        );
        inserted++;
      }
    } else if (entity === 'feedback') {
      const userIds = (await pool.query('SELECT id FROM ui_users ORDER BY id DESC LIMIT 50')).rows.map(r => r.id);
      const tplIds = (await pool.query('SELECT id FROM templates ORDER BY id DESC LIMIT 50')).rows.map(r => r.id);
      if (!userIds.length || !tplIds.length) return res.status(400).json({ error: 'Need ui_users and templates seeded first.' });
      const n = randInt(5, 10);
      for (let i = 0; i < n; i++) {
        await pool.query(
          `INSERT INTO feedback (ui_user_id,template_id,rating,category,comments,status)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [pick(userIds,1)[0], pick(tplIds,1)[0], randInt(1,5), pick(FEEDBACK_CATEGORIES,1)[0], pick(FEEDBACK_COMMENTS,1)[0], pick(FEEDBACK_STATUSES,1)[0]]
        );
        inserted++;
      }
    } else {
      return res.status(400).json({ error: `Unknown entity: ${entity}` });
    }

    res.json({ inserted, entity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
