const cds = require('@sap/cds');
const LOG = cds.log('risk-service');

// Conditionally require predictor based on AI_CORE_MOCK env var
const predictor = process.env.AI_CORE_MOCK !== 'false'
  ? require('./lib/mock-predictor')
  : require('./lib/ai-core-client');

const { extractFeatures } = require('./lib/feature-extractor');
const { mapPrediction } = require('./lib/risk-labels');

// In-memory cache: DocumentNumber+LineItem -> { riskClassification, riskExplanation, anomalyScoreResult, criticality }
const riskCache = new Map();

module.exports = cds.service.impl(async function () {

  // Populate virtual fields from cache on every READ.
  // Virtual fields MUST always be set — even to null — so OData V4 includes them
  // in the response payload. Otherwise the client's $select drill-down fails.
  this.after('READ', 'GLTransactions', (results) => {
    const rows = Array.isArray(results) ? results : [results];
    for (const row of rows) {
      const key = `${row.DocumentNumber}_${row.LineItem}`;
      const cached = riskCache.get(key);
      row.riskClassification = cached ? cached.riskClassification : null;
      row.riskExplanation    = cached ? cached.riskExplanation    : null;
      row.anomalyScoreResult = cached ? cached.anomalyScoreResult : null;
      row.criticality        = cached ? cached.criticality        : 0;
    }
  });

  this.on('analyzeRisks', async (req) => {
    const { GLTransactions } = this.entities;

    // 1. Fetch all GL transactions
    const transactions = await SELECT.from(GLTransactions);

    if (transactions.length === 0) {
      return [];
    }

    LOG.info('analyzeRisks:', transactions.length, 'total transactions');

    // 2. Extract features (24 per row)
    // Feature extractor uses CDS_FIELD_ORDER (camelCase) to read from CDS objects,
    // producing arrays in FEATURE_COLUMNS order for ML inference.
    const { validRows, skippedTransactions } = extractFeatures(transactions);

    LOG.info('analyzeRisks:', validRows.length, 'valid,', skippedTransactions.length, 'skipped');

    // 3. Build set of skipped DocumentNumbers for O(1) lookup
    const skippedDocNums = new Set(skippedTransactions.map(s => s.DocumentNumber));

    // 4. Handle skipped transactions (null features)
    for (const tx of transactions) {
      if (skippedDocNums.has(tx.DocumentNumber)) {
        tx.riskClassification = 'Incomplete Data';
        tx.riskExplanation = 'Transaction has missing feature values and cannot be analyzed.';
        tx.anomalyScoreResult = null;
        tx.criticality = 0;
        riskCache.set(`${tx.DocumentNumber}_${tx.LineItem}`, {
          riskClassification: tx.riskClassification,
          riskExplanation:    tx.riskExplanation,
          anomalyScoreResult: tx.anomalyScoreResult,
          criticality:        tx.criticality
        });
      }
    }

    // 5. If there are valid rows, call predictor
    if (validRows.length > 0) {
      try {
        const predictions = predictor.predictAnomalies(validRows);

        // Handle async (real client) and sync (mock) predictor
        const results = predictions instanceof Promise ? await predictions : predictions;

        // 6. Map predictions back to valid transactions and populate cache
        let predictionIndex = 0;
        for (const tx of transactions) {
          if (!skippedDocNums.has(tx.DocumentNumber)) {
            const label = mapPrediction(results[predictionIndex]);
            tx.riskClassification = label.display;
            tx.riskExplanation = label.explanation;
            tx.anomalyScoreResult = tx.anomalyScore;
            tx.criticality = label.criticality;
            predictionIndex++;
          }
          // Cache all transactions (including skipped ones already set above)
          riskCache.set(`${tx.DocumentNumber}_${tx.LineItem}`, {
            riskClassification: tx.riskClassification,
            riskExplanation:    tx.riskExplanation,
            anomalyScoreResult: tx.anomalyScoreResult,
            criticality:        tx.criticality
          });
        }

        LOG.info('analyzeRisks: completed.', predictionIndex, 'predictions mapped');

      } catch (error) {
        // Log full error server-side (never log prediction values or feature values)
        LOG.error('analyzeRisks failed', error);

        // Map error codes to HTTP status + user message per CONTEXT.md
        if (error.code === 'TIMEOUT') {
          req.reject(408, 'AI Core service timed out. Please try again.');
        } else if (error.code === 'AUTH_ERROR') {
          req.reject(401, 'AI Core authentication expired. Contact your administrator.');
        } else if (error.code === 'SERVICE_UNAVAILABLE') {
          req.reject(503, 'AI Core model is temporarily unavailable. Please try again later.');
        } else {
          req.reject(500, 'Analysis failed. Please try again later.');
        }
        return; // Explicit return after reject
      }
    }

    // 7. Return full transactions array with enriched virtual fields
    // Virtual fields are transient (not persisted to DB), populated in-memory only
    LOG.info('analyzeRisks: returning', transactions.length, 'enriched transactions');
    return transactions;
  });

});
