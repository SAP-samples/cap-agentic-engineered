# Architecture Research

**Domain:** CAP + Fiori Elements application with SAP AI Core inference and BDC data integration
**Researched:** 2026-03-09
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
                             User (Browser)
                                  |
                    +--------------------------+
                    |  Fiori Elements Frontend  |
                    |  (List Report Floorplan)  |
                    +-----------||--------------+
                                ||
                         OData V4 Protocol
                                ||
              +-----------------||------------------+
              |           CAP Service Layer          |
              |                                      |
              |  +-------------+  +---------------+  |
              |  | OData V4    |  | Action Handler |  |
              |  | Entity Set  |  | (analyzeRisks) |  |
              |  +------+------+  +-------+-------+  |
              |         |                 |          |
              +---------|-----------------|----------+
                        |                 |
           +------------+        +--------+--------+
           |                     |                  |
    +------v-------+    +--------v-------+   +------v------+
    | BDC Remote   |    | AI Core Client |   | Risk Label  |
    | Service      |    | (HTTP POST)    |   | Mapper      |
    | (OData V4)   |    +--------+-------+   | (Static)    |
    +------+-------+             |           +-------------+
           |                     |
  +--------v--------+   +-------v--------+
  | BTP Destination |   | SAP AI Core    |
  | (or Mock CSV)   |   | XGBoost Model  |
  +-----------------+   | /v1/predict    |
                        +----------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Fiori Elements List Report** | Render GL transactions table, filters, "Analyze" button, criticality colors | `app/risks/` with CDS annotations, no custom controller code |
| **CAP CDS Domain Model** | Define entity schema matching `gl_features_for_ml` columns | `db/schema.cds` with entity definition |
| **CAP OData Service** | Expose GL transactions as OData V4 entity set with bound action | `srv/risk-service.cds` with entity projection and `analyzeRisks` action |
| **CAP Service Handler** | Implement `analyzeRisks` action: extract features, call AI Core, map labels | `srv/risk-service.js` (sibling JS file to CDS) |
| **BDC Remote Service** | Proxy queries to BDC data product via BTP Destination | `srv/external/` with imported CDS definition, mocked with CSV in dev |
| **AI Core Client** | HTTP POST to XGBoost deployment, handle OAuth token exchange | `srv/lib/ai-core-client.js` isolated utility module |
| **Risk Label Mapper** | Translate 11 model class labels to display text, explanations, criticality | `srv/lib/risk-labels.js` pure lookup table |
| **Mock Data** | CSV files simulating BDC data product for local development | `db/data/` or `srv/external/data/` CSV files |

## Recommended Project Structure

```
./
  ├── app/                          # Fiori Elements UI artifacts
  │   ├── risks/                    # List report application
  │   │   ├── webapp/
  │   │   │   ├── manifest.json     # Fiori app descriptor (routing, data source)
  │   │   │   ├── Component.js      # UI5 Component (minimal, generated)
  │   │   │   ├── i18n/
  │   │   │   │   └── i18n.properties  # All user-facing strings
  │   │   │   └── annotations.cds  # UI annotations (could also be at app/risks/ level)
  │   │   └── package.json          # Fiori app metadata
  │   ├── annotations.cds           # Alternative: shared annotations file
  │   └── index.html                # Sandbox test page
  ├── srv/                          # Service layer
  │   ├── risk-service.cds          # Service definition (entity projection + actions)
  │   ├── risk-service.js           # Service handler (action implementation)
  │   ├── lib/                      # Shared utility modules
  │   │   ├── ai-core-client.js     # HTTP client for AI Core inference
  │   │   └── risk-labels.js        # Static label mapping (11 classes)
  │   └── external/                 # Remote service definitions
  │       ├── BDC_GLFeatures.cds    # Imported CDS from BDC data product
  │       └── data/                 # Mock data for remote service
  │           └── BDC_GLFeatures-GLFeatures.csv
  ├── db/                           # Domain model and seed data
  │   ├── schema.cds                # Core entity definitions
  │   └── data/                     # Initial data (CSV)
  │       └── <namespace>-GLTransactions.csv
  ├── package.json                  # Project config, CDS requires (destinations)
  ├── .cdsrc.json                   # CDS configuration overrides (optional)
  └── .env                          # Local credentials (AI Core token URL, etc.)
```

### Structure Rationale

