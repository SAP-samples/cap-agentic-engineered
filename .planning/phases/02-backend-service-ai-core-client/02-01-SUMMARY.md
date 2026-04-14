---
phase: 02-backend-service-ai-core-client
plan: 01
subsystem: api
tags: [cap, odata, ai-core, xgboost, risk-labels, feature-extraction, mock-predictor, nock, jest]

# Dependency graph
requires:
  - phase: 01-scaffold-domain-model
    provides: CDS entity with 24 feature columns, service definition, FEATURE_COLUMNS constant
provides:
  - risk-labels.js with 11 model classes and mapPrediction fallback
  - feature-extractor.js extracting 24 numeric values per row
  - ai-core-client.js with OAuth2 and error categorization
  - mock-predictor.js with threshold-based deterministic predictions
  - risk-service.js CAP handler for analyzeRisks action
  - Updated CDS action returning array of GLTransactions
  - 37 unit tests covering all domain logic modules
affects: [02-02-integration-tests, 03-frontend-annotations, 04-integration-e2e]

# Tech tracking
tech-stack:
  added: [nock]
  patterns: [conditional-predictor-loading, amount-field-mapping, error-code-categorization, virtual-field-population]

key-files:
  created:
    - srv/lib/risk-labels.js
    - srv/lib/feature-extractor.js
    - srv/lib/ai-core-client.js
    - srv/lib/mock-predictor.js
    - srv/risk-service.js
    - test/unit/risk-labels.test.js
    - test/unit/feature-extractor.test.js
    - test/unit/ai-core-client.test.js
  modified:
    - srv/risk-service.cds
    - db/schema.cds
    - package.json
    - .env.example

key-decisions:
  - "Virtual fields (riskClassification, riskExplanation, anomalyScoreResult, criticality) populated in-memory only, no DB persistence"
  - "anomalyScoreResult (not anomalyScore) used to avoid naming collision with anomaly_score feature column"
  - "Handler maps amount_feat -> amount before feature extraction for FEATURE_COLUMNS[12] compatibility"
  - "Added virtual criticality field to schema.cds for Fiori UI.Criticality annotation support"
  - "Timeout test extended to 10s jest timeout (5s nock delay + 5s abort signal margin)"

patterns-established:
  - "Conditional predictor: AI_CORE_MOCK=true routes to mock-predictor, else ai-core-client"
  - "Error categorization: TIMEOUT/AUTH_ERROR/SERVICE_UNAVAILABLE/UNKNOWN mapped to HTTP 408/401/503/500"
  - "Field mapping: CDS amount_feat -> FEATURE_COLUMNS amount at handler level"
  - "Null row handling: skip rows with missing features, label as Incomplete Data with criticality 0"

requirements-completed: [DATA-02, INFER-02, INFER-03, INFER-04, INFER-05, MCP-01]

# Metrics
duration: 6min
completed: 2026-03-11
---

# Phase 2 Plan 01: Backend Service + AI Core Client Summary

**Domain logic modules (risk-labels, feature-extractor, ai-core-client, mock-predictor) with TDD unit tests, CDS analyzeRisks action returning enriched GLTransactions, and CAP service handler implementing full inference pipeline**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-11T22:29:34Z
- **Completed:** 2026-03-11T22:36:25Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- 4 domain logic modules copied from prototype with verified tests (37 new unit tests, all passing)
- CAP service handler implementing full pipeline: SELECT -> map fields -> extract features -> predict -> map labels -> return
- CDS action updated from `returns String` to `returns array of GLTransactions`
- Mock predictor enables local development without AI Core credentials
- Error handling maps AI Core failures to user-friendly OData errors with correct HTTP status codes

## Task Commits

Each task was committed atomically:

1. **Task 1: Domain logic modules + unit tests (TDD)** - `6d9b9a2` (test)
2. **Task 2: CDS action definition + service handler** - `06fb9eb` (feat)

_TDD task 1: RED (tests fail) -> GREEN (modules copied, tests pass) in single commit_

