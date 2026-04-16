# Project Research Summary

**Project:** Financial Risk Analyzer
**Domain:** CAP + Fiori Elements application with SAP AI Core ML inference
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

This project is a SAP CAP + Fiori Elements list report that visualizes XGBoost anomaly predictions on GL transactions sourced from SAP Business Data Cloud. Experts build this type of application using an annotation-driven Fiori Elements frontend (zero custom UI controllers), a thin CAP OData V4 service layer that projects from a remote BDC data product, and an isolated AI Core HTTP client for on-demand inference. The stack is well-established: CAP v8, SAPUI5 1.120+, direct HTTP POST to AI Core (not the foundation model SDK, since XGBoost is a custom Docker container). The architecture naturally separates into four layers -- domain model, backend service, frontend annotations, and integration wiring -- which maps cleanly to a phased build with parallel agent execution.

The recommended approach is mock-first development: define the CDS entity schema derived from the BDC data product metadata, populate it with CSV mock data, and build the entire frontend and backend against mocks. The BTP Destination wiring to real BDC comes last. The "Analyze" button triggers a CAP bound action that extracts exactly 25 ordered numeric features, POSTs them to AI Core, maps the 11 class labels to business-language text with Fiori criticality codes, and returns enriched entities that the list report renders with color coding. Static label mapping (no GenAI) keeps the inference path deterministic, fast, and free of hallucination risk.

The top risks are: (1) feature column order mismatch silently producing wrong predictions -- mitigate with a single-source-of-truth FEATURE_COLUMNS constant and a canary unit test; (2) OAuth token expiry causing inference failures hours after deployment -- mitigate with TTL-based token caching from day one; (3) the CAP action return type not matching what Fiori Elements expects, causing the UI to show "Success" while risk columns remain empty -- mitigate by designing the action signature and SideEffects annotation together before coding. A documented bug exists in the project's own CLAUDE.md: criticality value 0 is described as "positive/green" but Fiori Elements interprets it as "neutral/grey". The correct mapping is 3=positive (green).

## Key Findings

### Recommended Stack

The stack is SAP CAP v8 (Node.js) for the backend, Fiori Elements list report on SAPUI5 1.120+ for the frontend, and direct HTTP POST with OAuth2 client credentials for AI Core inference. All package versions are verified via npm registry. The critical "what NOT to use" finding: `@sap-ai-sdk/foundation-models` is wrong for this project because the XGBoost model is a custom Docker container, not a foundation model. Similarly, custom charting libraries (D3.js, Highcharts) and custom UI5 controllers are anti-patterns for an annotation-driven Fiori Elements app.

**Core technologies:**
- **@sap/cds v8 + @sap/cds-dk v8:** CAP runtime and dev toolkit -- standard for OData V4 services on BTP
- **SAPUI5 1.120+ (CDN) + Fiori Elements:** Annotation-driven list report floorplan -- zero custom controller code
- **Direct HTTP POST to AI Core:** Custom XGBoost container uses raw fetch with OAuth2, not the AI SDK
- **@cap-js/sqlite:** Local dev database for mock-first development with `cds watch`
- **MCP servers (cap, fiori, ui5):** Design-time guidance for CDS, annotations, and UI5 patterns

### Expected Features

**Must have (table stakes -- P1):**
- Tabular GL transaction list with filter bar, sorting, and export to spreadsheet (all free from Fiori Elements)
- Risk classification per transaction with color-coded severity via `@UI.Criticality`
- Human-readable risk explanations from static 11-class label mapping
- Anomaly score column (continuous 0-1 value)
- "Analyze" toolbar action button triggering CAP action -> AI Core inference
- Loading indicator during inference and structured error handling for AI Core failures
- i18n externalization for all user-facing strings

**Should have (differentiators -- P2):**
- Analytical chart header showing risk distribution (donut/bar via `@UI.Chart`)
- Variant management for saved filter/sort configurations
- Transaction detail object page with risk factor breakdown
- KPI header (total transactions, high-risk count/percentage)
- Anomaly score threshold slider (range filter)

**Defer (v2+):**
- Audit trail / analysis history (requires schema extension)
- User feedback collection for false positives
- Role-based access control (XSUAA)
- Scheduled batch analysis
- SAP Process Automation integration

**Explicitly rejected (anti-features):**
- GenAI chat copilot (deterministic labels are better -- no hallucination, no cost)
- Real-time streaming inference (user-initiated batch is sufficient)
- Model retraining from UI (separate MLOps concern)
- Custom D3.js/Highcharts dashboards (breaks Fiori Elements paradigm)

### Architecture Approach

The architecture is a four-layer stack: Fiori Elements frontend (annotation-driven, no custom controllers) communicating via OData V4 to a CAP service layer that delegates reads to a BDC remote service (mocked in dev, BTP Destination in prod) and delegates inference to an isolated AI Core HTTP client. The risk label mapper is a pure stateless module. All AI Core communication -- OAuth token exchange, feature extraction, HTTP POST, error handling -- is encapsulated in `srv/lib/ai-core-client.js`. UI annotations live in `app/risks/annotations.cds`, separated from service definitions.

