# Phase 1: Scaffold + Domain Model - Research

**Researched:** 2026-03-09
**Domain:** SAP CAP project scaffolding, CDS entity modeling, mock data, git worktrees
**Confidence:** HIGH

## Summary

Phase 1 scaffolds a CAP Node.js project with CDS entities matching the BDC `gl_features_for_ml` schema, CSV mock data for local development, and git worktree infrastructure for 3-agent parallel execution. The research confirms CAP's "convention over configuration" philosophy where `cds init` + `cds watch` creates a working OData V4 service with zero additional setup. Mock data loads automatically from CSV files in `db/data/` following the `namespace-Entity.csv` naming convention. Git worktrees enable true parallel development by allowing multiple branches to be checked out simultaneously in sibling directories.

**Key finding:** The documented "25 features" is incorrect — USE_CASE.md table and prototype AGENTS.md array both enumerate exactly **24 feature columns**. All documentation referencing "25" must be corrected to "24" for consistency.

**Primary recommendation:** Use `cds init` in this directory, define a single flat CDS entity with SAP composite key (CompanyCode + FiscalYear + DocumentNumber + LineItem), populate ~50 CSV rows with realistic GL data following SAP patterns, and set up git worktrees as sibling directories for backend and frontend branches.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Mock data design:** ~50 rows of GL transactions in CSV format with realistic skew distribution (~70% Normal, ~20% medium risk, ~10% high risk). SAP-realistic field values (company codes 1000/2000, GL accounts 400000/600000, cost centers CC1000). Clean data only — no edge cases, all positive amounts, weekday-heavy, typical transaction patterns.
- **CDS entity structure:** Single flat entity (not normalized) matching flat BDC data product shape. SAP composite primary key: CompanyCode + FiscalYear + DocumentNumber + LineItem. Risk result fields (riskClassification, riskExplanation, anomalyScore) are virtual/transient — not persisted, populated in-memory by Analyze action. All 24 feature columns inline on same entity.
- **Feature column count:** **24 features, not 25** — USE_CASE.md table and AGENTS.md array both enumerate exactly 24 columns. Fix all docs (REQUIREMENTS.md, ROADMAP.md, prototype AGENTS.md success criteria) to say 24. FEATURE_COLUMNS constant is single source of truth.
- **Project folder layout:** CAP project initialized in this directory. Standard CAP structure: `db/` (schema + CSV), `srv/` (services + handlers), `app/` (Fiori app). Git worktrees as sibling directories: `../prototype-backend` (branch `feature/backend`) and `../prototype-frontend` (branch `feature/frontend`). `.env.example` template with placeholders; `.env` and `default-env.json` gitignored.

### Claude's Discretion
- Exact CDS field types and lengths for GL fields (String length, Decimal precision)
- Mock data content details (specific GL account numbers, posting dates, amounts) as long as they follow SAP-realistic patterns
- package.json dependency versions
- .gitignore contents beyond .env and default-env.json
- README structure and content for the prototype

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | CDS entity model matches `gl_features_for_ml` schema (GL fields + 24 feature columns with correct types) | CDS syntax patterns, field type mappings (String, Decimal, Date, Boolean, Integer), composite key definition |
| DATA-03 | Mock CSV data provides realistic GL transactions for local development without BDC | CSV naming convention (`namespace-Entity.csv`), automatic loading from `db/data/`, realistic distribution patterns |
| INFRA-01 | `cds build` succeeds in clean environment | CAP project structure, package.json dependencies (@sap/cds ^9.8.0, sqlite3, express) |
| INFRA-02 | Multi-agent build with 3 agents (orchestrator + backend + frontend) working in parallel git worktrees | Git worktree creation patterns, sibling directory layout, branch isolation |
| INFRA-03 | No hardcoded credentials — AI Core config via environment variables, BDC via BTP Destination | .env file support, CDS_CONFIG pattern, environment variable precedence |
| INFRA-04 | `.env` and `default-env.json` excluded from version control | .gitignore patterns for CAP projects, credential management best practices |
</phase_requirements>

## Standard Stack

