// Integration tests for analyzeRisks action via @cap-js/cds-test
// Uses mock predictor (AI_CORE_MOCK=true) for deterministic results
process.env.AI_CORE_MOCK = 'true';

const cds = require('@sap/cds');
const { RISK_LABELS } = require('../../srv/lib/risk-labels');

// Build set of all valid display labels (from risk-labels.js + special cases)
const VALID_DISPLAY_LABELS = new Set([
  ...Object.values(RISK_LABELS).map(l => l.display),
  'Incomplete Data',
  'Unknown Risk'
]);

// Bootstrap CAP in-memory test server (loads CDS model, CSV mock data, service handlers)
const { GET, POST } = cds.test('serve', '--in-memory');

// CAP mocked auth: pass user + roles via basic auth or { auth: { username, password } }
// RiskAnalyst role required for analyzeRisks action
const riskAnalyst = { auth: { username: 'test-analyst', password: 'pass' } };
const basicUser = { auth: { username: 'test-user', password: 'pass' } };

describe('RiskService - analyzeRisks integration', () => {

  test('POST /odata/v4/risk/analyzeRisks returns 200 with enriched transactions', async () => {
    const { status, data } = await POST('/odata/v4/risk/analyzeRisks', {}, riskAnalyst);

    expect(status).toBe(200);
    expect(data.value).toBeDefined();
    expect(Array.isArray(data.value)).toBe(true);
    expect(data.value.length).toBeGreaterThan(0);

    // Every transaction should have riskClassification and riskExplanation populated
    for (const tx of data.value) {
      expect(tx.riskClassification).toBeTruthy();
      expect(typeof tx.riskClassification).toBe('string');
      expect(tx.riskExplanation).toBeTruthy();
      expect(typeof tx.riskExplanation).toBe('string');
    }
  });

  test('all riskClassification values are valid display labels', async () => {
    const { data } = await POST('/odata/v4/risk/analyzeRisks', {}, riskAnalyst);

    for (const tx of data.value) {
      expect(VALID_DISPLAY_LABELS.has(tx.riskClassification)).toBe(true);
    }
  });

  test('Normal transactions have criticality 3 and correct explanation', async () => {
    const { data } = await POST('/odata/v4/risk/analyzeRisks', {}, riskAnalyst);

    // Most mock data rows have anomaly_score < 0.4, so should be classified Normal
    const normalTx = data.value.find(tx => tx.riskClassification === 'Normal');
    expect(normalTx).toBeDefined();
    expect(normalTx.riskExplanation).toBe('No anomalies detected in this transaction.');
    expect(normalTx.criticality).toBe(3);
  });

  test('all criticality values are valid integers in {0, 1, 2, 3}', async () => {
    const { data } = await POST('/odata/v4/risk/analyzeRisks', {}, riskAnalyst);

    expect(data.value.length).toBeGreaterThan(0);

    for (const tx of data.value) {
      expect(typeof tx.criticality).toBe('number');
      expect(Number.isInteger(tx.criticality)).toBe(true);
      expect([0, 1, 2, 3]).toContain(tx.criticality);
    }
  });

  test('GET /odata/v4/risk/GLTransactions returns mock data (sanity check)', async () => {
    const { status, data } = await GET('/odata/v4/risk/GLTransactions', basicUser);

    expect(status).toBe(200);
    expect(data.value).toBeDefined();
    expect(Array.isArray(data.value)).toBe(true);
    expect(data.value.length).toBeGreaterThan(0);
  });

});
