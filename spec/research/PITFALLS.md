# Pitfalls Research

**Domain:** CAP + Fiori Elements + AI Core Financial Risk Analyzer
**Researched:** 2026-03-09
**Confidence:** MEDIUM-HIGH (based on project specification analysis, CAP documentation, known SAP integration patterns; web verification was partially blocked by SAP doc CDN)

## Critical Pitfalls

### Pitfall 1: Feature Column Order Mismatch Silently Produces Wrong Predictions

**What goes wrong:**
The XGBoost model expects exactly 25 numeric features in a specific column order. If the CAP action extracts features in a different order -- even with all correct values -- the model returns predictions without errors, but the predictions are meaningless. There is no runtime error, no schema validation on the `/v1/predict` endpoint, and no way to detect the bug from the output alone. The model happily ingests a 25-element array regardless of which value is in which position.

**Why it happens:**
- CDS entity fields are not guaranteed to come back in definition order from OData queries
- JavaScript object property iteration order may differ from CDS definition order
- A developer adds, removes, or reorders a field in the CDS model without updating the extraction array
- Copy-paste errors during the 24-element `FEATURE_COLUMNS` constant creation (the USE_CASE.md lists 24 features numbered 1-24, but references "25 features" everywhere -- this off-by-one itself is a trap)

**How to avoid:**
- Define `FEATURE_COLUMNS` as a single source of truth constant, referenced by both the extraction logic and any validation code
- Write a unit test that asserts the extraction array length equals the model's expected input dimension
- Add a startup health-check that sends a known input to AI Core and asserts a known output (canary prediction)
- Never rely on object key iteration order; always index explicitly from the ordered constant array

**Warning signs:**
- Model returns mostly "Normal" for data that should have anomalies (features are jumbled, model defaults to majority class)
- Accuracy metrics from the training pipeline do not match production observation
- The `FEATURE_COLUMNS` array length does not match the number documented in USE_CASE.md

**Phase to address:**
Phase 1 (Backend Scaffolding) -- the `FEATURE_COLUMNS` constant and extraction function should be the first backend artifact, with a unit test.

---

### Pitfall 2: AI Core OAuth Token Expiry and Silent Authentication Failures

**What goes wrong:**
SAP AI Core uses OAuth 2.0 client credentials flow. The access token has a finite TTL (typically 12 hours but can be shorter depending on XSUAA configuration). If the CAP backend caches a token and does not refresh it before expiry, all inference calls fail with 401. Worse, if error handling catches the 401 but returns a generic "AI Core unavailable" error, the root cause is obscured.

**Why it happens:**
- Developer hard-codes a token during local development, deploys, and forgets it expires
- Token refresh logic is missing or uses a naive "fetch once at startup" pattern
- The XSUAA token endpoint URL is environment-specific (region + subdomain) and is misconfigured when moving between dev/staging/prod
- Resource group header (`AI-Resource-Group`) is omitted or set to wrong value

**How to avoid:**
- Implement a token cache with TTL-based refresh (fetch new token when current token has < 5 minutes remaining)
- Use the `@sap-cloud-sdk/connectivity` Destination approach which handles token lifecycle automatically, OR implement manual refresh with `client_credentials` grant against the XSUAA token URL
- Add the `AI-Resource-Group` header to every AI Core request (default: `"default"`)
- Log token expiry times during development to understand the TTL
- Integration test: verify the full auth flow against AI Core, not just mocked responses

**Warning signs:**
- Inference works for the first few hours after deployment then starts failing
- Works locally (fresh token) but fails in CF/BTP (stale token)
- 401 errors in CAP logs after a period of inactivity

**Phase to address:**
Phase 2 (Backend Development) -- the `ai-core-client.js` module must implement token lifecycle from the start, not as an afterthought.

---

### Pitfall 3: Mock Data Shape Diverges from Real BDC Data Product Schema

**What goes wrong:**
The project explicitly plans to use mock data first, then wire real BDC later. When mock CSV/JSON is hand-crafted, it tends to diverge from the real `gl_features_for_ml` schema: field names get camelCased differently, numeric types become strings, null handling differs, or fields are omitted. When the real BDC destination is wired, the entire data layer breaks.

