# Codebase Structure

**Analysis Date:** 2026-03-09

## Directory Layout

```
cap-agentic-engineered/
├── .claude/                   # Claude Code configuration
├── .git/                      # Git repository metadata
├── .hyperspace/               # Hyperspace PR bot configuration
├── .planning/                 # AI-generated codebase analysis
│   └── codebase/              # Mapping documents (this file)
├── prototype/                 # Multi-agent prototype specification
├── ref-arch/                  # Reference architecture content
│   ├── 1-vibe-coding-with-cline/         # Sub-page: Cline integration
│   ├── 2-accelerating-dev-with-claude-code/  # Sub-page: Claude Code integration
│   └── drawio/                # Shared architecture diagrams
├── .env                       # Environment variables (not committed)
├── .gitignore                 # Git exclusions
├── CLAUDE.md                  # Project instructions for AI agents
└── README.md                  # Repository overview
```

## Directory Purposes

**`ref-arch/`:**
- Purpose: Reference architecture documentation for SAP Architecture Center publication
- Contains: Markdown files with YAML frontmatter, sub-page directories, DrawIO diagrams
- Key files: `readme.md` (main overview), `CLAUDE.md` (writing guidelines)

**`ref-arch/1-vibe-coding-with-cline/`:**
- Purpose: Sub-page documenting Cline + SAP AI Core integration
- Contains: `readme.md` (content), `drawio/` (diagrams)
- Key files: `readme.md`

**`ref-arch/2-accelerating-dev-with-claude-code/`:**
- Purpose: Sub-page documenting Claude Code + LiteLLM + SAP AI Core integration
- Contains: `readme.md` (content), `drawio/` (diagrams)
- Key files: `readme.md`

**`prototype/`:**
- Purpose: Example multi-agent development specification (Journal Entry Analyzer)
- Contains: Agent team instructions, use case definition
- Key files: `CLAUDE.md` (agent instructions), `USE_CASE.md` (app specification)

**`.claude/`:**
- Purpose: Claude Code tool configuration
- Contains: Permission policies for web fetch, bash commands, git operations
- Key files: `settings.local.json`

**`.planning/`:**
- Purpose: AI-generated codebase mapping documents
- Contains: `codebase/` subdirectory with analysis artifacts
- Key files: This document (`STRUCTURE.md`) and `ARCHITECTURE.md`

**`.hyperspace/`:**
- Purpose: Hyperspace bot configuration (PR automation)
- Contains: Bot settings
- Key files: `pull_request_bot.json`

**`ref-arch/drawio/`:**
- Purpose: Shared architecture diagrams used across reference architecture pages
- Contains: DrawIO diagram files (`.drawio` format)
- Key files: `vibe-engineering-overview.drawio`

**`ref-arch/1-vibe-coding-with-cline/drawio/`:**
- Purpose: Cline-specific architecture diagrams
- Contains: DrawIO files for Cline integration flow
- Key files: `cline-vibe-code-diagram.drawio`

**`ref-arch/2-accelerating-dev-with-claude-code/drawio/`:**
- Purpose: Claude Code-specific architecture diagrams
- Contains: DrawIO files for Claude Code integration flow
- Key files: `claude-code-architecture.drawio`

## Key File Locations

**Entry Points:**
- `/README.md`: Repository overview, directory structure, key technologies
- `/CLAUDE.md`: Project instructions for AI agents (MCP servers, LiteLLM config, Python standards)
- `ref-arch/readme.md`: Main reference architecture page (vibe engineering overview)

**Configuration:**
- `.claude/settings.local.json`: Claude Code permissions (web domains, bash commands, git operations)
- `.gitignore`: Excludes `.env`, `node_modules/`, `.venv/`, `dist/`
- `.env`: Environment variables for SAP AI Core (CLIENT_ID, CLIENT_SECRET, AUTH_URL, BASE_URL, RESOURCE_GROUP) — not committed

**Core Documentation:**
- `ref-arch/readme.md`: Vibe engineering for SAP AI-native (main page)
- `ref-arch/1-vibe-coding-with-cline/readme.md`: Cline integration guide
- `ref-arch/2-accelerating-dev-with-claude-code/readme.md`: Claude Code integration guide
- `ref-arch/CLAUDE.md`: Writing guidelines (structure, tags, status, content rules)

**Prototype Specification:**
- `../prototype/CLAUDE.md`: Agent team instructions (team composition, worktree setup, workflow, definition of done)
- `../prototype/USE_CASE.md`: Journal Entry Analyzer use case (problem, solution, BDC data products, views)

