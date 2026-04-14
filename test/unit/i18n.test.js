const fs = require('fs');
const path = require('path');

describe('i18n.properties completeness', () => {
  let content;

  beforeAll(() => {
    const i18nPath = path.join(__dirname, '../../app/risks/webapp/i18n/i18n.properties');
    content = fs.readFileSync(i18nPath, 'utf-8');
  });

  // App metadata
  test('has app title and description', () => {
    expect(content).toMatch(/^appTitle=/m);
    expect(content).toMatch(/^appDescription=/m);
  });

  // Column headers (8 GL columns + 3 risk columns)
  test.each([
    'CompanyCode', 'FiscalYear', 'DocumentNumber', 'LineItem',
    'GLAccount', 'CostCenter', 'PostingDate', 'Amount',
    'RiskClassification', 'RiskExplanation', 'AnomalyScore'
  ])('has column header key: %s', (key) => {
    expect(content).toMatch(new RegExp(`^${key}=`, 'm'));
  });

  // Entity names
  test('has entity type names', () => {
    expect(content).toMatch(/^Transaction=/m);
    expect(content).toMatch(/^Transactions=/m);
  });

  // Action button
  test('has Analyze button label', () => {
    expect(content).toMatch(/^Analyze=/m);
  });

  // 11 risk display labels
  test.each([
    'riskNormal', 'riskUnusualAmount', 'riskHighAmountNewPattern',
    'riskHighAmountRarePattern', 'riskNewPattern', 'riskNewPatternWeekend',
    'riskNewPatternAfterHours', 'riskRarePattern', 'riskWeekendEntry',
    'riskBackdatedEntry', 'riskMultipleFactors'
  ])('has risk label key: %s', (key) => {
    expect(content).toMatch(new RegExp(`^${key}=`, 'm'));
  });

  // Error messages
  test('has error message keys', () => {
    expect(content).toMatch(/^analyzeError=/m);
  });
});
