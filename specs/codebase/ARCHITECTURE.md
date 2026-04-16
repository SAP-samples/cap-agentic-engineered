# Architecture

**Analysis Date:** 2026-03-09

## Pattern Overview

**Overall:** Documentation-Driven Reference Architecture Repository

**Key Characteristics:**
- Documentation-centric codebase with minimal runtime code
- Hierarchical reference architecture content organized by tooling approach
- Example prototype specification demonstrating multi-agent development patterns
- Configuration artifacts for AI coding tool integration (MCP servers, LiteLLM)

## Layers

**Documentation Layer:**
- Purpose: Primary content — reference architecture markdown documents for publication
- Location: `ref-arch/`
- Contains: Markdown files with frontmatter metadata, architectural guidance, integration patterns
- Depends on: External SAP services, MCP servers, LiteLLM proxy patterns
- Used by: SAP Architecture Center publication pipeline, developers implementing vibe engineering patterns

**Prototype Specification Layer:**
- Purpose: Concrete example of multi-agent development approach
- Location: `prototype/`
- Contains: Agent team instructions, use case definition, workflow specifications
- Depends on: SAP CAP, SAP Business Data Cloud data products, SAP AI Core
- Used by: Claude Code agent teams building intelligent SAP applications

**Configuration Layer:**
- Purpose: Tool configuration for AI-native development workflows
- Location: `.claude/`, root `CLAUDE.md`
- Contains: MCP server settings, permission policies, development standards
- Depends on: Claude Code, SAP Build MCP servers, LiteLLM
- Used by: Claude Code and other AI coding assistants

**Diagram Layer:**
- Purpose: Visual architecture representations
- Location: `ref-arch/drawio/`, `ref-arch/*/drawio/`
- Contains: DrawIO diagram files embedded in documentation
- Depends on: Documentation layer
- Used by: Published reference architecture pages

## Data Flow

**Documentation Publication Flow:**

1. Author writes/updates markdown in `ref-arch/` with SAP Architecture Center frontmatter
2. Diagrams are created in DrawIO format and referenced via `![drawio](path)` syntax
3. Content is validated against SAP Architecture Center schema (frontmatter, tags, contributors)
4. Publication system ingests markdown and renders on architecture.learning.sap.com
5. Developers consume published content as guidance for SAP AI-native development

**Multi-Agent Development Flow (Prototype Example):**

1. Architect reads `../prototype/CLAUDE.md` and `../prototype/USE_CASE.md`
2. Orchestrator agent spawns team of specialized agents (frontend, backend, integration)
3. Each agent works in isolated git worktree on separate branch
4. Agents query SAP Build MCP servers for CAP/Fiori/UI5 best practices
5. Agents coordinate through shared task list and messaging
6. Pull requests converge to main branch through orchestrator review

**AI Coding Tool Integration Flow:**

1. Developer configures Claude Code with settings from `.claude/settings.local.json`
2. MCP servers (CAP, Fiori, UI5, MDK) are registered as tool providers
3. LiteLLM proxy routes requests to SAP AI Core foundation models
4. Agent reads context from `CLAUDE.md` files (project instructions)
5. Agent queries MCP servers for SAP-specific guidance during code generation
6. Generated code follows SAP best practices embedded in MCP context

**State Management:**
- No runtime state — this is a documentation and specification repository
- Git branches track work-in-progress for reference architecture updates
- `specs/codebase/` contains AI-generated mapping documents (this file)

## Key Abstractions

**Reference Architecture Page:**
- Purpose: Self-contained architectural guidance document
- Examples: `ref-arch/readme.md`, `ref-arch/1-vibe-coding-with-cline/readme.md`, `ref-arch/2-accelerating-dev-with-claude-code/readme.md`
- Pattern: Markdown with YAML frontmatter, structured sections (Architecture, Flow, Characteristics, Examples, Services, Resources), embedded DrawIO diagrams

**Agent Team Specification:**
- Purpose: Blueprint for multi-agent parallel development
- Examples: `../prototype/CLAUDE.md`
- Pattern: Team composition table, worktree setup instructions, workflow phases, task assignment rules, definition of done

**Use Case Definition:**
- Purpose: Concrete example application demonstrating architecture patterns
- Examples: `../prototype/USE_CASE.md`
- Pattern: Problem statement, BDC data products table, application views, architecture diagram (ASCII art), tech stack table

**MCP Server Configuration:**
- Purpose: Register SAP Build MCP servers as tool providers for AI coding assistants
- Examples: Configuration embedded in root `CLAUDE.md`
- Pattern: JSON configuration with npx-based server startup commands

## Entry Points

**Main Reference Architecture:**
- Location: `ref-arch/readme.md`
- Triggers: Accessed by SAP Architecture Center publication system
- Responsibilities: Overview of vibe engineering paradigm, link to sub-pages, establish core principles

**Claude Code Integration Guide:**
- Location: `ref-arch/2-accelerating-dev-with-claude-code/readme.md`
- Triggers: Developers setting up Claude Code with SAP AI Core
- Responsibilities: Document LiteLLM proxy pattern, agent teams workflow, BDC integration, MCP server usage

**Cline Integration Guide:**
- Location: `ref-arch/1-vibe-coding-with-cline/readme.md`
- Triggers: Developers setting up Cline with SAP AI Core
- Responsibilities: Document native SAP AI Core provider configuration, context engineering principles

**Prototype Orchestrator Instructions:**
- Location: `../prototype/CLAUDE.md`
- Triggers: Claude Code orchestrator agent reading team setup
- Responsibilities: Define agent team structure, spawn teammates, establish workflow phases, set definition of done

**Project Instructions for AI Agents:**
- Location: `/CLAUDE.md` (root)
- Triggers: AI coding assistants reading project context
- Responsibilities: Configure LiteLLM, document MCP servers, establish SAP code standards, define BDC integration pattern

## Error Handling

**Strategy:** No runtime error handling — documentation repository

**Patterns:**
- Markdown linting via publication system validation
- Broken link detection in CI/CD (not currently visible)
- Schema validation for frontmatter metadata

## Cross-Cutting Concerns

**Logging:** Not applicable — no runtime system

**Validation:** Publication system validates YAML frontmatter (id, slug, sidebar_position, tags, contributors, draft status)

**Authentication:** Repository access controlled via Git; published content is public on SAP Architecture Center

---

*Architecture analysis: 2026-03-09*
