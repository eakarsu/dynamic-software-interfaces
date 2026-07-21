# Completeness Review: dynamic-software-interfaces

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 120 project files (101 source files), 3 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Prototype-demo**

This is a prototype/demo for AI/agent platform. Generated gap/demo patterns are present: it contains 101 source files and visible routes/pages in `frontend/`, `backend/`, `src/`, but those surfaces are not evidence of durable domain execution, verified integrations, or operational completion.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Replace generic prompt wrappers with typed domain tools, grounded retrieval, provenance, and schema-validated outputs.
2. Add tenant-scoped connectors, permission-aware indexing, incremental sync, deletion propagation, and source freshness indicators.
3. Implement evaluation datasets, quality/safety gates, cost and latency budgets, tracing, and human approval checkpoints.
4. Run tools in isolated jobs with timeouts, retries, idempotency, rate limits, and auditable input/output records.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `frontend/src/App.tsx:39`
- `backend/db/seed.sql:155`
- `backend/server.js`
- `src/App.tsx`
- `package.json`
- `start.sh`

## Recommended next action

Stop adding generated pages; prove one AI/agent platform workflow against real services and persistent state, with tests and measurable acceptance criteria.

## Implementation progress (2026-07-20)

Implemented in source on 2026-07-20:

- Consolidated the three overlapping demos into one supported tenant workflow: encrypted incremental connector → ACL/version-preserving index with deletion tombstones and freshness → typed grounded interface-proposal job → deterministic quality/cost/latency gates → independent reviewer approval. Removed the generic prompt wrappers, mock/sample data, generated gap/Codex/visualization routes, duplicate root frontend, destructive schema/seed path, and demo credentials.
- Added tenant-scoped users, roles, revocable eight-hour HTTP-only sessions, strict origin/CORS handling, tenant-isolated connectors/jobs/evaluations/audit, permission groups, encrypted connector credentials, secret rotation/disable flows, source ACL enforcement, incremental cursors, transactional sync pages, deletion propagation, source versions/hashes, and operator freshness indicators.
- Added the strict `grounded_interface_proposal` input/output contracts, an allowlisted component registry, permission-aware full-text retrieval, stale/no-source failure, untrusted-source prompt-injection boundary, provider JSON Schema mode, exact provenance for model/request/tokens/source version/hash/index/sync time, and deterministic grounding/safety gates. Invalid or unsupported output is never exposed for approval.
- Added separate leased workers using `FOR UPDATE SKIP LOCKED`, lease recovery, bounded connector/provider requests, attempts/backoff, idempotency conflicts, persistent rate-limit buckets, cost/latency budgets, trace spans, auditable input/output hashes, failure codes, and append-only audit triggers. Generation stops at `awaiting_approval`; creators cannot approve their own work.
- Added tenant evaluation datasets and queued evaluation runs measuring expected primitives, grounding, safety, latency, total cost, and configured pass thresholds. Added a focused UI for source freshness/sync, grounded job submission/status/review, and quality-gate runs rather than restoring generated feature pages.
- Added versioned migration with unversioned-legacy refusal, explicit account provisioning, safe startup/migrate/backup/guarded-restore scripts, locked modern dependencies, non-root read-only container/Compose deployment, migration and worker services, health checks, CI migration/lint/typecheck/test/build/audit/container/gitleaks gates, and provider/operations/legacy-recovery runbooks.
- Verified on a disposable PostgreSQL 17 server with local connector and AI contract servers: clean migration and 10/10 unit/integration/API/worker tests passed, covering strict schemas, safety rejection, incremental sync, tombstone deletion, tenant isolation, source ACL denial/allow, duplicate jobs, grounded provenance, independent approval, invalid-output and cost failures, evaluation gates, and database audit immutability. ESLint, TypeScript, Vite production build, Compose validation, npm audit (0 vulnerabilities), gitleaks (0 findings), shell syntax, and diff checks passed. The local Docker image build could not run only because the Docker/Colima daemon was stopped; CI is configured to perform it.

Remaining external launch gates are real connector/AI-provider certification and credentials, production tenant/ACL mapping, credential rotation, privacy/data-processing approval, prompt-injection red-team evidence, load/failover and restore exercises, accessibility/security review, cost ownership, and named incident/reviewer owners. These approvals and external systems cannot be completed in source code.

## Isolated startup and login verification (2026-07-20)

The no-argument launcher now starts the API, requires and validates the assigned port, binds only to `127.0.0.1`, refuses occupied/default ports, and avoids project `.env` override in isolated acceptance. Account creation is a separate acknowledgement-gated operation that consumes validator credentials, creates the runtime tenant when absent, and refuses to replace an existing tenant/email account.

On disposable PostgreSQL `55643`, the API started on `6096`; the provisioned tenant administrator completed real database-backed login, received the constrained cookie session, and passed the authenticated `/api/auth/me` revalidation on the first attempt: `API_VERIFIED/startup_login_session_api`. ESLint, TypeScript, the Vite production build, and all 10/10 unit/integration/API/worker tests passed after clean migration. Ports `55643`, `6096`, and `6097` were free after cleanup.
