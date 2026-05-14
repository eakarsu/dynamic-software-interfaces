DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS customizations CASCADE;
DROP TABLE IF EXISTS ui_sessions CASCADE;
DROP TABLE IF EXISTS widgets CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS ui_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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
