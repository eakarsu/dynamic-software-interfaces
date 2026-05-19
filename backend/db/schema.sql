DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS customizations CASCADE;
DROP TABLE IF EXISTS ui_sessions CASCADE;
DROP TABLE IF EXISTS widgets CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS ui_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS intent_classifier_examples CASCADE;
DROP TABLE IF EXISTS ui_generation_runs CASCADE;
DROP TABLE IF EXISTS variant_telemetry CASCADE;
DROP TABLE IF EXISTS layout_variants CASCADE;
DROP TABLE IF EXISTS design_tokens CASCADE;
DROP TABLE IF EXISTS component_primitives CASCADE;
DROP TABLE IF EXISTS intent_edges CASCADE;
DROP TABLE IF EXISTS intent_nodes CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ui_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  role VARCHAR(50),
  persona VARCHAR(50),
  interface_layout VARCHAR(50),
  theme VARCHAR(30),
  density VARCHAR(20),
  active_since DATE,
  session_count INTEGER DEFAULT 0,
  satisfaction_score DECIMAL
);

CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  layout VARCHAR(50),
  target_persona VARCHAR(50),
  primary_color VARCHAR(30),
  density VARCHAR(20),
  widgets_json TEXT,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE widgets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(50),
  description TEXT,
  data_source VARCHAR(100),
  config_schema TEXT,
  preview_url TEXT,
  category VARCHAR(50),
  popularity INTEGER DEFAULT 0
);

CREATE TABLE ui_sessions (
  id SERIAL PRIMARY KEY,
  ui_user_id INT REFERENCES ui_users,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_mins INTEGER,
  layout_used VARCHAR(50),
  actions_count INTEGER DEFAULT 0,
  satisfaction_rating INTEGER,
  device_type VARCHAR(30)
);

CREATE TABLE customizations (
  id SERIAL PRIMARY KEY,
  ui_user_id INT REFERENCES ui_users,
  config_name VARCHAR(100),
  config_json TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used TIMESTAMP,
  description TEXT
);

CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  ui_user_id INT REFERENCES ui_users,
  template_id INT REFERENCES templates,
  rating INTEGER,
  category VARCHAR(50),
  comments TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(30) DEFAULT 'new'
);

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target VARCHAR(100),
  payload TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- =====================================================
-- DEEP FEATURES (2026-05-14): Dynamic Software Interfaces
-- =====================================================

-- 1. INTENT GRAPH
-- Nodes represent what the user is trying to accomplish (not screens),
-- edges encode transitions / refinements between intents.
CREATE TABLE intent_nodes (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),                    -- e.g. communicate / decide / create / monitor / configure
  parent_id INT REFERENCES intent_nodes(id) ON DELETE SET NULL,
  signal_keywords TEXT,                    -- comma-sep keywords used by classifier (few-shot signal)
  expected_components TEXT,                -- JSON array of shadcn/Radix primitive slugs to render
  trigger_count INTEGER DEFAULT 0,         -- aggregate observed triggers
  success_rate DECIMAL(4,3) DEFAULT 0,     -- 0..1, task completion conditional on this intent
  median_completion_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_intent_nodes_category ON intent_nodes(category);
CREATE INDEX idx_intent_nodes_parent ON intent_nodes(parent_id);

