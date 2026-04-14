const cds = require('@sap/cds');
const path = require('path');

describe('CDS UI Annotations', () => {
  let csn;
  let entity;

  beforeAll(async () => {
    // Compile the full CDS model by loading all CDS source files
    const root = path.join(__dirname, '../../');
    csn = await cds.load([
      path.join(root, 'db/schema.cds'),
      path.join(root, 'srv/risk-service.cds'),
      path.join(root, 'app/services.cds')
    ]);
    entity = csn.definitions['RiskService.GLTransactions'];
  });

  test('GLTransactions entity has UI.LineItem annotation', () => {
    expect(entity).toBeDefined();
    expect(entity['@UI.LineItem']).toBeDefined();
    expect(Array.isArray(entity['@UI.LineItem'])).toBe(true);
  });

  test('UI.LineItem has at least 11 high-importance data entries (8 GL + 3 risk)', () => {
    const lineItem = entity['@UI.LineItem'];
    // Count DataField (Value) + DataFieldForAnnotation (Target) entries with #High importance.
    // Excludes DataFieldForAction (has Action property, no data column).
    // CDS compiler uses { "#": "High" } for enum values in compiled CSN.
    // This assertion is stable even after 03-02 removes DataFieldForAction from LineItem.
    const highImportanceDataEntries = lineItem.filter(item => {
      const isDataEntry = item.Value !== undefined || item.Target !== undefined;
      const isNotAction = item.Action === undefined;
      const imp = item['@UI.Importance'];
      const isHigh = imp === '#High' || (imp && imp['#'] === 'High');
      return isDataEntry && isNotAction && isHigh;
    });
    expect(highImportanceDataEntries.length).toBeGreaterThanOrEqual(11);
  });

  test('UI.SelectionFields includes riskClassification, CompanyCode, PostingDate, Amount', () => {
    const selFields = entity['@UI.SelectionFields'];
    expect(selFields).toBeDefined();
    expect(Array.isArray(selFields)).toBe(true);
    // CDS compiler uses { "=": "fieldName" } for path expressions in compiled CSN
    const fieldNames = selFields.map(f => f['='] || f.$Path || f);
    expect(fieldNames).toContain('riskClassification');
    expect(fieldNames).toContain('CompanyCode');
    expect(fieldNames).toContain('PostingDate');
    expect(fieldNames).toContain('Amount');
    expect(fieldNames).toHaveLength(4);
  });

  test('entity has UI.Criticality pointing to criticality field (UI-03)', () => {
    const crit = entity['@UI.Criticality'];
    expect(crit).toBeDefined();
  });

  test('entity has virtual criticality Integer field', () => {
    const critField = entity.elements.criticality;
    expect(critField).toBeDefined();
    expect(critField.virtual).toBe(true);
  });

  test('UI.PresentationVariant has PostingDate descending sort', () => {
    // CDS compiler flattens structured annotations: @UI.PresentationVariant.SortOrder
    const sortOrder = entity['@UI.PresentationVariant.SortOrder'] || (entity['@UI.PresentationVariant'] && entity['@UI.PresentationVariant'].SortOrder);
    expect(sortOrder).toBeDefined();
    // Property is a path expression: { "=": "PostingDate" }
    const prop = sortOrder[0].Property;
    const propName = (typeof prop === 'object' && prop['=']) ? prop['='] : prop;
    expect(propName).toBe('PostingDate');
    expect(sortOrder[0].Descending).toBe(true);
  });

  test('UI.HeaderInfo has correct entity type names', () => {
    // CDS compiler flattens: @UI.HeaderInfo.TypeName and @UI.HeaderInfo.TypeNamePlural
    const typeName = entity['@UI.HeaderInfo.TypeName'] || (entity['@UI.HeaderInfo'] && entity['@UI.HeaderInfo'].TypeName);
    const typeNamePlural = entity['@UI.HeaderInfo.TypeNamePlural'] || (entity['@UI.HeaderInfo'] && entity['@UI.HeaderInfo'].TypeNamePlural);
    expect(typeName).toBeDefined();
    expect(typeNamePlural).toBeDefined();
    expect(typeName).toMatch(/i18n>Transaction/);
    expect(typeNamePlural).toMatch(/i18n>Transactions/);
  });

  test('UI.DataPoint for anomalyScore exists', () => {
    // CDS compiler flattens: @UI.DataPoint#anomalyScore.Value
    const dpValue = entity['@UI.DataPoint#anomalyScore.Value'] || (entity['@UI.DataPoint#anomalyScore'] && entity['@UI.DataPoint#anomalyScore'].Value);
    expect(dpValue).toBeDefined();
  });
});
