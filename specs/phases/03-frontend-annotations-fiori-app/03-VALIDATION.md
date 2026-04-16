---
phase: 3
slug: frontend-annotations-fiori-app
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.2.0 with @cap-js/cds-test 0.4.1 |
| **Config file** | `jest.config.js` |
| **Quick run command** | `cd ../cap-llm-knowledge-only && npx jest --no-coverage -x` |
| **Full suite command** | `cd ../cap-llm-knowledge-only && npx jest` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --no-coverage -x`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | UI-05 | unit | `npx jest tests/unit/i18n.test.js -x` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | UI-01, UI-02, UI-03 | integration | `npx jest tests/integration/annotations.test.js -x` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | UI-04 | unit | `npx jest tests/unit/manifest.test.js -x` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | UI-03 | integration | `npx jest tests/integration/risk-service.test.js -x` | ✅ partial | ⬜ pending |
| 03-02-01 | 02 | 2 | INFER-01 | integration | `npx jest tests/integration/risk-service.test.js -x` | ✅ | ⬜ pending |
| 03-02-02 | 02 | 2 | MCP-01 | manual | `cds build` + visual verification | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/integration/annotations.test.js` — stubs for UI-01, UI-02: verify CDS model has expected annotations after deployment
- [ ] `tests/unit/manifest.test.js` — covers UI-04: parse manifest.json and assert enableExport is true
- [ ] `tests/unit/i18n.test.js` — covers UI-05: parse i18n.properties and verify all required keys exist
- [ ] Update `tests/integration/risk-service.test.js` — covers UI-03: add assertion that `criticality` field is populated with integer value (1, 2, or 3) after analyzeRisks
- [ ] `cds build` command as build validation — verify the complete model compiles without errors

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full-row criticality coloring renders correctly | UI-03 | Visual rendering requires browser | Run `cds watch`, open app, click Analyze, verify green/orange/red rows |
| Anomaly Score micro chart renders as progress bar | UI-01 | Visual component rendering | Run `cds watch`, verify progress bar in Anomaly Score column |
| KPI header updates after Analyze | UI-01 | Dynamic client-side behavior | Click Analyze, verify KPI counters update |
| MCP validation of annotations | MCP-01 | Requires MCP server queries | Query Fiori MCP for annotation syntax, UI5 MCP for bootstrap |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
