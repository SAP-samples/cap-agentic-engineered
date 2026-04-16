# Phase 3: Frontend Annotations + Fiori App - Research

**Researched:** 2026-03-09
**Domain:** SAP CAP CDS Fiori Annotations + Fiori Elements V4 List Report
**Confidence:** HIGH

## Summary

Phase 3 creates a complete Fiori Elements V4 List Report app within the existing CAP project. The existing backend (Phase 1 schema + Phase 2 service handler) provides an OData V4 service at `/odata/v4/risk/` with a `GLTransactions` entity set and an unbound `analyzeRisks` action. This phase adds CDS UI annotations and a Fiori Elements webapp shell that renders a fully functional list report with filters, criticality coloring, KPI header, an Analyze toolbar button, and export to spreadsheet.

The core work is annotation-driven -- the vast majority of UI behavior is declared in `.cds` files, not JavaScript. The webapp itself is a thin shell (manifest.json, Component.js, index.html, i18n.properties) that configures the `sap.fe.templates.ListReport` component. CAP automatically serves apps from the `app/` folder during `cds watch`, so no additional server configuration is needed. The key technical challenges are: (1) correctly structuring the annotation hierarchy for 8+3+24 columns with mixed importance levels, (2) wiring the unbound `analyzeRisks` action to a `@UI.DataFieldForAction` toolbar button, (3) entity-level `@UI.Criticality` for full-row coloring, and (4) a micro chart or progress indicator for the anomaly score column.

**Primary recommendation:** Use annotation-first development in a dedicated `app/risks/annotations.cds` file, with a minimal Fiori Elements V4 webapp shell under `app/risks/webapp/`. Split annotations by concern if needed (labels, layouts, capabilities). Test with `cds watch` + browser verification, and validate annotations compile correctly via `cds build`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 8 default visible columns in SAP document order: CompanyCode, FiscalYear, DocumentNumber, LineItem (keys), GLAccount, CostCenter, PostingDate, Amount, then Risk Classification, Risk Explanation, Anomaly Score
- 24 ML feature columns available via table personalization (Settings gear) but hidden by default
- Visibility controlled via `@UI.Importance`: `#High` for the 8 main columns + 3 risk columns, `#Low` for feature columns
- Default sort: PostingDate descending (most recent first)
- Risk Classification and Company Code visible by default in the compact filter bar
- Date Range, Amount Range, and Anomaly Score threshold available via "Adapt Filters"
- Risk Classification: multi-select dropdown showing all 11 risk display labels (Normal, Unusual Amount, etc.)
- Anomaly Score: numeric input field with operators (greater than, less than, between) -- not a slider
- No default filter values on initial load -- show all transactions
- Single "Analyze" toolbar button processes all currently loaded rows
- Growing list pagination with threshold of 50 rows per page ("More" link at bottom)
- Analyze processes whatever rows are currently loaded (not just visible viewport)
- Table busy indicator (standard Fiori gray overlay + spinner) during processing
- Error: standard Fiori `MessageBox.error()` dialog with the backend's categorized error message
- Success: no explicit feedback -- risk columns simply populate with results
- Backend `analyzeRisks` is a service-level action. Frontend needs to call it and handle the response to populate virtual fields on loaded rows.
- Full-row criticality coloring via `@UI.Criticality` at the entity/row level (green for Normal, orange for medium risk, red for high risk)
- Risk Explanation shown as an inline column in the table (not tooltip, not hidden)
- Anomaly Score displayed as a visual micro chart / bar (not plain decimal)
- Before Analyze is run: risk columns show blank/dash for unanalyzed rows
- Page title: "GL Transaction Risk Analysis"
- KPI strip in header with 2 metrics: total transaction count and high risk count
- KPIs update dynamically after Analyze action completes

### Claude's Discretion
- i18n key naming convention and file organization
- Exact annotation file structure (single annotations.cds or split by concern)
- manifest.json routing and component configuration details
- Micro chart type for Anomaly Score (RadialMicroChart, BulletMicroChart, etc.)
- App ID and namespace
- Exact growing threshold tuning (50 is the target, can adjust)

