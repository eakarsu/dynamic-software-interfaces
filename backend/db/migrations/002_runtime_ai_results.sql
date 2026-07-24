CREATE TABLE runtime_ai_results (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  feature TEXT NOT NULL,
  input JSONB NOT NULL,
  output TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (tenant_id,user_id) REFERENCES users(tenant_id,id)
);
CREATE INDEX runtime_ai_results_tenant_idx ON runtime_ai_results(tenant_id,created_at DESC);