CREATE TABLE intent_edges (
  id SERIAL PRIMARY KEY,
  from_intent_id INT REFERENCES intent_nodes(id) ON DELETE CASCADE,
  to_intent_id INT REFERENCES intent_nodes(id) ON DELETE CASCADE,
  edge_type VARCHAR(40),                   -- refines | follows | escalates | branches | exits
  transition_count INTEGER DEFAULT 0,
  avg_dwell_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_intent_edges_from ON intent_edges(from_intent_id);
CREATE INDEX idx_intent_edges_to ON intent_edges(to_intent_id);

-- 2. COMPONENT REGISTRY (shadcn/Radix/AG Grid/Recharts primitives)
CREATE TABLE component_primitives (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(120) UNIQUE NOT NULL,       -- e.g. radix-dialog, shadcn-data-table, recharts-line, ag-grid-pivot
  display_name VARCHAR(255) NOT NULL,
  library VARCHAR(60),                     -- radix | shadcn | ag-grid | recharts | tremor | mui | custom
  category VARCHAR(60),                    -- input | display | navigation | overlay | chart | grid | feedback
  description TEXT,
  prop_schema JSONB,                       -- JSON Schema of accepted props
  default_props JSONB,                     -- default values
  example_jsx TEXT,                        -- canonical JSX snippet
  docs_url TEXT,
  supports_rsc BOOLEAN DEFAULT TRUE,       -- React Server Components compatible
  a11y_role VARCHAR(60),                   -- ARIA role
  bundle_kb DECIMAL(6,2),                  -- gzipped size in kB
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_component_primitives_library ON component_primitives(library);
CREATE INDEX idx_component_primitives_category ON component_primitives(category);

-- 3. DESIGN TOKENS (Tailwind/Radix/shadcn)
CREATE TABLE design_tokens (
  id SERIAL PRIMARY KEY,
  token_key VARCHAR(120) UNIQUE NOT NULL,  -- e.g. color.brand.500 / radius.md / shadow.sm / font.sans
  token_value TEXT NOT NULL,               -- e.g. #6366f1 / 0.5rem / 0 1px 2px rgba(0,0,0,.06)
  category VARCHAR(50),                    -- color | radius | shadow | spacing | font | motion | z
  tier VARCHAR(40),                        -- primitive | semantic | component
  ref_token_key VARCHAR(120),              -- semantic tokens reference primitives
  source VARCHAR(60),                      -- tailwind | radix | shadcn | brand | custom
  description TEXT,
  dark_mode_value TEXT,                    -- override for dark mode
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_design_tokens_category ON design_tokens(category);
CREATE INDEX idx_design_tokens_tier ON design_tokens(tier);

-- 4. LAYOUT VARIANTS (generative-UI variants Vercel AI SDK style + A/B telemetry)
CREATE TABLE layout_variants (
  id SERIAL PRIMARY KEY,
  intent_id INT REFERENCES intent_nodes(id) ON DELETE CASCADE,
  variant_key VARCHAR(80) NOT NULL,        -- e.g. v1-control / v2-dense / v3-cards
  hypothesis TEXT,                         -- "Hypothesis: dense table lifts task completion for power users"
  primitives_json JSONB,                   -- ordered list of component_primitive slugs
  layout_json JSONB,                       -- grid spec: columns, rows, gap, areas
  copy_tone VARCHAR(40),                   -- terse | conversational | formal
  density VARCHAR(20),                     -- compact | comfortable | spacious
  is_control BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  traffic_pct INTEGER DEFAULT 0,           -- A/B traffic allocation 0..100
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_layout_variants_intent ON layout_variants(intent_id);
CREATE INDEX idx_layout_variants_active ON layout_variants(is_active);

CREATE TABLE variant_telemetry (
  id SERIAL PRIMARY KEY,
  variant_id INT REFERENCES layout_variants(id) ON DELETE CASCADE,
  ui_user_id INT REFERENCES ui_users(id) ON DELETE SET NULL,
  impressions INTEGER DEFAULT 0,
  task_completions INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  avg_time_to_first_action_ms INTEGER DEFAULT 0,
  avg_task_completion_ms INTEGER DEFAULT 0,
  recorded_for DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_variant_telemetry_variant ON variant_telemetry(variant_id);
CREATE INDEX idx_variant_telemetry_date ON variant_telemetry(recorded_for DESC);

-- 5. UI GENERATION RUNS (generative-UI history + benchmark-style metrics)
CREATE TABLE ui_generation_runs (
  id SERIAL PRIMARY KEY,
  intent_id INT REFERENCES intent_nodes(id) ON DELETE SET NULL,
  ui_user_id INT REFERENCES ui_users(id) ON DELETE SET NULL,
  model VARCHAR(120),                      -- e.g. anthropic/claude-opus-4.7, openai/gpt-4o, vercel-ai-sdk
  sdk VARCHAR(60),                         -- vercel-ai-sdk | anthropic-sdk | openrouter
  prompt TEXT,
  generated_jsx TEXT,
  primitives_used JSONB,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  cost_usd DECIMAL(8,5) DEFAULT 0,
  -- benchmark-style quality metrics (analogues for UI gen)
  humaneval_pass BOOLEAN DEFAULT FALSE,    -- compiles & matches type signature
  componentbench_score DECIMAL(4,3),       -- 0..1, primitive-correctness on ComponentBench
  swebench_style_score DECIMAL(4,3),       -- 0..1, integrated-task accuracy
  a11y_score DECIMAL(4,3),                 -- 0..1, axe-core pass rate
  status VARCHAR(30) DEFAULT 'success',    -- success | error | flagged
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_ui_generation_runs_intent ON ui_generation_runs(intent_id);
CREATE INDEX idx_ui_generation_runs_model ON ui_generation_runs(model);
CREATE INDEX idx_ui_generation_runs_created ON ui_generation_runs(created_at DESC);

-- 6. INTENT CLASSIFIER FEW-SHOT EXAMPLES
-- Training/eval rows used by structured-output intent classifier
CREATE TABLE intent_classifier_examples (
  id SERIAL PRIMARY KEY,
  intent_id INT REFERENCES intent_nodes(id) ON DELETE CASCADE,
  utterance TEXT NOT NULL,                 -- raw user input ("I want to see who deployed last")
  context_json JSONB,                      -- recent actions / role / time-of-day context
  expected_output JSONB,                   -- structured-output target {intent, params, confidence}
  split VARCHAR(20) DEFAULT 'train',       -- train | dev | test
  confidence_observed DECIMAL(4,3),        -- last observed classifier confidence
  is_correct BOOLEAN,                      -- gold-vs-predicted last eval
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_intent_examples_intent ON intent_classifier_examples(intent_id);
CREATE INDEX idx_intent_examples_split ON intent_classifier_examples(split);
