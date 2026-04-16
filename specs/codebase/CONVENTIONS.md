# Coding Conventions

**Analysis Date:** 2026-03-09

## Naming Patterns

**Files:**
- Markdown documentation: UPPERCASE.md for architecture/config files (`CLAUDE.md`, `README.md`, `USE_CASE.md`)
- kebab-case for reference architecture pages: `readme.md`
- DrawIO diagrams: kebab-case with .drawio extension: `vibe-engineering-overview.drawio`, `claude-code-architecture.drawio`

**Functions:**
- Not applicable (no JavaScript/TypeScript source code in this codebase)

**Variables:**
- UPPERCASE_SNAKE_CASE for environment variables: `SAP_AI_CORE_CLIENT_ID`, `SAP_AI_CORE_CLIENT_SECRET`, `SAP_AI_CORE_AUTH_URL`, `SAP_AI_CORE_BASE_URL`, `SAP_AI_CORE_RESOURCE_GROUP`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY`
- PascalCase for CDS entities (per documented standard): `JournalEntryHeader`, `EntryViewJournalEntry`, `GeneralLedgerAccount`
- camelCase for CDS fields (per documented standard): `postingDate`, `companyCode`, `documentType`

**Types:**
- Not applicable (no TypeScript source code in this codebase)

## Code Style

**Formatting:**
- No formatter configuration files detected (no `.prettierrc`, `.eslintrc`, `biome.json`)
- Markdown follows consistent conventions:
  - Code blocks use triple backticks with language identifiers: ` ```bash`, ` ```yaml`, ` ```json`, ` ```javascript`
  - Tables use standard Markdown table format with pipes and alignment
  - Sections use `##` for major headings, `###` for subsections
  - Lists use `-` for unordered, numbered sequences for ordered

**Linting:**
- No linting configuration detected in this documentation repository

## Import Organization

**Not applicable** — This is a documentation repository with no source code modules.

For SAP projects documented here, the standards are:

**Order (from `CLAUDE.md`):**
1. External dependencies (npm packages)
2. SAP framework modules (`sap.ui.define`)
3. Internal project modules

**Path Aliases:**
- Not specified in this codebase

**Module System:**
- SAPUI5 projects: `sap.ui.define` for all modules (no globals)
- CAP projects: Node.js CommonJS or ES6 imports

## Error Handling

**Patterns:**
- No source code to analyze
- Documented guideline: Use CAP's `cds.log` instead of `console.log` in production code (per `CLAUDE.md` line 182)

## Logging

**Framework:**
- CAP projects: Use `cds.log` (not `console.log`)
- General development: Standard console output for scripts and utilities

**Patterns:**
- Avoid `console.log` in production code
- No debug statements should be committed

## Comments

**When to Comment:**
- Document rationale for architectural decisions in CHANGELOG.md
- Document "why" not "what" in code (per documented standard)
- Use triple-slash JSDoc/TSDoc for public APIs (per documented standard)

**JSDoc/TSDoc:**
- Standard specified but no examples in this codebase

## Function Design

**Size:**
- No specific guidelines detected
- Documentation emphasizes clarity and maintainability

**Parameters:**
- Use descriptive names
- Prefer configuration objects for functions with many parameters

**Return Values:**
- Prefer explicit return types in TypeScript
- Use structured responses for service handlers

## Module Design

**Exports:**
- SAPUI5: Export via `sap.ui.define` return value
- Node.js: CommonJS `module.exports` or ES6 `export`

**Barrel Files:**
- Not specified

## SAP-Specific Conventions

**SAPUI5/Fiori:**
- XML views only — no JavaScript views (per `CLAUDE.md` line 177)
- `sap.ui.define` for all modules — no globals (line 178)
- Async loading: `data-sap-ui-async="true"` (line 179)
- i18n for all user-facing text (line 180)
- No deprecated APIs: `jQuery.sap.*`, sync loading, `sap.ui.getCore()` (line 181)
- Annotation-driven where possible (line 185)
- Use `sap.f`, `sap.uxap`, `sap.m` libraries (line 185)

**CAP/CDS:**
- PascalCase for entities (line 184)
- camelCase for fields (line 184)
- OData V4 (line 184)

**Security:**
- No hardcoded URLs, secrets, or credentials (line 183)
- Environment variables for all secrets
- Never commit `.env` files or credentials (`.gitignore` enforces this)

**Python:**
- Use **Poetry** for all dependency management — never `pip`, `venv`, or `virtualenv` (per `CLAUDE.md` lines 139-173)
- Commands: `poetry install`, `poetry add`, `poetry run`, `poetry shell`
- Always commit `poetry.lock` for reproducible installs

## Git Conventions

**Branch Naming:**
- Format: `<type>/<description>` (per `CLAUDE.md` line 189)
- Types: `feature/`, `bugfix/`, `docs/`, `hotfix/`, `chore/`, `refactor/`

**Commit Format:**
- Format: `<type>: <description>` (50 chars max) (line 190)
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Reference issues: `Closes #N` (line 191)
- Example: `feat: add journal entry analyzer AI chat interface. Closes #5`

**Pull Requests:**
- Squash merge for all PRs (documented in demo2 CLAUDE.md)
- Include test results in PR description
- One PR per feature/fix

## Documentation Standards

**File Organization:**
- Root `CLAUDE.md`: Project-wide conventions and configuration
- Module `CLAUDE.md`: Module-specific instructions (e.g., `../prototype/CLAUDE.md`, `ref-arch/CLAUDE.md`)
- `README.md`: User-facing overview and structure
- `USE_CASE.md`: Functional specifications (where applicable)

**Frontmatter:**
- Reference architecture pages use YAML frontmatter with metadata:
  - `id`, `slug`, `title`, `description`, `keywords`, `tags`, `contributors`, `last_update`

**Content Rules:**
- Professional and technically accurate language
- No emojis in documentation (except in special contexts)
- Use numbered Flow sections for architecture diagrams
- Use DrawIO notation: `![drawio](drawio/filename.drawio)`
- Include absolute file paths in all technical references

**Code Examples:**
- Always specify language in code blocks
- Provide working, complete examples
- Include comments explaining non-obvious behavior
- Show both declaration and usage where applicable

## Configuration Management

**Environment Variables:**
- Required for SAP AI Core:
  - `SAP_AI_CORE_CLIENT_ID`
  - `SAP_AI_CORE_CLIENT_SECRET`
  - `SAP_AI_CORE_AUTH_URL`
  - `SAP_AI_CORE_BASE_URL`
  - `SAP_AI_CORE_RESOURCE_GROUP`
- Required for LiteLLM + Claude Code:
  - `ANTHROPIC_BASE_URL`
  - `ANTHROPIC_API_KEY`

**Configuration Files:**
- `.gitignore`: Excludes secrets, build artifacts, dependencies
- `.claude/settings.json`: MCP server configuration (not in this repo, but documented)
- `litellm_config.yaml`: LiteLLM proxy configuration (documented pattern)
- `pyproject.toml`: Python project metadata and dependencies (when using Poetry)

---

*Convention analysis: 2026-03-09*