**Why it happens:**
- Mock data is created by a developer who approximates the schema rather than deriving it from the actual BDC data product metadata
- CDS entity definition drifts from the actual OData EDMX the BDC data product exposes
- BDC data products expose OData V4 with specific nullability, precision, and type conventions that hand-crafted JSON does not replicate
- The 25 feature columns have a mix of Integer, Decimal, and Boolean types -- mock data may use strings for all

**How to avoid:**
- Export the actual EDMX or metadata document from the BDC data product API and import it into CAP (`cds import <edmx>`) to generate the CDS external service definition
- If EDMX is not yet available, create mock data that strictly matches the CDS entity types (use `cds add data` to generate CSV templates from the CDS model)
- Add a validation layer in the CAP service handler that asserts feature values are numeric before sending to AI Core
- Document the expected data types for each of the 25 features alongside the `FEATURE_COLUMNS` constant

**Warning signs:**
- `cds deploy` or `cds serve` works with mock data but OData queries return empty results or type errors when BDC is wired
- Feature extraction produces `NaN` or `undefined` values in the array sent to AI Core
- AI Core returns 400 (bad request) instead of predictions

**Phase to address:**
Phase 1 (Scaffolding) -- CDS entity definitions and mock data structure must be derived from BDC metadata, not invented. Phase 3 (Integration) must include a BDC wiring smoke test.

---

### Pitfall 4: Fiori Elements Criticality Annotation Misconfiguration

**What goes wrong:**
Fiori Elements uses `@UI.Criticality` or `@UI.DataPoint` with criticality to color-code values. The criticality values are specific integers defined in the OData vocabulary: 0 = neutral, 1 = negative (red), 2 = critical (orange/yellow), 3 = positive (green). The prototype AGENTS.md defines criticality as `0 = positive/green, 1 = negative/red, 2 = critical/orange` -- but Fiori Elements interprets 0 as *neutral* (grey), not positive (green). If criticality 0 is used for "Normal" transactions, they show up grey instead of green.

**Why it happens:**
- Confusion between `CriticalityType` values (0=Neutral, 1=Negative, 2=Critical, 3=Positive) and custom integer mappings
- The comment in the prototype AGENTS.md says `0 = positive/green` which contradicts the actual Fiori semantics
- Developer tests with a small dataset and does not notice the color discrepancy
- `Criticality` can be applied as a static annotation or as a path to a property -- using the wrong approach causes it to be ignored silently

**How to avoid:**
- Use `Criticality: 3` for "Normal" (positive/green), `Criticality: 1` for high-risk (negative/red), `Criticality: 2` for medium-risk (critical/orange)
- Apply criticality as a path annotation pointing to a computed integer property on the entity, not as a static value
- Verify color rendering visually in the Fiori preview (use `cds watch` + Fiori preview)
- Reference the OData V4 vocabulary definition: `com.sap.vocabularies.UI.v1.CriticalityType`

**Warning signs:**
- "Normal" transactions display as grey/neutral instead of green
- All rows show the same color regardless of risk level
- Criticality column shows raw integers instead of colored indicators

**Phase to address:**
Phase 2 (Frontend Development) -- the annotation definition must use correct vocabulary values. The existing code comment is WRONG and must be corrected.

---

### Pitfall 5: CAP Action Handler Returns Data That Fiori Elements Cannot Render

**What goes wrong:**
The "Analyze" button triggers a CAP bound or unbound action. Fiori Elements has specific expectations for how action results are consumed: bound actions on a collection can return updated entities, but if the return type does not match what the list report expects, the UI either shows a success message with no data update, or throws a runtime error. The list report does not automatically refresh from an action result unless the response matches the entity type.

**Why it happens:**
- Developer defines the action as `returns array of String` (just the predictions) instead of returning the full entity with enriched fields
- Fiori Elements list report binds to an `EntitySet`; if the action response is not that entity type, the table does not refresh
- Side effects are not configured, so the UI does not know to re-read data after the action
- Unbound actions vs. bound actions have different UI integration patterns -- choosing the wrong one means the button does not appear where expected or the binding context is lost

**How to avoid:**
- Define the action as a bound action on the entity set that returns `array of <EntityType>` so the list report can consume the enriched results directly
- Alternatively, use `@Common.SideEffects` annotation to tell Fiori Elements to refresh the entity set after the action completes
- Test the full round-trip: button click -> action call -> response -> UI update in the Fiori preview
- Consider using an unbound `function import` for batch analysis with `SideEffects` triggering a list refresh, since the action modifies transient computed columns rather than persisted data

