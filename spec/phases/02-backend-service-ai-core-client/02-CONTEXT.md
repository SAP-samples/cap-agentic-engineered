# Phase 2: Backend Service + AI Core Client - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

A fully functional OData V4 service with a working AI Core inference pipeline that can be tested via curl/Postman independent of any UI. Covers: CDS bound action definition, service handler with feature extraction, AI Core HTTP client via @sap-ai-sdk/ai-api, static risk label mapping, error handling, mock mode for local development, and automated tests.

</domain>

<decisions>
## Implementation Decisions

### Action granularity
- Bound action on the GLTransactions entity set: `action analyzeRisks() returns array of GLTransactions;`
- One HTTP call per row to AI Core (not batched)
- Sequential processing (simple for loop, no parallelism)
- Results populate virtual fields only — transient, lost on page refresh (matches Phase 1 schema decision)
- Response returns full GLTransactions entities with virtual fields populated

### AI Core fallback behavior
- Fail entire batch on any error — no partial results
- Categorized user-friendly error messages via structured OData errors:
  - Timeout → "AI Core service timed out. Please try again."
  - 401/403 → "AI Core authentication expired. Contact your administrator."
  - 503 → "AI Core model is temporarily unavailable. Please try again later."
  - Unknown → Generic "Analysis failed" with logged details
- 5-second timeout per AI Core call
- Each error returns an appropriate HTTP status code (408, 401, 503, 500)

### Risk label mapping
- JS constant module (not JSON file, not CDS code list)
- 11 classes keyed by model output string
- Fiori criticality codes: 3=Positive/green (Normal), 2=Critical/orange (medium risk), 1=Negative/red (high risk)
- Unknown model classes get a default "Unknown Risk" label with criticality 2 (orange/warning)
- Display labels and explanations are hardcoded English strings (i18n externalization is a Phase 3 concern)

### AI Core SDK configuration
- All connection details via environment variables: AI_CORE_CLIENT_ID, AI_CORE_CLIENT_SECRET, AI_CORE_AUTH_URL, AI_CORE_BASE_URL, AI_CORE_RESOURCE_GROUP, AI_CORE_DEPLOYMENT_ID
- Singleton client initialization at module load time (not per-request)
- .env.example already has placeholder structure from Phase 1

### Testability without AI Core
- Dependency injection + Jest mocks for unit/integration tests
- Explicit `AI_CORE_MOCK=true` environment variable enables mock mode (not auto-detected)
- `cds watch` works locally with AI_CORE_MOCK=true — no real AI Core credentials needed for development
- Mock predictor uses threshold-based deterministic logic:
  - anomaly_score > 0.8 → rotates through high risk classes
  - anomaly_score 0.4–0.8 → medium risk classes
  - anomaly_score < 0.4 → "Normal"
- Unit tests cover: feature extraction (24 values), label mapping (all 11 classes + unknown), error categorization
- Integration tests cover: analyzeRisks action end-to-end with mocked AI Core
- Curl examples documented for manual testing (supports Phase 2 goal of "testable via curl/Postman")

### Null feature handling
- Skip rows with any null/undefined feature values — do not send to AI Core
- Skipped rows get label "Incomplete Data" with criticality 0 (neutral)
- Log a warning for skipped rows
- Other rows in the batch still get analyzed (null handling does NOT trigger batch failure)

### Logging / observability
- Structured debug logging via `cds.log` (project convention — no console.log)
- Log points: action invoked (row count), AI Core call start/end (per row with duration), errors (with categorized type)
- No prediction values or feature values logged (avoid sensitive data)
- Audit trail deferred to v2 (PROD-02)

### CDS action definition
- Bound action on GLTransactions entity: handler receives entity set context via $self
- Returns `array of GLTransactions` — full entities with virtual fields populated
- Fiori Elements can discover and bind toolbar buttons to this action in Phase 3

### Claude's Discretion
- Exact file structure within `srv/lib/` (ai-core-client.js, risk-labels.js, feature-extractor.js, or combined)
- Mock predictor implementation details beyond the threshold logic
- Exact error message wording (as long as each category is distinct and user-friendly)
- Test file organization (test per module vs grouped test files)
- .env.example additional entries for AI Core mock flag

</decisions>

<specifics>
## Specific Ideas

- The `FEATURE_COLUMNS` constant already exists at `srv/lib/feature-columns.js` — feature extraction should import and iterate this, not duplicate column names
- Risk label map draft exists in prototype AGENTS.md — use as starting point but correct criticality values to 3/2/1 scheme
- Phase 2 goal explicitly says "testable via curl/Postman independent of any UI" — curl examples are a first-class deliverable
- Mock mode should produce the same 70/20/10 distribution as the mock data (threshold logic on anomaly_score achieves this naturally)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `srv/lib/feature-columns.js`: FEATURE_COLUMNS constant (24 columns, exact order) — import for feature extraction
- `srv/risk-service.cds`: RiskService with GLTransactions projection — add analyzeRisks action here
- `db/schema.cds`: Full entity with virtual fields already declared (riskClassification, riskExplanation, anomalyScore)
- `.env.example`: Environment variable template — extend with AI Core and mock mode vars
- `tests/unit/feature-columns.test.js`: Existing unit test pattern to follow
- `tests/integration/entity-shape.test.js`: Existing CAP integration test pattern using @cap-js/cds-test

### Established Patterns
- Jest for testing with @cap-js/cds-test for CAP integration tests
- `cds.log` for logging (no console.log)
- CommonJS modules (`module.exports` / `require`)
- snake_case for feature column names (matching BDC/Python ML conventions)
- PascalCase for CDS entities, camelCase for CDS fields

### Integration Points
- CDS service: `RiskService` already has `// Note: analyzeRisks action will be added in Phase 2`
- Feature columns: `FEATURE_COLUMNS` array consumed by both extractor and existing tests
- Virtual fields: `riskClassification`, `riskExplanation`, `anomalyScore` on GLTransactions entity
- Phase 3 dependency: Fiori Elements toolbar button will bind to the `analyzeRisks` action defined here

</code_context>

<deferred>
## Deferred Ideas

- Batch prediction support (single HTTP POST with multiple rows) — optimize in Phase 4 if needed
- Parallel row processing with concurrency limits — Phase 4 optimization
- Audit trail / analysis history logging — v2 (PROD-02)
- Auto-detection of AI Core availability (vs explicit mock flag) — not needed for prototype
- Persistent analysis results (write to DB) — would require schema change, defer to v2

</deferred>

---

*Phase: 02-backend-service-ai-core-client*
*Context gathered: 2026-03-09*
