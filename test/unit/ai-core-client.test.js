const nock = require('nock');

// Set up env vars BEFORE requiring the module
const TEST_BASE_URL = 'https://api.ai.test.aws.ml.hana.ondemand.com/v2';
const TEST_ORIGIN = 'https://api.ai.test.aws.ml.hana.ondemand.com';
const TEST_AUTH_BASE = 'https://test.authentication.sap.hana.ondemand.com';
const TEST_DEPLOYMENT_ID = 'dtest123';
const TEST_RESOURCE_GROUP = 'default';
const PREDICT_PATH = `/v2/inference/deployments/${TEST_DEPLOYMENT_ID}/v1/predict`;

beforeEach(() => {
  process.env.AI_CORE_MOCK = 'false';
  process.env.AI_CORE_BASE_URL = TEST_BASE_URL;
  process.env.AI_CORE_DEPLOYMENT_ID = TEST_DEPLOYMENT_ID;
  process.env.AI_CORE_RESOURCE_GROUP = TEST_RESOURCE_GROUP;
  process.env.SAP_AI_CORE_CLIENT_ID = 'test-client-id';
  process.env.SAP_AI_CORE_CLIENT_SECRET = 'test-client-secret';
  process.env.SAP_AI_CORE_AUTH_URL = `${TEST_AUTH_BASE}/oauth/token`;
  nock.cleanAll();
});

afterEach(() => {
  nock.cleanAll();
});

/**
 * Helper: mock the OAuth2 token endpoint to return a valid token.
 * Must be called before any predictAnomalies call in ai-core-client tests.
 */
function mockAuthToken() {
  nock(TEST_AUTH_BASE)
    .post('/oauth/token', 'grant_type=client_credentials')
    .reply(200, { access_token: 'test-jwt-token', expires_in: 3600 });
}

describe('ai-core-client', () => {
  // Fresh require for each test to pick up env var changes
  function getClient() {
    // Clear module cache to allow env var changes to take effect
    delete require.cache[require.resolve('../../srv/lib/ai-core-client')];
    const client = require('../../srv/lib/ai-core-client');
    // Reset cached token so each test gets fresh auth
    client._resetTokenCache();
    return client;
  }

  test('predictAnomalies sends POST /v1/predict and returns predictions array', async () => {
    const featureRows = [[0.5, 1.2, 0.3, 0.4, 100, 10, 200, 8, 50, 0, 0, 0, 2500, 2500, 7.8, 1.1, 0, 1, 3, 10, 2, 19758, 0, 0]];
    const expectedPredictions = ['Normal'];

    mockAuthToken();
    nock(TEST_ORIGIN)
      .post(PREDICT_PATH, { data: featureRows })
      .reply(200, { predictions: expectedPredictions });

    const { predictAnomalies } = getClient();
    const result = await predictAnomalies(featureRows);

    expect(result).toEqual(expectedPredictions);
  });

  test('predictAnomalies with timeout throws error with code TIMEOUT', async () => {
    const featureRows = [[0.5, 1.2, 0.3, 0.4, 100, 10, 200, 8, 50, 0, 0, 0, 2500, 2500, 7.8, 1.1, 0, 1, 3, 10, 2, 19758, 0, 0]];

    mockAuthToken();
    nock(TEST_ORIGIN)
      .post(PREDICT_PATH)
      .delayConnection(6000)
      .reply(200, { predictions: ['Normal'] });

    const { predictAnomalies } = getClient();
    await expect(predictAnomalies(featureRows)).rejects.toMatchObject({ code: 'TIMEOUT' });
  }, 10000);

  test('predictAnomalies with 401 response throws error with code AUTH_ERROR', async () => {
    const featureRows = [[0.5, 1.2, 0.3, 0.4, 100, 10, 200, 8, 50, 0, 0, 0, 2500, 2500, 7.8, 1.1, 0, 1, 3, 10, 2, 19758, 0, 0]];

    mockAuthToken();
    nock(TEST_ORIGIN)
      .post(PREDICT_PATH)
      .reply(401, { error: 'Unauthorized' });

    const { predictAnomalies } = getClient();
    await expect(predictAnomalies(featureRows)).rejects.toMatchObject({ code: 'AUTH_ERROR' });
  });

  test('predictAnomalies with 403 response throws error with code AUTH_ERROR', async () => {
    const featureRows = [[0.5, 1.2, 0.3, 0.4, 100, 10, 200, 8, 50, 0, 0, 0, 2500, 2500, 7.8, 1.1, 0, 1, 3, 10, 2, 19758, 0, 0]];

    mockAuthToken();
    nock(TEST_ORIGIN)
      .post(PREDICT_PATH)
      .reply(403, { error: 'Forbidden' });

    const { predictAnomalies } = getClient();
    await expect(predictAnomalies(featureRows)).rejects.toMatchObject({ code: 'AUTH_ERROR' });
  });

  test('predictAnomalies with 503 response throws error with code SERVICE_UNAVAILABLE', async () => {
    const featureRows = [[0.5, 1.2, 0.3, 0.4, 100, 10, 200, 8, 50, 0, 0, 0, 2500, 2500, 7.8, 1.1, 0, 1, 3, 10, 2, 19758, 0, 0]];

    mockAuthToken();
    nock(TEST_ORIGIN)
      .post(PREDICT_PATH)
      .reply(503, { error: 'Service Unavailable' });

    const { predictAnomalies } = getClient();
    await expect(predictAnomalies(featureRows)).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
  });

  test('predictAnomalies with unknown error throws error with code UNKNOWN', async () => {
    const featureRows = [[0.5, 1.2, 0.3, 0.4, 100, 10, 200, 8, 50, 0, 0, 0, 2500, 2500, 7.8, 1.1, 0, 1, 3, 10, 2, 19758, 0, 0]];

    mockAuthToken();
    nock(TEST_ORIGIN)
      .post(PREDICT_PATH)
      .replyWithError('Something unexpected happened');

    const { predictAnomalies } = getClient();
    await expect(predictAnomalies(featureRows)).rejects.toMatchObject({ code: 'UNKNOWN' });
  });
});

