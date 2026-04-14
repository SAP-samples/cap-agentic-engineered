# Phase 3: Frontend Annotations + Fiori App - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

A complete Fiori Elements list report that renders GL transactions with filters, sorting, export, criticality colors, and an Analyze button — fully functional against mock data. Covers: CDS UI annotations, Fiori Elements manifest configuration, i18n externalization, filter bar, table with pagination, Analyze action binding, criticality rendering, KPI header, and spreadsheet export.

</domain>

<decisions>
## Implementation Decisions

### Column visibility + ordering
- 8 default visible columns in SAP document order: CompanyCode, FiscalYear, DocumentNumber, LineItem (keys), GLAccount, CostCenter, PostingDate, Amount, then Risk Classification, Risk Explanation, Anomaly Score
- 24 ML feature columns available via table personalization (Settings gear) but hidden by default
- Visibility controlled via `@UI.Importance`: `#High` for the 8 main columns + 3 risk columns, `#Low` for feature columns
- Default sort: PostingDate descending (most recent first)

### Filter bar design
- Risk Classification and Company Code visible by default in the compact filter bar
- Date Range, Amount Range, and Anomaly Score threshold available via "Adapt Filters"
- Risk Classification: multi-select dropdown showing all 11 risk display labels (Normal, Unusual Amount, etc.)
- Anomaly Score: numeric input field with operators (greater than, less than, between) — not a slider
- No default filter values on initial load — show all transactions

### Analyze button behavior
- Single "Analyze" toolbar button processes all currently loaded rows
- Growing list pagination with threshold of 50 rows per page ("More" link at bottom)
- Analyze processes whatever rows are currently loaded (not just visible viewport)
- Table busy indicator (standard Fiori gray overlay + spinner) during processing
- Error: standard Fiori `MessageBox.error()` dialog with the backend's categorized error message
- Success: no explicit feedback — risk columns simply populate with results (the color-coded results ARE the feedback)
- **Important**: Backend `analyzeRisks` is a service-level action. Frontend needs to call it and handle the response to populate virtual fields on loaded rows.

### Risk column presentation
- Full-row criticality coloring via `@UI.Criticality` at the entity/row level (green for Normal, orange for medium risk, red for high risk)
- Risk Explanation shown as an inline column in the table (not tooltip, not hidden)
- Anomaly Score displayed as a visual micro chart / bar (not plain decimal)
- Before Analyze is run: risk columns show blank/dash for unanalyzed rows (standard null virtual field behavior)

### Page header / KPI strip
- Page title: "GL Transaction Risk Analysis"
- KPI strip in header with 2 metrics: total transaction count and high risk count
- KPIs update dynamically after Analyze action completes (not just static from loaded data)
- Note: DIFF-04 (KPI header) was a v2 differentiator — pulled forward into v1 since it's annotation-driven and adds high value

### Claude's Discretion
- i18n key naming convention and file organization
- Exact annotation file structure (single annotations.cds or split by concern)
- manifest.json routing and component configuration details
- Micro chart type for Anomaly Score (RadialMicroChart, BulletMicroChart, etc.)
- App ID and namespace
- Exact growing threshold tuning (50 is the target, can adjust)

</decisions>

<specifics>
## Specific Ideas

- User explicitly wants to analyze only loaded rows, not the entire dataset — there are hundreds of thousands of GL transactions. The growing list (50/page) controls the blast radius of each Analyze call.
- Full-row coloring was chosen for maximum visual impact — risk level should be scannable at a glance across many rows.
- No success toast/banner after Analyze — the appearance of color-coded rows IS the success feedback. Keep it clean.
- KPI header pulls forward DIFF-04 from v2 because it's achievable via annotations and gives the page meaningful context (total count, high risk count).

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `db/schema.cds`: Full entity with virtual fields (`riskClassification`, `riskExplanation`, `anomalyScore`) already declared — annotations reference these directly
- `srv/risk-service.cds`: `analyzeRisks` service-level action returning `array of GLTransactions` — button binds to this
- `srv/lib/risk-labels.js`: 11 risk labels with criticality codes (3/2/1) — annotations must match these criticality values
- `srv/lib/feature-columns.js`: FEATURE_COLUMNS constant (24 columns) — used for @UI.Importance: #Low annotations on these fields
- `db/data/`: Mock CSV data with ~50 GL transactions — enough for local testing with growing threshold of 50

### Established Patterns
- Jest for testing with @cap-js/cds-test for CAP integration tests
- CommonJS modules (`module.exports` / `require`) for CAP handlers
- `cds.log` for all logging (no console.log)
- CDS naming: PascalCase entities, camelCase fields
- Environment variables for all secrets/config
- XML views only for SAPUI5, `sap.ui.define` for all modules

### Integration Points
- `RiskService` in `srv/risk-service.cds` — Fiori Elements app connects to this OData V4 service
- `analyzeRisks` action — toolbar button triggers `POST /odata/v4/risk/analyzeRisks`
- Virtual fields on `GLTransactions` — risk columns populate from action response
- `app/` directory — currently empty, greenfield for the Fiori Elements app
- `package.json` — may need `@sap/ux-specification` or Fiori tooling dev dependencies

</code_context>

<deferred>
## Deferred Ideas

- Analytical chart header showing risk distribution (donut/bar) — v2 DIFF-01
- Variant management for saved filter/sort configurations — v2 DIFF-02
- Transaction detail object page with all 24 features — v2 DIFF-03
- Batch vs single-row re-analysis (row-level "Re-analyze" button) — v2 DIFF-05
- Anomaly score threshold slider filter — v2 DIFF-06 (numeric input used instead for v1)

</deferred>

---

*Phase: 03-frontend-annotations-fiori-app*
*Context gathered: 2026-03-09*