### Deferred Ideas (OUT OF SCOPE)
- Analytical chart header showing risk distribution (donut/bar) -- v2 DIFF-01
- Variant management for saved filter/sort configurations -- v2 DIFF-02
- Transaction detail object page with all 24 features -- v2 DIFF-03
- Batch vs single-row re-analysis (row-level "Re-analyze" button) -- v2 DIFF-05
- Anomaly score threshold slider filter -- v2 DIFF-06 (numeric input used instead for v1)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Fiori Elements list report displays columns: Company Code, GL Account, Cost Center, Posting Date, Amount, Risk Classification, Risk Explanation, Anomaly Score | @UI.LineItem annotation with ordered DataField entries and @UI.Importance for visibility control |
| UI-02 | Smart filter bar with: Risk Classification (multi-select), Company Code, Date Range, Amount Range, Anomaly Score threshold | @UI.SelectionFields annotation + @Common.ValueList for Risk Classification dropdown |
| UI-03 | Risk Classification column uses Fiori criticality color coding (3=green, 2=orange, 1=red) | @UI.Criticality annotation at entity level pointing to criticality integer field, plus @UI.LineItem Criticality property |
| UI-04 | Export to spreadsheet enabled via Fiori Elements manifest setting | manifest.json controlConfiguration tableSettings enableExport: true |
| UI-05 | All user-facing text externalized in i18n.properties | i18n.properties file under app/risks/webapp/i18n/ with {i18n>key} references in annotations and @title annotations |
| INFER-01 | "Analyze" toolbar button triggers AI Core inference on visible/selected transactions | @UI.DataFieldForAction in @UI.LineItem referencing RiskService.analyzeRisks unbound action |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @sap/cds | ^9.8.0 | CAP runtime + CDS compiler | Already installed, serves OData + Fiori preview |
| sap.fe.templates | (bundled with UI5) | Fiori Elements V4 templates (ListReport, ObjectPage) | Standard SAP approach for annotation-driven Fiori apps |
| sap.fe.core | (bundled with UI5) | Fiori Elements V4 core runtime | AppComponent base class, action handling |
| SAPUI5 | 1.120+ | UI framework | Project CLAUDE.md specifies 1.120+ |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @cap-js/sqlite | ^2 | In-memory SQLite for local dev | Already installed, `cds watch` uses it |
| @cap-js/cds-test | ^0.4.1 | CAP testing utilities | Already installed, integration test bootstrap |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fiori Elements annotation-driven | Custom SAPUI5 freestyle app | Loses auto-generated filter bar, table, export; far more code; goes against CLAUDE.md rules |
| CDS annotations in .cds files | OData $metadata XML annotations | CDS is the standard CAP approach; XML is verbose and fragile |
| BulletMicroChart for anomaly score | RadialMicroChart or plain text | Bullet chart shows 0-1 range intuitively; Radial is also viable (discretion item) |

### No Additional Installation Needed
The existing `package.json` already has all required dependencies. The Fiori Elements app is served by CAP from the `app/` folder. The SAPUI5 library is loaded via CDN in `index.html` (standard pattern). No `npm install` is needed for this phase.

## Architecture Patterns

### Recommended Project Structure
```
./
  app/
    risks/                         # Fiori Elements app directory
      annotations.cds              # All UI annotations (or split: see below)
      webapp/
        index.html                 # UI5 bootstrap HTML
        Component.js               # AppComponent extending sap.fe.core.AppComponent
        manifest.json              # App descriptor (routing, data source, settings)
        i18n/
          i18n.properties          # All user-facing strings
      package.json                 # App metadata (optional, for tooling)
    services.cds                   # Imports annotation files (entry point)
  srv/                             # Existing service layer (unchanged)
  db/                              # Existing data layer (unchanged)
```

### Pattern 1: Annotation-First Development
**What:** All UI behavior is declared in CDS annotations, not JavaScript code. The webapp is a minimal shell.
**When to use:** Always for Fiori Elements apps (per CLAUDE.md: "annotation-driven where possible")
**Example:**
```cds
// Source: SAP CAP documentation + SAP sflight sample
using RiskService from '../../srv/risk-service';

annotate RiskService.GLTransactions with @(
  UI: {
    HeaderInfo: {
      TypeName: '{i18n>Transaction}',
      TypeNamePlural: '{i18n>Transactions}',
      Title: { Value: DocumentNumber },
      Description: { Value: CompanyCode }
    },
    PresentationVariant: {
      SortOrder: [{
        Property: PostingDate,
        Descending: true
      }],
      Visualizations: ['@UI.LineItem']
    },
    SelectionFields: [
      riskClassification,
      CompanyCode
    ],
    LineItem: [
      { $Type: 'UI.DataFieldForAction', Action: 'RiskService.analyzeRisks', Label: '{i18n>Analyze}' },
      { Value: CompanyCode, @UI.Importance: #High },
      { Value: FiscalYear, @UI.Importance: #High },
      { Value: DocumentNumber, @UI.Importance: #High },
      { Value: LineItem, @UI.Importance: #High },
      { Value: GLAccount, @UI.Importance: #High },
      { Value: CostCenter, @UI.Importance: #High },
      { Value: PostingDate, @UI.Importance: #High },
      { Value: amount, @UI.Importance: #High },
      { Value: riskClassification, Criticality: criticality, @UI.Importance: #High },
      { Value: riskExplanation, @UI.Importance: #High },
      // Anomaly score as micro chart (DataFieldForAnnotation pattern)
      { $Type: 'UI.DataFieldForAnnotation', Target: '@UI.DataPoint#anomalyScore', Label: '{i18n>AnomalyScore}', @UI.Importance: #High }
    ]
  }
);
```

