---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in-progress
stopped_at: Completed 03-02-PLAN.md
last_updated: "2026-03-12T01:02:16.500Z"
last_activity: 2026-03-11 — Custom action handler wiring Analyze button to analyzeRisks OData action
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 7
  completed_plans: 6
  percent: 86
---

# Project State

## Project Reference

See: spec/PROJECT.md (updated 2026-03-10)

**Core value:** Finance teams can see which GL transactions are risky in a single Fiori list report with one-click ML inference
**Methodology:** MCP-first — every SAP artifact validated against SAP MCP servers before writing
**Target directory:** `prototype-mcp/`
**Current focus:** Phase 3 complete, Phase 4 next

## Current Position

Phase: 3 of 4 — Frontend Annotations + Fiori App (COMPLETE)
Plan: 6 of 7 complete (Phase 3 done, Phase 4 next)
Status: Phase 3 complete, ready for Phase 4
Last activity: 2026-03-11 — Custom action handler wiring Analyze button to analyzeRisks OData action

Progress: [########░░] 86%

## Accumulated Context

### Decisions

Carried forward from original prototype/ build (domain decisions still apply):
- Criticality mapping: 3=green (Normal), 2=orange, 1=red
- 24 feature columns in snake_case (matches BDC/Python conventions)
- AI Core client uses direct fetch() with OAuth2 (not @sap-ai-sdk/ai-api management APIs)
- analyzeRisks is a service-level (unbound) action
- Mock predictor uses rotation indexes for deterministic output
- Feature columns as single source of truth constant

New for MCP-first build:
- MCP-first methodology: query SAP MCP server before writing any SAP framework code
- Domain logic reused from ../prototype/ (no SAP dependency): feature-columns.js, risk-labels.js, mock-predictor.js, ai-core-client.js, feature-extractor.js
- Single-agent sequential execution (no worktree parallelism)

Plan 01-01 decisions:
- Used @cap-js/sqlite (CAP 9.x plugin) for SQLite, in-memory for development
- Virtual field anomalyScoreResult (not anomalyScore) avoids collision with anomaly_score feature
- Feature field amount_feat avoids collision with GL Amount field
- Minimal service definition added to satisfy OData endpoint must_haves

Plan 01-02 decisions:
- FEATURE_COLUMNS[12] is 'amount' (BDC/Python); CDS uses 'amount_feat' -- Phase 2 must map
- @readonly on GLTransactions (BDC data is read-only for this app)
- analyzeRisks returns String placeholder; Phase 2 refines return type
- Removed explicit @path on service (CAP default /odata/v4/risk suffices)
- Jest modulePathIgnorePatterns excludes gen/ build artifacts

Plan 02-01 decisions:
- Virtual fields populated in-memory only, no DB persistence (virtual = transient in CAP)
- anomalyScoreResult used for virtual field (not anomalyScore) to avoid collision with anomaly_score
- Handler maps amount_feat -> amount before feature extraction for FEATURE_COLUMNS[12]
- Added virtual criticality field to schema.cds for Fiori UI.Criticality support
- Timeout test extended to 10s jest timeout (nock delay margin)

Plan 02-02 decisions:
- Used @cap-js/cds-test for in-memory CAP server bootstrap (real server, real handlers, CSV data)
- Integration test pattern: process.env.AI_CORE_MOCK='true' before require, cds.test('serve','--in-memory')
- 5 focused integration tests covering full analyzeRisks pipeline end-to-end

Plan 03-01 decisions:
- criticality field already existed in db/schema.cds from Phase 2 -- skipped extend in srv/risk-service.cds
- Used anomalyScoreResult (not anomalyScore) as DataPoint Value path to avoid collision with anomaly_score feature column
- DataFieldForAnnotation for anomaly score progress bar instead of plain DataField
- CDS compiler flattens structured annotations: tests use @UI.HeaderInfo.TypeName not @UI.HeaderInfo as nested object
- CDS compiler enum format: { "#": "High" } not "#High" -- tests handle both formats

Plan 03-02 decisions:
- Custom action in manifest.json instead of DataFieldForAction -- proven pattern from prototype, avoids silent failure for unbound actions
- ExtensionAPI.refresh() instead of manual table ID lookup for binding refresh -- more reliable across FE versions
- No success toast after Analyze -- color-coded rows are the feedback (locked decision)
- ushell sandbox bootstrap required for Fiori Elements rendering -- ComponentSupport alone shows blank page
- Error handler uses direct oError.message when available, falls back to i18n analyzeError key -- no hardcoded English strings

### Pending Todos

None yet.

### Blockers/Concerns

- SAP MCP server tools (cap, fiori, ui5) must be accessible in Claude Code session
- BDC EDMX not yet available — CDS entity hand-authored from USE_CASE.md docs

## Performance Metrics

| Phase-Plan | Duration | Tasks | Files |
|------------|----------|-------|-------|
| 03-01      | 5min     | 3     | 9     |
| 03-02      | 4min     | 2     | 4     |

## Session Continuity

Last session: 2026-03-12T01:02:16Z
Stopped at: Completed 03-02-PLAN.md
Resume file: spec/phases/03-frontend-annotations-fiori-app/03-02-SUMMARY.md