**Warning signs:**
- "Analyze" button click shows "Success" toast but risk columns remain empty
- Console shows `TypeError` or binding errors after action execution
- The action works in REST client (Postman/curl) but the UI does not reflect results

**Phase to address:**
Phase 2 (Frontend + Backend Development, both agents) -- the action signature and Fiori annotation must be designed together. This is the primary coordination point between backend and frontend agents.

---

### Pitfall 6: Batch Inference Timeout for Large Transaction Sets

**What goes wrong:**
The "Analyze" button sends ALL visible transactions to AI Core in a single POST. If the user has loaded 500+ GL line items (plausible for a period-close review), the payload becomes large, AI Core inference takes multiple seconds, and the CAP request times out. The default CAP/Node.js request timeout and AI Core inference latency combine to create a hard wall around 200-500 transactions.

**Why it happens:**
- Developer tests with 10-20 mock records and never encounters the timeout
- AI Core XGBoost inference scales linearly with batch size, but network overhead and JSON serialization add latency
- CAP HTTP timeout defaults may be shorter than AI Core processing time for large batches
- No pagination or chunking logic is implemented for the inference call

**How to avoid:**
- Implement batch chunking: split feature arrays into groups of 50-100, call AI Core in parallel, merge results
- Set explicit timeouts on the `fetch` call to AI Core (e.g., 30s) with retry logic for transient failures
- Add a loading indicator / progress bar in the Fiori UI for long-running analysis
- Consider server-side pagination: only analyze the currently visible page of transactions
- Set `requestTimeout` on the CAP remote service configuration if using destination-based calls

**Warning signs:**
- Analysis works with 20 records but hangs or fails with 200+
- `ETIMEDOUT` or `ESOCKETTIMEDOUT` errors in CAP logs
- Fiori UI shows indefinite loading spinner with no error feedback