### Pattern 2: Unbound Action as Toolbar Button
**What:** The `analyzeRisks` is a service-level (unbound) action. In Fiori Elements, it appears as a toolbar button when added to `@UI.LineItem` as a `DataFieldForAction`.
**When to use:** When calling a service-level action from the list report table toolbar.
**Critical detail:** For an unbound action, the `Action` property in `@UI.DataFieldForAction` uses the fully qualified service name: `RiskService.analyzeRisks`. This matches the OData metadata where it appears as an `ActionImport`.
**Example:**
```cds
// Source: OData metadata from generated RiskService.xml
// The action is declared in risk-service.cds as: action analyzeRisks() returns array of GLTransactions;
// In OData V4 metadata it appears as: <ActionImport Name="analyzeRisks" Action="RiskService.analyzeRisks"/>

LineItem: [
  { $Type: 'UI.DataFieldForAction', Action: 'RiskService.analyzeRisks', Label: '{i18n>Analyze}' },
  // ... data fields follow
]
```

### Pattern 3: Entity-Level Criticality for Row Coloring
**What:** Full-row criticality coloring is achieved by annotating the entity with `@UI.Criticality` pointing to a field that holds the integer criticality code (3=green, 2=orange, 1=red, 0=neutral/gray).
**When to use:** When entire rows should be color-coded based on a status or risk level.
**Challenge:** The existing `riskClassification` is a `String` virtual field (display label like "Normal"), not an integer criticality code. We need an additional virtual integer field (e.g., `criticality`) that maps to the Fiori criticality integer, OR we handle it at the annotation level by mapping the string to criticality in each LineItem column.
**Recommended approach:** Add a `virtual criticality: Integer` field to the CDS entity and populate it alongside `riskClassification` in the service handler. Then use `@UI.Criticality: criticality` at the entity level.
**Example:**
```cds
// In db/schema.cds or srv/risk-service.cds (extending the projection)
// Add: virtual criticality : Integer;

annotate RiskService.GLTransactions with @(
  UI.Criticality: criticality  // Points to the integer virtual field
);
```

### Pattern 4: Micro Chart for Anomaly Score
**What:** Display the anomaly score (0-1 decimal) as a visual indicator in a table cell using `@UI.DataPoint` with `Visualization: #Progress` or a `@UI.Chart` micro chart.
**When to use:** When a numeric value should be displayed as a visual bar rather than plain text.
**Recommended approach:** Use `@UI.DataPoint` with `#Progress` visualization. The progress indicator shows a horizontal bar from 0-100%. Since anomaly score is 0-1, set `TargetValue: 1` and let the DataPoint render as a progress bar. Reference it via `@UI.DataFieldForAnnotation` in LineItem.
**Example:**
```cds
// Source: Fiori Elements annotation vocabulary
annotate RiskService.GLTransactions with @(
  UI.DataPoint #anomalyScore: {
    Value: anomalyScore,
    TargetValue: 1,
    Visualization: #Progress,
    Criticality: criticality
  }
);

// In LineItem, reference via DataFieldForAnnotation:
// { $Type: 'UI.DataFieldForAnnotation', Target: '@UI.DataPoint#anomalyScore', Label: '{i18n>AnomalyScore}' }
```

### Pattern 5: KPI Header
**What:** The List Report header can show KPI tags using `@UI.KPI` annotation. These display aggregate values (count, sum, etc.) in the page header.
**When to use:** When the list report needs summary metrics above the table.
**Challenge:** `@UI.KPI` typically requires `@Aggregation.ApplySupported` and analytics capabilities on the entity. For a simple count display without analytical queries, a simpler approach may be to use `@UI.HeaderInfo` with a `@UI.DataPoint` and custom header facets.
**Alternative approach:** Since KPIs that update after the Analyze action would require client-side logic (the server does not persist the analysis results), this may need a controller extension or a different pattern. The KPI counts need to reflect the current state of analyzed data on the client.
**Recommended approach:** Start with annotation-based KPI using `@UI.KPI` for total transaction count (server-side `$count`). For high risk count (which depends on client-side analysis results), this will likely need a controller extension or a custom header section. Mark this as requiring validation during implementation.
**Example from SAP sflight sample:**
```cds
// Source: SAP-samples/cap-sflight app/travel_analytics/annotations.cds
@UI.KPI #totalTransactions: {
  DataPoint: {
    Value: CompanyCode,     // placeholder for $count
    Title: 'Total',
    Description: '{i18n>TotalTransactions}'
  }
}
```