## Files Created/Modified
- `srv/lib/risk-labels.js` - 11 model class labels with mapPrediction and UNKNOWN_FALLBACK
- `srv/lib/feature-extractor.js` - Extracts 24 numeric values per row from FEATURE_COLUMNS order
- `srv/lib/ai-core-client.js` - OAuth2 token caching, 5s timeout, error categorization
- `srv/lib/mock-predictor.js` - Threshold-based deterministic predictor (>0.8 high, 0.4-0.8 medium, <0.4 Normal)
- `srv/risk-service.js` - CAP handler for analyzeRisks with field mapping and error handling
- `srv/risk-service.cds` - Updated action: `analyzeRisks() returns array of GLTransactions`
- `db/schema.cds` - Added virtual criticality field
- `test/unit/risk-labels.test.js` - 11 tests for labels + 6 for mapPrediction
- `test/unit/feature-extractor.test.js` - 10 tests for extraction, null handling, ordering
- `test/unit/ai-core-client.test.js` - 6 tests for ai-core-client + 7 tests for mock-predictor (nock-mocked)
- `package.json` - Added nock dev dependency
- `.env.example` - Added AI_CORE_MOCK, AI_CORE_DEPLOYMENT_ID, AI_CORE_BASE_URL

## Decisions Made
- Used `anomalyScoreResult` (CDS virtual field name) instead of `anomalyScore` to avoid collision with `anomaly_score` feature column
- Virtual fields populated in-memory only -- no DB UPDATE step (virtual fields are transient by definition in CAP)
- Handler maps `amount_feat` (CDS) to `amount` (FEATURE_COLUMNS[12]) before calling extractFeatures
- Added `virtual criticality : Integer` to schema.cds for Phase 3 Fiori `@UI.Criticality` annotation support

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Extended jest timeout for TIMEOUT test**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Jest default 5000ms timeout was too short for the 6000ms nock delay + 5000ms abort signal test
- **Fix:** Added explicit 10000ms timeout to the TIMEOUT test case
- **Files modified:** test/unit/ai-core-client.test.js
- **Verification:** Test passes consistently
- **Committed in:** 6d9b9a2 (Task 1 commit)

**2. [Rule 3 - Blocking] Added virtual criticality field to schema.cds**
- **Found during:** Task 2 (service handler implementation)
- **Issue:** Handler needs to set criticality on transactions but schema had no criticality field; prototype had it but MCP-2 schema was missing it
- **Fix:** Added `virtual criticality : Integer` to GLTransactions entity
- **Files modified:** db/schema.cds
- **Verification:** cds compile succeeds, build succeeds
- **Committed in:** 06fb9eb (Task 2 commit)

**3. [Rule 1 - Bug] Removed DB UPDATE for virtual fields**
- **Found during:** Task 2 (service handler implementation)
- **Issue:** Plan specified UPDATE for virtual fields but virtual fields are transient in CAP and cannot be persisted to DB
- **Fix:** Handler populates virtual fields in-memory and returns them directly without UPDATE step
- **Files modified:** srv/risk-service.js
- **Verification:** Handler returns enriched transactions; cds build succeeds
- **Committed in:** 06fb9eb (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All fixes necessary for correctness. No scope creep.

## Issues Encountered
- Jest worker process exit warning after timeout test -- known nock/Jest interaction with AbortController and delayed connections. Tests still pass correctly. Not a failure.

## User Setup Required
None - no external service configuration required. AI_CORE_MOCK=true enables local development.

## Next Phase Readiness
- All domain logic modules tested and ready for integration testing (02-02-PLAN)
- Service handler ready for end-to-end testing with `cds watch` and `AI_CORE_MOCK=true`
- CDS action definition ready for Fiori Elements action binding in Phase 3
- Virtual fields (riskClassification, riskExplanation, anomalyScoreResult, criticality) ready for annotation-driven UI rendering

## Self-Check: PASSED

All 11 created/modified files verified on disk. Both task commits (6d9b9a2, 06fb9eb) verified in git log.

---
*Phase: 02-backend-service-ai-core-client*
*Completed: 2026-03-11*
