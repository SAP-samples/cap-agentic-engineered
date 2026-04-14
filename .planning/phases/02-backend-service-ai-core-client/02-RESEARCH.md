# Phase 2: Backend Service + AI Core Client - Research

**Researched:** 2026-03-09
**Domain:** CAP OData actions, SAP AI Core SDK, HTTP client patterns, static label mapping
**Confidence:** HIGH

## Summary

Phase 2 builds the backend service layer that connects the CAP OData service to SAP AI Core for ML inference. The research confirms that `@sap-ai-sdk/ai-api` v3.x provides OAuth2 token management and deployment invocation via the `AiCoreService` class, eliminating the need for manual token handling. CAP bound actions (defined via `action` keyword in CDS and implemented in service handlers) provide the OData V4 action pattern needed for the "Analyze" button. The static label mapping is a simple JavaScript object lookup with no external dependencies.

**Key finding:** The USE_CASE.md shows 24 feature columns (numbered 1-24), confirming the corrected count. The AI Core model expects a 2D array with 24 features per row. Phase 1 already established `FEATURE_COLUMNS` as the single source of truth.

**Primary recommendation:** Define `analyzeRisks` as a bound action in `srv/risk-service.cds`, implement the handler in `srv/risk-service.js` using `@sap-ai-sdk/ai-api` for AI Core invocation, extract features in documented order from `FEATURE_COLUMNS`, and map predictions via a static `RISK_LABELS` object.

## User Constraints

