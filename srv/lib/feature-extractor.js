const cds = require('@sap/cds');
const { CDS_FIELD_ORDER } = require('./feature-columns');
const LOG = cds.log('feature-extractor');

/**
 * Extracts numeric feature arrays from CDS transaction objects.
 * Features are extracted in CDS_FIELD_ORDER (24 values per row),
 * which mirrors FEATURE_COLUMNS order for ML inference.
 *
 * @param {Array<Object>} transactions - Array of CDS transaction objects with camelCase feature properties
 * @returns {{ validRows: Array<Array<number>>, skippedTransactions: Array<{ DocumentNumber: string, reason: string }> }}
 */
function extractFeatures(transactions) {
  const validRows = [];
  const skippedTransactions = [];

  for (const tx of transactions) {
    const features = CDS_FIELD_ORDER.map(col => tx[col]);

    // Loose equality catches both null and undefined
    if (features.some(f => f == null)) {
      skippedTransactions.push({
        DocumentNumber: tx.DocumentNumber,
        reason: 'Missing feature values'
      });
      // Do NOT log feature values (sensitive data per CONTEXT.md)
      LOG.warn('Skipping transaction', tx.DocumentNumber, '- missing feature values');
      continue;
    }

    validRows.push(features);
  }

  return { validRows, skippedTransactions };
}

module.exports = { extractFeatures };
