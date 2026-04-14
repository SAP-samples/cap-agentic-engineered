# Feature Research

**Domain:** Financial anomaly detection / GL transaction risk analysis (Fiori Elements list report with ML predictions)
**Researched:** 2026-03-09
**Confidence:** HIGH (core Fiori Elements capabilities well-documented; financial risk domain patterns are well-established in enterprise software)

## Feature Landscape

### Table Stakes (Users Expect These)

Features finance teams expect in any transaction risk analysis tool. Missing these means the app feels broken or unusable for its stated purpose.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Tabular transaction list** | Finance users think in rows of journal entries. A list of GL transactions is the fundamental unit of work. | LOW | Fiori Elements list report provides this out of the box via `@UI.LineItem` annotations. Zero custom UI code needed. |
| **Risk classification per transaction** | The whole point: each transaction needs a clear risk label. Without it, the app has no value. | MEDIUM | Requires AI Core call + static label mapping. The 11-class taxonomy is already defined in USE_CASE.md. Display via `@UI.DataFieldForAnnotation` or direct `@UI.LineItem` entry. |
| **Color-coded severity** | Finance users scan for red/yellow/green at a glance. Raw text labels without visual weight force slow reading. | LOW | Fiori Elements supports `@UI.Criticality` natively. Map model output to criticality values (0=positive/green, 1=negative/red, 2=critical/orange). Already specified in the static label mapping. |
| **Filter bar** | Users need to slice data by company code, date range, risk type. Without filters, a 10K-row list is useless. | LOW | Fiori Elements provides a smart filter bar via `@UI.SelectionFields`. Declare which fields appear as filters in CDS annotations. Multi-select for risk classification is standard. |
| **Sorting** | Users need to sort by amount, date, anomaly score to find the worst items fast. | LOW | Built into Fiori Elements tables by default. No custom code; just ensure columns are sortable in OData metadata. |
| **Human-readable risk explanations** | Raw model output (`High_Amount_Deviation`) means nothing to a controller. Business-language text is mandatory. | LOW | Static lookup table mapping 11 classes to explanations. Already fully defined. Render as a column or tooltip. |
| **Anomaly score column** | Users need to see the continuous score (0-1) alongside the discrete classification to gauge severity within a risk class. | LOW | Simple numeric column. Consider `@UI.DataPoint` with `Visualization: Rating` or progress bar for visual weight, but a plain number works for MVP. |
| **Export to spreadsheet** | Finance teams live in Excel. If they cannot export the flagged transactions to a spreadsheet, adoption dies. | LOW | Fiori Elements OData V4 list report supports "Export to Spreadsheet" natively. Enable via manifest setting `"tableSettings": { "enableExport": true }`. |
| **"Analyze" action button** | The user-initiated inference trigger. Without a clear action to score transactions, the workflow is undefined. | MEDIUM | CAP bound action (or unbound action on the service) annotated as `@UI.DataFieldForAction`. Fiori Elements renders it as a toolbar button. Backend extracts 25 features, calls AI Core, returns enriched data. |
| **Loading/progress indication** | AI Core inference takes seconds. Users need feedback that something is happening, or they will click repeatedly. | LOW | Fiori Elements shows a busy indicator automatically during OData action execution. May need a custom message strip for batch progress on large datasets. |
| **Error handling for AI Core failures** | If the model endpoint is down, the user must see a meaningful message, not a raw HTTP 500. | MEDIUM | CAP action handler catches AI Core errors and returns structured OData error messages. Fiori Elements renders these as message toast/dialog automatically. |

### Differentiators (Competitive Advantage)