### Pattern 6: Minimal Webapp Shell
**What:** Fiori Elements V4 apps need only 3 files in webapp: index.html, Component.js, manifest.json.
**When to use:** Always for Fiori Elements apps (the framework generates everything else).
**Example manifest.json structure:**
```json
{
  "_version": "1.32.0",
  "sap.app": {
    "id": "risk.analysis",
    "type": "application",
    "title": "{{appTitle}}",
    "description": "{{appDescription}}",
    "i18n": "i18n/i18n.properties",
    "dataSources": {
      "mainService": {
        "uri": "/odata/v4/risk/",
        "type": "OData",
        "settings": { "odataVersion": "4.0" }
      }
    }
  },
  "sap.ui5": {
    "dependencies": {
      "minUI5Version": "1.120.0",
      "libs": { "sap.ui.core": {}, "sap.fe.templates": {} }
    },
    "models": {
      "": {
        "dataSource": "mainService",
        "preload": true,
        "settings": {
          "synchronizationMode": "None",
          "operationMode": "Server",
          "autoExpandSelect": true,
          "earlyRequests": true
        }
      },
      "i18n": {
        "type": "sap.ui.model.resource.ResourceModel",
        "settings": { "bundleName": "risk.analysis.i18n.i18n" }
      }
    },
    "routing": {
      "routes": [
        { "pattern": ":?query:", "name": "GLTransactionsList", "target": "GLTransactionsList" }
      ],
      "targets": {
        "GLTransactionsList": {
          "type": "Component",
          "id": "GLTransactionsList",
          "name": "sap.fe.templates.ListReport",
          "options": {
            "settings": {
              "entitySet": "GLTransactions",
              "initialLoad": "Enabled",
              "controlConfiguration": {
                "@com.sap.vocabularies.UI.v1.LineItem": {
                  "tableSettings": {
                    "type": "ResponsiveTable",
                    "enableExport": true,
                    "growing": true,
                    "growingThreshold": 50,
                    "personalization": {
                      "column": true,
                      "sort": true,
                      "filter": true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Anti-Patterns to Avoid
- **Hand-writing OData metadata XML:** Use CDS annotations exclusively; they compile to the correct OData vocabulary automatically.
- **JavaScript views or controllers for standard behavior:** Fiori Elements handles table rendering, filter bar, pagination, and export. Only write custom code for the Analyze action response handling if needed.
- **Putting annotations in schema.cds or risk-service.cds:** Keep UI annotations in the `app/` layer. Service definitions should remain protocol-agnostic.
- **Using deprecated SAPUI5 APIs:** No `sap.ui.getCore()`, no `jQuery.sap.*`, no synchronous module loading. Use `sap.ui.define` and `sap.fe.core.AppComponent`.
- **Hardcoding labels in annotations:** Always use `{i18n>key}` references and `@title` annotations.
- **Using `@odata.draft.enabled`:** This app is read-only with an action -- draft mode is inappropriate.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Table with sorting, filtering, pagination | Custom sap.m.Table controller | Fiori Elements `sap.fe.templates.ListReport` | Handles all table interaction patterns automatically |
| Export to spreadsheet | Custom export logic | manifest.json `enableExport: true` | Built-in Fiori Elements feature, one config flag |
| Filter bar with multi-select, date range, operators | Custom sap.m.FilterBar | `@UI.SelectionFields` annotation | Automatic from annotations |
| Row coloring | Custom CSS or formatter | `@UI.Criticality` annotation + integer field | Standard Fiori semantic coloring |
| Column visibility/responsiveness | Custom responsive logic | `@UI.Importance` annotation (#High/#Medium/#Low) | Framework handles viewport adaptation |
| Action toolbar button | Custom button + OData call | `@UI.DataFieldForAction` in LineItem | Standard Fiori Elements action binding |
| Progress bar for score | Custom control rendering | `@UI.DataPoint` with `#Progress` visualization | Standard Fiori Elements micro chart |
| i18n resource model | Custom resource loading | manifest.json i18n model + `{i18n>key}` | Standard CAP + UI5 pattern |

**Key insight:** 90%+ of this phase is CDS annotations that the Fiori Elements framework interprets. The only custom JavaScript might be for the Analyze button's response handling (updating virtual fields on loaded rows).

## Common Pitfalls

### Pitfall 1: Unbound Action Not Appearing in Toolbar
**What goes wrong:** The Analyze button does not render in the table toolbar.
**Why it happens:** The `Action` property in `@UI.DataFieldForAction` uses the wrong path. For unbound (service-level) actions, the correct format is `ServiceName.actionName` (e.g., `RiskService.analyzeRisks`). Bound actions use `ServiceName.EntityType/actionName`.
**How to avoid:** Verify against the generated OData metadata XML. The action should appear as `<ActionImport Name="analyzeRisks" Action="RiskService.analyzeRisks"/>`.
**Warning signs:** Button missing from toolbar, no error in console.

### Pitfall 2: Criticality Field Missing from Entity
**What goes wrong:** Row coloring does not work because `@UI.Criticality` points to a field that doesn't exist or is null.
**Why it happens:** The existing entity has `riskClassification` (String) but no integer criticality field. `@UI.Criticality` requires an integer path (0/1/2/3).
**How to avoid:** Add a `virtual criticality: Integer` field to the entity and populate it in the `analyzeRisks` handler alongside other virtual fields. The values from `risk-labels.js` (criticality: 3 for Normal/green, 2 for orange, 1 for red) are already correct for Fiori.
**Warning signs:** Rows render without color, criticality annotation shows in metadata but has no effect.

