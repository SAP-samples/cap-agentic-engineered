sap.ui.define([
    "sap/m/MessageBox"
], function (MessageBox) {
    "use strict";

    return {
        /**
         * Custom action handler for "Analyze" toolbar button.
         * Calls unbound analyzeRisks action, then refreshes the list via ExtensionAPI.
         * Virtual fields are served from a server-side cache on every GET,
         * so refresh() correctly shows the enriched data.
         *
         * MCP-grounded: Fiori MCP says "Don't access or manipulate controls,
         * properties, models, or other internal objects created by the SAP Fiori
         * elements framework." We use only ExtensionAPI (refresh, getModel).
         */
        onAnalyze: function (oBindingContext, aSelectedContexts) {
            var oExtensionAPI = this;
            var oModel = oExtensionAPI.getModel();

            var oActionBinding = oModel.bindContext("/analyzeRisks(...)");

            oActionBinding.execute().then(function () {
                // Force a hard refresh of the OData V4 list binding.
                // ExtensionAPI.refresh() alone does not always re-fetch from server
                // when autoExpandSelect is enabled — the model may serve cached data.
                // getModel().refresh() invalidates all bindings and forces a re-read.
                oModel.refresh();
                MessageBox.success("Risk analysis completed successfully.");
            }).catch(function (oError) {
                var sMessage;
                try {
                    var oErrorData = JSON.parse(oError.message);
                    sMessage = oErrorData.message || oError.message;
                } catch (e) {
                    sMessage = oError.message || oExtensionAPI.getModel("i18n").getResourceBundle().getText("analyzeError");
                }
                MessageBox.error(sMessage);
            });
        }
    };
});
