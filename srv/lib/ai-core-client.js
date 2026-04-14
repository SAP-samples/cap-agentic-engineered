const cds = require('@sap/cds');
const LOG = cds.log('ai-core-client');

/**
 * AI Core client for XGBoost model inference.
 * Uses direct HTTP calls to AI Core deployment endpoint.
 *
 * The @sap-ai-sdk/ai-api package is available for deployment management,
 * but custom model inference uses direct HTTP POST to the deployment URL.
 * Token management is handled via environment variables.
 *
 * Required env vars:
 *   AI_CORE_BASE_URL - AI Core API base URL
 *   AI_CORE_DEPLOYMENT_ID - Deployment ID for the XGBoost model
 *   SAP_AI_CORE_CLIENT_ID - OAuth2 client ID
 *   SAP_AI_CORE_CLIENT_SECRET - OAuth2 client secret
 *   SAP_AI_CORE_AUTH_URL - OAuth2 token endpoint
 *   AI_CORE_RESOURCE_GROUP - Resource group (default: 'default')
 */

// Timeout: 5 seconds per CONTEXT.md decision
const TIMEOUT_MS = 5000;

let _cachedToken = null;
let _tokenExpiry = 0;

/**
 * Fetches an OAuth2 token from the auth URL.
 * Caches the token until expiry.
 */
async function getToken() {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiry) {
    return _cachedToken;
  }

  const authUrl = process.env.SAP_AI_CORE_AUTH_URL;
  const clientId = process.env.SAP_AI_CORE_CLIENT_ID;
  const clientSecret = process.env.SAP_AI_CORE_CLIENT_SECRET;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials',
      signal: controller.signal
    });

    if (!response.ok) {
      const err = new Error(`Auth failed with status ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    _cachedToken = data.access_token;
    // Expire 60s before actual expiry to avoid edge cases
    _tokenExpiry = now + (data.expires_in - 60) * 1000;
    return _cachedToken;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Calls AI Core deployment to predict anomalies for feature rows.
 *
 * @param {Array<Array<number>>} featureRows - 2D array of feature values (24 per row)
 * @returns {Promise<string[]>} Array of predicted class names
 * @throws {Error} With code: TIMEOUT, AUTH_ERROR, SERVICE_UNAVAILABLE, or UNKNOWN
 */
async function predictAnomalies(featureRows) {
  const baseUrl = process.env.AI_CORE_BASE_URL;
  const deploymentId = process.env.AI_CORE_DEPLOYMENT_ID;
  // AI Core inference URL: {base}/inference/deployments/{id}/v1/predict
  // base already includes /v2
  const url = `${baseUrl}/inference/deployments/${deploymentId}/v1/predict`;

  LOG.info('Calling AI Core prediction for', featureRows.length, 'rows');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const token = await getToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'AI-Resource-Group': process.env.AI_CORE_RESOURCE_GROUP || 'default'
      },
      body: JSON.stringify({ data: featureRows }),
      signal: controller.signal
    });

    if (!response.ok) {
      const err = new Error(`AI Core returned status ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    LOG.info('AI Core prediction completed for', featureRows.length, 'rows');
    return data.predictions;

  } catch (error) {
    // Categorize errors
    const categorized = new Error(error.message);

    if (error.name === 'AbortError' || error.code === 'ECONNABORTED' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      categorized.code = 'TIMEOUT';
      categorized.message = 'AI Core request timed out';
    } else if (error.status === 401 || error.status === 403) {
      categorized.code = 'AUTH_ERROR';
      categorized.message = 'AI Core authentication failed';
    } else if (error.status === 503) {
      categorized.code = 'SERVICE_UNAVAILABLE';
      categorized.message = 'AI Core service is unavailable';
    } else {
      categorized.code = 'UNKNOWN';
      categorized.message = error.message || 'Unknown AI Core error';
    }

    // Log full error server-side (never log tokens or secrets)
    LOG.error('AI Core prediction failed:', categorized.code, categorized.message);
    throw categorized;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resets the token cache. Used in tests to ensure clean state.
 * @private
 */
function _resetTokenCache() {
  _cachedToken = null;
  _tokenExpiry = 0;
}

module.exports = { predictAnomalies, _resetTokenCache };
