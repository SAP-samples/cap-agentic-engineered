# AGENTS.md — MCP-Grounded SAP Development Guide

This file configures AI coding agents (Claude Code, Copilot, Cursor, etc.) to query SAP MCP servers before writing SAP-specific code. It works in conjunction with the skills in [`skills/`](skills/) that automatically trigger MCP queries when the agent touches specific file types. Together, the AGENTS.md provides the rules and the skills enforce them at the file level.

It is a reusable pattern for any CAP + Fiori Elements project.

## MANDATORY: Query SAP MCP Servers Before Writing SAP Code

**Before writing, modifying, debugging, or fixing any SAP-specific code, you MUST query the relevant MCP server first.** Do not rely on general knowledge alone — always ground your work in MCP server guidance.

| When you are working on... | Query this MCP server FIRST |
|---|---|
| CDS entities, types, aspects, or services | **CAP** (`@cap-js/mcp-server`) |
| CAP service handlers, actions, functions, or events | **CAP** (`@cap-js/mcp-server`) |
| CDS annotations (`@UI`, `@Common`, `@Capabilities`) | **Fiori** (`@sap-ux/fiori-mcp-server`) |
| Fiori Elements floorplans, manifest.json, or page config | **Fiori** (`@sap-ux/fiori-mcp-server`) |
| SAPUI5 controllers, XML views, or control APIs | **UI5** (`@ui5/mcp-server`) |
| UI5 model bindings, formatters, or event handlers | **UI5** (`@ui5/mcp-server`) |

**Rules:**
- **Developing new features:** Query the MCP server for the correct pattern before writing code.
- **Debugging issues:** Query the MCP server to verify correct API usage, annotation syntax, or handler signatures before proposing a fix.
- **Fixing errors:** Query the MCP server to confirm the fix follows current best practices — do not guess.
- **If multiple layers are involved** (e.g., CDS annotation + controller extension), query both the Fiori and UI5 MCP servers.
- **Trust MCP server responses over general training knowledge.** If they conflict, follow the MCP server.

## SAP Build MCP Server Configuration

Add to your Claude Code project settings (`.claude/settings.json`):

```json
{
  "mcpServers": {
    "cap": {
      "command": "npx",
      "args": ["-y", "@cap-js/mcp-server@latest"]
    },
    "fiori": {
      "command": "npx",
      "args": ["-y", "@sap-ux/fiori-mcp-server@latest"]
    },
    "ui5": {
      "command": "npx",
      "args": ["-y", "@ui5/mcp-server@latest"]
    }
  }
}
```

### MCP Server Repositories

| MCP Server | Package | Repository | Description |
|------------|---------|------------|-------------|
| **CAP** | `@cap-js/mcp-server` | https://github.com/cap-js/mcp-server | CDS entities, services, handlers, OData annotations |
| **Fiori** | `@sap-ux/fiori-mcp-server` | https://github.com/SAP/open-ux-tools | Fiori Elements annotations, floorplans, manifest.json |
| **UI5** | `@ui5/mcp-server` | https://github.com/UI5/linter | SAPUI5 controls, XML views, bindings, event handlers |

All MCP servers are open-source under Apache-2.0 license.

### MCP Server Usage Guide

| Task | Query This MCP Server |
|---|---|
| Define a CDS entity or service | `@cap-js/mcp-server` |
| Write a CAP service handler | `@cap-js/mcp-server` |
| Create Fiori Elements annotations | `@sap-ux/fiori-mcp-server` |
| Configure a Fiori Elements floorplan | `@sap-ux/fiori-mcp-server` |
| Create a SAPUI5 XML view | `@ui5/mcp-server` |
| Use a SAPUI5 control or binding pattern | `@ui5/mcp-server` |

Always query the relevant MCP server before generating SAP-specific code. Trust MCP guidance over generic knowledge.

## Skills: Automatic MCP Triggers

The `skills/` directory contains skills that automatically activate when the agent edits matching file patterns. Each skill instructs the agent to query the correct MCP server before making changes:

| Skill | Triggers on | MCP Server |
|-------|------------|------------|
| [`sap-cap`](skills/sap-cap/SKILL.md) | `db/**/*.cds`, `srv/**/*.cds`, `srv/**/*.js` | `@cap-js/mcp-server` |
| [`sap-fiori`](skills/sap-fiori/SKILL.md) | `app/**/*.cds`, `app/**/manifest.json` | `@sap-ux/fiori-mcp-server` |
| [`sap-ui5`](skills/sap-ui5/SKILL.md) | `app/**/*.xml`, `app/**/ext/**/*.js` | `@ui5/mcp-server` |

The AGENTS.md defines the routing table and rules. The skills enforce them — when the agent touches a CDS file in `srv/`, the `sap-cap` skill fires and reminds it to query the CAP MCP server first.

## Fiori Elements: Unbound Actions in List Report

**Do NOT use `UI.DataFieldForAction` in CDS annotations for unbound OData actions in List Report toolbars.** The Fiori Elements internal handler can silently fail — the button renders but clicks do nothing (no network request, no error).

**Instead, use a custom action in manifest.json:**
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
- Handler signature: `function(oBindingContext, aSelectedContexts)` where `this` is the extension API
- Set `requiresSelection: false` for actions that operate on the whole table

**Debugging silent button failures:** Test backend (`curl`) → test OData model (browser console `oModel.bindContext("/action(...)").execute()`) → check network tab → wrap FE handler. This binary elimination isolates the broken layer in minutes.

## OData V4: Use ODataModel.refresh() After Unbound Actions

When `autoExpandSelect: true` is set in manifest.json model settings, `ExtensionAPI.refresh()` does not always force the OData V4 model to re-fetch data from the server. Virtual fields may remain null in the UI even after the server cache is populated.

**Use `oModel.refresh()` instead:**
```javascript
oActionBinding.execute().then(function () {
    oModel.refresh();  // Forces all bindings to re-read from server
    MessageBox.success("...");
});
```

This was confirmed via the `sap.ui.model.odata.v4.ODataModel#refresh` API reference from the UI5 MCP server.

## Code Standards

- XML views only — no JavaScript views
- `sap.ui.define` for all modules — no globals
- Async loading: `data-sap-ui-async="true"`
- i18n for all user-facing text
- No deprecated APIs (`jQuery.sap.*`, sync loading, `sap.ui.getCore()`)
- No `console.log` in production code (use CAP's `cds.log`)
- No hardcoded URLs, secrets, or credentials
- CDS: PascalCase entities, camelCase fields, OData V4
- Fiori: annotation-driven where possible, `sap.f`/`sap.uxap`/`sap.m` libraries