Features that elevate this from "basic list with colors" to a genuinely useful risk analysis tool. Not expected but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Analytical chart header** | A donut/bar chart showing risk distribution (e.g., 72% Normal, 15% High Amount, 8% Weekend) gives instant portfolio-level insight before the user reads a single row. | MEDIUM | Fiori Elements V4 supports `@UI.Chart` in the list report header area (visual filter or chart). Define a chart annotation grouping by `riskClassification`. Requires aggregation support in OData service (`@Aggregation.ApplySupported`). |
| **Variant management** | Auditors save "Weekend Postings > $50K" as a named view. Controllers save "My Company Codes - High Risk Only". Personalized views increase daily-use stickiness. | LOW | Fiori Elements provides variant management (page variants and table variants) out of the box. Enable in manifest. Users save filter/sort/column configs without developer effort. |
| **Batch vs. single-row analysis** | Score all visible transactions at once OR drill into one transaction for detailed scoring. Batch is the default, but per-row re-analysis after data changes is useful. | MEDIUM | Two actions: toolbar-level "Analyze All" (unbound action on entity set) and row-level "Re-analyze" (bound action). Fiori Elements supports both via `@UI.DataFieldForAction` with `Inline: true` for row-level. |
| **Risk factor breakdown** | Beyond the single classification label, show which features drove the prediction: "Amount is 4.2 standard deviations above peer average; posted on Sunday; new GL/cost center combination." | MEDIUM | Expand the risk explanation from a single sentence to a structured breakdown. Parse the input features (z-score, is_weekend, is_new_combination) and generate a bullet list. Can be shown in a popover or object page detail. No GenAI needed -- deterministic logic. |
| **Anomaly score threshold slider** | Let users adjust sensitivity: "Show me only transactions with anomaly score > 0.5." Changes the effective risk tolerance without retraining the model. | LOW | A filter on `anomalyScore` with a slider or numeric input. Fiori Elements filter bar supports range filters natively. The value filters client-side or via OData `$filter`. Simple but powerful for power users. |
| **Transaction detail object page** | Click a row to see all 25 features, the full risk explanation, peer group comparison, and temporal context. The list report is the overview; the object page is the investigation tool. | MEDIUM | Fiori Elements object page floorplan with `@UI.Identification`, `@UI.FieldGroup`, `@UI.HeaderInfo`. Navigation from list report is annotation-driven. Shows features like peer_avg_amount, frequency_12m in context. |
| **Audit trail / analysis history** | Record when a transaction was analyzed, by whom, and what the result was. Critical for compliance: "We reviewed this on March 5 and classified it as low risk." | HIGH | Requires a separate CDS entity for analysis logs. Each "Analyze" action writes a timestamped record. Adds persistence complexity but is highly valued in audit-heavy environments. Defer to v1.x. |
| **Key performance indicators (KPIs)** | Header-level KPIs: "Total Transactions: 12,450 | High Risk: 342 (2.7%) | Analyzed: 8,200 (65.9%)." Gives management a dashboard feel without building a separate dashboard. | MEDIUM | Fiori Elements supports `@UI.KPI` annotations in the list report header. Requires aggregation queries. Each KPI is a single number with optional trend/target. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem appealing but would hurt the project if built.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **GenAI chat copilot for risk explanations** | "Use AI to explain why this transaction is risky in natural language." Sounds modern. | The explanations are deterministic -- the 11 classes have fixed business meanings. Adding a foundation model call adds latency, token cost, hallucination risk, and non-determinism for zero incremental value. The static mapping is better. | Static label mapping with structured feature breakdown (differentiator above). Deterministic, instant, free. |
| **Real-time streaming inference** | "Score transactions as they post, not on user click." Sounds more advanced. | Requires event-driven architecture (SAP Event Mesh or similar), persistent model serving with low-latency SLA, and changes the entire data flow from pull to push. Massive complexity for a prototype. | User-initiated batch inference via "Analyze" button. Simpler, controllable, sufficient for period-close and audit workflows where transactions are reviewed in batches. |
| **Model retraining from the UI** | "Let users flag false positives and retrain the model." Active learning loop. | Model training requires data engineering, hyperparameter tuning, validation, and deployment pipeline. It is a separate MLOps concern, not a UI feature. Mixing inference UI with training creates a support nightmare. | Feedback collection only: let users flag false positives/negatives. Store feedback in a CDS entity. Feed it back to the data science team offline. Separate concerns. |
| **Custom dashboard with D3.js/Highcharts** | "Fiori Elements charts are limited. Build custom visualizations." | Breaks the Fiori Elements paradigm. Custom charts require custom UI5 controls, lose annotation-driven behavior, cannot be personalized via variants, and double the frontend maintenance. | Use Fiori Elements built-in charts (`@UI.Chart`), visual filters, and micro charts. They cover 90% of needs. If truly insufficient, build a separate analytical app later -- do not bolt custom charts onto the list report. |
| **Multi-model ensemble** | "Run XGBoost and a second model, then combine predictions." More models = better accuracy. | Doubles AI Core calls, requires fusion logic, complicates the label mapping, and the prototype scope is one model. Ensemble design is an ML architecture decision, not a UI feature. | Single model (XGBoost) for now. If accuracy is insufficient, improve the single model or swap it. The app is model-agnostic -- changing the backend model requires zero frontend changes. |
| **Role-based access control** | "Different users should see different company codes." Standard enterprise requirement. | Correct, but implementing XSUAA-based authorization, role collections, and data-level filtering is substantial infrastructure work. It is explicitly out of scope for the prototype. | Prototype without auth. Document the XSUAA integration pattern for production deployment. The CAP `@restrict` annotation model makes it straightforward to add later. |
| **Mobile-responsive layout** | "Finance users might use iPads." | Fiori Elements list reports are somewhat responsive by default, but optimizing for mobile requires testing, column hiding priorities (`@UI.Importance`), and potentially a different floorplan. Desktop-only is explicitly in scope. | Desktop only. Set `@UI.Importance` annotations on columns so Fiori Elements gracefully hides less-important columns on smaller screens, but do not test or optimize for mobile. |