- **`app/risks/`:** One Fiori Elements app per use case. The list report requires minimal custom code because Fiori Elements is annotation-driven. CDS annotations define columns, filters, and actions declaratively.
- **`srv/risk-service.cds` + `.js`:** CAP convention places the handler JS file as a sibling to the CDS file with the same base name. The framework auto-discovers and wires them.
- **`srv/lib/`:** Isolate AI Core HTTP client and risk label mapper as testable utility modules. Keep the service handler thin by delegating to these.
- **`srv/external/`:** CAP convention for imported remote service definitions. Created by `cds import`. Contains both the CDS definition and mock data for local development.
- **`db/schema.cds`:** The canonical domain model. The service layer projects from this, selecting and renaming fields. Even though data comes from BDC (remote), defining a local entity allows mock-first development with `cds watch`.
- **`db/data/`:** CSV mock data loaded automatically by `cds watch` and `cds deploy --to sqlite`. Named `<namespace>-<EntityName>.csv`.

## Architectural Patterns

### Pattern 1: Mock-First Remote Service Integration

**What:** Define the BDC data product as a CAP remote service, but develop entirely against local mock CSV data. Wire the real BTP Destination only when the backend is feature-complete.

**When to use:** Always, when the remote data source (BDC Connect) is not yet configured or unreliable during development.

**Trade-offs:** Fast inner-loop development. Risk that mock data shape diverges from real BDC schema. Mitigate by importing the real EDMX/CDS definition from BDC early and generating mock CSV from it.

**Implementation:**

```cds
// srv/external/BDC_GLFeatures.cds (imported from BDC or hand-authored)
@cds.external
service BDC_GLFeatures {
  entity GLFeatures {
    key ID               : UUID;
    CompanyCode          : String(4);
    GLAccount            : String(10);
    CostCenter           : String(10);
    PostingDate          : Date;
    Amount               : Decimal(15,2);
    anomaly_score        : Double;
    amount_z_score       : Double;
    // ... all 25 feature columns
  }
}
```

```json
// package.json — cds.requires section
{
  "cds": {
    "requires": {
      "BDC_GLFeatures": {
        "kind": "odata-v4",
        "model": "srv/external/BDC_GLFeatures",
        "[production]": {
          "credentials": {
            "destination": "BDC_GLFeatures",
            "path": "/odata/v4/gl-features"
          }
        }
      }
    }
  }
}
```

In development, `cds watch` auto-mocks the remote service. In production, the `[production]` profile activates the BTP Destination binding.

### Pattern 2: Bound Action for On-Demand Inference

**What:** Define `analyzeRisks` as a bound action on the GL transactions entity. The Fiori Elements toolbar renders it as a button. When clicked, selected rows are sent to the handler, which calls AI Core and returns enriched results.

**When to use:** When inference should be explicit and user-triggered, not automatic on every page load. This avoids unnecessary AI Core calls and gives the user control.

**Trade-offs:** More intuitive UX (user decides when to analyze). Requires handling the case where rows have not been analyzed yet (Risk Classification shows as empty). Bound actions operate on selected entities, which maps naturally to "analyze these transactions."

**Implementation:**

```cds
// srv/risk-service.cds
using { BDC_GLFeatures as bdc } from './external/BDC_GLFeatures';

service RiskService {
  entity GLTransactions as projection on bdc.GLFeatures {
    *,
    // Computed columns populated by the action
    null as riskClassification   : String,
    null as riskExplanation      : String,
    null as criticalityCode      : Integer
  } actions {
    action analyzeRisks() returns array of GLTransactions;
  };
}
```

```cds
// app/risks/annotations.cds
annotate RiskService.GLTransactions with @(
  UI.LineItem: [
    { Value: CompanyCode },
    { Value: GLAccount },
    { Value: CostCenter },
    { Value: PostingDate },
    { Value: Amount },
    { Value: riskClassification, Criticality: criticalityCode },
    { Value: riskExplanation },
    { Value: anomaly_score }
  ],
  UI.SelectionFields: [
    riskClassification, CompanyCode, PostingDate, Amount, anomaly_score
  ]
);

// Action button in toolbar
annotate RiskService.GLTransactions with @(
  UI.LineItem: [
    { $Type: 'UI.DataFieldForAction', Action: 'RiskService.analyzeRisks', Label: '{i18n>Analyze}' },
    // ... column definitions above
  ]
);
```

### Pattern 3: Isolated AI Core HTTP Client

