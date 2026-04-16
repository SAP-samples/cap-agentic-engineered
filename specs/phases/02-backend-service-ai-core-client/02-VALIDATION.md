---
phase: 2
slug: backend-service-ai-core-client
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.2.0 + @cap-js/cds-test |
| **Config file** | `jest.config.js` (exists from Phase 1) |
| **Quick run command** | `npm test -- risk-service.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- <relevant-test-file>`
- **After every plan wave:** Run `npm test && cds build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | INFER-02 | unit | `npm test -- feature-extractor.test.js` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | INFER-04 | unit | `npm test -- risk-labels.test.js` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | INFER-03 | unit | `npm test -- ai-core-client.test.js` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | DATA-02, MCP-01 | unit | `npm test -- risk-service.test.js` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | DATA-02, INFER-05 | integration | `npm test -- risk-service.test.js` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | INFER-05 | integration | `npm test -- risk-service.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/lib/feature-extractor.test.js` — stubs for INFER-02
- [ ] `test/lib/risk-labels.test.js` — stubs for INFER-04
- [ ] `test/lib/ai-core-client.test.js` — stubs for INFER-03 (with nock mocking)
- [ ] `test/risk-service.test.js` — stubs for DATA-02, INFER-05
- [ ] Framework install: `npm install --save @sap-ai-sdk/ai-api @sap-ai-sdk/core && npm install --save-dev nock`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OData action endpoint callable via browser/curl | DATA-02 | Validates full HTTP stack | `curl -X POST http://localhost:4004/odata/v4/risk/GLTransactions/analyzeRisks` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
