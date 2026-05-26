# Financial Risk Analyzer - High-Level Specification

**Version:** 1.0  
**Last Updated:** 2026-05-22  
**Status:** Design Phase - Brainstorming Detailed Specifications

## Project Goal

**The goal of this specification phase is to brainstorm and document:**
1. **High-Level Design (HLD)** - Architecture, components, and system interactions
2. **Low-Level Design (LLD)** - Detailed technical specifications for implementation
3. **Test Case Definitions** - Comprehensive test scenarios for TDD implementation (unit, integration, E2E)

This document serves as the foundation for creating detailed specification documents through iterative brainstorming sessions using `/brainstorm`. A claude code skill that helps creating the spec. The resulting specifications will guide the TDD-based implementation phases.

## 1. Purpose

Enable finance teams to identify risky GL transactions through ML-powered risk classification in a user-friendly interface.

## 2. Pre-Conditions

**The following components are already developed and deployed:**

1. **ML Model (XGBoost)** - Trained model deployed in SAP AI Core
   - Model is production-ready and accessible via AI Core inference endpoint
   - Model version and endpoint details to be configured via BTP destination

2. **Feature Definitions** - 25 features have been defined and validated
   - Feature extraction logic is specified (column names, order, transformations)
   - Feature engineering is complete and tested with the deployed model
   - Input feature schema matches model training data

3. **Data Source** - GL transaction data with pre-computed ML features
   - 24 feature columns already present in source data
   - Additional features derived from existing columns during inference

**This project focuses on building the application layer (UI + service) that integrates with these existing ML components.**

## 2. Core Capabilities

### 2.1 Data Integration
- Read GL transaction data with pre-computed ML features (24 feature columns)
- Support mock data for development and real data via SAP Business Data Cloud
- Handle composite key structure: Company Code + Fiscal Year + Document Number + Line Item

### 2.2 Risk Analysis
- Execute ML inference on GL transactions using pre-deployed XGBoost model in AI Core
- Extract 25 features in exact column order as defined in model specification
- Send feature vectors to AI Core inference endpoint
- Receive predictions and confidence scores from deployed model
- Classify transactions into 11 risk categories (Normal through Multiple Risk Factors)
- Map technical model outputs to business-friendly language
- Assign severity levels (Normal/Warning/Critical) with visual indicators

### 2.3 User Interface
- Display GL transactions in sortable, filterable list format
- Show key business fields: Company Code, GL Account, Cost Center, Posting Date, Amount
- Display risk results: Classification label, explanation text, anomaly score
- Provide color-coded criticality indicators (green/yellow/red)
- Enable filtering by risk level, company code, date range, and amount
- Support user-initiated batch analysis via "Analyze" action
- Allow export to spreadsheet

### 2.4 Quality & Security

#### 2.4.1 Compliance Framework
- Follow SAP Product Standards (PSR) for code quality and security
- Complete threat modeling (SAP TM 2.0) before production deployment
- Maintain product profile for PSR filtering

#### 2.4.2 Development Standards
- No hardcoded credentials (use environment variables and BTP destinations)
- Externalize all user-facing text for internationalization
- No deprecated SAP APIs (CDS, CAP, UI5)
- OData V4 only
- Annotation-driven Fiori Elements where possible

## 3. Technology Constraints

### 3.1 Framework Requirements
- **Backend:** SAP Cloud Application Programming Model (CAP) with Node.js
- **Frontend:** SAP Fiori Elements (List Report pattern)
- **Data Protocol:** OData V4
- **ML Runtime:** SAP AI Core (custom XGBoost deployment)
- **Data Source:** SAP Business Data Cloud via BTP Destination

### 3.2 Development Approach

#### OpenSpec-Inspired: SDD + TDD
This project follows **Specification-Driven Development (SDD)** combined with **Test-Driven Development (TDD)**, inspired by the OpenSpec methodology:

