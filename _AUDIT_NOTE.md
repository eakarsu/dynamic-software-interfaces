# DynamicUI Studio — Audit Note

## Stack
- Backend: Express on port **3007**, PostgreSQL DB `dynui_db`, JWT bearer auth (`Authorization: Bearer <token>`).
- Frontend: React + Vite + TypeScript SPA on port 5173, Tailwind, react-router, lucide-react.
- Login: `admin@demo.com` / `demo123`.
- AI provider: OpenRouter (model from `OPENROUTER_MODEL`, key from `OPENROUTER_API_KEY` in repo-root `.env`).
- Bootstrap: `./start.sh` (drops/creates `dynui_db`, runs schema + seed, starts backend + Vite).

## Routes registered (`backend/server.js`)
- `/api/auth` (auth.js)
- `/api/ai` (ai.js + ai_extra.js)
- `/api/ui-users`, `/api/templates`, `/api/widgets`, `/api/sessions`, `/api/customizations`, `/api/feedback`
- `/api/utility` (utility.js)

## Apply pass 3 — feature add (2026-05-07)
Added **5 AI features** (`backend/routes/ai_extra.js` + `frontend/src/pages/AIToolsPlusPage.tsx`):
- POST `/api/ai/nl-to-spec` — natural-language description -> component spec
- POST `/api/ai/palette-from-brand` — brand description -> color palette + Tailwind tokens
- POST `/api/ai/a11y-audit` — WCAG 2.2 AA audit on a component spec / JSX
- POST `/api/ai/ab-variants` — generates three A/B variants for a UI element
- POST `/api/ai/tone-rewrite` — rewrites UI copy in a target tone for a target audience

Added **3 utility features** (`backend/routes/utility.js` + `frontend/src/pages/UtilityPage.tsx`):
- GET `/api/utility/export/:table` — CSV export for `ui_users | templates | widgets | ui_sessions | customizations | feedback`
- GET `/api/utility/search?q=...&table=...` — global multi-table search/filter
- GET/POST `/api/utility/audit-log` — audit log with action/target filters; auto-logs every AI call, CSV export, and search

Schema: added `audit_log (id, user_id FK→users, action, target, payload, created_at)` with indexes on `created_at DESC` and `action`.

Frontend nav: new `Utilities` item in main nav and `AI Tools+` entry under AI Center.

## Conventions
- All new endpoints use `verifyToken` middleware.
- AI errors map to **503** when upstream returns 401/403/429/5xx OR when `OPENROUTER_API_KEY` is unset; frontend renders a friendly "AI service unavailable" banner.
- All write/expensive actions write to `audit_log` non-fatally.
- CSV export uses raw `fetch` with bearer header (binary blob); all other calls use the shared `apiFetch` helper.
- No new dependencies; no `npm install` performed.

## Smoke test results
- login → 200; export → 200 (CSV); search → 200 (multi-table); audit-log → 200 (entries logged); AI on bad key → 503 (correct).

## Log
`/Users/erolakarsu/projects/_AUDIT/apply3_logs/feature_add_dynamic-software-interfaces.md`

## Apply pass — Sample Data page (2026-05-07)
Added a **Sample Data** page with one button per main entity (skipping `users` and `audit_log`).

Backend:
- New `backend/routes/sample_data.js` mounted at `/api/admin`.
- `POST /api/admin/sample-data/:entity` → `verifyToken`, inserts 5-10 domain-realistic rows, returns `{inserted, entity}`.
- Supports: `ui_users`, `templates`, `widgets`, `ui_sessions`, `customizations`, `feedback`.
- Domain seed data covers component specs (Atlas Analytics Dashboard, Halo Developer Console, …), widgets (KPI Tile, Command Palette, Token Swatch Grid, A/B Variant Tile, …), saved customizations, and copy/feedback snippets.

Frontend:
- New `frontend/src/pages/SampleDataPage.tsx` (grid of buttons, JWT bearer, per-entity counter, toast).
- New `/sample-data` route in `App.tsx`.
- New `Sample Data` sidebar item (lucide `Database` icon) in `Layout.tsx`.

Smoke test (port 3007): login admin@demo.com/demo123 → token; `POST /api/admin/sample-data/widgets` → **200** `{"inserted":5,"entity":"widgets"}`; widgets table delta +5; rows then deleted, port released.

