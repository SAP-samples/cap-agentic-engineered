---
phase: 03-frontend-annotations-fiori-app
plan: 02
subsystem: ui
tags: [fiori-elements, custom-action, controller-extension, sapui5, odata-v4, messagebox, i18n]

# Dependency graph
requires:
  - phase: 03-frontend-annotations-fiori-app
    provides: CDS annotations, webapp shell (index.html, Component.js, manifest.json), i18n properties
  - phase: 02-backend-service-ai-core-client
    provides: RiskService with analyzeRisks unbound action, virtual criticality field
provides:
  - Custom action handler (ListReportExt.controller.js) wiring Analyze button to analyzeRisks OData action
  - manifest.json custom action binding (bypasses DataFieldForAction silent failure pattern)
  - Busy indicator during action processing, MessageBox.error with i18n fallback for errors
  - Corrected ushell sandbox bootstrap in index.html for Fiori Elements rendering
affects: [04-01-PLAN]

# Tech tracking
tech-stack:
  added: [sap.m.MessageBox, ushell-sandbox]
  patterns: [custom action in manifest.json for unbound actions, plain object controller extension (not ES6 class), ExtensionAPI.refresh() for table rebind, oModel.bindContext("/action(...)").execute() for OData V4 action invocation]

key-files:
  created:
    - app/risks/webapp/ext/controller/ListReportExt.controller.js
  modified:
    - app/risks/webapp/manifest.json
    - app/risks/annotations.cds
    - app/risks/webapp/index.html

key-decisions:
  - "Custom action in manifest.json instead of DataFieldForAction -- proven pattern from prototype, avoids silent failure for unbound actions"
  - "ExtensionAPI.refresh() instead of manual table ID lookup for binding refresh -- more reliable across FE versions"
  - "No success toast after Analyze -- color-coded rows are the feedback (locked decision)"
  - "ushell sandbox bootstrap required for Fiori Elements rendering -- ComponentSupport alone shows blank page"
  - "Error handler uses direct oError.message when available, falls back to i18n analyzeError key -- no hardcoded English strings"

patterns-established:
  - "Fiori Elements V4 custom action: plain object with sap.ui.define, handler receives (oBindingContext, aSelectedContexts), this = ExtensionAPI"
  - "OData V4 unbound action call: oModel.bindContext('/actionName(...)').execute() returns Promise"
  - "Busy indicator via innerTable ID pattern: {appId}::{viewName}--fe::table::{entitySet}::LineItem-innerTable"
  - "ushell sandbox bootstrap: sap-ushell-config with renderer=fiori2, then sap/ushell/bootstrap/sandbox.js"

requirements-completed: [INFER-01, MCP-01, UI-03]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 3 Plan 02: Custom Action Handler Summary

**Custom action controller extension wiring Analyze button to analyzeRisks OData V4 action with busy indicator, MessageBox.error with i18n fallback, and ExtensionAPI.refresh() -- using manifest.json custom action pattern (not DataFieldForAction) per proven prototype fix**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T23:01:00Z
- **Completed:** 2026-03-11T23:05:00Z
- **Tasks:** 2 (1 auto + 1 checkpoint)
- **Files modified:** 4

## Accomplishments
- Created ListReportExt.controller.js with onAnalyze handler using sap.ui.define plain object pattern (not ES6 class), busy indicator on inner table, OData V4 action invocation via bindContext/execute, ExtensionAPI.refresh() for table rebind, MessageBox.error with i18n-externalized fallback
- Updated manifest.json with custom action `analyzeAction` referencing ListReportExt.onAnalyze, requiresSelection: false (action processes all loaded rows)
- Removed DataFieldForAction from annotations.cds LineItem (replaced by custom action per AGENTS.md proven pattern -- DataFieldForAction silently fails for unbound actions)
- Fixed index.html bootstrap to use ushell sandbox (was blank page with ComponentSupport alone)
- All 90 tests pass, cds build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Custom action handler + manifest wiring via UI5 MCP** - `8a3609a` (feat)
2. **Task 2: Visual verification** - checkpoint approved (no commit -- verification only)

Additional fix commit:
- **index.html bootstrap fix** - `651d386` (fix)

## Files Created/Modified
- `app/risks/webapp/ext/controller/ListReportExt.controller.js` - Custom action handler: onAnalyze calls analyzeRisks via OData V4 bindContext/execute, sets busy indicator, refreshes via ExtensionAPI.refresh(), shows MessageBox.error with i18n fallback on failure
- `app/risks/webapp/manifest.json` - Added custom action `analyzeAction` in controlConfiguration actions block, referencing ListReportExt.onAnalyze with requiresSelection: false
- `app/risks/annotations.cds` - Removed DataFieldForAction for analyzeRisks from LineItem array; added comment explaining custom action pattern
- `app/risks/webapp/index.html` - Replaced ComponentSupport bootstrap with ushell sandbox bootstrap (sap-ushell-config + sandbox.js) required for Fiori Elements rendering

## Decisions Made
- **Custom action over DataFieldForAction:** Used manifest.json custom action pattern per AGENTS.md and prototype experience. DataFieldForAction can silently fail for unbound actions -- button renders but clicks do nothing. Custom action is the proven reliable pattern.
- **ExtensionAPI.refresh() for table rebind:** Instead of manually looking up list binding by ID, used the ExtensionAPI.refresh() method which handles table rebinding across FE versions.
- **No success toast:** Per locked decision, color-coded rows (via criticality) serve as the visual feedback after analysis. No MessageToast.show() on success.
- **ushell sandbox bootstrap:** Fiori Elements requires the ushell container for proper rendering. Plain ComponentSupport bootstrap results in a blank page. Fixed with sap-ushell-config and sandbox.js loader.
- **Error fallback chain:** Try JSON-parsing the error message first (structured OData errors), then use raw error.message if available, finally fall back to i18n `analyzeError` key -- ensures no hardcoded English strings reach the user.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed index.html bootstrap for Fiori Elements rendering**
- **Found during:** Task 2 (visual verification checkpoint)
- **Issue:** index.html used `sap/ui/core/ComponentSupport` bootstrap which does not initialize the ushell container needed by Fiori Elements. App showed blank page.
- **Fix:** Replaced with ushell sandbox bootstrap: added `window["sap-ushell-config"]` for fiori2 renderer and loaded `sap/ushell/bootstrap/sandbox.js` before placing component in ushell container
- **Files modified:** app/risks/webapp/index.html
- **Verification:** App renders correctly in browser with cds watch
- **Committed in:** `651d386`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for app to render. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 complete: Full Fiori Elements V4 List Report with CDS annotations, webapp shell, and custom action handler
- Ready for Phase 4: Integration + End-to-End wiring (SideEffects, visual verification via Playwright)
- The Analyze button calls analyzeRisks, refreshes the table, shows errors -- Phase 4 will add SideEffects for automatic refresh and KPI header
- All 90 tests pass including annotation, manifest, and i18n test scaffolds

## Self-Check: PASSED

All created/modified files verified present on disk. Both commits (8a3609a, 651d386) verified in git log. 90/90 tests pass.

---
*Phase: 03-frontend-annotations-fiori-app*
*Completed: 2026-03-11*