### Pitfall 3: Criticality Values Backwards
**What goes wrong:** Colors are inverted (Normal shows red, high risk shows green).
**Why it happens:** Confusing Fiori criticality codes. The correct mapping is: 3=Positive/green, 2=Critical/orange, 1=Negative/red, 0=Neutral/gray. The `risk-labels.js` already uses these correct values.
**How to avoid:** Cross-reference with `srv/lib/risk-labels.js` which has the authoritative criticality codes. Normal=3 (green), medium risk=2 (orange), high risk=1 (red).
**Warning signs:** Test with mock data after Analyze -- check that Normal rows are green, not red.

### Pitfall 4: Virtual Fields Not Appearing After Action
**What goes wrong:** After clicking Analyze, the risk columns remain blank even though the action returns data.
**Why it happens:** Fiori Elements may not automatically refresh the table binding after an unbound action. The action returns data but the table binding may not update.
**How to avoid:** Use `@Common.SideEffects` annotation to tell Fiori Elements to refresh the entity set after the action executes. This is the standard pattern for actions that modify displayed data.
**Warning signs:** Action succeeds (200 OK in network tab) but table does not update.
**Resolution pattern:**
```cds
annotate RiskService.analyzeRisks with @(
  Common.SideEffects: {
    TargetEntities: [_it]  // or use TargetProperties to refresh specific fields
  }
);
```
Note: SideEffects on unbound actions may need special handling -- the action is not bound to an entity instance. Alternative: use a controller extension to manually refresh the table binding after the action.

### Pitfall 5: SelectionFields Referencing Virtual Fields
**What goes wrong:** Filtering on `riskClassification` (virtual field) fails because virtual fields are not persisted and cannot be queried via OData $filter.
**Why it happens:** Virtual fields are `@Core.Computed` and not stored in the database. OData `$filter` operates on the server, which cannot filter virtual fields.
**How to avoid:** For the Risk Classification filter, consider one of: (a) use the persisted `anomaly_score` field as a proxy filter (threshold-based), (b) create a value help that maps to client-side filtering, or (c) accept that this filter works only after Analyze has run and the data is on the client. Since CONTEXT.md says "functional against mock data" and mock data starts unanalyzed, the filter may need to be annotation-only (visible in filter bar, operational after analysis populates the field).
**Warning signs:** Filter bar shows Risk Classification but selecting values returns empty results before Analyze runs.

### Pitfall 6: Growing Threshold vs Analyze Scope
**What goes wrong:** User expects Analyze to process all 50 rows but only the initial page (e.g., 20) is processed.
**Why it happens:** The growing threshold in manifest.json controls how many rows load initially and per "More" click.
**How to avoid:** Set `growingThreshold: 50` in manifest.json tableSettings. With 50 mock data rows and threshold of 50, all data loads on initial page. The Analyze action on the server side does `SELECT.from(GLTransactions)` which fetches ALL rows regardless of client pagination -- the current handler already processes all transactions server-side.
**Warning signs:** Table shows "More" link when expecting all rows to be visible.

### Pitfall 7: Service URI Path Mismatch
**What goes wrong:** Fiori app cannot connect to OData service, shows "Service Unavailable" error.
**Why it happens:** The `dataSources.mainService.uri` in manifest.json does not match the actual OData endpoint served by CAP. CAP serves at `/odata/v4/risk/` (lowercase service name path from `cds.env`).
**How to avoid:** Verify the service URI by running `cds watch` and checking the index page, which lists all available endpoints. The URI should be `/odata/v4/risk/` (with trailing slash).
**Warning signs:** 404 errors in browser network tab when the app loads.

## Code Examples

