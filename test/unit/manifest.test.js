const fs = require('fs');
const path = require('path');

describe('manifest.json configuration', () => {
  let manifest;

  beforeAll(() => {
    const manifestPath = path.join(__dirname, '../../app/risks/webapp/manifest.json');
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  });

  test('uses OData V4 data source pointing to /odata/v4/risk/', () => {
    const ds = manifest['sap.app'].dataSources.mainService;
    expect(ds.uri).toBe('/odata/v4/risk/');
    expect(ds.settings.odataVersion).toBe('4.0');
  });

  test('uses sap.fe.templates.ListReport for routing', () => {
    const targets = manifest['sap.ui5'].routing.targets;
    const listTarget = Object.values(targets)[0];
    expect(listTarget.name).toBe('sap.fe.templates.ListReport');
  });

  test('has export enabled (UI-04)', () => {
    const targets = manifest['sap.ui5'].routing.targets;
    const listTarget = Object.values(targets)[0];
    const lineItemConfig = listTarget.options.settings.controlConfiguration['@com.sap.vocabularies.UI.v1.LineItem'];
    expect(lineItemConfig.tableSettings.enableExport).toBe(true);
  });

  test('has growing threshold of 50', () => {
    const targets = manifest['sap.ui5'].routing.targets;
    const listTarget = Object.values(targets)[0];
    const lineItemConfig = listTarget.options.settings.controlConfiguration['@com.sap.vocabularies.UI.v1.LineItem'];
    expect(lineItemConfig.tableSettings.growingThreshold).toBe(50);
  });

  test('has table personalization enabled', () => {
    const targets = manifest['sap.ui5'].routing.targets;
    const listTarget = Object.values(targets)[0];
    const lineItemConfig = listTarget.options.settings.controlConfiguration['@com.sap.vocabularies.UI.v1.LineItem'];
    expect(lineItemConfig.tableSettings.personalization.column).toBe(true);
  });

  test('has i18n model configured', () => {
    const models = manifest['sap.ui5'].models;
    expect(models.i18n).toBeDefined();
    expect(models.i18n.type).toBe('sap.ui.model.resource.ResourceModel');
  });

  test('minimum UI5 version is 1.120.0', () => {
    const minVersion = manifest['sap.ui5'].dependencies.minUI5Version;
    expect(minVersion).toBe('1.120.0');
  });

  test('has page-level variant management enabled', () => {
    const targets = manifest['sap.ui5'].routing.targets;
    const listTarget = Object.values(targets)[0];
    expect(listTarget.options.settings.variantManagement).toBe('Page');
  });

  test('has export filename set to GL_Transactions', () => {
    const targets = manifest['sap.ui5'].routing.targets;
    const listTarget = Object.values(targets)[0];
    const lineItemConfig = listTarget.options.settings.controlConfiguration['@com.sap.vocabularies.UI.v1.LineItem'];
    expect(lineItemConfig.tableSettings.exportSettings.fileName).toBe('GL_Transactions');
  });
});