**Major components:**
1. **Fiori Elements List Report** (`app/risks/`) -- renders table, filters, "Analyze" button, criticality colors via CDS annotations
2. **CAP OData Service** (`srv/risk-service.cds` + `.js`) -- entity projection from BDC, `analyzeRisks` bound action implementation
3. **AI Core Client** (`srv/lib/ai-core-client.js`) -- OAuth token lifecycle, feature extraction in exact column order, HTTP POST to `/v1/predict`
4. **Risk Label Mapper** (`srv/lib/risk-labels.js`) -- static 11-class lookup: model output -> display label + explanation + criticality integer
5. **BDC Remote Service** (`srv/external/`) -- imported CDS definition with mock CSV data, production switch via `[production]` profile
6. **CDS Domain Model** (`db/schema.cds`) -- canonical entity matching `gl_features_for_ml` schema

### Critical Pitfalls

1. **Feature column order mismatch** -- XGBoost accepts any 25-element array without validation; wrong order produces silent wrong predictions. Fix: define `FEATURE_COLUMNS` as a single constant with a unit test asserting length and order against a known input/output canary.
2. **OAuth token expiry** -- tokens expire after ~12 hours; "fetch once at startup" pattern causes production failure. Fix: implement TTL-based token cache with proactive refresh when <5 minutes remain.
3. **Action return type mismatch with Fiori Elements** -- if the CAP action returns strings instead of full entity types, Fiori shows "Success" but risk columns stay empty. Fix: return `array of <EntityType>` and/or configure `@Common.SideEffects` to trigger list refresh.
4. **Criticality annotation bug** -- project CLAUDE.md says `0=positive/green` but Fiori interprets 0 as neutral/grey. Fix: use `3` for positive (green), `1` for negative (red), `2` for critical (orange).
5. **Mock data schema drift from real BDC** -- hand-crafted CSV diverges from actual BDC EDMX in field names, types, nullability. Fix: derive CDS entity from imported EDMX; use `cds add data` for CSV templates.
6. **Batch inference timeout at scale** -- 500+ transactions in a single AI Core POST causes timeout. Fix: chunk into batches of 50-100 and parallelize.

## Implications for Roadmap

Based on the dependency analysis across all four research files, the build naturally splits into four phases with explicit parallelism in the middle.

### Phase 1: Scaffold + Domain Model
**Rationale:** Everything depends on the CDS entity definition. The service projects from it. The frontend annotates it. Mock data populates it. Without the schema, nothing compiles.
**Delivers:** `cds init` project structure, `db/schema.cds` matching `gl_features_for_ml`, mock CSV data, `package.json` with CDS configuration, `FEATURE_COLUMNS` constant with unit test. `cds watch` starts and serves mock data at `/odata/v4/risk/GLTransactions`.
**Addresses:** Foundation for all P1 features; resolves mock data shape upfront.
**Avoids:** Feature column order mismatch (Pitfall 1), mock/real schema divergence (Pitfall 3), feature count discrepancy (24 vs 25 -- must be resolved here).

### Phase 2a: Backend Service + AI Core Client (parallel with 2b)
**Rationale:** The service handler and AI Core client depend only on the domain model from Phase 1. Can be built and tested independently of the frontend via curl/Postman.
**Delivers:** `srv/risk-service.cds` with entity projection and `analyzeRisks` action, `srv/risk-service.js` handler, `srv/lib/ai-core-client.js` with OAuth token lifecycle and batch chunking, `srv/lib/risk-labels.js` with correct criticality values (3=green, 1=red, 2=orange). OData endpoint callable via REST.
**Uses:** @sap/cds v8, direct HTTP POST to AI Core, OAuth2 client credentials.
**Avoids:** Token expiry (Pitfall 2), hardcoded URLs, batch timeout (Pitfall 6).

### Phase 2b: Frontend Annotations + Fiori App (parallel with 2a)
**Rationale:** Fiori Elements only needs the CDS entity schema and annotations to render. It does not need the handler implementation. The "Analyze" button appears but will not function until backend integration.
**Delivers:** `app/risks/annotations.cds` with `@UI.LineItem`, `@UI.SelectionFields`, `@UI.DataFieldForAction`, `@UI.Criticality`. `manifest.json`, `Component.js`, `i18n/i18n.properties`. List report renders with mock data, columns, filters, export, sorting all work.
**Addresses:** All table-stakes UI features (tabular list, filter bar, sorting, export, color coding, i18n).
**Avoids:** Criticality annotation bug (Pitfall 4 -- use correct vocabulary values), annotations-in-service-CDS anti-pattern.

