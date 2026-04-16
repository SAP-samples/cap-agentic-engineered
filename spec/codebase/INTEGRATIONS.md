# External Integrations

**Analysis Date:** 2026-03-09

## APIs & External Services

**AI Model Access:**
- SAP AI Core - Foundation model hosting (Claude 4 Sonnet/Opus, Gemini 2.5 Pro, GPT models)
  - SDK/Client: `@sap-ai-sdk/foundation-models`, `@sap-ai-sdk/ai-api`
  - Auth: `SAP_AI_CORE_CLIENT_ID`, `SAP_AI_CORE_CLIENT_SECRET`, `SAP_AI_CORE_AUTH_URL`
  - Base URL: `SAP_AI_CORE_BASE_URL`
  - Resource Group: `SAP_AI_CORE_RESOURCE_GROUP`

**AI Proxy Layer:**
- LiteLLM - OpenAI-compatible proxy to SAP AI Core
  - Configuration: `litellm_config.yaml` (referenced in `AGENTS.md`)
  - Models mapped:
    - `claude-sonnet` → `sap_ai_core/anthropic--claude-4-sonnet`
    - `claude-opus` → `sap_ai_core/anthropic--claude-4-opus`
    - `gemini-pro` → `sap_ai_core/gemini-2.5-pro`
  - Proxy port: 4000
  - Auth: `sk-litellm-master-key` (local proxy auth)

**MCP Servers (Model Context Protocol):**
- SAP Build MCP Servers (open-source, Apache-2.0)
  - Execution: `npx -y <package-name>@latest`
  - Servers:
    - `@cap-js/mcp-server` - CAP development patterns
    - `@sap-ux/fiori-mcp-server` - Fiori Elements guidance
    - `@ui5/mcp-server` - SAPUI5 best practices
    - `@sap/mdk-mcp-server` - Mobile Development Kit patterns

**Web Fetch Permissions (Claude Code):**
- Allowed domains (from `.claude/settings.local.json`):
  - `community.sap.com` - SAP community resources
  - `www.npmjs.com` - npm package information
  - `github.com` - Repository access
  - `help.sap.com` - SAP documentation
  - `delta.io` - Delta Lake documentation
  - `docs.anthropic.com` - Claude documentation
  - `x.com`, `twitter.com`, `nitter.net` - Social media access
  - `www.reddit.com` - Reddit access

## Data Storage

**Databases:**
- SQLite (referenced in prototype guides)
  - Connection: Not applicable - example configuration only
  - Client: Native SQLite

**Data Products:**
- SAP Business Data Cloud (BDC)
  - Connection: BTP Destinations (OData v4)
  - Referenced data products:
    - `JournalEntryHeader` - Financial journal entry metadata
    - `EntryViewJournalEntry` - Journal entry line items
    - `GeneralLedgerAccount` - GL account master data
  - Source system: SAP Accounting & Financial Close (S/4HANA Cloud Private Edition)

**File Storage:**
- Local filesystem only - Documentation repository

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- SAP AI Core OAuth2
  - Implementation: OAuth client credentials flow
  - Token endpoint: `SAP_AI_CORE_AUTH_URL`
  - Required scopes: Determined by SAP AI Core service key

**BTP Authentication:**
- BTP Destinations (for BDC integration)
  - Implementation: BTP destination service handles authentication
  - Credentials managed through BTP cockpit

## Monitoring & Observability

**Error Tracking:**
- None - Documentation repository

**Logs:**
- Not applicable

**Model Observability:**
- LiteLLM proxy logging (when running locally)
- SAP AI Core metering and quota controls

## CI/CD & Deployment

**Hosting:**
- SAP Architecture Center (target publication platform)
  - Format: Docusaurus-based documentation site
  - Metadata: YAML frontmatter with tags, contributors, dates

**CI Pipeline:**
- Not detected in this repository

**Referenced Deployment Patterns:**
- SAP BTP (for applications built using these reference architectures)
  - Cloud Foundry runtime
  - MTA builds
  - BTP CLI (`btp`, `cf` commands)

## Environment Configuration

**Required env vars (for development following these guides):**
- `SAP_AI_CORE_CLIENT_ID` - SAP AI Core service key client ID
- `SAP_AI_CORE_CLIENT_SECRET` - SAP AI Core service key secret
- `SAP_AI_CORE_AUTH_URL` - OAuth token endpoint
- `SAP_AI_CORE_BASE_URL` - SAP AI Core API base URL
- `SAP_AI_CORE_RESOURCE_GROUP` - Resource group (typically "default")
- `ANTHROPIC_BASE_URL` - LiteLLM proxy URL (http://localhost:4000)
- `ANTHROPIC_API_KEY` - LiteLLM master key

**Secrets location:**
- `.env` file present (NOT committed - listed in `.gitignore` pattern)
- BTP service keys (obtained from BTP cockpit)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Git Integration Patterns

**Version Control:**
- Git with worktree support (for multi-agent development patterns)
- GitHub CLI (`gh`) integration
  - Issue management
  - Pull request creation and merging
  - API access for automation

**Multi-Agent Worktree Pattern:**
- One worktree per agent (referenced in `../prototype/AGENTS.md`)
- Branch naming: `feature/<agent-role>`
- Isolation: Each agent works in separate working directory
- Coordination: Shared task lists and direct messaging between agents

## Enterprise Integration Points

**SAP Services (Referenced in Architecture):**
- SAP Business Technology Platform - Application runtime and services
- SAP Business Data Cloud - Data products and semantic layer
- SAP AI Core - Foundation model inference
- SAP Datasphere - Analytics and data transformation
- SAP Integration Suite - Integration flows (referenced as use case)

**SAP Development Tools:**
- SAP Business Application Studio - IDE with BTP connectivity
- SAP CAP - Application framework
- SAP Fiori / SAPUI5 - UI framework

**Integration Architecture:**
- Design-time: Claude Code reads BDC metadata (read-only)
- Runtime: Deployed apps read/write to BDC via BTP Destinations (bidirectional)

---

*Integration audit: 2026-03-09*