### Core Dependencies
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @sap/cds | ^9.8.0 | CAP runtime, CDS compiler, OData V4 server | Official SAP framework for domain-driven services |
| @sap/cds-dk | ^9.7.2 | Development tools (cds init, cds watch, cds build) | Standard CLI for CAP project scaffolding |
| sqlite3 | ^5.1.0 | In-memory database for local development | CAP default for dev/test (auto-provisioned by cds watch) |
| express | ^4.19.0 | HTTP server | CAP runtime dependency |

### Supporting (Testing)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @cap-js/cds-test | latest | CAP test utilities, HTTP helpers, data reset | Unit and integration testing of CAP services |
| jest | ^30.2.0 | Test runner | Popular choice, well-documented with CAP |
| mocha | ^11.7.5 | Alternative test runner | Lighter weight, good Chai integration |
| chai | latest | BDD/TDD assertions | Included with @cap-js/cds-test, supports expect/assert/should styles |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sqlite3 | SAP HANA | HANA for cloud deployment, but sqlite3 is CAP convention for local dev |
| jest | mocha + chai | Mocha is lighter but Jest has better snapshot testing and parallel execution |
| CSV mock data | Hardcoded JS arrays | CSV is declarative, version-controllable, and non-technical users can edit |

**Installation:**
```bash
cd prototype
npm install --save @sap/cds sqlite3 express
npm install --save-dev @sap/cds-dk @cap-js/cds-test jest chai
```

## Architecture Patterns

### Recommended Project Structure
```
./
├── db/
│   ├── schema.cds              # Entity definitions
│   └── data/
│       └── risk-GLTransactions.csv  # Mock data (namespace-Entity.csv)
├── srv/
│   ├── risk-service.cds        # Service definition
│   ├── risk-service.js         # Action handlers (Phase 2)
│   └── lib/
│       └── feature-columns.js  # FEATURE_COLUMNS constant
├── app/
│   └── risk-list/              # Fiori Elements app (Phase 3)
├── test/
│   └── feature-columns.test.js # Unit test for FEATURE_COLUMNS
├── package.json
├── .cdsrc.json                 # CAP config (optional)
├── .env.example                # Template with placeholders
├── .gitignore                  # Excludes .env, default-env.json, node_modules
└── README.md
```

### Pattern 1: CAP Entity with Composite Key
**What:** SAP document model uses compound primary keys (CompanyCode + FiscalYear + DocumentNumber + LineItem)
**When to use:** Modeling SAP transactional data (FI, CO, MM documents)
**Example:**
```cds
// db/schema.cds
namespace risk;

entity GLTransactions {
  key CompanyCode : String(4);
  key FiscalYear  : String(4);
  key DocumentNumber : String(10);
  key LineItem    : String(6);

  // GL fields
  GLAccount      : String(10);
  CostCenter     : String(10);
  PostingDate    : Date;
  Amount         : Decimal(15,2);

  // 24 feature columns (numeric)
  anomaly_score         : Decimal(5,4);
  amount_z_score        : Decimal(10,4);
  rarity_score          : Decimal(5,4);
  temporal_score        : Decimal(5,4);
  peer_amount_stddev    : Decimal(15,2);
  peer_count            : Integer;
  peer_avg_amount       : Decimal(15,2);
  peer_count_month      : Integer;
  frequency_12m         : Integer;
  is_weekend            : Integer;  // 0/1 flag
  is_after_hours        : Integer;
  is_new_combination    : Integer;
  amount                : Decimal(15,2);
  abs_amount            : Decimal(15,2);
  amount_log            : Decimal(10,4);
  peer_amount_ratio     : Decimal(10,4);
  is_large_amount       : Integer;
  posting_delay_days    : Integer;
  day_of_week           : Integer;  // 1-7
  posting_hour          : Integer;  // 0-23
  month_numeric         : Integer;  // 1-12
  PostingDate_days      : Integer;
  weekend_and_large     : Integer;
  is_high_frequency     : Integer;

  // Virtual fields (not persisted, populated by action)
  virtual riskClassification : String;
  virtual riskExplanation    : String;
  virtual anomalyScore       : Decimal(5,4);
}
```
**Source:** https://cap.cloud.sap/docs/cds/cdl (CDS entity syntax)

