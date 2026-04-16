# Phase 1: Scaffold + Domain Model - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

A running CAP project with the complete domain model, mock data, and project infrastructure so that backend and frontend agents can work independently. Covers: CDS entity model matching the BDC data product schema, mock CSV data for local development, FEATURE_COLUMNS constant as single source of truth, environment config templates, and git worktree documentation for 3-agent parallel execution.

</domain>

<decisions>
## Implementation Decisions

### Mock data design
- ~50 rows of GL transactions in CSV format
- Realistic skew distribution: ~70% Normal, ~20% medium risk (Rare Pattern, Weekend Entry, Backdated Entry), ~10% high risk (Unusual Amount, New Pattern + Weekend, etc.)
- SAP-realistic field values: company codes like 1000/2000, GL accounts like 400000/600000, cost centers like CC1000
- Clean data only — no edge cases (no zero amounts, negative reversals, or intentional anomalies). All positive amounts, weekday-heavy, typical transaction patterns.

### CDS entity structure
- Single flat entity (not normalized) — matches the flat shape of the BDC `gl_features_for_ml` data product
- SAP composite primary key: CompanyCode + FiscalYear + DocumentNumber + LineItem (mirrors SAP document model)
- Risk result fields (riskClassification, riskExplanation, anomalyScore) are **virtual/transient** — not persisted, populated in-memory by the Analyze action. Results do not survive page refresh.
- All 24 feature columns are inline on the same entity (no separate FeatureSet entity)

### Feature column count
- **24 features, not 25** — USE_CASE.md table and CLAUDE.md code arrays both enumerate exactly 24 columns. The "25" references in prose (REQUIREMENTS.md, ROADMAP.md, prototype CLAUDE.md) are documentation errors.
- Fix all docs (REQUIREMENTS.md, ROADMAP.md, prototype CLAUDE.md success criteria) to say 24 for consistency
- FEATURE_COLUMNS constant is the single source of truth for column names and order

### Project folder layout
- CAP project initialized in this directory (not repo root) — clean separation from ref-arch documentation
- Standard CAP folder structure: `db/` (schema + mock data CSV), `srv/` (services + handlers), `app/` (Fiori Elements app)
- Git worktrees as sibling directories: `../prototype-backend` (branch `feature/backend`) and `../prototype-frontend` (branch `feature/frontend`)
- `.env.example` template with placeholder values and comments for AI Core credentials; `.env` and `default-env.json` gitignored

### Claude's Discretion
- Exact CDS field types and lengths for GL fields (String length, Decimal precision)
- Mock data content details (specific GL account numbers, posting dates, amounts) as long as they follow SAP-realistic patterns
- package.json dependency versions
- .gitignore contents beyond .env and default-env.json
- README structure and content for the prototype

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The decisions above provide sufficient guidance for research and planning.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this directory contains only CLAUDE.md and USE_CASE.md. This is a greenfield scaffold.

### Established Patterns
- CDS naming: PascalCase entities, camelCase fields (from CONVENTIONS.md)
- CAP logging: `cds.log` not `console.log` (from CONVENTIONS.md)
- Module system: `sap.ui.define` for SAPUI5, CommonJS/ES6 for CAP handlers
- Environment config: environment variables for all secrets, never hardcoded

### Integration Points
- AI Core prediction URL: environment variable `AI_CORE_PREDICTION_URL`
- BDC data product: `shared_analytics.finance_risk.gl_features_for_ml` (mocked in Phase 1, real connection in Phase 4)
- Feature extraction order: FEATURE_COLUMNS constant consumed by Phase 2 action handler
- CDS entity schema: consumed by Phase 3 Fiori Elements annotations

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-scaffold-domain-model*
*Context gathered: 2026-03-09*
