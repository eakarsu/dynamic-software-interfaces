const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

async function callAI(userPrompt, systemPrompt = '') {
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost', 'X-Title': 'DynamicUI' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', messages: [...(systemPrompt ? [{role:'system',content:systemPrompt}] : []), {role:'user',content:userPrompt}] })
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || 'AI unavailable';
}

router.post('/suggest-layout', verifyToken, async (req, res) => {
  try {
    const { user_role, user_behavior, current_layout } = req.body;
    const result = await callAI(
      `User role: ${user_role}\nBehavior patterns: ${user_behavior}\nCurrent layout: ${current_layout}`,
      'You are a UI/UX personalization expert. Suggest the optimal interface layout for this user based on their role and behavior. Explain specific layout changes, widget placements, information density settings, and navigation patterns that would improve their experience.'
    );
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/personalize', verifyToken, async (req, res) => {
  try {
    const { user_id, usage_patterns } = req.body;
    const result = await callAI(
      `User ID: ${user_id}\nUsage patterns: ${JSON.stringify(usage_patterns)}`,
      'You are an interface personalization AI. Analyze usage patterns and generate specific personalization recommendations including: layout adjustments, widget priorities, theme preferences, information density, keyboard shortcuts, and workflow optimizations.'
    );
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ux-analysis', verifyToken, async (req, res) => {
  try {
    const { session_data } = req.body;
    const result = await callAI(
      `Session data: ${JSON.stringify(session_data)}`,
      'You are a UX research analyst. Analyze session data to identify: friction points, successful workflows, abandonment patterns, efficiency opportunities, and specific recommendations to improve user satisfaction scores.'
    );
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/generate-widget', verifyToken, async (req, res) => {
  try {
    const { data_source, use_case } = req.body;
    const result = await callAI(
      `Data source: ${data_source}\nUse case: ${use_case}`,
      'You are a UI widget designer. Suggest a widget configuration including: widget type, data visualization approach, interactive elements, filters, refresh rate, size recommendations, and configuration schema. Provide concrete specifications.'
    );
    res.json({ result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