### Phase 3: Integration + End-to-End Testing
**Rationale:** Requires both backend and frontend to be complete. This is where the action return type and Fiori rendering are validated together -- the most critical coordination point.
**Delivers:** Working "Analyze" button with end-to-end flow (click -> AI Core inference -> color-coded results). BDC mock-to-real switchover validation. Load testing with 500+ records.
**Addresses:** Remaining P1 features (action integration, loading indicators, error states). Validates action return type matches Fiori expectations.
**Avoids:** Action return type mismatch (Pitfall 5), batch timeout at realistic volumes.

### Phase 4: Differentiators (v1.x)
**Rationale:** P2 features add value but depend on a working P1 foundation. Each is independently valuable and can be added incrementally.
**Delivers:** Analytical chart header (requires `@Aggregation.ApplySupported`), variant management (manifest toggle), transaction detail object page, KPI header, anomaly score threshold slider.
**Addresses:** All P2 differentiator features.

### Phase Ordering Rationale

- **Phase 1 must be first** because every other component depends on the CDS entity definition. This is the research consensus across ARCHITECTURE.md (build order) and PITFALLS.md (feature column order must be locked early).
- **Phases 2a and 2b are parallel** because Fiori Elements only needs the schema/annotations to render, not the handler implementation. This enables the 3-agent pattern: orchestrator does Phase 1, backend agent does 2a, frontend agent does 2b simultaneously.
- **Phase 3 must follow both 2a and 2b** because action integration is the primary cross-cutting concern. The action return type (backend) and SideEffects annotation (frontend) must be validated together.
- **Phase 4 is incremental** -- each differentiator feature is independent and can be added in any order after the core works.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2a (AI Core Client):** The OAuth token lifecycle, AI-Resource-Group header, and batch chunking strategy need validation against the actual AI Core deployment. The exact feature count (24 vs 25) must be resolved by inspecting the model contract.
- **Phase 3 (Integration):** The CAP bound action return type and Fiori Elements SideEffects interaction is the highest-risk coordination point. Research the exact `@Common.SideEffects` annotation syntax for OData V4 list report refresh.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Scaffold):** `cds init`, entity definition, mock CSV -- thoroughly documented in CAP guides.
- **Phase 2b (Frontend):** Fiori Elements list report annotations are well-established and stable. MCP servers provide real-time guidance.
- **Phase 4 (Differentiators):** Chart annotations, variant management, object page are standard Fiori Elements patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry. CAP v8 + Fiori Elements is the standard SAP stack. |
| Features | HIGH | Core Fiori Elements capabilities well-documented. Feature prioritization aligned with project scope. |
| Architecture | HIGH | CAP project structure, remote services, and Fiori integration follow official CAP documentation patterns. |
| Pitfalls | MEDIUM-HIGH | Based on project spec analysis and known SAP integration patterns. Some SAP doc CDN pages were not fully accessible during verification. |

**Overall confidence:** HIGH

### Gaps to Address

- **Feature count discrepancy (24 vs 25):** USE_CASE.md lists 24 numbered features but references "25 features" in prose. Must be resolved by inspecting the actual model input schema before Phase 2a coding begins.
- **BDC EDMX availability:** The BTP Destination for BDC Connect is not yet configured. If the EDMX cannot be imported, the CDS entity must be hand-authored from USE_CASE.md documentation. Validate schema alignment when BDC becomes available.
- **AI Core deployment URL stability:** Custom Docker deployments on AI Core get new URLs when redeployed. Environment variable approach handles this, but the current deployment URL must be confirmed before integration testing.
- **Aggregation support for charts:** Phase 4 chart/KPI features require `@Aggregation.ApplySupported` in the OData service. This needs validation with CAP v8 + SQLite to confirm `$apply` queries work correctly.

## Sources

### Primary (HIGH confidence)
- CAP Documentation: https://cap.cloud.sap/docs/ -- project structure, remote services, Fiori integration, CDS actions
- SAP AI SDK JS: https://github.com/SAP/ai-sdk-js -- confirmed foundation-models SDK is wrong for custom containers
- npm registry -- package versions verified for @sap/cds v8, @sap/cds-dk v8, @cap-js/sqlite
- OData V4 UI Vocabulary: `com.sap.vocabularies.UI.v1.CriticalityType` -- 0=Neutral, 1=Negative, 2=Critical, 3=Positive

### Secondary (MEDIUM confidence)
- Fiori Design Guidelines (list report floorplan): https://experience.sap.com/fiori-design-web/ -- referenced but CDN rendering not fully accessible via automated fetch
- SAP AI Core authentication patterns -- standard BTP OAuth2 client credentials flow
- Financial anomaly detection domain patterns -- synthesized from established enterprise software (SAP GR/IR, SAS AML)

### Project Context
- `spec/PROJECT.md` -- project constraints and key decisions
- `../prototype/USE_CASE.md` -- AI Core model contract, feature columns, anomaly classes
- `../prototype/CLAUDE.md` -- agent instructions (contains criticality mapping bug documented above)

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
