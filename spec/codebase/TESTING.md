# Testing Patterns

**Analysis Date:** 2026-03-09

## Test Framework

**Runner:**
- No test framework configured in this repository (documentation-only project)

**For SAP Projects (documented standards):**
- Backend (Python): `pytest` (per `AGENTS.md`)
- Backend (Node.js/CAP): Jest or Mocha (standard for CAP projects)
- Frontend (SAPUI5): QUnit or OPA5 (SAP standard)
- UI Testing: Playwright MCP (per demo2 `AGENTS.md`)

**Assertion Library:**
- pytest: Built-in assertion rewriting
- Jest: Built-in `expect` API
- QUnit: `assert` object

**Run Commands (documented patterns):**
```bash
# Python backend (from backend/)
poetry run pytest              # Run all tests
poetry run pytest --cov=app    # With coverage

# Node.js backend
npm test                       # Run all tests
npm run test:watch             # Watch mode

# Frontend
npm run lint                   # UI5 linter (mandatory gate)
```

## Test File Organization

**Location:**
- Not applicable (no test files in this documentation repository)

**Documented Pattern:**
- Co-located or separate `test/` directories
- Backend tests: `tests/` or `__tests__/`
- UI tests: `test/` or alongside components

**Naming:**
- Pattern: `*.test.js`, `*.spec.js`, `*.test.py`, `test_*.py`

**Structure:**
Not detected in this repository — no source code with tests.

## Test Structure

**Suite Organization:**
Not applicable — no test code in this documentation repository.

**Documented Patterns:**
```python
# pytest pattern
def test_journal_entry_query():
    # Arrange
    query = {"companyCode": "1010", "amountMin": 50000}

    # Act
    result = query_journal_entries(query)

    # Assert
    assert len(result) > 0
    assert all(entry.amount >= 50000 for entry in result)
```

```javascript
// Jest/CAP pattern
describe("JournalEntryService", () => {
  it("should filter entries by amount", async () => {
    const result = await SELECT.from("JournalEntry").where({ amount: { ">": 50000 } });
    expect(result.length).toBeGreaterThan(0);
  });
});
```

**Patterns:**
- Arrange-Act-Assert structure
- Descriptive test names that document behavior
- One assertion per test (where practical)

## Mocking

**Framework:**
- pytest: `pytest-mock` or `unittest.mock`
- Jest: Built-in `jest.mock()`

**Patterns:**
Not detected in this repository.

**Documented Guidelines:**
- Mock external services (SAP AI Core, BDC, external APIs)
- Mock slow or non-deterministic operations
- Use test doubles for third-party integrations

**What to Mock:**
- SAP AI Core model calls (to avoid API costs and latency)
- BDC data product queries (to isolate business logic)
- External HTTP requests
- File system operations (where applicable)
- Time-dependent functions

**What NOT to Mock:**
- Internal business logic being tested
- Data transformations
- Pure functions
- Simple utility functions

## Fixtures and Factories

**Test Data:**
Not detected in this repository.

**Documented Pattern:**
- Use BDC data products as source for realistic test data (per `ref-arch/2-accelerating-dev-with-claude-code/readme.md`)
- Generate fixtures from actual schemas to ensure validity

**Location:**
- `tests/fixtures/` or `test/fixtures/`
- `conftest.py` for pytest fixtures

## Coverage

**Requirements:**
- No specific coverage target documented
- "Check coverage (optional but recommended)" — `pytest --cov=app` (per demo2 `AGENTS.md`)