**Phase to address:**
Phase 2 (Backend Development) for chunking logic; Phase 3 (Integration) for load testing with realistic data volumes.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-coded AI Core deployment URL | Works instantly in dev | Breaks on every environment change; URL includes deployment ID which changes on redeployment | Only during initial local dev; must move to env var / BTP Destination by Phase 2 |
| Inline mock data in service handler | Fast iteration | Cannot switch to real BDC without rewriting handler; mock data rots | Acceptable for Phase 1 scaffold; must use CAP csv mock pattern |
| Skip token refresh implementation | Simplifies initial AI Core integration | Production failure after token expires (12h); emergency patch | Never in code that reaches staging; implement from the start |
| Single `console.log` for errors | Quick debugging | No structured logging; cannot diagnose production issues | Only in throwaway spike code; use `cds.log` from day one |
| Return flat strings from action instead of entities | Easier action handler | Fiori cannot render results; requires frontend rewrite | Never -- design the action return type correctly from the start |
| Ignore OData `$top`/`$skip` in Analyze action | Simpler handler | Analyze button sends ALL records regardless of UI pagination; timeout at scale | Only in prototype with <50 records; address before any demo with real data |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| CAP -> AI Core HTTP | Using `node-fetch` or native `fetch` without error handling for non-JSON error responses (AI Core returns HTML error pages for some 5xx errors) | Parse response content-type header before calling `.json()`; handle HTML error responses gracefully |
| CAP -> BDC OData | Importing the EDMX but not updating it when the BDC data product schema changes | Version the EDMX file in the repo; add a CI check that compares the imported EDMX against the live BDC metadata endpoint |
| CAP -> BDC OData | Not handling `$filter` query delegation -- CAP may try to filter in-memory on large remote datasets | Ensure CDS service projections expose the same filterable fields as the remote BDC service; use `@cds.persistence.skip` correctly |
| Fiori -> CAP Action | Not declaring the action in `UI.LineItem` annotations -- button does not appear in the list report toolbar | Add `{$Type: 'UI.DataFieldForAction', Action: 'ServiceName.analyzeRisk', Label: 'Analyze'}` to the `@UI.LineItem` annotation array |
| BTP Destination | Forgetting `sap-client` header or `WebIDEUsage` property when destination targets an SAP system via BDC Connect | Configure destination properties per the BDC Connect documentation; test with `curl` against the destination before wiring to CAP |
| AI Core Resource Group | Omitting `AI-Resource-Group` header in inference requests | Always include `AI-Resource-Group: default` (or the configured group) in the HTTP headers alongside the Bearer token |
| CAP CDS -> OData V4 | Defining an entity with `UUID` key type but BDC data product uses `String` keys -- silent type coercion causes lookup failures | Match the CDS entity key type exactly to the remote service EDMX; import EDMX rather than hand-coding |
| Mock -> Real data | Mock CSV uses different column names than real BDC (e.g., `company_code` vs `CompanyCode`) | Derive mock data column names from the CDS entity definition, which itself should be derived from the BDC EDMX |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching ALL BDC records without server-side pagination | Page load takes 10+ seconds; browser memory spikes | Implement `$top/$skip` in the CDS service; Fiori Elements list report uses growing mode or pagination by default but only if the OData service supports it | > 1,000 GL line items |
| Sending entire dataset to AI Core in one POST | AI Core request timeout; 413 Payload Too Large | Chunk into batches of 50-100; parallelize chunks | > 200 transactions in a single Analyze call |
| CAP re-fetches BDC data on every action call instead of using already-loaded entities | Double network round-trip (once for list, once for analyze) | Pass entity keys to the action and re-use the already-fetched feature data from the OData context | Always wasteful, critical when BDC has latency > 500ms |
| Not setting `$select` on BDC remote service queries | Fetching all 30+ columns when list report only displays 8 | Add explicit `columns` projections in the CDS service definition | > 500 records with wide rows |
| Serializing 25 numeric features as strings in JSON | Unnecessary parsing overhead; possible precision loss for decimals | Ensure CDS types are `Decimal` or `Double`, not `String`; validate types before AI Core call | Noticeable at > 1,000 records |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| AI Core credentials (client ID/secret) hardcoded in source code or committed to git | Credential exposure; unauthorized model access | Use environment variables or BTP Destination; add `*.env` to `.gitignore`; scan commits for secrets |
| AI Core deployment URL exposed in frontend JavaScript | Attacker can call the model directly, bypassing access control | All AI Core calls go through the CAP backend; never expose the deployment URL to the browser |
| No input validation on feature values before sending to AI Core | Malformed or adversarial inputs could cause model errors or unexpected predictions | Validate that all 25 features are numeric and within expected ranges before constructing the POST body |
| BDC Destination credentials stored in `default-env.json` and committed | BDC access credentials exposed | Add `default-env.json` to `.gitignore`; use CF environment or `.env` files excluded from version control |
| No rate limiting on the Analyze action | A user (or automated script) can trigger unlimited AI Core inference calls, running up compute costs | Add basic rate limiting or debouncing at the CAP handler level; consider a cooldown period per user session |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "Analyze" button triggers inference but provides no loading feedback | User clicks repeatedly, spawning duplicate requests; thinks the app is broken | Show a `BusyIndicator` during the action; disable the button while processing; use `@Common.SideEffects` for automatic refresh |
| Risk Classification column shows raw model output (`High_Amount_Deviation`) instead of business label | Finance users do not understand ML class names | Apply the static label mapping server-side and expose `riskClassificationDisplay` as the annotated column, not the raw class name |
| Criticality colors applied inconsistently | Users cannot trust the visual risk signal; red used for both "critical" and "negative" | Map to exactly three visual states: green (Normal), yellow/orange (medium risk), red (high risk) and document the mapping |
| All 25 feature columns visible in the list report | Overwhelming; finance users do not need to see `amount_z_score` or `peer_count` | Show only the 8 business-relevant columns by default; hide feature columns or put them in a detail panel for power users |
| No explanation of WHY a transaction is risky | User sees "High Risk" but does not know what to do | The Risk Explanation column (from static label mapping) must be prominently displayed and written in business language |
| Filters default to showing ALL transactions including Normal | Most records are Normal; user must manually filter to find the risky ones | Consider defaulting the Risk Classification filter to exclude "Normal" so the initial view shows only flagged transactions |

## "Looks Done But Isn't" Checklist