**Phase 1: Specification Development (SDD)**
1. **Brainstorm specifications** - Use `/brainstorm` to create detailed, testable specifications
2. **Define contracts** - Document API contracts, data models, UI behaviors as executable specs
3. **Specify test scenarios** - Embed test cases directly in specification documents
4. **Review & validate** - Iterate until specs are complete, unambiguous, and testable

**Phase 2: Test-First Implementation (TDD)**
1. **Red** - Write failing tests derived directly from specifications
2. **Green** - Write minimal code to make tests pass
3. **Refactor** - Improve code while keeping tests green
4. **Verify against spec** - Confirm implementation matches original specification

**Specification as Single Source of Truth:**
- Specifications live in `spec/` directory as machine-readable markdown
- Tests are derived from specifications, not invented independently
- Implementation follows tests, which follow specifications
- Changes require spec updates first, then test updates, then code updates

**Test Coverage Requirements:**
- Unit tests for all service handlers and business logic
- Integration tests for OData service endpoints
- End-to-end tests for critical user flows
- Mock AI responses to enable frontend development without live ML service

#### MCP-First Framework Usage
Query SAP MCP servers before generating framework code:
- CAP MCP: Entity definitions, service handlers, action patterns
- Fiori MCP: Annotations, manifest configuration
- UI5 MCP: Controllers, bootstrap, control APIs

## 4. Risk Classifications

**Note:** These 11 risk categories are defined by the pre-deployed ML model. The application layer maps model outputs to these business-friendly labels.

**Risk Categories (defined by deployed model):**

1. **Normal** - No anomalies detected (green)
2. **Unusual Amount** - Amount deviates from typical range (yellow)
3. **High Amount + New Pattern** - Large amount with first-time account/cost center combination (red)
4. **High Amount + Rare Pattern** - Large amount with infrequently used account combination (red)
5. **New Pattern** - First occurrence of specific account/cost center combination (yellow)
6. **New Pattern + Weekend** - New pattern posted on weekend (red)
7. **New Pattern + After Hours** - New pattern posted outside business hours (yellow)
8. **Rare Pattern** - Infrequently used account combination (yellow)
9. **Weekend Entry** - Posted on Saturday or Sunday (yellow)
10. **Backdated Entry** - Posting date significantly earlier than entry date (red)
11. **Multiple Risk Factors** - Combined indicators suggesting elevated risk (red)

## 5. Out of Scope

- Real-time streaming inference (batch processing only)
- GenAI chat interface (static risk labels are deterministic and sufficient)
- **Model training/retraining** (ML model is pre-deployed in AI Core - out of scope)
- **Feature engineering/selection** (25 features are already defined - out of scope)
- **MLOps pipeline** (model deployment and monitoring handled separately - out of scope)
- Role-based access control (prototype scope)
- Mobile-optimized layouts (desktop Fiori Elements only)
- Multi-language support (English only, but externalized for future)

## 6. Success Metrics

### 6.1 Functional Success
- User can click "Analyze" and see color-coded risk classifications
- Filters work correctly across all dimensions
- Export produces complete spreadsheet with all visible columns
- Error messages are user-friendly (no raw HTTP codes)

### 6.2 Technical Success
- `cds build` completes without errors in clean environment
- All MCP-generated code follows current framework patterns (no deprecated APIs)
- Unit and integration tests pass
- PSR compliance audit finds no critical issues
- Threat model identifies and mitigates security risks

## 7. Architecture Summary

```
┌─────────────────┐
│  Fiori Elements │  ← User clicks "Analyze" button
│   List Report   │  ← Displays color-coded risk results
└────────┬────────┘
         │ OData V4
         ↓
┌────────────────────┐
│   CAP Backend      │  ← Extracts 25 pre-defined features
│   Service Handler  │  ← Calls AI Core endpoint
└────────┬───────────┘
         │
         ↓
┌────────────────────┐
│  Mock Predictor    │  ← Returns varied risk classes
│  (Phase 1-3)       │  ← Enables frontend testing
└────────────────────┘
         │
         ↓ (Phase 4)
┌────────────────────┐
│  SAP AI Core       │  ← Pre-deployed XGBoost model
│  Inference API     │  ← /v1/predict (already deployed)
└────────────────────┘
```