**What:** Encapsulate all SAP AI Core communication (OAuth token acquisition, inference call, error handling, retry) in a standalone module (`srv/lib/ai-core-client.js`) that the service handler imports.

**When to use:** Always. The AI Core calling pattern involves OAuth token exchange, specific URL construction, and error handling that should not pollute the service handler.

**Trade-offs:** Clean separation of concerns. The client module is independently testable. Adding retry logic or circuit-breaking later does not touch the handler. Slightly more files to maintain.

**Implementation:**

```javascript
// srv/lib/ai-core-client.js
const FEATURE_COLUMNS = [
  'anomaly_score', 'amount_z_score', 'rarity_score', 'temporal_score',
  'peer_amount_stddev', 'peer_count', 'peer_avg_amount', 'peer_count_month',
  'frequency_12m', 'is_weekend', 'is_after_hours', 'is_new_combination',
  'amount', 'abs_amount', 'amount_log', 'peer_amount_ratio', 'is_large_amount',
  'posting_delay_days', 'day_of_week', 'posting_hour', 'month_numeric',
  'PostingDate_days', 'weekend_and_large', 'is_high_frequency'
];

async function getAICoreToken() {
  const tokenUrl = process.env.AI_CORE_AUTH_URL;
  const clientId = process.env.AI_CORE_CLIENT_ID;
  const clientSecret = process.env.AI_CORE_CLIENT_SECRET;

  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    })
  });
  const { access_token } = await resp.json();
  return access_token;
}

async function predictAnomalies(transactions) {
  const featureRows = transactions.map(tx =>
    FEATURE_COLUMNS.map(col => Number(tx[col]) || 0)
  );

  const token = await getAICoreToken();
  const resp = await fetch(process.env.AI_CORE_PREDICTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ data: featureRows })
  });

  if (!resp.ok) throw new Error(`AI Core returned ${resp.status}`);
  return (await resp.json()).predictions;
}

module.exports = { predictAnomalies, FEATURE_COLUMNS };
```

### Pattern 4: Static Label Mapping as a Pure Module

**What:** Keep the 11-class risk label mapping in its own module with no dependencies. Each model output class maps to a display label, human-readable explanation, and Fiori criticality integer.

**When to use:** When model output classes are fixed and the display mapping is deterministic (no GenAI needed).

**Trade-offs:** Zero runtime cost, deterministic, easy to test. If model classes change (new class added), this file must be updated manually. Acceptable for a prototype.

## Data Flow

### Browse Flow (Page Load)

```
User opens app
    |
    v
Fiori Elements sends GET /odata/v4/risk/GLTransactions
    |
    v
CAP Service Handler (on READ)
    |
    v
Delegates to BDC Remote Service (cds.connect.to)
    |                                     |
    v [dev]                               v [prod]
Mock CSV in srv/external/data/     BTP Destination -> BDC OData
    |                                     |
    v                                     v
Returns GL transactions (without risk columns populated)
    |
    v
Fiori List Report renders table
(Risk Classification, Risk Explanation columns are empty)
```

### Analyze Flow (User Action)

```
User selects rows, clicks "Analyze"
    |
    v
Fiori sends POST /odata/v4/risk/GLTransactions/<key>/RiskService.analyzeRisks
    |
    v
CAP Action Handler (on 'analyzeRisks')
    |
    +---> Extract 25 feature columns in exact order (FEATURE_COLUMNS array)
    |
    +---> ai-core-client.js: POST to AI Core /v1/predict
    |         |
    |         +---> OAuth2 token exchange (client credentials)
    |         +---> POST { data: [[...features]] }
    |         +---> Returns { predictions: ["High_Amount_Deviation", ...] }
    |
    +---> risk-labels.js: Map each prediction to display label + explanation + criticality
    |
    v
Returns enriched transactions with:
  - riskClassification: "Unusual Amount"
  - riskExplanation: "This transaction amount is statistically unusual..."
  - criticalityCode: 1 (red)
    |
    v
Fiori List Report re-renders with color-coded risk columns
```

### Key Data Flows

1. **BDC -> CAP (read-only):** GL transactions with 25 feature columns flow from BDC data product through BTP Destination to the CAP OData service. In development, mock CSV substitutes for BDC.

2. **CAP -> AI Core (inference):** The action handler extracts exactly 25 numeric features per transaction in column order and POSTs them to the XGBoost model. The model returns string class labels. No data is written to AI Core.

