# Requirements: Financial Risk Analyzer (MCP-First)

**Defined:** 2026-03-09 | **Updated:** 2026-03-11 for MCP-first rebuild
**Core Value:** Finance teams can see which GL transactions are risky in a single Fiori list report with one-click ML inference
**Methodology:** MCP-first — every SAP artifact validated against SAP MCP servers before writing

## v1 Requirements

### Data Layer

- [x] **DATA-01**: CDS entity model matches `gl_features_for_ml` schema (GL fields + 24 feature columns with correct types)
- [x] **DATA-02**: OData V4 service exposes GL transactions entity set with `analyzeRisks` action
- [x] **DATA-03**: Mock CSV data provides realistic GL transactions for local development without BDC
- [ ] **DATA-04**: BTP Destination configured to connect CAP to BDC Connect data product (wired after mock data works)

### Inference

- [x] **INFER-01**: "Analyze" toolbar button triggers AI Core inference on visible/selected transactions
- [x] **INFER-02**: Feature extraction produces exactly 24 numeric values in the documented column order per transaction
- [x] **INFER-03**: AI Core client calls XGBoost deployment `/v1/predict` with OAuth2 token management
- [x] **INFER-04**: Static risk label mapping translates 11 model output classes to display label, business explanation, and Fiori criticality code
- [x] **INFER-05**: AI Core errors return meaningful user-facing messages (not raw HTTP status codes)

### UI

- [x] **UI-01**: Fiori Elements list report displays columns: Company Code, GL Account, Cost Center, Posting Date, Amount, Risk Classification, Risk Explanation, Anomaly Score
- [x] **UI-02**: Smart filter bar with: Risk Classification (multi-select), Company Code, Date Range, Amount Range, Anomaly Score threshold
- [x] **UI-03**: Risk Classification column uses Fiori criticality color coding (3=green for Normal, 2=orange for medium risk, 1=red for high risk)
- [x] **UI-04**: Export to spreadsheet enabled via Fiori Elements manifest setting
- [x] **UI-05**: All user-facing text externalized in i18n.properties (11 risk labels, column headers, button text, error messages)

### Infrastructure

- [x] **INFRA-01**: `cds build` succeeds in clean environment
- [x] **INFRA-02**: Multi-agent build with 3 agents (orchestrator + backend + frontend) working in parallel git worktrees as sibling directories
- [x] **INFRA-03**: No hardcoded credentials — AI Core config via environment variables, BDC via BTP Destination
- [x] **INFRA-04**: `.env` and `default-env.json` excluded from version control

### MCP-First Methodology

- [x] **MCP-01**: Every SAP framework artifact (CDS entities, service definitions, handlers, annotations, manifest.json, controllers, bootstrap) generated after querying the relevant SAP MCP server (CAP, Fiori, or UI5)

## v2 Requirements

### Differentiators

- **DIFF-01**: Analytical chart header showing risk distribution (donut/bar chart by risk class)
- **DIFF-02**: Variant management for saved filter/sort configurations
- **DIFF-03**: Transaction detail object page with all 24 features and risk factor breakdown
- **DIFF-04**: KPI header (total transactions, high risk count/percentage, analyzed percentage)
- **DIFF-05**: Batch vs single-row re-analysis (row-level "Re-analyze" button)
- **DIFF-06**: Anomaly score threshold slider filter

### Production Readiness

- **PROD-01**: Role-based access control via XSUAA
- **PROD-02**: Audit trail / analysis history (separate CDS entity for timestamped analysis logs)
- **PROD-03**: User feedback collection (flag false positives/negatives)

## Out of Scope

| Feature | Reason |
|---------|--------|
| GenAI chat copilot | Static label mapping is deterministic, instant, and free. GenAI adds latency and hallucination risk for zero value. |
| Real-time streaming inference | User-initiated batch via "Analyze" button is sufficient for period-close workflows. Streaming requires event-driven architecture. |
| Model retraining from UI | Separate MLOps concern. Training pipeline is independent of the visualization app. |
| Custom D3.js/Highcharts charts | Breaks Fiori Elements paradigm. Use built-in `@UI.Chart` annotations for v2. |
| Mobile layout | Desktop Fiori Elements only. `@UI.Importance` annotations provide graceful degradation. |
| Multi-language i18n | English only. Strings externalized for future translation. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 2 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 4 | Pending |
| INFER-01 | Phase 3 | Complete |
| INFER-02 | Phase 2 | Complete |
| INFER-03 | Phase 2 | Complete |
| INFER-04 | Phase 2 | Complete |
| INFER-05 | Phase 2 | Complete |
| UI-01 | Phase 3 | Complete |
| UI-02 | Phase 3 | Complete |
| UI-03 | Phase 3 | Complete |
| UI-04 | Phase 3 | Complete |
| UI-05 | Phase 3 | Complete |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| MCP-01 | All phases | Complete |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Updated: 2026-03-11 -- added INFRA-02 (git worktrees for multi-agent parallel development)*
