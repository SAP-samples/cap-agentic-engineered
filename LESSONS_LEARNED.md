# Lessons Learned

## Fiori Elements Controller Extension Naming Mismatch

### What Happened

The Fiori app failed to load with the error:
```
Uncaught ModuleError: failed to load 'risk/analysis/ext/controller/ListReportExt.js'
```

When clicking "Analyze Risks" in the UI, no fields were populated because the button handler never executed due to this module loading error.

### Why It Happened

**Mismatch between manifest.json reference and actual filename:**

- **manifest.json** referenced: `risk.analysis.ext.controller.ListReportExt.onAnalyze`
- **Actual file**: `ListReportExt.controller.js` (with `.controller.` in the name)

In SAP Fiori Elements, when you reference a controller extension in the manifest as:
```json
"press": "risk.analysis.ext.controller.ListReportExt.onAnalyze"
```

The framework expects to find a file at:
```
webapp/ext/controller/ListReportExt.js
```

NOT:
```
webapp/ext/controller/ListReportExt.controller.js
```

The `.controller.js` suffix is a convention for standard SAPUI5 controllers, but for controller extensions referenced directly in Fiori Elements manifests, the file must match the exact module path without the `.controller` infix.

### How to Fix It

**Option 1: Rename the file (simplest)**
```bash
mv webapp/ext/controller/ListReportExt.controller.js \
   webapp/ext/controller/ListReportExt.js
```

**Option 2: Create the correctly-named file**
```bash
cp webapp/ext/controller/ListReportExt.controller.js \
   webapp/ext/controller/ListReportExt.js
```

**Option 3: Update manifest.json (not recommended)**

You could theoretically update the manifest to reference `ListReportExt.controller`, but this breaks conventions and may cause issues with UI5 tooling.

### Prevention

When creating Fiori Elements controller extensions:

1. **For action handlers referenced in manifest.json**: Use plain `.js` extension
   - File: `ListReportExt.js`
   - Reference: `"press": "namespace.ext.controller.ListReportExt.onMethod"`

2. **For standard SAPUI5 controllers**: Use `.controller.js` extension
   - File: `Main.controller.js`
   - Defined as: `sap.ui.controller("namespace.Main", {...})`

3. **Always verify the module path matches** the manifest reference exactly:
   - Namespace in manifest → folder structure in webapp
   - Last segment before method → exact filename (without `.js`)

### Related Files

- [manifest.json:94](app/risks/webapp/manifest.json#L94) - Action handler reference
- [ListReportExt.js](app/risks/webapp/ext/controller/ListReportExt.js) - Correct filename
- [ListReportExt.controller.js](app/risks/webapp/ext/controller/ListReportExt.controller.js) - Incorrect filename (legacy)