3. **Label enrichment (in-memory):** Predictions from AI Core are mapped to business-language labels and Fiori criticality codes inside the CAP handler. This is a pure in-memory transformation, not persisted.

4. **CAP -> Fiori (OData response):** Enriched transactions (original GL fields + risk classification + explanation + criticality) are returned as OData entities. Fiori Elements renders them with annotation-driven formatting.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Prototype (10-100 txns) | Single CAP service, in-memory label mapping, no caching. AI Core call per batch. Current design works. |
| Departmental (1K-10K txns) | Batch AI Core calls (send arrays of 100-500 rows per POST). Add token caching (OAuth tokens are valid ~10 min). Consider persisting predictions to avoid re-inference. |
| Enterprise (100K+ txns) | Paginate BDC reads. Move to async inference (queue + callback). Cache predictions in CAP-local database. Consider pre-scoring in the data pipeline (Databricks) instead of real-time inference. |

### Scaling Priorities

1. **First bottleneck: AI Core round-trip latency.** Each "Analyze" click currently sends all selected transactions in one POST. If users select thousands of rows, the request payload grows and inference takes seconds. Fix: batch into chunks of 100-500 and parallelize calls. Cache OAuth token instead of re-fetching per call.

2. **Second bottleneck: BDC data volume.** Loading 100K+ GL transactions on page load is slow. Fix: server-side pagination (CAP handles OData $top/$skip natively), plus push users toward filtering before analyzing.

## Anti-Patterns

### Anti-Pattern 1: Auto-Inference on Page Load

**What people do:** Call AI Core automatically when the list report loads, scoring every visible row.
**Why it's wrong:** Unnecessary AI Core calls, slow page load, wasted compute. Users may just be browsing.
**Do this instead:** Use an explicit "Analyze" action button. Score only when the user requests it. Show empty risk columns until analyzed.

### Anti-Pattern 2: Exposing Remote Service Entities Directly

**What people do:** Re-export the BDC remote entity directly in the CAP service without a projection.
**Why it's wrong:** Couples your API contract to the BDC data product schema. If BDC renames a field, your OData clients break.
**Do this instead:** Create a CDS projection that maps BDC field names to your own stable API names. This insulates the frontend from upstream schema changes.

### Anti-Pattern 3: Feature Extraction in the Frontend

**What people do:** Extract the 25 feature columns in the Fiori controller and POST directly to AI Core from the browser.
**Why it's wrong:** Exposes AI Core credentials to the browser. Breaks if feature order changes. Bypasses CAP authorization. Splits business logic across tiers.
**Do this instead:** Keep all inference logic in the CAP action handler. The frontend only knows about the "analyzeRisks" action. Feature extraction, AI Core call, and label mapping all happen server-side.

### Anti-Pattern 4: Hardcoding Feature Column Order Inline

**What people do:** Build the feature array directly in the handler function with inline column names.
**Why it's wrong:** If the model is retrained with a different feature set, you have to hunt through handler code to update. Error-prone because order is critical.
**Do this instead:** Define `FEATURE_COLUMNS` as a named constant array in a separate module (`srv/lib/ai-core-client.js`). The handler just calls `predictAnomalies(transactions)` without knowing column details.

### Anti-Pattern 5: Annotations Inside Service CDS Files

**What people do:** Put all `@UI.LineItem`, `@UI.SelectionFields` annotations directly in `srv/risk-service.cds`.
**Why it's wrong:** Mixes backend service concerns with frontend presentation. Makes it hard for a frontend agent to work independently.
**Do this instead:** Place UI annotations in `app/risks/annotations.cds`. The service CDS defines entities and actions only. CAP merges all CDS files automatically.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **BDC Data Product** (`gl_features_for_ml`) | CAP remote service via BTP Destination (OData V4). Imported CDS in `srv/external/`. Mocked with CSV in dev. | BTP Destination not yet configured. Build with mocks first. CSV naming: `<service>-<entity>.csv` in `srv/external/data/`. |
| **SAP AI Core** (XGBoost `/v1/predict`) | Direct HTTP POST from `srv/lib/ai-core-client.js`. OAuth2 client credentials for token. Custom Docker deployment, not foundation model SDK. | NOT via `@sap-ai-sdk/foundation-models` (wrong SDK for custom containers). Token URL, client ID, client secret from `.env`. |
| **SAP AI Core OAuth** | `POST` to token endpoint with `client_credentials` grant type. Cache token for ~600s. | Token endpoint in `SAP_AI_CORE_AUTH_URL` env var. Standard OAuth2 client credentials flow. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Fiori Elements <-> CAP Service** | OData V4 protocol. Entity reads via GET, action invocation via POST. Annotations drive UI. | No custom Fiori controller code needed for standard list report. Action binding handled by Fiori Elements automatically. |
| **CAP Service Handler <-> AI Core Client** | JS module import. Handler calls `predictAnomalies(rows)` and receives `string[]`. | Clean function boundary. Handler does not know about HTTP, OAuth, or feature order. |
| **CAP Service Handler <-> Risk Label Mapper** | JS module import. Handler calls `mapLabel(prediction)` and receives `{display, explanation, criticality}`. | Pure function, no side effects, trivially testable. |
| **CAP Service <-> BDC Remote Service** | `cds.connect.to('BDC_GLFeatures')` returns a service proxy. Handler delegates READ queries to it. | In dev, CAP auto-mocks. In prod, BTP Destination resolves connection. Configuration-only switch via `[production]` profile in `package.json`. |