### Pattern 2: OData V4 Service Exposure
**What:** Expose entities as OData collections with actions
**When to use:** Always — Fiori Elements consumes OData V4 endpoints
**Example:**
```cds
// srv/risk-service.cds
using { risk } from '../db/schema';

service RiskService {
  entity GLTransactions as projection on risk.GLTransactions;

  // Phase 2: bound action for inference
  action analyzeRisks() returns String;
}
```
**Source:** CAP service definition patterns

### Pattern 3: CSV Mock Data with Realistic Distribution
**What:** ~50 rows with skewed distribution matching real-world risk patterns
**When to use:** Local dev before BDC connection (Phase 1-3)
**Example CSV structure:**
```csv
CompanyCode,FiscalYear,DocumentNumber,LineItem,GLAccount,CostCenter,PostingDate,Amount,anomaly_score,amount_z_score,...
1000,2024,5000000001,000001,400000,CC1000,2024-03-15,1250.50,0.15,0.8,...
1000,2024,5000000002,000001,600000,CC2000,2024-03-15,89500.00,0.85,3.5,...
```
**Distribution:**
- 70% rows: anomaly_score < 0.3, is_weekend=0, is_new_combination=0 → Normal
- 20% rows: anomaly_score 0.3-0.6, is_weekend=1 or posting_delay_days > 5 → Medium risk
- 10% rows: anomaly_score > 0.6, amount_z_score > 3, is_new_combination=1 → High risk

**Naming:** `db/data/risk-GLTransactions.csv` (namespace `risk` + entity `GLTransactions`)

### Pattern 4: FEATURE_COLUMNS as Single Source of Truth
**What:** Constant array defines column names and order, tested
**When to use:** Any code that extracts features for AI Core (Phase 2 handler)
**Example:**
```javascript
// srv/lib/feature-columns.js
const FEATURE_COLUMNS = [
  'anomaly_score', 'amount_z_score', 'rarity_score', 'temporal_score',
  'peer_amount_stddev', 'peer_count', 'peer_avg_amount', 'peer_count_month',
  'frequency_12m',
  'is_weekend', 'is_after_hours', 'is_new_combination',
  'amount', 'abs_amount', 'amount_log', 'peer_amount_ratio', 'is_large_amount',
  'posting_delay_days', 'day_of_week', 'posting_hour', 'month_numeric',
  'PostingDate_days',
  'weekend_and_large', 'is_high_frequency'
];

module.exports = { FEATURE_COLUMNS };
```

**Unit test:**
```javascript
// test/feature-columns.test.js
const { FEATURE_COLUMNS } = require('../srv/lib/feature-columns');

test('FEATURE_COLUMNS has exactly 24 columns', () => {
  expect(FEATURE_COLUMNS).toHaveLength(24);
});

test('FEATURE_COLUMNS matches documented order', () => {
  expect(FEATURE_COLUMNS[0]).toBe('anomaly_score');
  expect(FEATURE_COLUMNS[23]).toBe('is_high_frequency');
});
```

### Pattern 5: Git Worktree for Parallel Development
**What:** Multiple working trees for simultaneous branch work
**When to use:** Multi-agent parallel execution (backend and frontend work simultaneously)
**Example:**
```bash
# From main branch in prototype/
git worktree add ../prototype-backend -b feature/backend
git worktree add ../prototype-frontend -b feature/frontend

# Verify
git worktree list
# ../cap-llm-knowledge-only  abc123 [main]
# ./worktree-backend                    def456 [feature/backend]
# ./worktree-frontend                   ghi789 [feature/frontend]

# Backend agent works in ../prototype-backend
# Frontend agent works in ../prototype-frontend
# Orchestrator merges PRs from both branches to main
```
**Source:** https://git-scm.com/docs/git-worktree

### Pattern 6: Environment Variables via .env
**What:** CAP reads `.env` files with flexible syntax (underscore or dot notation)
**When to use:** Development credentials, AI Core URL, feature flags
**Example:**
```bash
# .env.example (committed)
# SAP AI Core configuration
AI_CORE_PREDICTION_URL=https://YOUR_DEPLOYMENT_URL/v1/predict
SAP_AI_CORE_CLIENT_ID=your-client-id
SAP_AI_CORE_CLIENT_SECRET=your-client-secret
SAP_AI_CORE_AUTH_URL=https://YOUR_SUBDOMAIN.authentication.REGION.hana.ondemand.com/oauth/token

# .env (gitignored, user creates from .env.example)
AI_CORE_PREDICTION_URL=https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com/v2/inference/deployments/d123/v1/predict
SAP_AI_CORE_CLIENT_ID=sb-abc-xyz
SAP_AI_CORE_CLIENT_SECRET=actual-secret-value
SAP_AI_CORE_AUTH_URL=https://my-subdomain.authentication.eu10.hana.ondemand.com/oauth/token
```
**Source:** https://cap.cloud.sap/docs/node.js/cds-env

