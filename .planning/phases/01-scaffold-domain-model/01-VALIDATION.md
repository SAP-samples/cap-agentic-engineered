---
phase: 1
slug: scaffold-domain-model
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 30.x + @cap-js/cds-test |
| **Config file** | `jest.config.js` — Wave 0 installs |
| **Quick run command** | `npx jest test/feature-columns.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest test/feature-columns.test.js && cds compile db/schema.cds`
- **After every plan wave:** Run `npm test && cds build --production`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFRA-01 | smoke | `cds build --production` | ✅ CAP CLI | ⬜ pending |
| 01-01-02 | 01 | 1 | DATA-01 | unit | `cds compile db/schema.cds` | ✅ Native CDS | ⬜ pending |
| 01-01-03 | 01 | 1 | DATA-03 | integration | `cds watch` + curl | ✅ CAP runtime | ⬜ pending |
| 01-01-04 | 01 | 1 | INFRA-04 | smoke | `git check-ignore .env` | ✅ Git | ⬜ pending |
| 01-01-05 | 01 | 1 | INFRA-03 | smoke | `grep -r "client.*secret" srv/` returns empty | ✅ Bash | ⬜ pending |
| 01-02-01 | 02 | 1 | DATA-01 | unit | `npx jest test/feature-columns.test.js` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | MCP-01 | manual | Verify CDS generated after CAP MCP query | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/feature-columns.test.js` — stubs for DATA-01 (FEATURE_COLUMNS validation)
- [ ] `srv/lib/feature-columns.js` — defines FEATURE_COLUMNS constant
- [ ] `jest.config.js` — Jest configuration (testMatch, coverageDirectory)
- [ ] Framework install: `npm install --save-dev jest @cap-js/cds-test chai`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mock data has realistic distribution (~70/20/10%) | DATA-03 | Distribution is visual/subjective | Open CSV, count rows per risk tier, verify approximate distribution |
| Git worktrees exist for 3 agents | INFRA-02 | Infrastructure check, not code test | Run `git worktree list`, verify 3 entries |
| CDS generated after CAP MCP query | MCP-01 | Process verification, not output test | Confirm MCP query appears in execution log before CDS creation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