**View Coverage:**
```bash
# Python
poetry run pytest --cov=app --cov-report=html
open htmlcov/index.html

# Node.js
npm run test:coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, methods, or components
- Approach: Isolated, fast, no external dependencies
- Documented as mandatory gate in `AGENTS.md`

**Integration Tests:**
- Scope: Service handlers, API endpoints, data layer integration
- Approach: Test component interactions with real or simulated services
- Documented as part of orchestrator's integration testing phase (prototype `AGENTS.md` line 180)

**E2E Tests:**
- Framework: Playwright MCP (documented in demo2 `AGENTS.md`)
- Scope: Full user flows through UI and backend
- Approach: Browser automation, screenshots, interaction verification

## Common Patterns

**Async Testing:**
```javascript
// Jest async pattern
test("fetches journal entries", async () => {
  const entries = await JournalEntryService.getEntries({ companyCode: "1010" });
  expect(entries).toBeDefined();
});
```

```python
# pytest async pattern
@pytest.mark.asyncio
async def test_ai_query():
    response = await ai_service.ask("Show manual entries")
    assert response.status == "success"
```

**Error Testing:**
```javascript
// Jest error testing
test("throws error for invalid company code", () => {
  expect(() => {
    JournalEntryService.validate({ companyCode: "INVALID" });
  }).toThrow("Invalid company code");
});
```

```python
# pytest error testing
def test_invalid_query():
    with pytest.raises(ValueError, match="Invalid company code"):
        validate_company_code("INVALID")
```

## UI Testing with Playwright MCP

**Documented Pattern (from demo2 `AGENTS.md`):**

1. Navigate to the application (e.g., `http://localhost:8080`)
2. Take screenshots of key UI states
3. Test all user interactions (clicks, forms, navigation)
4. Verify no console errors in browser

**Mandatory Gates:**
- UI5 linter must pass with 0 errors: `npm run lint`
- Playwright MCP UI test with screenshots taken
- No console errors during manual or automated testing

## Pre-Commit Testing Gates

**Mandatory Checks (from demo2 `AGENTS.md` lines 52-94):**

⛔ **YOU CANNOT COMMIT UNTIL ALL TESTS PASS** ⛔

```bash
# Frontend tests (from project root)
npm run lint                    # MUST show 0 errors
npm start &                     # Start dev server
# Use Playwright MCP to test UI

# Backend tests (from backend/)
cd backend
poetry shell                    # Activate venv
poetry run pytest               # MUST show all tests pass
poetry run pytest --cov=app     # Check coverage (optional but recommended)
```

**If ANY test fails:**
- DO NOT proceed to commit
- Fix the issue first
- Re-run ALL tests
- Only continue when everything passes

## Test Documentation Requirements

**PR Description Must Include:**
- [ ] `npm run lint` passes (0 errors)
- [ ] `pytest` passes (all tests)
- [ ] UI tested with Playwright MCP
- [ ] Screenshots taken

## Testing Philosophy

**From Documented Standards:**

1. **Test-Driven Development with AI** — "Let the AI generate tests first to set a verifiable contract; code is then produced to satisfy those tests" (per `ref-arch/1-vibe-coding-with-cline/readme.md` line 46)

2. **Human-in-the-Loop Governance** — Tests are mandatory gates, but developers remain final gatekeepers for quality (per `ref-arch/readme.md`)

3. **No Commit Without Passing Tests** — Hard rule: if `npm run lint` or `pytest` fails, you cannot commit (per demo2 `AGENTS.md` line 108)

4. **Quality Gates in Multi-Agent Workflows** — In agent team development, "Each PR requires passing tests before merge" (per prototype `AGENTS.md` line 125)

5. **End-to-End Validation** — Orchestrator runs integration testing after all PRs merge (per prototype `AGENTS.md` line 180)

## Agent Team Testing Pattern

**From prototype `AGENTS.md`:**

When using multi-agent development with git worktrees:

1. **Each agent runs tests in their worktree** before creating a PR
2. **Pull requests cannot merge** until all tests pass
3. **Orchestrator validates integration** after merging branches
4. **All agents rebase and fix** integration issues if they arise

**Testing Responsibilities by Agent Role:**
- Backend Agents: Unit tests for service logic, integration tests for OData endpoints
- Frontend Agents: UI5 linter, Playwright UI tests
- Prompt Engineer: Validate AI response parsing and error handling
- Problem Finder: Identify untested edge cases and missing test coverage
- Orchestrator: End-to-end integration testing after all merges

---

*Testing analysis: 2026-03-09*