### Anti-Patterns to Avoid
- **Hardcoding secrets in code:** Always use environment variables. Audit with `grep -r "client.*secret" srv/` before commits.
- **Using default-env.json:** Deprecated in favor of `.env` files and `cds bind` command.
- **Manual database setup:** CAP auto-provisions sqlite3 with `cds watch`. Never write custom SQL DDL.
- **Deep folder nesting:** CAP convention is flat `db/`, `srv/`, `app/`. Don't create `src/backend/database/models/`.
- **Mixing test and production data:** Use `db/data/` for prod-like data, `test/data/` for test-only data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OData V4 server | Custom Express routes, manual query parsing | CAP runtime + CDS service definition | CAP generates full OData V4 protocol (filtering, sorting, paging, $expand, $select) from CDS. 10,000+ lines you don't write. |
| Database schema migration | SQL CREATE TABLE scripts, custom migration tool | `cds deploy`, automatic CSV loading | CAP compiles CDS to SQL for any DB (sqlite, HANA, PostgreSQL). CSV files auto-load. |
| CSV parsing for mock data | fs.readFileSync + manual CSV parsing | CAP automatic CSV loading from `db/data/` | CAP loads CSV on startup based on `namespace-Entity.csv` naming. Zero code. |
| Environment config management | dotenv + custom config object builder | CAP `cds.env` | CAP merges `.env`, `package.json`, `.cdsrc.json`, env vars, VCAP_SERVICES with documented precedence. |
| Git multi-branch checkout | Multiple clones, complex scripting | `git worktree add` | Native Git feature. Shares .git directory, instant branch switching, no duplicate files. |
| Test server setup/teardown | Manual app.listen, complex beforeAll/afterAll | `cds.test()` from @cap-js/cds-test | Auto-starts CAP server in beforeAll, stops in afterAll, includes HTTP helpers (GET, POST), data reset utilities. |

**Key insight:** CAP is "convention over configuration." When you fight the conventions (custom folder structure, manual SQL, ignoring CDS patterns), you lose 80% of CAP's value. Follow the patterns, let the framework do the work.

## Common Pitfalls

### Pitfall 1: Incorrect CSV File Naming
**What goes wrong:** CSV file in `db/data/` but data doesn't load. `cds watch` shows empty entity set.
**Why it happens:** Naming doesn't match `namespace-Entity.csv` pattern. File named `gl_transactions.csv` instead of `risk-GLTransactions.csv`.
**How to avoid:** Exact match required: if entity is `risk.GLTransactions`, file MUST be `risk-GLTransactions.csv` (case-sensitive, hyphen separates namespace and entity).
**Warning signs:** `GET /odata/v4/risk/GLTransactions` returns `{ value: [] }` despite CSV existing.

### Pitfall 2: CSV Header Case Mismatch
**What goes wrong:** CSV columns don't map to entity fields. Data loads partially or fails silently.
**Why it happens:** CSV header `companycode` doesn't match CDS field `CompanyCode` (CDS is PascalCase, CSV has lowercase).
**How to avoid:** CSV headers MUST exactly match CDS field names (case-sensitive). Use CDS field names as-is: `CompanyCode,FiscalYear,DocumentNumber` not `company_code,fiscal_year,document_number`.
**Warning signs:** Some fields load, others are null. Check CAP logs for "unknown column" warnings.

### Pitfall 3: Decimal Type Precision Mismatch
**What goes wrong:** Data truncated or rounded incorrectly. `anomaly_score` shows `0.1500` instead of `0.15` or loses precision.
**Why it happens:** Decimal type `Decimal(15,2)` means 15 total digits, 2 after decimal. Using wrong precision for feature scores (which are 0.0-1.0 with 4 decimal places).
**How to avoid:** Match precision to data: `Decimal(5,4)` for scores 0.0000-9.9999, `Decimal(15,2)` for money amounts up to 9,999,999,999,999.99.
**Warning signs:** Amounts like `1250.5034` truncate to `1250.50`. Anomaly scores can't store 0.8523 (only 0.85).