## Feature Dependencies

```
[OData Service for GL Transactions]
    |
    +--requires--> [CDS Entity Model matching gl_features_for_ml schema]
    |
    +--enables---> [Tabular Transaction List (Fiori Elements)]
    |                  |
    |                  +--enables--> [Filter Bar]
    |                  +--enables--> [Sorting]
    |                  +--enables--> [Export to Spreadsheet]
    |                  +--enables--> [Variant Management]
    |
    +--enables---> ["Analyze" Action Button]
                       |
                       +--requires--> [AI Core Client (HTTP POST to /v1/predict)]
                       +--requires--> [Feature Extraction (25 columns, exact order)]
                       +--requires--> [Static Risk Label Mapping (11 classes)]
                       |
                       +--enables---> [Risk Classification Column]
                       |                  +--enables--> [Color-Coded Severity]
                       |
                       +--enables---> [Risk Explanation Column]
                       +--enables---> [Anomaly Score Column]
                       +--enables---> [Loading/Progress Indication]
                       +--enables---> [Error Handling for AI Core Failures]

[Risk Classification Column]
    +--enables---> [Analytical Chart Header (aggregation by risk class)]
    +--enables---> [KPI Header (count/percentage by risk class)]

[Tabular Transaction List]
    +--enables---> [Transaction Detail Object Page]
                       +--enables--> [Risk Factor Breakdown]

["Analyze" Action]
    +--enables---> [Batch vs. Single-Row Analysis]
    +--enables---> [Audit Trail / Analysis History]
```

### Dependency Notes

- **Risk Classification requires the full Analyze pipeline:** CDS entity, feature extraction, AI Core call, and label mapping must all work before any risk data appears in the UI.
- **Chart/KPI header requires aggregation support:** The OData service must support `$apply` (groupby, aggregate) for the chart and KPI annotations to work. This is a CAP configuration concern (`@Aggregation.ApplySupported`).
- **Object page requires the list report first:** Navigation from list to object page is built on top of the working list report. Do not build the object page before the list report works end-to-end.
- **Audit trail requires a second CDS entity:** This is a persistence addition, not just a UI feature. It adds schema complexity and should be deferred past MVP.
- **Export to spreadsheet is independent:** It works as soon as the list report has data, regardless of whether analysis has been run. Users may export raw data or analyzed data.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what demonstrates the end-to-end pattern from BDC through AI Core to Fiori.

- [x] **CDS entity model** matching `gl_features_for_ml` schema -- foundation for everything
- [x] **OData V4 service** exposing GL transactions -- the data layer
- [x] **Mock data** for BDC (CSV/JSON) -- unblocks frontend without BTP Destination
- [x] **Fiori Elements list report** with columns: Company Code, GL Account, Cost Center, Posting Date, Amount, Risk Classification, Risk Explanation, Anomaly Score
- [x] **Smart filter bar** with: Risk Classification (multi-select), Company Code, Date Range, Amount Range, Anomaly Score threshold
- [x] **"Analyze" toolbar action** triggering CAP action
- [x] **AI Core client** extracting 25 features in order, calling `/v1/predict`
- [x] **Static risk label mapping** (11 classes to display label + explanation + criticality)
- [x] **Color-coded risk classification** via `@UI.Criticality`
- [x] **Sorting** on all columns (free with Fiori Elements)
- [x] **Export to spreadsheet** (manifest toggle)
- [x] **Error handling** for AI Core unavailability
- [x] **i18n externalization** for all user-facing strings

### Add After Validation (v1.x)

Features to add once the core inference loop works end-to-end.

- [ ] **Analytical chart header** (risk distribution donut/bar) -- add when aggregation support is proven
- [ ] **Variant management** -- enable in manifest once filter bar is stable
- [ ] **Transaction detail object page** -- build when users want to drill into individual transactions
- [ ] **Risk factor breakdown** in object page -- when users ask "why was this flagged?"
- [ ] **Batch vs. single-row re-analysis** -- when users need to re-score individual rows after data changes
- [ ] **KPI header** (total transactions, high risk count/percentage) -- when management wants a summary view
- [ ] **BDC live connection** via BTP Destination -- replace mock data when infrastructure is ready

### Future Consideration (v2+)

Features to defer until the prototype proves its value.