describe('mock-predictor', () => {
  function getMockPredictor() {
    delete require.cache[require.resolve('../../srv/lib/mock-predictor')];
    return require('../../srv/lib/mock-predictor');
  }

  const HIGH_RISK_CLASSES = [
    'High_Amount_Deviation', 'High_Amount_New_Combination',
    'High_Amount_Rare_Combination', 'New_Combination_Weekend',
    'New_Combination_After_Hours', 'General_Anomaly'
  ];

  const MEDIUM_RISK_CLASSES = [
    'New_Combination', 'Rare_Combination',
    'Weekend_Posting', 'Backdated_Posting'
  ];

  test('anomaly_score > 0.8 returns high-risk class names', () => {
    // anomaly_score is the first feature (index 0)
    const featureRows = [[0.85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

    const { predictAnomalies } = getMockPredictor();
    const result = predictAnomalies(featureRows);

    expect(result).toHaveLength(1);
    expect(HIGH_RISK_CLASSES).toContain(result[0]);
  });

  test('anomaly_score 0.4-0.8 returns medium-risk class names', () => {
    const featureRows = [[0.55, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

    const { predictAnomalies } = getMockPredictor();
    const result = predictAnomalies(featureRows);

    expect(result).toHaveLength(1);
    expect(MEDIUM_RISK_CLASSES).toContain(result[0]);
  });

  test('anomaly_score < 0.4 returns Normal', () => {
    const featureRows = [[0.2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

    const { predictAnomalies } = getMockPredictor();
    const result = predictAnomalies(featureRows);

    expect(result).toEqual(['Normal']);
  });

  test('returns same-length array as input', () => {
    const featureRows = [
      [0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0.9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const { predictAnomalies } = getMockPredictor();
    const result = predictAnomalies(featureRows);

    expect(result).toHaveLength(3);
  });

  test('high-risk classes rotate through all 6 classes', () => {
    // Create 6 high-risk rows to cycle through all classes
    const featureRows = Array.from({ length: 6 }, () =>
      [0.9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    );

    const { predictAnomalies } = getMockPredictor();
    const result = predictAnomalies(featureRows);

    expect(result).toHaveLength(6);
    // All should be high-risk classes
    result.forEach(cls => expect(HIGH_RISK_CLASSES).toContain(cls));
    // Check we get variety (at least 2 distinct classes in 6 predictions)
    const unique = new Set(result);
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });

  test('medium-risk classes rotate through all 4 classes', () => {
    // Create 4 medium-risk rows to cycle through all classes
    const featureRows = Array.from({ length: 4 }, () =>
      [0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    );

    const { predictAnomalies } = getMockPredictor();
    const result = predictAnomalies(featureRows);

    expect(result).toHaveLength(4);
    // All should be medium-risk classes
    result.forEach(cls => expect(MEDIUM_RISK_CLASSES).toContain(cls));
    // Check we get variety
    const unique = new Set(result);
    expect(unique.size).toBeGreaterThanOrEqual(2);
  });

  test('deterministic: same input produces same output', () => {
    const featureRows = [
      [0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0.85, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0.55, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const { predictAnomalies } = getMockPredictor();
    const result1 = predictAnomalies(featureRows);
    const result2 = predictAnomalies(featureRows);

    expect(result1).toEqual(result2);
  });
});