### Pitfall 4: Missing .gitignore for Secrets
**What goes wrong:** `.env` or `default-env.json` committed to Git. Credentials exposed in repo history.
**Why it happens:** Forgot to add `.env` to `.gitignore` before first commit. Or used `git add -A` without reviewing.
**How to avoid:** Create `.gitignore` BEFORE `cds init`. Add `.env`, `.env.local`, `default-env.json`, `node_modules/` immediately. Use `.env.example` as committed template with placeholder values.
**Warning signs:** `git status` shows `.env` as untracked. GitHub security alerts on push.

### Pitfall 5: Forgetting Virtual Fields Don't Persist
**What goes wrong:** User clicks Analyze, sees risk results, refreshes page, results disappear. Thinks data is lost.
**Why it happens:** `virtual` fields in CDS are not stored in database. They're computed in-memory by action handlers. Page refresh fetches data from DB (which never had risk results).
**How to avoid:** Document clearly: risk results are transient. If persistence is needed later, create separate `AnalysisResult` entity with foreign key to `GLTransactions`.
**Warning signs:** Users report "data loss" after refresh. Results visible in UI but `SELECT` query returns null for risk fields.

### Pitfall 6: Git Worktree Path Confusion
**What goes wrong:** Agent edits files in main worktree instead of linked worktree. Changes on wrong branch.
**Why it happens:** Multiple terminal tabs open, forgot which directory is which worktree. `pwd` shows `/prototype` but expected `/prototype-backend`.
**How to avoid:** Use `git worktree list` to verify paths. Set distinct terminal titles/prompts per worktree. Document worktree layout in README: "Backend agent: work in `../prototype-backend`".
**Warning signs:** PR from `feature/backend` includes frontend changes. Files edited but `git status` shows nothing (working in wrong directory).

### Pitfall 7: Feature Column Count Documentation Error
**What goes wrong:** Code references 25 features but array has 24. Off-by-one errors in validation, tests fail intermittently.
**Why it happens:** Requirements doc says "25 features" but actual model contract has 24 (counted from USE_CASE.md table and AGENTS.md array).
**How to avoid:** **CRITICAL FIX REQUIRED:** Update REQUIREMENTS.md line 10 (DATA-01), ROADMAP.md line 30 (Phase 1 success criteria), and prototype AGENTS.md line 30 to say "24 feature columns" not "25".
**Warning signs:** Test expects `FEATURE_COLUMNS.length === 25` but fails. AI Core returns 11 predictions for 11 classes, not 25.

## Code Examples

Verified patterns from official sources:

### CDS Init and Watch
```bash
# Initialize CAP project
mkdir prototype && cd prototype
cds init --add java  # Or without --add for Node.js only
npm install

# Start dev server with auto-reload
cds watch
# Output: [cds] - serving RiskService { path: '/odata/v4/risk' }
```
**Source:** https://cap.cloud.sap/docs/get-started/

### CDS Entity Definition (Flat Structure)
```cds
namespace risk;

entity GLTransactions {
  key CompanyCode    : String(4);
  key FiscalYear     : String(4);
  key DocumentNumber : String(10);
  key LineItem       : String(6);

  GLAccount   : String(10);
  CostCenter  : String(10);
  PostingDate : Date;
  Amount      : Decimal(15,2);

  // All 24 features inline (not separate entity)
  anomaly_score      : Decimal(5,4);
  amount_z_score     : Decimal(10,4);
  rarity_score       : Decimal(5,4);
  // ... (21 more)

  virtual riskClassification : String;
}
```
**Source:** https://cap.cloud.sap/docs/cds/cdl