- [ ] **Audit trail / analysis history** -- requires schema extension, relevant for production compliance
- [ ] **User feedback collection** (flag false positives) -- when accuracy improvement cycle begins
- [ ] **Role-based access control** (XSUAA) -- when deploying to production with real users
- [ ] **Multi-company-code navigation** (worklist per company code) -- when used across business units
- [ ] **Scheduled batch analysis** (run scoring nightly) -- when workflow shifts from interactive to automated
- [ ] **Integration with SAP Process Automation** (trigger approval workflows for high-risk items) -- when the app becomes part of a business process, not just a viewing tool

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Tabular transaction list | HIGH | LOW | P1 |
| Risk classification per transaction | HIGH | MEDIUM | P1 |
| Color-coded severity | HIGH | LOW | P1 |
| Filter bar (risk class, company, date, amount) | HIGH | LOW | P1 |
| Sorting | HIGH | LOW | P1 |
| Human-readable risk explanations | HIGH | LOW | P1 |
| Anomaly score column | MEDIUM | LOW | P1 |
| Export to spreadsheet | HIGH | LOW | P1 |
| "Analyze" action button | HIGH | MEDIUM | P1 |
| Loading/progress indication | MEDIUM | LOW | P1 |
| Error handling for AI Core failures | MEDIUM | MEDIUM | P1 |
| Variant management | MEDIUM | LOW | P2 |
| Analytical chart header | MEDIUM | MEDIUM | P2 |
| Transaction detail object page | MEDIUM | MEDIUM | P2 |
| Risk factor breakdown | MEDIUM | MEDIUM | P2 |
| Batch vs. single-row analysis | LOW | MEDIUM | P2 |
| KPI header | MEDIUM | MEDIUM | P2 |
| Anomaly score threshold slider | MEDIUM | LOW | P2 |
| Audit trail / analysis history | HIGH | HIGH | P3 |
| User feedback collection | MEDIUM | MEDIUM | P3 |
| Role-based access control | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- the prototype is incomplete without these
- P2: Should have -- add once P1 is working end-to-end, each adds clear value
- P3: Future -- important for production but out of scope for prototype

## Competitor Feature Analysis

| Feature | SAP S/4HANA Financial Close (GR/IR) | Specialized tools (SAS, Palantir AML) | Our Approach |
|---------|--------------------------------------|---------------------------------------|--------------|
| Transaction list with risk flags | Built-in aging reports with color indicators | Custom dashboards with configurable thresholds | Fiori Elements list report with criticality annotations -- native SAP look and feel |
| ML-based classification | Limited -- mostly rule-based exception management | Full ML pipelines with model management | XGBoost on AI Core -- custom model, standard serving |
| Drill-down to transaction detail | Object page navigation to accounting document | Custom investigation views | Fiori Elements object page -- annotation-driven, zero custom UI |
| Export | Standard ALV export (Excel, CSV) | Varies by tool | Fiori Elements built-in export -- Excel format, respects filters |
| Risk explanation | Rule descriptions (e.g., "GR/IR aging > 90 days") | Feature importance / SHAP values | Static label mapping -- deterministic, business-language. SHAP values are a v2+ consideration. |
| Batch scoring | Often pre-computed nightly | Real-time or near-real-time | User-initiated via "Analyze" button -- interactive, no infrastructure for streaming |
| Audit trail | Built into S/4 change documents | Full case management with workflow | Deferred to v2 -- the prototype focuses on detection, not case management |
| Visualization | Analytical list page with charts | Custom BI dashboards (Tableau, Looker) | Fiori Elements chart annotations -- native, no custom charting |

## Sources

- SAP CAP Fiori Elements documentation: https://cap.cloud.sap/docs/guides/uis/fiori (verified via WebFetch -- confirms `@UI.LineItem`, `@UI.SelectionFields`, `@UI.Criticality`, `@UI.DataFieldForAction`, `@UI.Chart`, variant management, export support)
- Project context: `.planning/PROJECT.md`, `../prototype/USE_CASE.md` (primary source for anomaly classes, feature columns, architecture, and scope decisions)
- Fiori Design Guidelines for List Report floorplan: https://experience.sap.com/fiori-design-web/list-report-floorplan-sap-fiori-element/ (redirects to https://www.sap.com/design-system/fiori-design-web/page-types/floorplans/list-report-floorplan-sap-fiori-element/ -- site rendering not accessible via WebFetch, referenced from training data: HIGH confidence on Fiori Elements capabilities as they are well-established and stable across SAPUI5 1.96+)
- Financial anomaly detection domain patterns: Based on established enterprise software patterns (SAP GR/IR, SAS AML, general transaction monitoring systems). MEDIUM confidence -- synthesized from training data, not verified against current product releases.

---
*Feature research for: Financial anomaly detection / GL transaction risk analysis*
*Researched: 2026-03-09*
