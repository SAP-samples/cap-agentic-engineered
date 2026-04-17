# Development Rules

## Conversational Style

- Keep answers short and concise
- No emojis in commits, PR comments, or code
- Technical prose only
- No fluff or filler text

## MCP Servers: Query Before Writing SAP Code

Before writing, modifying, or fixing any SAP-specific code, query the relevant MCP server. Do not rely on training knowledge alone. If MCP guidance conflicts with general knowledge, follow MCP.

| Working on...                                       | Query this MCP server      |
| --------------------------------------------------- | -------------------------- |
| CDS entities, types, aspects, services              | `@cap-js/mcp-server`       |
| CAP handlers, actions, functions, events            | `@cap-js/mcp-server`       |
| CDS annotations (`@UI`, `@Common`, `@Capabilities`) | `@sap-ux/fiori-mcp-server` |
| Fiori Elements floorplans, manifest.json            | `@sap-ux/fiori-mcp-server` |
| SAPUI5 controllers, XML views, control APIs         | `@ui5/mcp-server`          |
| UI5 bindings, formatters, event handlers            | `@ui5/mcp-server`          |

If multiple layers are involved (e.g., CDS annotation + controller), query both servers.

### MCP Server Config

Add to `.claude/settings.json` — pin to exact versions, do not use `@latest`:

```json
{
  "mcpServers": {
    "cap":   { "command": "npx", "args": ["-y", "@cap-js/mcp-server@<pin>"] },
    "fiori": { "command": "npx", "args": ["-y", "@sap-ux/fiori-mcp-server@<pin>"] },
    "ui5":   { "command": "npx", "args": ["-y", "@ui5/mcp-server@<pin>"] }
  }
}
```

### Skills: Auto-Triggers

Skills in `skills/` fire automatically when you edit matching file patterns:

| Skill      | Triggers on                                    | MCP server                 |
| ---------- | ---------------------------------------------- | -------------------------- |
| `sap-cap`  | `db/**/*.cds`, `srv/**/*.cds`, `srv/**/*.js`   | `@cap-js/mcp-server`       |
| `sap-fiori`| `app/**/*.cds`, `app/**/manifest.json`         | `@sap-ux/fiori-mcp-server` |
| `sap-ui5`  | `app/**/*.xml`, `app/**/ext/**/*.js`           | `@ui5/mcp-server`          |

## Supply Chain & Dependency Safety

- Never run fresh dependency resolution in CI when a lockfile exists
- Never run install/lifecycle scripts by default — use `--ignore-scripts` unless explicitly approved
- Never use `curl | bash`, `npx`, `pnpm dlx`, `uvx`, `pipx`, `cargo install`, `go install`, or any remote install one-liner without an exact pinned version and explicit approval
- Never install from Git URLs, branches, mutable tags, or remote tarballs unless explicitly approved
- Never add, upgrade, or suggest a package version released less than 7 days ago
- Prefer exact pins and committed lockfiles
- Node: prefer pnpm with a 7-day release-age gate and frozen lockfiles; if the repo uses npm, use `npm ci`
- Python: prefer uv with `exclude-newer = "7 days"` and frozen lockfiles; if the repo uses pip, install only from a fully pinned, hashed requirements/lock file
- If lifecycle scripts are required, stop and explain which package needs them and why
- If no compliant version exists, stop and explain why — do not silently take the newest release
- Treat changes to manifests, lockfiles, GitHub Actions workflows, Dockerfiles, build scripts, and installer scripts as security-sensitive
- Prefer GitHub Actions pinned to full commit SHAs; prefer Docker base images pinned to immutable digests
- Prefer registries, artifacts, and packages with provenance/signatures; verify when the workflow supports it
- Do not bypass these rules unless explicitly approved

## Known Pitfalls

**Unbound actions in List Report toolbars** — do not use `UI.DataFieldForAction` in CDS annotations. The Fiori Elements handler silently fails: button renders but clicks do nothing. Use a custom action in `manifest.json` instead:

```json
"controlConfiguration": {
  "@com.sap.vocabularies.UI.v1.LineItem": {
    "actions": {
      "myAction": {
        "press": "my.app.ext.controller.ListReportExt.handlerName",
        "text": "{{i18nKey}}",
        "requiresSelection": false,
        "enabled": true
      }
    }
  }
}
```

Handler signature: `function(oBindingContext, aSelectedContexts)` where `this` is the extension API.

**OData V4 refresh after unbound actions** — when `autoExpandSelect: true` is set, `ExtensionAPI.refresh()` does not reliably re-fetch from server. Use `oModel.refresh()` instead:

```javascript
oActionBinding.execute().then(function () {
    oModel.refresh();
    MessageBox.success("...");
});
```

## Code Standards

- XML views only — no JavaScript views
- `sap.ui.define` for all modules — no globals
- Async loading: `data-sap-ui-async="true"`
- i18n for all user-facing text
- No deprecated APIs (`jQuery.sap.*`, sync loading, `sap.ui.getCore()`)
- No `console.log` in production code — use `cds.log`
- No hardcoded URLs, secrets, or credentials
- CDS: PascalCase entities, camelCase fields, OData V4
- Fiori: annotation-driven where possible; use `sap.f`, `sap.uxap`, `sap.m`