**Analysis Artifacts:**
- `.planning/codebase/ARCHITECTURE.md`: Architecture analysis (this document's companion)
- `.planning/codebase/STRUCTURE.md`: This document

## Naming Conventions

**Files:**
- Markdown: `readme.md` (lowercase) for primary content pages, `CLAUDE.md` (uppercase) for agent instructions, `USE_CASE.md` (uppercase) for specifications
- Diagrams: `kebab-case-diagram-name.drawio`
- Configuration: `settings.local.json`, `.gitignore`, `.env`

**Directories:**
- Reference architecture sub-pages: `1-vibe-coding-with-cline/`, `2-accelerating-dev-with-claude-code/` (numbered, kebab-case)
- Diagram subdirectories: `drawio/` (lowercase)
- Tool configuration: `.claude/`, `.hyperspace/`, `.planning/` (hidden, lowercase)

## Where to Add New Code

**New Reference Architecture Sub-page:**
- Primary content: `ref-arch/N-new-topic-name/readme.md` (N = next number)
- Diagrams: `ref-arch/N-new-topic-name/drawio/diagram-name.drawio`
- Update: `ref-arch/readme.md` to link new sub-page

**New Prototype/Example:**
- Create: `prototype-name/` at root level
- Agent instructions: `prototype-name/CLAUDE.md`
- Use case: `prototype-name/USE_CASE.md`
- Update: Root `README.md` to document new example

**New Architecture Diagram:**
- Shared diagrams: `ref-arch/drawio/diagram-name.drawio`
- Sub-page specific: `ref-arch/N-sub-page/drawio/diagram-name.drawio`
- Reference in markdown: `![drawio](drawio/diagram-name.drawio)` or `![drawio](../drawio/diagram-name.drawio)`

**New MCP Server Configuration:**
- Add to: Root `CLAUDE.md` in "SAP Build MCP Server Configuration" section
- Format: JSON configuration with `npx` command pattern
- Update: Corresponding reference architecture page to document usage

**New AI Agent Instructions:**
- Project-level: Root `CLAUDE.md`
- Prototype-level: `../prototype/CLAUDE.md` (or new prototype directory)
- Format: Markdown with clear headings, code examples, definition of done checklist

## Special Directories

**`.planning/`:**
- Purpose: AI-generated codebase analysis documents for GSD command support
- Generated: Yes (by `/gsd:map-codebase` command)
- Committed: Yes (should be committed to provide context for future AI agents)

**`.git/`:**
- Purpose: Git repository metadata
- Generated: Yes (by git)
- Committed: No (Git internal structure)

**`.claude/`:**
- Purpose: Claude Code configuration (MCP servers, permissions)
- Generated: Manually configured
- Committed: Yes (`settings.local.json` defines tool permissions)

**`.hyperspace/`:**
- Purpose: Hyperspace bot configuration for PR automation
- Generated: Bot-managed
- Committed: Yes (defines bot behavior)

**`ref-arch/*/drawio/`:**
- Purpose: DrawIO diagram source files
- Generated: Created with DrawIO editor
- Committed: Yes (source of truth for architecture diagrams)

## Content Organization Patterns

**Reference Architecture Page Structure:**
Each sub-page follows this template:
1. YAML frontmatter (id, slug, sidebar_position, title, description, keywords, tags, contributors, dates)
2. Introduction paragraph
3. `## Architecture` section with DrawIO diagram
4. `## Flow` section with numbered steps
5. `## Characteristics` section with bullet points
6. `## Examples in an SAP context` section with bullet points
7. `## Services and Components` section with links
8. `## Resources` section with external links

**Prototype Specification Structure:**
- `CLAUDE.md`: Agent instructions — Mission, Application summary, Prerequisites, Agent team structure, Agent workflow, Runtime integration examples, Orchestrator checklist, Definition of done
- `USE_CASE.md`: Use case definition — Problem, Solution, BDC data products table, Application views, Architecture diagram, Tech stack table, Agent decomposition, Definition of done

**MCP Server Configuration Pattern:**
Stored in root `CLAUDE.md`, structured as:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@scope/package@latest"]
    }
  }
}
```

## File Path Examples

**Documentation:**
- Main overview: `ref-arch/readme.md`
- Cline guide: `ref-arch/1-vibe-coding-with-cline/readme.md`
- Claude Code guide: `ref-arch/2-accelerating-dev-with-claude-code/readme.md`
- Writing guidelines: `ref-arch/CLAUDE.md`

**Diagrams:**
- Overview diagram: `ref-arch/drawio/vibe-engineering-overview.drawio`
- Cline flow: `ref-arch/1-vibe-coding-with-cline/drawio/cline-vibe-code-diagram.drawio`
- Claude Code flow: `ref-arch/2-accelerating-dev-with-claude-code/drawio/claude-code-architecture.drawio`

**Prototype:**
- Agent instructions: `../prototype/CLAUDE.md`
- Use case: `../prototype/USE_CASE.md`

**Configuration:**
- Project instructions: `/CLAUDE.md`
- Claude Code settings: `.claude/settings.local.json`
- Environment variables: `.env` (not committed)

**Analysis:**
- Architecture mapping: `.planning/codebase/ARCHITECTURE.md`
- Structure mapping: `.planning/codebase/STRUCTURE.md`

---

*Structure analysis: 2026-03-09*