### Complete annotations.cds Pattern
```cds
// Source: Derived from SAP CAP Fiori documentation + SAP sflight sample patterns
using RiskService from '../../srv/risk-service';

// Field labels (i18n)
annotate RiskService.GLTransactions with {
  CompanyCode        @title: '{i18n>CompanyCode}';
  FiscalYear         @title: '{i18n>FiscalYear}';
  DocumentNumber     @title: '{i18n>DocumentNumber}';
  LineItem           @title: '{i18n>LineItem}';
  GLAccount          @title: '{i18n>GLAccount}';
  CostCenter         @title: '{i18n>CostCenter}';
  PostingDate        @title: '{i18n>PostingDate}';
  amount             @title: '{i18n>Amount}';
  riskClassification @title: '{i18n>RiskClassification}';
  riskExplanation    @title: '{i18n>RiskExplanation}';
  anomalyScore       @title: '{i18n>AnomalyScore}';
  criticality        @title: '{i18n>Criticality}'  @UI.Hidden;
};

// Main UI annotations
annotate RiskService.GLTransactions with @(
  UI.Criticality: criticality,
  UI: {
    HeaderInfo: {
      TypeName: '{i18n>Transaction}',
      TypeNamePlural: '{i18n>Transactions}',
      Title: { Value: DocumentNumber },
      Description: { Value: CompanyCode }
    },
    PresentationVariant: {
      SortOrder: [{
        Property: PostingDate,
        Descending: true
      }],
      Visualizations: ['@UI.LineItem']
    },
    SelectionFields: [
      riskClassification,
      CompanyCode
    ],
    LineItem: [
      { $Type: 'UI.DataFieldForAction', Action: 'RiskService.analyzeRisks', Label: '{i18n>Analyze}' },
      { Value: CompanyCode,       @UI.Importance: #High },
      { Value: FiscalYear,        @UI.Importance: #High },
      { Value: DocumentNumber,    @UI.Importance: #High },
      { Value: LineItem,          @UI.Importance: #High },
      { Value: GLAccount,         @UI.Importance: #High },
      { Value: CostCenter,        @UI.Importance: #High },
      { Value: PostingDate,       @UI.Importance: #High },
      { Value: amount,            @UI.Importance: #High },
      { Value: riskClassification, Criticality: criticality, @UI.Importance: #High },
      { Value: riskExplanation,   @UI.Importance: #High },
      { $Type: 'UI.DataFieldForAnnotation', Target: '@UI.DataPoint#anomalyScore', Label: '{i18n>AnomalyScore}', @UI.Importance: #High }
    ],
    DataPoint #anomalyScore: {
      Value: anomalyScore,
      TargetValue: 1,
      Visualization: #Progress,
      Criticality: criticality
    }
  }
);

// Feature columns (hidden by default, available via personalization)
annotate RiskService.GLTransactions with {
  anomaly_score      @title: '{i18n>anomaly_score}'      @UI.Importance: #Low;
  amount_z_score     @title: '{i18n>amount_z_score}'     @UI.Importance: #Low;
  rarity_score       @title: '{i18n>rarity_score}'       @UI.Importance: #Low;
  temporal_score     @title: '{i18n>temporal_score}'      @UI.Importance: #Low;
  // ... remaining 20 feature columns with @UI.Importance: #Low
};
```

### Complete index.html
```html
<!-- Source: SAP sflight sample pattern -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GL Transaction Risk Analysis</title>
  <script id="sap-ui-bootstrap"
    src="https://sapui5.hana.ondemand.com/1.120.0/resources/sap-ui-core.js"
    data-sap-ui-theme="sap_horizon"
    data-sap-ui-resourceroots='{ "risk.analysis": "./" }'
    data-sap-ui-compatVersion="edge"
    data-sap-ui-async="true"
    data-sap-ui-oninit="module:sap/ui/core/ComponentSupport"
    data-sap-ui-libs="sap.m, sap.fe.core"
    data-sap-ui-flexibilityServices='[{"connector": "SessionStorageConnector"}]'>
  </script>
</head>
<body class="sapUiBody" id="content">
  <div data-sap-ui-component
    data-name="risk.analysis"
    data-id="container"
    data-settings='{"id": "risk.analysis"}'
    data-handle-validation="true">
  </div>
</body>
</html>
```

### Complete Component.js
```javascript
// Source: SAP sflight sample pattern (simplified to JS from TS)
sap.ui.define([
  "sap/fe/core/AppComponent"
], function (AppComponent) {
  "use strict";

  return AppComponent.extend("risk.analysis.Component", {
    metadata: {
      manifest: "json"
    }
  });
});
```

### i18n.properties Structure
```properties
# App metadata
appTitle=GL Transaction Risk Analysis
appDescription=Analyze GL transactions for financial risk using AI-powered inference

# Column headers
CompanyCode=Company Code
FiscalYear=Fiscal Year
DocumentNumber=Document Number
LineItem=Line Item
GLAccount=GL Account
CostCenter=Cost Center
PostingDate=Posting Date
Amount=Amount
RiskClassification=Risk Classification
RiskExplanation=Risk Explanation
AnomalyScore=Anomaly Score
Criticality=Criticality

# Entity names
Transaction=GL Transaction
Transactions=GL Transactions

# Actions
Analyze=Analyze

# Risk labels (11 classifications)
riskNormal=Normal
riskUnusualAmount=Unusual Amount
riskHighAmountNewPattern=High Amount + New Pattern
riskHighAmountRarePattern=High Amount + Rare Pattern
riskNewPattern=New Pattern
riskNewPatternWeekend=New Pattern + Weekend
riskNewPatternAfterHours=New Pattern + After Hours
riskRarePattern=Rare Pattern
riskWeekendEntry=Weekend Entry
riskBackdatedEntry=Backdated Entry
riskMultipleFactors=Multiple Risk Factors

# Feature column labels (24 columns)
anomaly_score=Anomaly Score (Raw)
amount_z_score=Amount Z-Score
rarity_score=Rarity Score
temporal_score=Temporal Score
peer_amount_stddev=Peer Amount Std Dev
peer_count=Peer Count
peer_avg_amount=Peer Average Amount
peer_count_month=Peer Count (Month)
frequency_12m=Frequency (12M)
is_weekend=Weekend Flag
is_after_hours=After Hours Flag
is_new_combination=New Combination Flag
abs_amount=Absolute Amount
amount_log=Amount (Log)
peer_amount_ratio=Peer Amount Ratio
is_large_amount=Large Amount Flag
posting_delay_days=Posting Delay (Days)
day_of_week=Day of Week
posting_hour=Posting Hour
month_numeric=Month
PostingDate_days=Posting Date (Days)
weekend_and_large=Weekend + Large Flag
is_high_frequency=High Frequency Flag

# Error messages
analyzeError=Analysis failed. Please try again later.
```