### CSV Mock Data Sample
```csv
CompanyCode,FiscalYear,DocumentNumber,LineItem,GLAccount,CostCenter,PostingDate,Amount,anomaly_score,amount_z_score,rarity_score,temporal_score,peer_amount_stddev,peer_count,peer_avg_amount,peer_count_month,frequency_12m,is_weekend,is_after_hours,is_new_combination,amount,abs_amount,amount_log,peer_amount_ratio,is_large_amount,posting_delay_days,day_of_week,posting_hour,month_numeric,PostingDate_days,weekend_and_large,is_high_frequency
1000,2024,5000000001,000001,400000,CC1000,2024-03-15,1250.50,0.15,0.8,0.2,0.1,500.00,12,1500.00,8,45,0,0,0,1250.50,1250.50,7.13,0.83,0,2,5,9,3,19362,0,0
1000,2024,5000000002,000001,600000,CC2000,2024-03-16,89500.00,0.85,3.5,0.9,0.7,5000.00,3,25000.00,2,2,0,0,1,89500.00,89500.00,11.40,3.58,1,15,6,20,3,19363,0,0
```
**File location:** `db/data/risk-GLTransactions.csv`
**Source:** https://cap.cloud.sap/docs/guides/databases/initial-data

### Git Worktree Setup
```bash
# From main branch in prototype/
git worktree add ../prototype-backend -b feature/backend
git worktree add ../prototype-frontend -b feature/frontend

# List all worktrees
git worktree list

# Remove worktree when done (after branch merged)
git worktree remove ../prototype-backend
```
**Source:** https://git-scm.com/docs/git-worktree

### Testing with cds.test
```javascript
// test/feature-columns.test.js
const cds = require('@sap/cds');
const { FEATURE_COLUMNS } = require('../srv/lib/feature-columns');

describe('FEATURE_COLUMNS constant', () => {
  test('has exactly 24 columns', () => {
    expect(FEATURE_COLUMNS).toHaveLength(24);
  });

  test('first column is anomaly_score', () => {
    expect(FEATURE_COLUMNS[0]).toBe('anomaly_score');
  });

  test('last column is is_high_frequency', () => {
    expect(FEATURE_COLUMNS[23]).toBe('is_high_frequency');
  });

  test('contains no duplicates', () => {
    const unique = new Set(FEATURE_COLUMNS);
    expect(unique.size).toBe(24);
  });
});

// Run with: npx jest test/feature-columns.test.js
```
**Source:** https://cap.cloud.sap/docs/node.js/cds-test

### Environment Variables (.env)
```bash
# .env.example (committed to Git)
AI_CORE_PREDICTION_URL=https://YOUR_DEPLOYMENT_URL/v1/predict
SAP_AI_CORE_CLIENT_ID=your-client-id
SAP_AI_CORE_CLIENT_SECRET=your-client-secret

# .env (gitignored, user creates locally)
AI_CORE_PREDICTION_URL=https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com/v2/inference/deployments/d123/v1/predict
SAP_AI_CORE_CLIENT_ID=sb-abc-xyz
SAP_AI_CORE_CLIENT_SECRET=actual-secret-here
```
**Access in code:**
```javascript
const predictionUrl = process.env.AI_CORE_PREDICTION_URL;
```
**Source:** https://cap.cloud.sap/docs/node.js/cds-env

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| default-env.json for credentials | .env files + cds bind | CAP 6.x (~2022) | default-env.json still works but deprecated. Use .env for local dev, cds bind for service bindings. |
| @sap/cds versions 5.x | @sap/cds 9.x (current: 9.8.0) | March 2024 | Breaking changes in OData V4 protocol handling, improved type safety, faster compilation. |
| Manual CSV parsing in code | Automatic CSV loading from db/data/ | CAP 4.x (~2020) | Zero code required. CAP discovers and loads CSV based on naming convention. |
| cds deploy --to sqlite | cds watch (auto-deploys) | CAP 5.x (~2021) | cds watch auto-creates DB on startup. Explicit deploy only needed for production. |
| Jest 29.x | Jest 30.x (current: 30.2.0) | Dec 2024 | Performance improvements, better TypeScript support, snapshot diffing. |

**Deprecated/outdated:**
- `default-env.json`: Use `.env` files instead (cleaner, more standard)
- `cds deploy --to sqlite:db.sqlite`: Use `cds watch` which auto-provisions sqlite3
- Underscore-case entity names (`gl_transactions`): Use PascalCase (`GLTransactions`) per CAP conventions

## Open Questions