## Build Order (Dependencies Between Components)

The following build order reflects real dependencies where one component requires another to exist.

### Phase 1: Scaffold + Domain Model (MUST be first)

Build: `cds init`, `db/schema.cds`, `package.json`, mock CSV data.

**Why first:** Everything depends on the CDS entity definition. The service projects from it. The frontend annotates it. The mock data populates it. Without the schema, nothing else can compile.

**Deliverable:** `cds watch` starts, mock data is served at `/odata/v4/risk/GLTransactions`.

### Phase 2: Backend Service + AI Core Client (parallel-safe after Phase 1)

Build: `srv/risk-service.cds`, `srv/risk-service.js`, `srv/lib/ai-core-client.js`, `srv/lib/risk-labels.js`.

**Why second:** The service definition depends on the domain model. The handler depends on the AI Core client and label mapper. These backend pieces can be built and tested independently of the frontend.

**Deliverable:** OData endpoint works. `analyzeRisks` action callable via REST client (curl/Postman). Returns enriched results.

### Phase 3: Frontend Annotations + Fiori App (parallel-safe after Phase 1)

Build: `app/risks/annotations.cds`, `app/risks/webapp/manifest.json`, `app/risks/webapp/Component.js`, `app/risks/webapp/i18n/`.

**Why parallel with Phase 2:** Fiori Elements only needs the CDS entity schema and annotations to render. It does not need the handler implementation. However, the "Analyze" button will not work until the backend action handler exists.

**Deliverable:** List report renders with mock data. Columns and filters work. "Analyze" button appears but requires backend integration.

### Phase 4: Integration + BDC Wiring (last)

Build: Wire BTP Destination for BDC, replace mock data, end-to-end testing with real AI Core endpoint.

**Why last:** Requires both backend and frontend to be complete. BTP Destination configuration is operational, not code. Should not block development.

**Deliverable:** Full end-to-end flow with real BDC data and real AI Core predictions.

### Dependency Graph

```
Phase 1: Scaffold + Domain Model
    |
    +--------+---------+
    |                  |
    v                  v
Phase 2: Backend    Phase 3: Frontend
    |                  |
    +--------+---------+
             |
             v
     Phase 4: Integration
```

Phases 2 and 3 are parallelizable. This matches the 3-agent setup: orchestrator handles Phase 1 (scaffold), then backend agent takes Phase 2 while frontend agent takes Phase 3 simultaneously. Orchestrator handles Phase 4 (integration + merge).

## Sources

- CAP Documentation: Project Structure — https://cap.cloud.sap/docs/get-started/
- CAP Documentation: Consuming Remote Services — https://cap.cloud.sap/docs/guides/services/consuming-services
- CAP Documentation: Service Handlers and Actions — https://cap.cloud.sap/docs/node.js/core-services
- CAP Documentation: Fiori Elements Integration — https://cap.cloud.sap/docs/guides/uis/fiori
- CAP Documentation: CDS Actions and Functions — https://cap.cloud.sap/docs/cds/cdl#actions
- CAP Documentation: Initial Data / Mock Data — https://cap.cloud.sap/docs/guides/databases/initial-data
- Project Context: `spec/PROJECT.md`, `../prototype/USE_CASE.md`, `../prototype/CLAUDE.md`

---
*Architecture research for: Financial Risk Analyzer (CAP + Fiori Elements + AI Core + BDC)*
*Researched: 2026-03-09*
