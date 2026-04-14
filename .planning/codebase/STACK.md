# Technology Stack

**Analysis Date:** 2026-03-09

## Languages

**Primary:**
- Markdown - Documentation and reference architecture content
- YAML - Frontmatter metadata for architecture pages

**Secondary:**
- JavaScript - Code examples in prototype instructions
- DrawIO XML - Architecture diagrams

## Runtime

**Environment:**
- Not applicable - This is a documentation repository

**Package Manager:**
- Not applicable for main repository
- Referenced in guides: npm (for SAP CAP, MCP servers), Poetry (for Python backend examples)

## Frameworks

**Core:**
- Not applicable - Documentation repository

**Reference Architectures Described:**
- SAP CAP (Cloud Application Programming Model) - Enterprise service framework
- SAP Fiori / SAPUI5 1.120+ - Enterprise UI framework
- FastAPI - Python backend framework (referenced in guides)

**Build/Dev:**
- Not detected - Static documentation

## Key Dependencies

**MCP Servers (Referenced):**
- `@cap-js/mcp-server` - CAP development knowledge
- `@sap-ux/fiori-mcp-server` - Fiori Elements patterns
- `@ui5/mcp-server` - SAPUI5 controls and conventions
- `@sap/mdk-mcp-server` - Mobile Development Kit

**SAP SDKs (Referenced):**
- `@sap-ai-sdk/foundation-models` - SAP AI Core integration
- `@sap-ai-sdk/ai-api` - AI API access
- `@sap/cds-dk` - CAP Development Kit

**Infrastructure (Referenced):**
- LiteLLM - OpenAI-compatible proxy for SAP AI Core
- uvicorn - ASGI server (for Python examples)
- SQLite - Database (for prototype examples)

## Configuration

**Environment:**
- `.env` file present - Contains SAP AI Core credentials configuration
- Required environment variables documented:
  - `SAP_AI_CORE_CLIENT_ID`
  - `SAP_AI_CORE_CLIENT_SECRET`
  - `SAP_AI_CORE_AUTH_URL`
  - `SAP_AI_CORE_BASE_URL`
  - `SAP_AI_CORE_RESOURCE_GROUP`
  - `ANTHROPIC_BASE_URL` (for LiteLLM proxy)
  - `ANTHROPIC_API_KEY` (for LiteLLM master key)

**Build:**
- No build process - Documentation is rendered as static content

**Claude Code:**
- `.claude/settings.local.json` - Permissions configuration for Claude Code operations (git, npm, web fetch)

## Platform Requirements

**Development:**
- Node.js 18+ (for SAP CAP development referenced in guides)
- Python 3.8+ with Poetry (for backend examples)
- Git with worktree support (for multi-agent patterns)
- Claude Code or compatible AI coding assistant (Cline, Cursor, Windsurf, GitHub Copilot)

**Production:**
- SAP Business Technology Platform (BTP) - Deployment target for applications built using these reference architectures
- SAP AI Core - Foundation model hosting and inference
- SAP Business Data Cloud (BDC) - Data products and semantic data layer

## Architecture Documentation Tools

**Diagramming:**
- DrawIO - Architecture diagrams in `ref-arch/drawio/` and `ref-arch/2-accelerating-dev-with-claude-code/drawio/`

**Documentation Format:**
- Markdown with YAML frontmatter
- Structured for SAP Architecture Center publication
- Tags: `genai`, `appdev`, `bdc`

---

*Stack analysis: 2026-03-09*
