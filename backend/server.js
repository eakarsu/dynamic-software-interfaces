require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai', require('./routes/ai_extra'));
app.use('/api/ui-users', require('./routes/ui_users'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/widgets', require('./routes/widgets'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/customizations', require('./routes/customizations'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/utility', require('./routes/utility'));
app.use('/api/admin', require('./routes/sample_data'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.use('/api/gap-ai-feedback-clustering', require('./routes/gap-ai-feedback-clustering'));
app.use('/api/gap-ai-session-replay-summarizer', require('./routes/gap-ai-session-replay-summarizer'));
app.use('/api/gap-ai-agent-customizer', require('./routes/gap-ai-agent-customizer'));
app.use('/api/gap-ai-screenshot-extractor', require('./routes/gap-ai-screenshot-extractor'));
app.use('/api/gap-ai-i18n-translator', require('./routes/gap-ai-i18n-translator'));
app.use('/api/gap-nonai-multi-app-workspace', require('./routes/gap-nonai-multi-app-workspace'));
app.use('/api/gap-nonai-widget-marketplace', require('./routes/gap-nonai-widget-marketplace'));
app.use('/api/gap-nonai-customization-versioning', require('./routes/gap-nonai-customization-versioning'));
app.use('/api/gap-nonai-render-endpoint', require('./routes/gap-nonai-render-endpoint'));
app.use('/api/gap-nonai-analytics-events', require('./routes/gap-nonai-analytics-events'));
app.use('/api/gap-nonai-theme-toggle', require('./routes/gap-nonai-theme-toggle'));
app.use('/api/cf-fda-loop', require('./routes/cf-fda-loop'));
app.use('/api/cf-primitives-marketplace', require('./routes/cf-primitives-marketplace'));
app.use('/api/cf-cross-app-portable', require('./routes/cf-cross-app-portable'));
app.use('/api/cf-live-spec-compile', require('./routes/cf-live-spec-compile'));
app.use('/api/cf-a11y-by-construction', require('./routes/cf-a11y-by-construction'));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => console.log(`DynamicUI Studio backend running on port ${PORT}`));