## 8. Development Phases (SDD + TDD Approach)

**All phases follow Specification-Driven + Test-Driven Development:**
1. Write detailed specifications with embedded test scenarios
2. Derive tests from specifications
3. Implement to pass tests
4. Verify against original specifications

### Phase 1: Foundation (SDD → TDD) → `v0.1.0-phase1-foundation`
**Specifications:**
- Data model specification with entity contracts
- Schema validation rules
- Mock data requirements

**Implementation (TDD):**
- Write tests for CDS entity model validation
- CAP project scaffold
- CDS entity model matching data schema
- Mock CSV data
- Service definition with `analyzeRisks` action
- **Tests:** Schema validation, entity relationships, mock data loading
- **Milestone:** Tag commit when phase complete: `git tag -f v0.1.0-phase1-foundation`

### Phase 2: Backend Logic (SDD → TDD) → `v0.2.0-phase2-backend`
**Specifications:**
- API contract for OData service
- Feature extraction specification (25 features, exact order)
- Risk classification logic specification
- Mock predictor contract

**Implementation (TDD):**
- Write unit tests for feature extraction
- Write unit tests for risk classification logic
- Service handler implementation
- Feature extraction (25 columns in correct order)
- Mock predictor returning varied risk classes
- Risk label mapping with criticality codes
- **Tests:** Unit tests for handlers, integration tests for OData actions
- **Milestone:** Tag commit when phase complete: `git tag -f v0.2.0-phase2-backend`

### Phase 3: Frontend & Integration (SDD → TDD) → `v0.3.0-phase3-frontend`
**Specifications:**
- UI component specifications (Fiori annotations)
- User interaction flows
- Export functionality requirements
- E2E test scenarios

**Implementation (TDD):**
- Write E2E tests for user interactions
- Fiori annotations (columns, filters, criticality)
- Manifest configuration (routing, actions)
- Controller for "Analyze" button
- i18n externalization
- **Tests:** E2E tests for analyze flow, filter operations, export functionality
- **Milestone:** Tag commit when phase complete: `git tag -f v0.3.0-phase3-frontend`

### Git Milestone Strategy

Lightweight tags mark phase completion:
- **v0.1.0-phase1-foundation** - Foundation complete
- **v0.2.0-phase2-backend** - Backend logic complete
- **v0.3.0-phase3-frontend** - Frontend & integration complete (FINAL)

**Move tag to completion commit:**
```bash
git tag -f v0.1.0-phase1-foundation <commit-hash>
```

**Push tags to remote:**
```bash
git push origin --tags
```

---

**Next Steps - Specification Development Process (SDD):**

The following detailed specifications will be created through iterative `/brainstorm` sessions, following OpenSpec principles:

### High-Level Design (HLD) Documents
- **spec/data-model.md** - Complete entity relationships, composite keys, type definitions, associations
  - Embedded: Schema validation test scenarios
- **spec/compliance.md** - PSR requirements mapping, threat modeling coverage
  - Embedded: Compliance verification test cases

### Low-Level Design (LLD) Documents  
- **spec/api-design.md** - OData V4 service contract, action signatures, error responses
  - Embedded: API integration test scenarios (request/response examples)
- **spec/ui-requirements.md** - Detailed Fiori annotations, column definitions, filter specs, UX flows
  - Embedded: E2E test scenarios (user interaction flows)
- **spec/ml-integration.md** - Feature extraction logic, prediction pipeline, mock vs. real predictor
  - Embedded: Unit test scenarios (feature extraction, classification logic)

### Test Strategy Document
- **spec/test-strategy.md** - Overall test approach, coverage requirements, test data management
  - Test pyramid definition (unit/integration/e2e ratios)
  - Mock data patterns and test fixtures
  - CI/CD integration requirements

**OpenSpec Principle:** Each specification document contains both the contract/requirement AND the test scenarios that verify it. Tests are derived from specs, not invented separately. This ensures specifications are testable and implementation is verifiable.