1. **BDC EDMX availability**
   - What we know: BDC data product `gl_features_for_ml` exists in Databricks, schema documented in USE_CASE.md
   - What's unclear: Is EDMX file available for import? Or must we hand-author CDS from documentation?
   - Recommendation: Hand-author CDS in Phase 1 based on USE_CASE.md. Phase 4 wires real BDC connection via BTP Destination.

2. **AI Core deployment URL stability**
   - What we know: AI Core deployments have unique URLs that may change on redeployment
   - What's unclear: How often does URL change? Is there a stable alias?
   - Recommendation: Treat as environment variable (AI_CORE_PREDICTION_URL). Document that users must update .env after AI Core redeployment.

3. **Exact model output format**
   - What we know: USE_CASE.md shows `{ "predictions": ["High_Amount_Deviation"], "model_version": "XGBClassifier" }`
   - What's unclear: Is predictions array always same length as input? Are class names exactly as documented (with underscores)?
   - Recommendation: Phase 2 research must verify actual model contract. Flag as validation requirement.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 30.2.0 (or Mocha 11.7.5) + Chai |
| Config file | `jest.config.js` — see Wave 0 gap |
| Quick run command | `npm test -- feature-columns.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | CDS entity compiles with 24 feature columns | unit | `cds compile db/schema.cds` | ✅ Native CDS |
| DATA-01 | FEATURE_COLUMNS constant has 24 items | unit | `npm test -- feature-columns.test.js` | ❌ Wave 0 |
| DATA-03 | CSV data loads automatically on cds watch | integration | `cds watch` + curl test | ✅ CAP runtime |
| DATA-03 | Mock data has realistic distribution | manual | Visual inspection of CSV | N/A |
| INFRA-01 | cds build succeeds | smoke | `cds build --production` | ✅ CAP CLI |
| INFRA-02 | Git worktrees exist for 3 agents | manual | `git worktree list` check | N/A |
| INFRA-03 | No hardcoded credentials in code | smoke | `grep -r "client.*secret" srv/` returns empty | ✅ Bash |
| INFRA-04 | .env and default-env.json in .gitignore | smoke | `git check-ignore .env` returns .env | ✅ Git |

### Sampling Rate
- **Per task commit:** `npm test -- feature-columns.test.js && cds compile db/schema.cds` (< 10 seconds)
- **Per wave merge:** `npm test && cds build --production` (< 30 seconds)
- **Phase gate:** Full suite green + manual worktree verification before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/feature-columns.test.js` — covers DATA-01 (FEATURE_COLUMNS validation)
- [ ] `srv/lib/feature-columns.js` — defines FEATURE_COLUMNS constant
- [ ] `jest.config.js` — Jest configuration (testMatch, coverageDirectory)
- [ ] Framework install: `npm install --save-dev jest @cap-js/cds-test chai`

*(If no gaps after Wave 0: "None — existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- CAP Get Started: https://cap.cloud.sap/docs/get-started/ (project structure, cds init)
- CAP CDS Language: https://cap.cloud.sap/docs/cds/cdl (entity syntax, field types, composite keys)
- CAP Initial Data: https://cap.cloud.sap/docs/guides/databases/initial-data (CSV naming, automatic loading)
- CAP Environment: https://cap.cloud.sap/docs/node.js/cds-env (environment variables, .env support, precedence)
- CAP Testing: https://cap.cloud.sap/docs/node.js/cds-test (cds.test API, HTTP helpers, data reset)
- Git Worktree: https://git-scm.com/docs/git-worktree (worktree creation, management, best practices)

### Secondary (MEDIUM confidence)
- npm package versions verified via `npm info` commands (March 9, 2026): @sap/cds@9.8.0, @sap/cds-dk@9.7.2, jest@30.2.0, mocha@11.7.5, @sap-ai-sdk/ai-api@2.8.0

### Tertiary (LOW confidence)
- Feature column count (24 not 25): VERIFIED by manual inspection of USE_CASE.md table (24 rows numbered 1-24) and prototype AGENTS.md FEATURE_COLUMNS array (JavaScript array length confirmed as 24 via Node.js)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified via npm, official CAP docs consulted
- Architecture: HIGH - Patterns extracted from official CAP docs, git-scm.com, and CAP best practices
- Pitfalls: MEDIUM - Based on common CAP development patterns and git worktree edge cases, not exhaustive production experience

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days — CAP is stable but npm packages update monthly)