### CDS Entity Extension for Criticality Field
```cds
// Add to srv/risk-service.cds or a separate annotations file
// The virtual criticality field must be on the service projection
using { risk } from '../db/schema';

service RiskService {
  entity GLTransactions as projection on risk.GLTransactions;
  // Virtual criticality field added via extend
  action analyzeRisks() returns array of GLTransactions;
}

// Extend entity to add criticality virtual field
extend RiskService.GLTransactions with {
  virtual criticality : Integer default 0;
}
```

### Service Handler Update (populate criticality)
```javascript
// In risk-service.js, within the analyzeRisks handler:
// After mapping predictions, also set the criticality integer:
const label = mapPrediction(results[predictionIndex]);
tx.riskClassification = label.display;
tx.riskExplanation = label.explanation;
tx.anomalyScore = tx.anomaly_score;
tx.criticality = label.criticality;  // Integer: 3=green, 2=orange, 1=red
```

### app/services.cds (Annotation Entry Point)
```cds
// Source: SAP sflight sample app/services.cds pattern
using from './risks/annotations';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fiori Elements V2 (OData V2) | Fiori Elements V4 (OData V4) | UI5 1.84+ | V4 uses `sap.fe.templates` not `sap.ui.comp`; different manifest structure |
| `sap.ui.comp.smarttable.SmartTable` | `sap.fe.macros.Table` (auto) | UI5 1.84+ | V4 tables are fully annotation-driven |
| XML annotations files | CDS annotations | CAP standard | CDS compiles to OData vocabulary; much more concise |
| `sap.ui.core.UIComponent` | `sap.fe.core.AppComponent` | V4 templates | Must extend AppComponent for Fiori Elements V4 |
| `jQuery.sap.declare` | `sap.ui.define` | SAPUI5 1.28+ | Project CLAUDE.md mandates: no deprecated APIs |
| Manual export button | `enableExport: true` in manifest | V4 templates | One configuration flag enables spreadsheet export |

**Deprecated/outdated:**
- `sap.ui.getCore()` -- banned by CLAUDE.md
- `jQuery.sap.*` -- banned by CLAUDE.md
- `sap.ui.comp.*` (V2 smart controls) -- not available in V4 templates
- Synchronous module loading -- banned by CLAUDE.md (`data-sap-ui-async="true"` required)

## Open Questions

1. **KPI Header Dynamic Updates**
   - What we know: `@UI.KPI` annotation works with analytical queries (`@Aggregation.ApplySupported`). The sflight sample shows this pattern.
   - What's unclear: Whether KPIs can update dynamically after the `analyzeRisks` action completes (since analysis results are in virtual fields, not persisted). The total transaction count works (server-side `$count`), but "high risk count" depends on analysis results that exist only in the action response.
   - Recommendation: Implement total count via annotation-based KPI. For high risk count, either (a) skip it in v1 and defer to v2, (b) use a custom header section with a controller extension that reads from the table binding, or (c) make the KPI reflect server-side data if analysis results are temporarily cached. Start with approach (a) or (b) and validate.

2. **Unbound Action Side Effects**
   - What we know: `@Common.SideEffects` is the standard way to refresh data after an action. For bound actions, `TargetEntities` and `TargetProperties` work well.
   - What's unclear: How `@Common.SideEffects` works with unbound actions in Fiori Elements V4. The action is not bound to a specific entity instance, so the `TargetEntities` reference may need special syntax.
   - Recommendation: Test with a simple SideEffects annotation first. If it doesn't work for the unbound action, fall back to a controller extension that calls `this.getModel().refresh()` after the action completes. The sflight sample uses controller extensions for custom behavior.

3. **Virtual Field Filtering**
   - What we know: Virtual fields (`@Core.Computed`) are not persisted and cannot be filtered server-side via OData `$filter`.
   - What's unclear: Whether Fiori Elements V4 can filter on client-side data for virtual fields, or if the filter bar entry for `riskClassification` will simply have no effect until the field is populated.
   - Recommendation: Include `riskClassification` in `SelectionFields` as specified in CONTEXT.md. Accept that filtering works only after Analyze has been run. Document this as expected behavior. Add a `@Common.ValueList` for the 11 risk display labels to provide a good dropdown UX.

4. **Anomaly Score DataPoint Visualization**
   - What we know: `@UI.DataPoint` with `Visualization: #Progress` renders a progress indicator in table cells. `@UI.DataFieldForAnnotation` in LineItem references it.
   - What's unclear: Whether `#Progress` visualization works correctly for a 0-1 range (TargetValue: 1) in Fiori Elements V4, or if it expects 0-100 percentage.
   - Recommendation: Implement with `TargetValue: 1` first. If the bar renders as 0-1% (tiny), switch to a `#BulletMicroChart` pattern or multiply the display value by 100. Validate visually during development.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.2.0 with @cap-js/cds-test 0.4.1 |