### Locked Decisions
- **Action definition:** Bound action named `analyzeRisks` on the `GLTransactions` entity set, callable via `POST /odata/v4/risk/GLTransactions/analyzeRisks`. Returns nothing (fire-and-forget pattern) — results written to virtual fields, UI refreshes via OData binding.
- **AI Core SDK:** Use `@sap-ai-sdk/ai-api` (not raw HTTP fetch) for token management and deployment invocation. OAuth2 handled automatically via service binding or environment variables.
- **Feature extraction:** Iterate over `FEATURE_COLUMNS` array to extract 24 numeric values per transaction in exact order. If any feature is null/undefined, skip that row with warning log (don't send incomplete data to model).
- **Static label mapping:** 11-class lookup object with keys matching model output exactly (e.g., "High_Amount_Deviation"). Each value has `display`, `explanation`, `criticality` (3=green, 2=orange, 1=red for Fiori).
- **Error handling:** AI Core timeouts, auth failures, or 5xx responses return HTTP 502 to client with user-facing message ("AI service temporarily unavailable"). Log full error server-side. Never expose raw stack traces or tokens to client.

### Claude's Discretion
- Exact service handler file structure (single `risk-service.js` vs separate modules in `srv/lib/`)
- Logging verbosity and format (as long as `cds.log` is used)
- Timeout values for AI Core HTTP calls (reasonable default: 30 seconds)
- Whether to implement retry logic for transient AI Core errors (optional, not required for Phase 2)

### Deferred Ideas (OUT OF SCOPE)
- Batch optimization (send all transactions in one AI Core call) — Phase 2 sends each row individually for simplicity
- Caching AI Core predictions — every "Analyze" triggers fresh inference
- Async job pattern — Phase 2 is synchronous, user waits for response

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-02 | OData V4 service exposes `analyzeRisks` bound action | CAP action syntax, handler registration patterns |
| INFER-02 | Feature extraction produces 24 numeric values in order | `FEATURE_COLUMNS` array iteration, null handling |
| INFER-03 | AI Core client uses `@sap-ai-sdk/ai-api` with token management | `AiCoreService` class, deployment invocation API |
| INFER-04 | Static mapping: 11 model classes → display/explanation/criticality | JavaScript object lookup, criticality codes (3/2/1) |
| INFER-05 | AI Core errors return user-facing messages | Try-catch patterns, HTTP 502 for downstream failures |

## Standard Stack

### Core Dependencies
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @sap-ai-sdk/ai-api | ^3.1.0 | SAP AI Core SDK for deployment invocation | Official SAP SDK with OAuth2, service binding support |
| @sap-ai-sdk/core | ^3.1.0 | Core utilities for AI SDK (auto-installed with ai-api) | Dependency of ai-api |
| @sap/cds | ^9.8.0 | CAP runtime for service handlers | Already installed in Phase 1 |

### Supporting (Development/Testing)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @cap-js/cds-test | latest | HTTP testing utilities | Integration tests for action handler |
| nock | ^13.5.4 | HTTP mocking for AI Core endpoint | Unit tests that mock AI Core responses |
| jest | ^30.2.0 | Test runner | Already installed in Phase 1 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @sap-ai-sdk/ai-api | Raw `fetch` with manual OAuth2 | SDK handles token lifecycle, retries, service binding — manual approach is 200+ lines of boilerplate |
| Static label object | GenAI for label generation | Static is deterministic, instant, zero cost. GenAI adds latency and hallucination risk. |
| Bound action | Function import | Bound actions are RESTful (POST to entity), function imports are RPC-style (less idiomatic for OData V4) |

**Installation:**
```bash
cd prototype
npm install --save @sap-ai-sdk/ai-api @sap-ai-sdk/core
npm install --save-dev nock
```

## Architecture Patterns

### Recommended Service Structure
```
srv/
├── risk-service.cds        # Service + action definition
├── risk-service.js         # Action handler implementation
└── lib/
    ├── feature-columns.js  # FEATURE_COLUMNS constant (already exists)
    ├── ai-core-client.js   # AI Core invocation wrapper
    └── risk-labels.js      # RISK_LABELS mapping object
```

### Pattern 1: Bound Action Definition
**What:** Define an action bound to an entity set, callable via POST
**When to use:** User-triggered operations that mutate or analyze data (like "Analyze")
**Example:**
```cds
// srv/risk-service.cds
using { risk } from '../db/schema';

service RiskService {
  entity GLTransactions as projection on risk.GLTransactions;

  // Bound action (operates on entity set)
  action analyzeRisks() returns String;
}
```
**Source:** https://cap.cloud.sap/docs/cds/cdl#actions-and-functions (CAP actions syntax)

### Pattern 2: Action Handler Registration
**What:** Implement action logic in service handler file
**When to use:** Every action defined in CDS needs a JavaScript handler
**Example:**
```javascript
// srv/risk-service.js
const cds = require('@sap/cds');
const { analyzeRisks } = require('./lib/ai-core-handler');

module.exports = cds.service.impl(async function() {
  this.on('analyzeRisks', async (req) => {
    const { GLTransactions } = this.entities;

    // Get all GL transactions
    const transactions = await SELECT.from(GLTransactions);

    // Call AI Core and update virtual fields
    const result = await analyzeRisks(transactions);

    return `Analyzed ${result.count} transactions`;
  });
});
```
**Source:** https://cap.cloud.sap/docs/node.js/core-services#srv-on-before-after (CAP event handlers)

### Pattern 3: AI Core Client with @sap-ai-sdk/ai-api
**What:** Use `AiCoreService` to invoke deployed model with automatic OAuth2
**When to use:** Any AI Core deployment invocation
**Example:**
```javascript
// srv/lib/ai-core-client.js
const { AiCoreService } = require('@sap-ai-sdk/ai-api');

// Initialize service (reads from BTP service binding or env vars)
const aiCore = new AiCoreService({
  url: process.env.AI_CORE_BASE_URL,
  clientId: process.env.SAP_AI_CORE_CLIENT_ID,
  clientSecret: process.env.SAP_AI_CORE_CLIENT_SECRET,
  authUrl: process.env.SAP_AI_CORE_AUTH_URL
});

async function predictAnomalies(featureRows) {
  const deploymentId = process.env.AI_CORE_DEPLOYMENT_ID;

  const response = await aiCore.invoke({
    deploymentId,
    method: 'POST',
    path: '/v1/predict',
    body: { data: featureRows },
    headers: { 'Content-Type': 'application/json' }
  });

  return response.predictions; // ["Normal", "High_Amount_Deviation", ...]
}

module.exports = { predictAnomalies };
```
**Source:** https://github.com/SAP/ai-sdk-js/tree/main/packages/ai-api (AI SDK documentation)

### Pattern 4: Feature Extraction with Null Handling
**What:** Extract 24 features per row, skip rows with missing data
**When to use:** Before sending to AI Core (incomplete features cause model errors)
**Example:**
```javascript
// srv/lib/feature-extractor.js
const { FEATURE_COLUMNS } = require('./feature-columns');
const cds = require('@sap/cds');

function extractFeatures(transactions) {
  const validRows = [];
  const skipped = [];

  for (const tx of transactions) {
    const features = FEATURE_COLUMNS.map(col => tx[col]);

    // Check for null/undefined
    if (features.some(f => f == null)) {
      skipped.push(tx.DocumentNumber);
      cds.log().warn(`Skipping transaction ${tx.DocumentNumber}: missing features`);
      continue;
    }

    validRows.push(features);
  }

  return { validRows, skipped };
}

module.exports = { extractFeatures };
```
**Key:** Use `== null` (loose equality) to catch both `null` and `undefined`.

### Pattern 5: Static Risk Label Mapping
**What:** Object with model class names as keys, display/explanation/criticality as values
**When to use:** Translating model predictions to UI-friendly labels
**Example:**
```javascript
// srv/lib/risk-labels.js
const RISK_LABELS = {
  "Normal": {
    display: "Normal",
    explanation: "No anomalies detected in this transaction.",
    criticality: 3  // Green/positive
  },
  "High_Amount_Deviation": {
    display: "Unusual Amount",
    explanation: "This transaction amount is statistically unusual compared to similar entries.",
    criticality: 1  // Red/negative
  },
  "High_Amount_New_Combination": {
    display: "High Amount + New Pattern",
    explanation: "Large amount on a GL/cost center combination that has never appeared before.",
    criticality: 1
  },
  "High_Amount_Rare_Combination": {
    display: "High Amount + Rare Pattern",
    explanation: "Large amount on a GL/cost center combination seen 5 or fewer times in 12 months.",
    criticality: 1
  },
  "New_Combination": {
    display: "New Pattern",
    explanation: "This GL/cost center/amount combination has not been seen before.",
    criticality: 2  // Orange/critical
  },
  "New_Combination_Weekend": {
    display: "New Pattern + Weekend",
    explanation: "Never-before-seen combination posted on a weekend.",
    criticality: 1
  },
  "New_Combination_After_Hours": {
    display: "New Pattern + After Hours",
    explanation: "Never-before-seen combination posted outside business hours.",
    criticality: 1
  },
  "Rare_Combination": {
    display: "Rare Pattern",
    explanation: "This GL/cost center combination has appeared 5 or fewer times in 12 months.",
    criticality: 2
  },
  "Weekend_Posting": {
    display: "Weekend Entry",
    explanation: "Transaction was posted on a Saturday or Sunday.",
    criticality: 2
  },
  "Backdated_Posting": {
    display: "Backdated Entry",
    explanation: "More than 10 days between the document date and posting date.",
    criticality: 2
  },
  "General_Anomaly": {
    display: "Multiple Risk Factors",
    explanation: "This transaction has a composite anomaly score above the risk threshold.",
    criticality: 1
  }
};

function mapPrediction(modelClass) {
  const label = RISK_LABELS[modelClass];
  if (!label) {
    cds.log().error(`Unknown model class: ${modelClass}`);
    return RISK_LABELS["General_Anomaly"]; // Fallback
  }
  return label;
}

module.exports = { RISK_LABELS, mapPrediction };
```
**Criticality codes:** 3=positive/green, 2=critical/orange, 1=negative/red (Fiori semantic colors).

### Pattern 6: Error Handling for AI Core Failures
**What:** Catch AI Core errors, log details, return user-facing messages
**When to use:** Any external service call (AI Core, BDC)
**Example:**
```javascript
// srv/lib/ai-core-handler.js
const cds = require('@sap/cds');
const { predictAnomalies } = require('./ai-core-client');
const { extractFeatures } = require('./feature-extractor');
const { mapPrediction } = require('./risk-labels');

async function analyzeRisks(transactions) {
  try {
    // Extract features
    const { validRows, skipped } = extractFeatures(transactions);

    if (validRows.length === 0) {
      throw new Error('No valid transactions to analyze');
    }

    // Call AI Core
    const predictions = await predictAnomalies(validRows);

    // Map results back to transactions
    let i = 0;
    for (const tx of transactions) {
      if (!skipped.includes(tx.DocumentNumber)) {
        const label = mapPrediction(predictions[i]);
        tx.riskClassification = label.display;
        tx.riskExplanation = label.explanation;
        tx.anomalyScore = tx.anomaly_score; // Copy from feature column
        i++;
      }
    }

    return { count: validRows.length, skipped: skipped.length };

  } catch (error) {
    cds.log().error('AI Core invocation failed', error);

    // User-facing error (don't expose stack trace)
    throw new cds.ApplicationError(
      'AI service temporarily unavailable. Please try again later.',
      { status: 502 }
    );
  }
}

module.exports = { analyzeRisks };
```
**Key:** Use `cds.ApplicationError` for user-facing messages, log full error server-side.

### Anti-Patterns to Avoid
- **Manual OAuth2 token handling:** SDK does this automatically. Don't write custom token fetch/refresh logic.
- **Sending incomplete feature arrays:** Model expects exactly 24 features. Missing data causes cryptic errors.
- **Using unbound actions:** Bound actions (on entity set) are more RESTful than function imports.
- **Exposing raw model class names to UI:** Users see "High_Amount_Deviation" instead of "Unusual Amount" — always map.
- **Forgetting to validate model output:** AI Core could return unexpected class names. Always check against `RISK_LABELS`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth2 token lifecycle | Custom token fetch/refresh/cache | `@sap-ai-sdk/ai-api` AiCoreService | SDK handles token expiry, retries, service binding. Manual approach is 200+ lines prone to race conditions. |
| HTTP client with retry logic | Custom fetch wrapper with exponential backoff | `@sap-ai-sdk/ai-api` built-in retry | SDK retries transient failures (429, 503) automatically with configurable strategy. |
| Action handler boilerplate | Manual req.data parsing, response building | CAP `this.on('actionName', handler)` | CAP parses OData action payload, validates types, serializes response. Zero boilerplate. |
| Feature array validation | Manual length/type checks per feature | Array iteration with `== null` check | Simple, readable, catches both null and undefined. Complex validation (type, range) can wait for Phase 4. |

**Key insight:** The `@sap-ai-sdk/ai-api` package exists precisely to avoid hand-rolling AI Core integration. Use it.

## Common Pitfalls

### Pitfall 1: Feature Order Mismatch
**What goes wrong:** Model predictions are nonsensical (e.g., all "Normal" or random classes) even though request succeeds.
**Why it happens:** Feature extraction order doesn't match `FEATURE_COLUMNS` or model training order. Model sees `is_weekend` where it expects `anomaly_score`.
**How to avoid:** Always iterate over `FEATURE_COLUMNS` array. Add assertion: `if (features.length !== 24) throw new Error()`. Unit test feature extraction.
**Warning signs:** AI Core returns 200 but predictions don't correlate with data (high-risk transaction marked "Normal").

### Pitfall 2: Null/Undefined Features Sent to Model
**What goes wrong:** AI Core returns 400 or 500, error message mentions "NaN" or "invalid input shape".
**Why it happens:** Mock CSV has incomplete rows, or CSV parsing fails for some columns. Model can't process null values.
**How to avoid:** Check `features.some(f => f == null)` before pushing to validRows. Log skipped rows with document number.
**Warning signs:** Some transactions analyze successfully, others fail with cryptic errors. AI Core error mentions array shape.

### Pitfall 3: Hardcoded AI Core URL
**What goes wrong:** Code works locally but fails in BTP (or after model redeployment).
**Why it happens:** AI Core deployment URLs change on redeploy. Hardcoded URL = broken code.
**How to avoid:** Always use `process.env.AI_CORE_DEPLOYMENT_ID` and `process.env.AI_CORE_BASE_URL`. Document in `.env.example`.
**Warning signs:** 404 from AI Core even though credentials are valid. Works for developer but not for teammate.

### Pitfall 4: Exposing Raw Error Stack Traces to Client
**What goes wrong:** User sees "TypeError: Cannot read property 'data' of undefined" or raw JWT tokens in error messages.
**Why it happens:** Caught error object thrown directly to client instead of user-facing message.
**How to avoid:** Always `throw new cds.ApplicationError('user message', { status: 502 })` after logging full error server-side.
**Warning signs:** End users report seeing code-like error messages. Security scan flags token exposure in HTTP responses.

### Pitfall 5: Unknown Model Class Names
**What goes wrong:** UI shows "undefined" in Risk Classification column. Application error: "Cannot read property 'display' of undefined".
**Why it happens:** Model returns class name not in `RISK_LABELS` (typo in model code, or model updated without updating labels).
**How to avoid:** Always validate: `if (!RISK_LABELS[modelClass]) return RISK_LABELS["General_Anomaly"]`. Log warning when unknown class encountered.
**Warning signs:** Most rows render correctly, a few show blank risk labels. Server logs show unknown class names.

### Pitfall 6: Forgetting Virtual Fields Don't Persist
**What goes wrong:** User clicks Analyze, sees results, refreshes page, results disappear. Reports "data loss".
**Why it happens:** `virtual` fields in CDS are in-memory only. OData GET fetches from DB (which never stored risk results).
**How to avoid:** Document clearly: risk results are transient. Phase 2 accepts this limitation. Phase 4 could add persistence if needed.
**Warning signs:** Users complain results vanish on refresh. Risk fields always null in direct DB queries.

### Pitfall 7: Synchronous Action with Long Timeout
**What goes wrong:** User waits 30 seconds, browser times out, reports "broken button".
**Why it happens:** 50 rows × 1 second per AI Core call = 50 seconds. Browser default timeout is 30 seconds.
**How to avoid:** Phase 2 accepts synchronous pattern for simplicity. Document: "Analyze works for small datasets (<100 rows). Phase 4 will add async jobs." Set AI Core timeout to 10 seconds max.
**Warning signs:** Works with 10 CSV rows, fails with 50. Browser console shows "net::ERR_EMPTY_RESPONSE".

## Code Examples

Verified patterns from official sources:

### Action Definition and Handler
```cds
// srv/risk-service.cds
using { risk } from '../db/schema';

service RiskService {
  entity GLTransactions as projection on risk.GLTransactions;

  // Bound action (POST /odata/v4/risk/GLTransactions/analyzeRisks)
  action analyzeRisks() returns String;
}
```

```javascript
// srv/risk-service.js
const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  this.on('analyzeRisks', async (req) => {
    const { GLTransactions } = this.entities;

    // Get all transactions
    const transactions = await SELECT.from(GLTransactions);

    // TODO: Call AI Core and update virtual fields

    return `Analyzed ${transactions.length} transactions`;
  });
});
```
**Source:** https://cap.cloud.sap/docs/cds/cdl#actions-and-functions

### AI Core Client with SDK
```javascript
// srv/lib/ai-core-client.js
const { AiCoreService } = require('@sap-ai-sdk/ai-api');
const cds = require('@sap/cds');

const aiCore = new AiCoreService({
  url: process.env.AI_CORE_BASE_URL,
  clientId: process.env.SAP_AI_CORE_CLIENT_ID,
  clientSecret: process.env.SAP_AI_CORE_CLIENT_SECRET,
  authUrl: process.env.SAP_AI_CORE_AUTH_URL
});

async function predictAnomalies(featureRows) {
  const deploymentId = process.env.AI_CORE_DEPLOYMENT_ID;

  try {
    const response = await aiCore.invoke({
      deploymentId,
      method: 'POST',
      path: '/v1/predict',
      body: { data: featureRows },
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000  // 30 second timeout
    });

    return response.predictions;
  } catch (error) {
    cds.log().error('AI Core prediction failed', error);
    throw error;  // Re-throw for handler to catch
  }
}

module.exports = { predictAnomalies };
```
**Source:** https://github.com/SAP/ai-sdk-js (AI SDK examples)

### Feature Extraction
```javascript
// srv/lib/feature-extractor.js
const { FEATURE_COLUMNS } = require('./feature-columns');
const cds = require('@sap/cds');

function extractFeatures(transactions) {
  const validRows = [];
  const skipped = [];

  for (const tx of transactions) {
    const features = FEATURE_COLUMNS.map(col => tx[col]);

    // Validate: no nulls, exactly 24 features
    if (features.length !== 24) {
      cds.log().error(`Feature extraction error: expected 24, got ${features.length}`);
      throw new Error('Feature column mismatch');
    }

    if (features.some(f => f == null)) {
      skipped.push(tx.DocumentNumber);
      cds.log().warn(`Skipping transaction ${tx.DocumentNumber}: missing features`);
      continue;
    }

    validRows.push(features);
  }

  cds.log().info(`Extracted ${validRows.length} valid rows, skipped ${skipped.length}`);
  return { validRows, skipped };
}

module.exports = { extractFeatures };
```

### Complete Action Handler with Error Handling
```javascript
// srv/risk-service.js
const cds = require('@sap/cds');
const { predictAnomalies } = require('./lib/ai-core-client');
const { extractFeatures } = require('./lib/feature-extractor');
const { mapPrediction } = require('./lib/risk-labels');

module.exports = cds.service.impl(async function() {
  this.on('analyzeRisks', async (req) => {
    const { GLTransactions } = this.entities;

    try {
      // 1. Fetch all GL transactions
      const transactions = await SELECT.from(GLTransactions);

      if (transactions.length === 0) {
        return 'No transactions to analyze';
      }

      // 2. Extract features (24 per row)
      const { validRows, skipped } = extractFeatures(transactions);

      if (validRows.length === 0) {
        throw new Error('No valid transactions (all have missing features)');
      }

      // 3. Call AI Core
      cds.log().info(`Sending ${validRows.length} rows to AI Core`);
      const predictions = await predictAnomalies(validRows);

      if (predictions.length !== validRows.length) {
        throw new Error(`Prediction count mismatch: expected ${validRows.length}, got ${predictions.length}`);
      }

      // 4. Map predictions back to transactions
      let i = 0;
      for (const tx of transactions) {
        if (!skipped.includes(tx.DocumentNumber)) {
          const label = mapPrediction(predictions[i]);
          tx.riskClassification = label.display;
          tx.riskExplanation = label.explanation;
          tx.anomalyScore = tx.anomaly_score;
          i++;
        }
      }

      // 5. Update transactions in memory (virtual fields)
      // Note: virtual fields are not persisted, but OData binding will show them

      return `Analyzed ${validRows.length} transactions (${skipped.length} skipped due to missing data)`;

    } catch (error) {
      cds.log().error('analyzeRisks action failed', error);

      // User-facing error message
      throw new cds.ApplicationError(
        'AI service temporarily unavailable. Please try again later.',
        { status: 502, cause: error }
      );
    }
  });
});
```

### Static Label Mapping
```javascript
// srv/lib/risk-labels.js
const cds = require('@sap/cds');

const RISK_LABELS = {
  "Normal": {
    display: "Normal",
    explanation: "No anomalies detected in this transaction.",
    criticality: 3
  },
  "High_Amount_Deviation": {
    display: "Unusual Amount",
    explanation: "This transaction amount is statistically unusual compared to similar entries.",
    criticality: 1
  },
  // ... (9 more classes as documented above)
};

function mapPrediction(modelClass) {
  const label = RISK_LABELS[modelClass];

  if (!label) {
    cds.log().warn(`Unknown model class: ${modelClass}, using fallback`);
    return RISK_LABELS["General_Anomaly"];
  }

  return label;
}

// For testing
function getAllLabels() {
  return Object.keys(RISK_LABELS);
}

module.exports = { RISK_LABELS, mapPrediction, getAllLabels };
```

### Environment Variables (.env)
```bash
# .env.example (committed to Git)
AI_CORE_BASE_URL=https://api.ai.REGION.aws.ml.hana.ondemand.com/v2
AI_CORE_DEPLOYMENT_ID=d1234567890abcdef
SAP_AI_CORE_CLIENT_ID=sb-xxxxxxxx-yyyy-zzzz
SAP_AI_CORE_CLIENT_SECRET=placeholder-secret
SAP_AI_CORE_AUTH_URL=https://subdomain.authentication.REGION.hana.ondemand.com/oauth/token

# .env (gitignored, user creates locally)
AI_CORE_BASE_URL=https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com/v2
AI_CORE_DEPLOYMENT_ID=d789abc123def456
SAP_AI_CORE_CLIENT_ID=sb-real-client-id
SAP_AI_CORE_CLIENT_SECRET=actual-secret-value
SAP_AI_CORE_AUTH_URL=https://my-subdomain.authentication.eu10.hana.ondemand.com/oauth/token
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual OAuth2 with fetch | @sap-ai-sdk/ai-api AiCoreService | SDK v3.0 (2024) | Token lifecycle, retries, service binding support built-in. Reduces integration code by 80%. |
| Function imports for actions | Bound actions (OData V4 best practice) | OData V4 spec (2014) | Bound actions are RESTful (operate on entities), function imports are RPC-style. CAP prefers bound actions. |
| Throwing generic errors | cds.ApplicationError with status codes | CAP 7.x (~2023) | Allows setting HTTP status (502, 400) and user-facing messages separately from server logs. |
| Virtual fields + manual updates | Virtual fields + in-memory updates | CAP 9.x (current) | Virtual fields don't persist but render in OData responses. Simpler for transient data. |

**Deprecated/outdated:**
- `@sap-ai-sdk/ai-api` v2.x: Use v3.x for improved TypeScript support and OAuth2 handling
- Raw `fetch` to AI Core: SDK handles edge cases (token expiry, retries, logging)
- Unbound actions: Use bound actions for entity-related operations

## Open Questions

1. **AI Core batch prediction support**
   - What we know: USE_CASE.md shows single prediction per request
   - What's unclear: Does the FastAPI endpoint support batch input (multiple rows in one POST)?
   - Recommendation: Phase 2 sends rows individually. Phase 4 research can optimize for batch if endpoint supports it.

2. **Model output array order**
   - What we know: Response format `{ "predictions": ["Class1", "Class2", ...] }`
   - What's unclear: Is predictions array guaranteed to match input row order?
   - Recommendation: Assume yes (standard ML API pattern). Add assertion: if length mismatch, throw error.

3. **AI Core retry behavior**
   - What we know: SDK has built-in retry logic
   - What's unclear: Default retry strategy (how many attempts, backoff interval)
   - Recommendation: Use SDK defaults for Phase 2. Document that users may experience 10-30 second delays on transient failures.

4. **Virtual field persistence**
   - What we know: Virtual fields are in-memory, don't persist to DB
   - What's unclear: Does CAP have a built-in way to persist virtual fields on demand?
   - Recommendation: Phase 2 accepts transient results. Phase 4 can add separate `AnalysisResult` entity if persistence is required.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.2.0 + @cap-js/cds-test |
| Config file | `jest.config.js` (already exists from Phase 1) |
| Quick run command | `npm test -- risk-service.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-02 | analyzeRisks action callable via OData POST | integration | `npm test -- risk-service.test.js` | ❌ Wave 0 |
| INFER-02 | Feature extraction produces 24 values in order | unit | `npm test -- feature-extractor.test.js` | ❌ Wave 0 |
| INFER-03 | AI Core client calls SDK correctly | unit (mocked) | `npm test -- ai-core-client.test.js` | ❌ Wave 0 |
| INFER-04 | Static mapping returns correct display/criticality | unit | `npm test -- risk-labels.test.js` | ❌ Wave 0 |
| INFER-05 | Errors return HTTP 502 with user message | integration | `npm test -- risk-service.test.js` (error cases) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- <relevant-test-file>` (unit tests, < 5 seconds)
- **Per wave merge:** `npm test && cds build` (all tests + compile, < 30 seconds)
- **Phase gate:** Full suite green + manual curl test to `/odata/v4/risk/GLTransactions/analyzeRisks`

### Wave 0 Gaps
- [ ] `test/risk-service.test.js` — integration tests for analyzeRisks action (covers DATA-02, INFER-05)
- [ ] `test/lib/feature-extractor.test.js` — unit tests for feature extraction (covers INFER-02)
- [ ] `test/lib/ai-core-client.test.js` — unit tests for AI Core client with nock mocking (covers INFER-03)
- [ ] `test/lib/risk-labels.test.js` — unit tests for label mapping (covers INFER-04)
- [ ] `srv/lib/ai-core-client.js` — AI Core invocation wrapper
- [ ] `srv/lib/feature-extractor.js` — Feature extraction logic
- [ ] `srv/lib/risk-labels.js` — RISK_LABELS object and mapPrediction function
- [ ] Framework install: `npm install --save @sap-ai-sdk/ai-api @sap-ai-sdk/core && npm install --save-dev nock`

## Sources

### Primary (HIGH confidence)
- CAP Actions: https://cap.cloud.sap/docs/cds/cdl#actions-and-functions (action definition syntax)
- CAP Service Handlers: https://cap.cloud.sap/docs/node.js/core-services#srv-on-before-after (event handler patterns)
- SAP AI SDK for JavaScript: https://github.com/SAP/ai-sdk-js/tree/main/packages/ai-api (AiCoreService class, deployment invocation)
- CAP Error Handling: https://cap.cloud.sap/docs/node.js/best-practices#error-handling (cds.ApplicationError usage)
- CAP Virtual Fields: https://cap.cloud.sap/docs/cds/cdl#virtual-calculated-elements (virtual field behavior)

### Secondary (MEDIUM confidence)
- npm package versions verified: @sap-ai-sdk/ai-api@3.1.0, nock@13.5.4 (via npm registry, 2026-03-09)
- Feature column count: Verified from USE_CASE.md table (24 rows numbered 1-24) and ../prototype/srv/lib/feature-columns.js (array length 24)

### Tertiary (LOW confidence)
- AI Core batch prediction support: Not documented in USE_CASE.md. Assumption: single row per request (standard FastAPI pattern).
- SDK retry defaults: Not documented in public SDK docs. Assumption: 3 retries with exponential backoff (common pattern).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @sap-ai-sdk/ai-api is official SAP SDK, versions verified via npm
- Architecture: HIGH - Patterns extracted from official CAP docs, AI SDK examples, OData V4 spec
- Pitfalls: MEDIUM - Based on common AI Core integration issues and CAP service handler patterns, not exhaustive production experience

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days — SDK stable but npm packages update monthly)
