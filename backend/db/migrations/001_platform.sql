CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('member','reviewer','tenant_admin')),
  permission_groups TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id,email), UNIQUE (tenant_id,id)
);

CREATE TABLE connectors (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(160) NOT NULL,
  kind VARCHAR(32) NOT NULL CHECK (kind IN ('http_incremental')),
  base_url TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL,
  permission_mode VARCHAR(32) NOT NULL DEFAULT 'source_acl' CHECK (permission_mode='source_acl'),
  cursor TEXT,
  last_synced_at TIMESTAMPTZ,
  source_updated_at TIMESTAMPTZ,
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','syncing','ready','error','disabled')),
  last_error TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id,name),
  FOREIGN KEY (tenant_id,created_by) REFERENCES users(tenant_id,id)
);

CREATE TABLE indexed_documents (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  connector_id UUID NOT NULL REFERENCES connectors(id),
  source_id VARCHAR(240) NOT NULL,
  source_version VARCHAR(160) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  permissions TEXT[] NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  source_updated_at TIMESTAMPTZ NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('english',coalesce(title,'') || ' ' || coalesce(content,''))) STORED,
  UNIQUE (connector_id,source_id), UNIQUE (tenant_id,id)
);
CREATE INDEX indexed_documents_search_idx ON indexed_documents USING GIN(search_vector);
CREATE INDEX indexed_documents_acl_idx ON indexed_documents USING GIN(permissions);

CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  connector_id UUID NOT NULL REFERENCES connectors(id),
  idempotency_key VARCHAR(160) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','succeeded','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_until TIMESTAMPTZ,
  stats JSONB,
  error TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (tenant_id,idempotency_key),
  FOREIGN KEY (tenant_id,created_by) REFERENCES users(tenant_id,id)
);

CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_by UUID NOT NULL,
  tool VARCHAR(64) NOT NULL CHECK (tool IN ('grounded_interface_proposal')),
  input JSONB NOT NULL,
  output JSONB,
  provenance JSONB,
  idempotency_key VARCHAR(160) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','awaiting_approval','approved','rejected','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_until TIMESTAMPTZ,
  timeout_ms INTEGER NOT NULL CHECK (timeout_ms BETWEEN 1000 AND 60000),
  cost_budget_usd NUMERIC(10,6) NOT NULL CHECK (cost_budget_usd > 0),
  latency_budget_ms INTEGER NOT NULL CHECK (latency_budget_ms BETWEEN 1000 AND 60000),
  actual_cost_usd NUMERIC(10,6),
  latency_ms INTEGER,
  error_code VARCHAR(64),
  error TEXT,
  reviewed_by UUID,
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (tenant_id,created_by,idempotency_key),
  FOREIGN KEY (tenant_id,created_by) REFERENCES users(tenant_id,id),
  FOREIGN KEY (tenant_id,reviewed_by) REFERENCES users(tenant_id,id)
);
CREATE INDEX generation_jobs_claim_idx ON generation_jobs(status,next_attempt_at);

CREATE TABLE evaluation_cases (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(160) NOT NULL,
  tool VARCHAR(64) NOT NULL CHECK (tool='grounded_interface_proposal'),
  input JSONB NOT NULL,
  expected_primitives TEXT[] NOT NULL,
  min_grounded_score NUMERIC(4,3) NOT NULL CHECK (min_grounded_score BETWEEN 0 AND 1),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id,name)
);

CREATE TABLE evaluation_runs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_by UUID NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','passed','failed')),
  attempts INTEGER NOT NULL DEFAULT 0, max_attempts INTEGER NOT NULL DEFAULT 2,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), lease_until TIMESTAMPTZ,
  pass_rate NUMERIC(4,3), grounded_score NUMERIC(4,3), safety_pass_rate NUMERIC(4,3),
  avg_latency_ms INTEGER, total_cost_usd NUMERIC(10,6), gates JSONB NOT NULL,
  error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ,
  FOREIGN KEY (tenant_id,created_by) REFERENCES users(tenant_id,id)
);

CREATE TABLE evaluation_results (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  run_id UUID NOT NULL REFERENCES evaluation_runs(id),
  case_id UUID NOT NULL REFERENCES evaluation_cases(id),
  passed BOOLEAN NOT NULL, grounded_score NUMERIC(4,3) NOT NULL,
  safety_passed BOOLEAN NOT NULL, latency_ms INTEGER NOT NULL, cost_usd NUMERIC(10,6) NOT NULL,
  output JSONB, error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_id,case_id)
);

CREATE TABLE traces (
  id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), job_type VARCHAR(32) NOT NULL,
  job_id UUID NOT NULL, span VARCHAR(80) NOT NULL, status VARCHAR(24) NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}', started_at TIMESTAMPTZ NOT NULL, ended_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX traces_job_idx ON traces(tenant_id,job_id,started_at);

CREATE TABLE audit_events (
  id BIGSERIAL PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES tenants(id), actor_user_id UUID,
  action VARCHAR(100) NOT NULL, target_type VARCHAR(64) NOT NULL, target_id TEXT NOT NULL,
  input_hash VARCHAR(64), output_hash VARCHAR(64), details JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (tenant_id,actor_user_id) REFERENCES users(tenant_id,id)
);
CREATE INDEX audit_events_tenant_idx ON audit_events(tenant_id,created_at DESC);

CREATE TABLE rate_limits (
  tenant_id UUID NOT NULL REFERENCES tenants(id), user_id UUID NOT NULL, bucket VARCHAR(64) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL, count INTEGER NOT NULL, PRIMARY KEY (tenant_id,user_id,bucket),
  FOREIGN KEY (tenant_id,user_id) REFERENCES users(tenant_id,id)
);

CREATE FUNCTION reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'audit events are append-only'; END; $$;
CREATE TRIGGER audit_events_append_only BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