| Config file | `jest.config.js` |
| Quick run command | `cd ../cap-llm-knowledge-only && npx jest --testPathPattern="tests/" --no-coverage -x` |
| Full suite command | `cd ../cap-llm-knowledge-only && npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | LineItem annotation declares all required columns | integration | `npx jest tests/integration/annotations.test.js -x` | No -- Wave 0 |
| UI-02 | SelectionFields annotation declares required filters | integration | `npx jest tests/integration/annotations.test.js -x` | No -- Wave 0 |
| UI-03 | Criticality virtual field populated with correct integer codes | integration | `npx jest tests/integration/risk-service.test.js -x` | Partial -- needs criticality assertion |
| UI-04 | Export enabled in manifest.json | unit | `npx jest tests/unit/manifest.test.js -x` | No -- Wave 0 |
| UI-05 | All required i18n keys present in properties file | unit | `npx jest tests/unit/i18n.test.js -x` | No -- Wave 0 |
| INFER-01 | analyzeRisks action callable and returns enriched data | integration | `npx jest tests/integration/risk-service.test.js -x` | Yes -- already exists |

### Sampling Rate
- **Per task commit:** `cd ../cap-llm-knowledge-only && npx jest --no-coverage -x`
- **Per wave merge:** `cd ../cap-llm-knowledge-only && npx jest`
- **Phase gate:** Full suite green + `cds build` succeeds + visual verification via `cds watch`

### Wave 0 Gaps
- [ ] `tests/integration/annotations.test.js` -- covers UI-01, UI-02: verify CDS model has expected annotations after deployment
- [ ] `tests/unit/manifest.test.js` -- covers UI-04: parse manifest.json and assert enableExport is true
- [ ] `tests/unit/i18n.test.js` -- covers UI-05: parse i18n.properties and verify all required keys exist
- [ ] Update `tests/integration/risk-service.test.js` -- covers UI-03: add assertion that `criticality` field is populated with integer value (1, 2, or 3) after analyzeRisks
- [ ] `cds build` command as build validation -- verify the complete model compiles without errors
- [ ] `virtual criticality : Integer` field added to entity -- prerequisite for UI-03 test

## Sources

### Primary (HIGH confidence)
- SAP CAP documentation: `https://cap.cloud.sap/docs/guides/uis/fiori` -- Fiori Elements setup, annotation patterns, app folder structure, i18n handling
- SAP CAP CDS annotations: `https://cap.cloud.sap/docs/cds/annotations` -- Annotation syntax reference
- SAP CAP CDS actions: `https://cap.cloud.sap/docs/cds/cdl#actions` -- Bound vs unbound action syntax
- SAP sflight sample (travel_processor): `https://github.com/SAP-samples/cap-sflight/tree/main/app/travel_processor` -- Complete working Fiori Elements V4 app with manifest.json, layouts.cds, field-control.cds
- SAP sflight sample (travel_analytics): `https://github.com/SAP-samples/cap-sflight/tree/main/app/travel_analytics` -- @UI.KPI, @UI.Chart annotations

### Secondary (MEDIUM confidence)
- Generated OData metadata (`gen/srv/srv/odata/v4/RiskService.xml`) -- verified action appears as ActionImport, virtual fields are Core.Computed
- Existing risk-labels.js -- verified criticality codes: 3=green/Normal, 2=orange/medium, 1=red/high
- Existing risk-service.js -- verified action handler structure and virtual field population pattern

### Tertiary (LOW confidence)
- KPI dynamic update pattern after unbound action -- no verified source; needs implementation validation
- DataPoint #Progress with TargetValue: 1 for 0-1 range -- standard pattern but not verified with this specific use case
- SideEffects on unbound actions -- standard pattern but unbound action behavior may differ from bound

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Using existing CAP project with well-documented Fiori Elements V4 patterns
- Architecture: HIGH -- SAP sflight sample provides authoritative reference for file structure, manifest.json, and annotation patterns
- Pitfalls: HIGH -- Critical pitfalls (criticality field, unbound action path, virtual field filtering) identified from codebase analysis and OData metadata verification
- KPI header: MEDIUM -- Standard annotation exists but dynamic update after action needs validation
- Micro chart: MEDIUM -- DataPoint #Progress is standard but TargetValue behavior for 0-1 range needs testing

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- CAP and Fiori Elements V4 are mature)
