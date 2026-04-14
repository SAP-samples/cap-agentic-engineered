# Stack Research

**Domain:** CAP + Fiori Elements + AI Core Financial Risk Analyzer
**Researched:** 2026-03-09
**Confidence:** HIGH (versions verified via npm registry)

## Recommended Stack

### Backend — SAP CAP (Node.js)

| Package | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| `@sap/cds` | ^8 (latest) | Core CAP runtime. Requires Node >=20. | HIGH — verified via `npm view` |
| `@sap/cds-dk` | ^8 (latest) | CAP dev toolkit (`cds init`, `cds watch`, `cds build`) | HIGH |
| `@cap-js/sqlite` | latest | Local dev database. Requires `@sap/cds >=9.8`. | HIGH |
| `express` | ^4 | CAP's default HTTP server | HIGH |

### Frontend — Fiori Elements

| Package | Version | Rationale | Confidence |
|---------|---------|-----------|------------|
| `@sap/ux-specification` | latest | Fiori Elements floorplan specs | HIGH |
| SAPUI5 CDN | 1.120+ | List report floorplan, OData V4 model | HIGH |

### AI Core Integration

| Approach | Rationale | Confidence |
|----------|-----------|------------|
| Direct HTTP POST (`fetch`) | XGBoost is a custom Docker container, NOT a foundation model. `@sap-ai-sdk/foundation-models` is wrong for this. Use raw `fetch` with OAuth2 client credentials. | HIGH |
| OAuth2 client credentials | Standard BTP/XSUAA pattern for AI Core token exchange | HIGH |

### What NOT to Use

| Package | Why Not |
|---------|---------|
| `@sap-ai-sdk/foundation-models` | For GenAI foundation models only. XGBoost custom container uses direct HTTP. |
| `@sap-ai-sdk/langchain` | No LangChain needed — this is not a chat/agent app |
| `@sap-ai-sdk/orchestration` | No orchestration service needed |
| Custom UI5 controllers | Fiori Elements is annotation-driven. Custom controllers add maintenance burden. |
| D3.js / Highcharts | Breaks Fiori Elements paradigm. Use built-in `@UI.Chart` annotations. |

### Dev Tooling

| Tool | Purpose |
|------|---------|
| `cds watch` | Hot-reload dev server with mock data |
| `cds add fiori` | Scaffold Fiori Elements app |
| MCP: `@cap-js/mcp-server` | CAP CDS guidance |
| MCP: `@sap-ux/fiori-mcp-server` | Fiori Elements annotations |
| MCP: `@ui5/mcp-server` | UI5 control patterns |

## Key References

- CAP Fiori Elements: https://cap.cloud.sap/docs/guides/uis/fiori
- CAP Guides: https://cap.cloud.sap/docs/guides/
- CAP Remote Services: https://cap.cloud.sap/docs/guides/services/consuming-services
- SAP AI SDK JS: https://github.com/SAP/ai-sdk-js

---
*Stack research for: Financial Risk Analyzer (CAP + Fiori Elements + AI Core)*
*Researched: 2026-03-09*