Log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/sample_data_dynamic-software-interfaces.md`

## Apply pass — Sample-prefill buttons on AI pages (2026-05-07)
Added 2-3 sample-prefill buttons to every AI feature page (9 features total, 27 samples).

- `frontend/src/components/AICenter.tsx` (route `/ai`, 4 features) — added inline `SampleRow` helper + per-section sample arrays (Suggest Layout, Personalize, UX Analysis, Generate Widget). Each sample's `apply()` fully populates that section's state via the existing setters.
- `frontend/src/pages/AIToolsPlusPage.tsx` (route `/ai-plus`, 5 features) — extended the shared `Section` abstraction with an optional `samples?: Sample[]` prop and an `applySample()` helper; sample-button row rendered once in the section render loop. Covers nl-to-spec, palette-from-brand, a11y-audit, ab-variants, tone-rewrite.

Samples use realistic dynamic-UI / design data: component spec descriptions ("Atlas Analytics Dashboard with KPI tiles, time-range selector, and anomaly callouts"), brand briefs ("Lumen Pay — modern fintech, minimalist, blue + amber"), copy snippets to rewrite, JSX-with-a11y-issues for the auditor, etc. Labels ≤24 chars.

Smoke test (port 3007): backend up, Vite v4.5.14 transformed both modified modules without errors, login `admin@demo.com / demo123` → 200. No deps added, no `npm install`, no changes to working code beyond samples.

Log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/samples_dynamic-software-interfaces.md`

## Apply pass — Dashboard page (2026-05-07)
Added a domain-appropriate Dashboard page that is the first sidebar item and the post-login landing route.

Backend:
- New `backend/routes/dashboard.js` mounted at `/api/dashboard` in `server.js`.
- `GET /api/dashboard/stats` (JWT-protected) returns KPI counts (component specs, widgets, design tokens, A/B variants live in last 7d via `audit_log`, recent customizations 7d, customizations total, interface users, active sessions 7d) plus the latest 10 `audit_log` rows joined to user email. All counts wrapped in a `safeScalar` helper so missing tables/cols degrade to `0`.

Frontend:
- New `frontend/src/pages/Dashboard.tsx` — 5 primary KPI cards + 3 secondary stats, Quick Actions to AI Center / Templates / Widgets / Sample Data, Recent Activity list with relative timestamps and link to `/utility`, refresh button.
- `App.tsx`: `/` now redirects to `/dashboard`; new `/dashboard` route.
- `Layout.tsx`: prepended `Dashboard` as the first sidebar entry with the lucide `LayoutDashboard` icon.

Smoke test (port 3007): backend up, login `admin@demo.com / demo123` → token; `GET /api/dashboard/stats` with bearer → **200** (kpis populated, 2 recent_activity rows). No-token → 401, bad token → 403. Port released.

No deps added, no `npm install`, existing routes/pages untouched.

Log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/dashboard_dynamic-software-interfaces.md`

## Apply pass — Merge duplicate AI sidebar entries (2026-05-07)
Consolidated the two parallel sidebar AI entries (`/ai` AICenter + `/ai-plus` AIToolsPlusPage) into a single tabbed AI Center.

- `frontend/src/components/AICenter.tsx` rewritten with a two-tab UI: **Core Tools** (Suggest Layout, Personalize, UX Analysis, Generate Widget) and **Design Tools** (NL to Component Spec, Brand to Color Palette, Accessibility Audit, A/B Variant Generator, Copy Tone Rewriter). All sample-prefill buttons and `apiFetch` calls preserved verbatim; plus-tool state namespaced (`plusState`, `plusResults`, `plusLoading`, `plusErrors`) to avoid collisions.
- `frontend/src/App.tsx`: dropped `AIToolsPlusPage` import; `/ai-plus` now `<Navigate to="/ai" replace />`.
- `frontend/src/components/Layout.tsx`: removed `AI Tools+` link; remaining link relabeled "AI Tools" → "AI Center".
- `frontend/src/pages/AIToolsPlusPage.tsx` deleted.

Smoke test (port 3007): `vite build` clean (1487 modules, 267 KB gzipped JS); `tsc --noEmit` reports only pre-existing unrelated errors in `PersonaSelector` / `PersonalizedInterface` / `SettingsPanel`; backend up, login `admin@demo.com / demo123` → **200**; port released, build artifacts cleaned. No deps added, no `npm install`.

Log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/merge_ai_dynamic-software-interfaces.md`