- [ ] **Feature extraction:** Verify the array sent to AI Core has exactly 24 elements (per the USE_CASE.md numbered list) or 25 (per the prose) -- resolve this discrepancy before coding
- [ ] **Criticality mapping:** Verify `Criticality: 3` is used for green (positive), not `Criticality: 0` which is grey (neutral) -- the prototype AGENTS.md has this wrong
- [ ] **Token refresh:** Verify that AI Core tokens are refreshed automatically, not just fetched once at startup -- test by running the app for >12 hours
- [ ] **Action return type:** Verify the Fiori list report actually updates after "Analyze" -- not just that the action succeeds in the backend
- [ ] **i18n completeness:** Verify all 11 risk classification labels and explanations are in `i18n.properties`, not hardcoded in JavaScript
- [ ] **Error states:** Verify what happens when AI Core is down -- does the user see a meaningful error, or a blank screen?
- [ ] **Empty state:** Verify what the list report shows when BDC returns zero records -- is there a "no data" message?
- [ ] **Filter interaction:** Verify that filtering by Risk Classification works AFTER analysis (the column is populated by action, not by initial data load)
- [ ] **Mock-to-real switch:** Verify that switching from mock CSV to BDC Destination requires ONLY configuration changes, not code changes in the handler
- [ ] **`cds build` in CI:** Verify that `cds build` succeeds in a clean environment (no local `node_modules` caching)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Feature column order mismatch | MEDIUM | Redefine `FEATURE_COLUMNS` constant from the training pipeline source; add canary test; redeploy. No data loss but all past predictions are unreliable. |
| Token expiry in production | LOW | Deploy updated `ai-core-client.js` with refresh logic; no data impact, just downtime during the fix |
| Mock/real schema mismatch | HIGH | Re-derive CDS entities from EDMX; update mock data; may require re-working the service handler and Fiori annotations if field names changed |
| Criticality values wrong | LOW | Update the static mapping constant and CDS annotations; redeploy. Purely cosmetic fix. |
| Action return type wrong | HIGH | Requires coordinated changes to CDS action definition, handler return type, and Fiori annotations. May need frontend agent to rework the action button binding. |
| Batch inference timeout | MEDIUM | Implement chunking in the action handler; frontend needs loading indicator. Backend-only change if chunking is transparent. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Feature column order mismatch | Phase 1 (Scaffolding) | Unit test asserting extraction produces correct array length and order against a known input |
| AI Core token expiry | Phase 2 (Backend Dev) | Integration test that mocks token expiry and verifies refresh |
| Mock/real schema divergence | Phase 1 (Scaffolding) + Phase 3 (Integration) | CDS entity derived from EDMX; smoke test with real BDC endpoint in Phase 3 |
| Criticality annotation wrong | Phase 2 (Frontend Dev) | Visual verification: green for Normal, red for high-risk, orange for medium |
| Action return type mismatch | Phase 2 (Backend + Frontend coordination) | End-to-end test: click Analyze, verify list report updates with risk columns |
| Batch inference timeout | Phase 2 (Backend Dev) + Phase 3 (Integration) | Load test with 500 mock records; verify all get predictions within 30s |
| Hard-coded AI Core URL | Phase 2 (Backend Dev) | Code review: no hardcoded URLs; all config via env vars or destinations |
| No loading indicator on Analyze | Phase 2 (Frontend Dev) | UX review: button shows busy state during processing |
| Feature count discrepancy (24 vs 25) | Phase 1 (Scaffolding) | Count features in USE_CASE.md table, resolve discrepancy, document in code comment |

## Sources

- Project specification: `spec/PROJECT.md` -- project constraints and key decisions
- Use case definition: `../prototype/USE_CASE.md` -- AI Core model contract, feature columns, anomaly classes
- Agent instructions: `../prototype/AGENTS.md` -- criticality mapping (contains the 0/1/2 error), action handler patterns
- CAP CDS documentation: https://cap.cloud.sap/docs/cds/cdl -- action/function definitions, bound vs unbound
- CAP remote services: https://cap.cloud.sap/docs/node.js/remote-services -- timeout configuration, CSRF handling (partial fetch; docs note incompleteness)
- Fiori CriticalityType vocabulary: `com.sap.vocabularies.UI.v1.CriticalityType` (0=Neutral, 1=Negative, 2=Critical, 3=Positive) -- standard OData vocabulary definition
- SAP AI Core authentication: OAuth 2.0 client credentials flow via XSUAA -- standard BTP pattern

---
*Pitfalls research for: CAP + Fiori Elements + AI Core Financial Risk Analyzer*
*Researched: 2026-03-09*
