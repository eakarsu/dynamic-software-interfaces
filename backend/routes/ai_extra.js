const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

async function callAI(userPrompt, systemPrompt = '') {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI service unavailable');
    err.status = 503;
    throw err;
  }
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost', 'X-Title': 'DynamicUI' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', messages: [...(systemPrompt ? [{role:'system',content:systemPrompt}] : []), {role:'user',content:userPrompt}] })
  });
  if (!resp.ok) {
    const err = new Error(`AI service error (${resp.status})`);
    err.status = (resp.status === 401 || resp.status === 403 || resp.status === 429 || resp.status >= 500) ? 503 : 500;
    throw err;
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || 'AI unavailable';
}

async function logAudit(userId, action, target, payload) {
  try {
    await pool.query(
      'INSERT INTO audit_log (user_id, action, target, payload) VALUES ($1,$2,$3,$4)',
      [userId || null, action, target, payload ? JSON.stringify(payload).slice(0, 4000) : null]
    );
  } catch (_) { /* non-fatal */ }
}

function handle(res, err) {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Failed' });
}

// 1. NL -> component spec
router.post('/nl-to-spec', verifyToken, async (req, res) => {
  try {
    const { description, framework } = req.body;
    if (!description) return res.status(400).json({ error: 'description required' });
    const result = await callAI(
      `Component description: ${description}\nTarget framework: ${framework || 'React + Tailwind'}`,
      'You are a UI component architect. Convert the natural-language description into a structured component specification with: component name, prop schema (name/type/required), state, slots, accessibility attributes, and example JSX. Return as a clearly-labeled markdown spec.'
    );
    await logAudit(req.user.id, 'ai.nl-to-spec', 'component', { description, framework });
    res.json({ result });
  } catch (err) { handle(res, err); }
});

// 2. Color palette generator from brand description
router.post('/palette-from-brand', verifyToken, async (req, res) => {
  try {
    const { brand, mood, baseColor } = req.body;
    if (!brand) return res.status(400).json({ error: 'brand required' });
    const result = await callAI(
      `Brand: ${brand}\nMood / personality: ${mood || 'modern, trustworthy'}\nOptional base color: ${baseColor || 'none'}`,
      'You are a brand color systems designer. Produce a complete palette with: primary (hex), secondary (hex), accent (hex), neutral scale (50-900), success/warning/error semantic colors, and a one-line rationale per token. Format as a markdown spec ready to paste into a Tailwind config.'
    );
    await logAudit(req.user.id, 'ai.palette-from-brand', 'palette', { brand, mood });
    res.json({ result });
  } catch (err) { handle(res, err); }
});

// 3. Accessibility audit on component spec
router.post('/a11y-audit', verifyToken, async (req, res) => {
  try {
    const { spec } = req.body;
    if (!spec) return res.status(400).json({ error: 'spec required' });
    const result = await callAI(
      `Component spec / JSX:\n${spec}`,
      'You are an accessibility auditor (WCAG 2.2 AA). Audit the provided component for: keyboard navigation, ARIA attributes, color contrast assumptions, focus management, screen-reader semantics, and motion safety. Output: severity (critical/major/minor) per finding, the failing rule, the offending location, and a concrete fix. Finish with a numeric score 0-100.'
    );
    await logAudit(req.user.id, 'ai.a11y-audit', 'spec', { spec_len: spec.length });
    res.json({ result });
  } catch (err) { handle(res, err); }
});

// 4. A/B variant generator
router.post('/ab-variants', verifyToken, async (req, res) => {
  try {
    const { component, hypothesis } = req.body;
    if (!component) return res.status(400).json({ error: 'component required' });
    const result = await callAI(
      `Existing component / element: ${component}\nHypothesis to test: ${hypothesis || 'increase conversion by reducing friction'}`,
      'You are a conversion-optimization engineer. Generate three distinct A/B variants for the supplied UI element. For each variant, return: name, what changed (copy/layout/color/affordance), why it should win, suggested success metric, and a sample HTML/JSX snippet.'
    );
    await logAudit(req.user.id, 'ai.ab-variants', 'component', { hypothesis });
    res.json({ result });
  } catch (err) { handle(res, err); }
});

// 5. Copy-tone rewriter
router.post('/tone-rewrite', verifyToken, async (req, res) => {
  try {
    const { text, tone, audience } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const result = await callAI(
      `Original UI copy:\n${text}\n\nTarget tone: ${tone || 'friendly and concise'}\nAudience: ${audience || 'general product users'}`,
      'You are a senior product copywriter. Rewrite the given UI copy in the target tone. Provide: 3 alternative variants of varying length (short/medium/long), explanation of voice choices, and warnings if any original meaning may be lost.'
    );
    await logAudit(req.user.id, 'ai.tone-rewrite', 'copy', { tone, audience });
    res.json({ result });
  } catch (err) { handle(res, err); }
});

module.exports = router;
