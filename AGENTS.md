# Conversational Style

- Keep answers short and concise
-  No emojis in commits, PR comments, or code
- Technical prose only  
- No fluff or filler text
## Code Quality

- No `any` types unless absolutely necessary
- Check node_modules for external API type definitions instead of guessing
- **NEVER use inline imports** - no `await import("./foo.js")`, no `import("pkg").Type` in type positions, no dynamic imports for types. Always use standard top-level imports.
- NEVER remove or downgrade code to fix type errors from outdated dependencies; upgrade the dependency instead
- Always ask before removing functionality or code that appears to be intentional
- Do not preserve backward compatibility unless the user explicitly asks for it
- Never hardcode key checks with, eg. `matchesKey(keyData, "ctrl+x")`. All keybindings must be configurable. Add default to matching object (`DEFAULT_EDITOR_KEYBINDINGS` or `DEFAULT_APP_KEYBINDINGS`)
## Commands

- After code changes (not documentation changes): `npm run check` (get full output, no tail). Fix all errors, warnings, and infos before committing.
- Note: `npm run check` does not run tests.
- NEVER run: `npm run dev`, `npm run build`, `npm test`
- Only run specific tests if user instructs: `npx tsx ../../node_modules/vitest/dist/cli.js --run test/specific.test.ts`
- Run tests from the package root, not the repo root.
- If you create or modify a test file, you MUST run that test file and iterate until it passes.
- When writing tests, run them, identify issues in either the test or implementation, and iterate until fixed.
- For `packages/coding-agent/test/suite/`, use `test/suite/harness.ts` plus the faux provider. Do not use real provider APIs, real API keys, or paid tokens.
- Put issue-specific regressions under `packages/coding-agent/test/suite/regressions/` and name them `<issue-number>-<short-slug>.test.ts`.
- NEVER commit unless user asks

# Development Rules

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
