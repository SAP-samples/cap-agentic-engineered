---
phase: 01-scaffold-domain-model
plan: 02
subsystem: infra
tags: [cap, cds, odata-v4, jest, tdd, feature-columns, sap]

# Dependency graph
requires:
  - phase: 01-scaffold-domain-model/01-01
    provides: CDS entity risk.GLTransactions, mock CSV data, minimal RiskService
provides:
  - FEATURE_COLUMNS constant (24 column names, single source of truth for AI Core inference)
  - Jest test suite with 7 tests validating column contract
  - CDS RiskService with @readonly GLTransactions projection and analyzeRisks unbound action
  - OData V4 endpoint at /odata/v4/risk/GLTransactions serving 50 mock rows
affects: [02-backend-service, 03-frontend-annotations]

# Tech tracking
tech-stack:
  added: ["jest ^30.3.0"]
  patterns: ["TDD RED-GREEN for domain constants", "Jest with modulePathIgnorePatterns for CAP gen/ exclusion", "Unbound CDS action for service-level operations", "@readonly annotation for BDC-sourced read-only entities"]

key-files:
  created:
    - srv/lib/feature-columns.js
    - test/feature-columns.test.js
    - jest.config.js
  modified:
    - srv/risk-service.cds
    - package.json

key-decisions:
  - "FEATURE_COLUMNS[12] is 'amount' (BDC/Python name); CDS uses 'amount_feat' to avoid GL Amount collision -- Phase 2 feature extractor must map this"
  - "@readonly annotation on GLTransactions entity (BDC data is read-only)"
  - "analyzeRisks returns String as placeholder; Phase 2 will refine return type"
  - "Removed explicit @path annotation from service (CAP default /odata/v4/risk suffices)"
  - "Added modulePathIgnorePatterns to Jest config to exclude gen/ build artifacts"

patterns-established:
  - "TDD workflow: RED commit (failing tests) then GREEN commit (passing implementation)"
  - "Domain constants in srv/lib/ with corresponding test in test/"
  - "Jest test runner configured with 'npm test' script"

requirements-completed: [DATA-01, INFRA-01, MCP-01]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 1 Plan 02: Service Definition + FEATURE_COLUMNS Summary

**CDS RiskService with @readonly projection and analyzeRisks action, plus TDD-validated FEATURE_COLUMNS constant (24 columns) as single source of truth for AI Core inference**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T22:17:18Z
- **Completed:** 2026-03-11T22:21:12Z
- **Tasks:** 2 completed (Task 1 via TDD with 2 commits)
- **Files modified:** 5

## Accomplishments
- Created FEATURE_COLUMNS constant with 24 column names matching BDC/Python model contract, validated by 7 Jest tests (TDD RED-GREEN)
- Extended CDS service definition with @readonly annotation and analyzeRisks unbound action declaration
- Verified OData V4 endpoint serves 50 mock GL transactions and exposes analyzeRisks in $metadata
- Cross-plan contract documented: FEATURE_COLUMNS[12] is 'amount' but CDS field is 'amount_feat'

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: FEATURE_COLUMNS failing tests** - `64fdbf2` (test)
2. **Task 1 GREEN: FEATURE_COLUMNS implementation** - `0b20da2` (feat)
3. **Task 2: CDS service definition** - `6261d2f` (feat)

## Files Created/Modified
- `srv/lib/feature-columns.js` - 24-column constant for AI Core inference input (single source of truth)
- `test/feature-columns.test.js` - 7 Jest tests: count, order, uniqueness, cross-plan contract
- `jest.config.js` - Jest configuration with node environment and gen/ exclusion
- `srv/risk-service.cds` - RiskService with @readonly GLTransactions and analyzeRisks() action
- `package.json` - Added Jest devDependency and "test" script

## Decisions Made
- FEATURE_COLUMNS[12] = 'amount' (BDC/Python name), while CDS entity uses 'amount_feat' to avoid collision with GL Amount field. Phase 2 feature extractor must handle this mapping.
- Used @readonly on GLTransactions entity because GL data comes from BDC and should not be modified by this app.
- analyzeRisks() returns String as a placeholder return type; Phase 2 will refine based on actual handler output.
- Removed the explicit @path annotation that was on the minimal service from Plan 01-01 -- CAP's default path /odata/v4/risk is correct.
- Added modulePathIgnorePatterns to Jest config to suppress haste-map collision warnings from gen/ directory.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all tasks executed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CDS service definition ready for Phase 2 handler implementation (analyzeRisks action handler)
- FEATURE_COLUMNS constant ready for Phase 2 feature extractor to consume
- Jest test infrastructure ready for additional test suites
- OData V4 endpoint verified with 50 rows of mock data

## Self-Check: PASSED

All 4 created/modified files verified on disk. All 3 commits verified in git log.

---
*Phase: 01-scaffold-domain-model*
*Completed: 2026-03-11*
