const cds = require('@sap/cds');
const LOG = cds.log('mock-predictor');

/**
 * Mock predictor for local development without AI Core credentials.
 * Uses threshold-based deterministic logic on anomaly_score (first feature, index 0).
 *
 * Thresholds:
 *   > 0.8:  Rotates through 6 high-risk classes
 *   0.4-0.8: Rotates through 4 medium-risk classes
 *   < 0.4:  Returns "Normal"
 *
 * Same function signature as ai-core-client.js for drop-in replacement.
 */

const HIGH_RISK_CLASSES = [
  'High_Amount_Deviation',
  'High_Amount_New_Combination',
  'High_Amount_Rare_Combination',
  'New_Combination_Weekend',
  'New_Combination_After_Hours',
  'General_Anomaly'
];

const MEDIUM_RISK_CLASSES = [
  'New_Combination',
  'Rare_Combination',
  'Weekend_Posting',
  'Backdated_Posting'
];

/**
 * Predicts anomaly classes for feature rows using deterministic threshold logic.
 *
 * @param {Array<Array<number>>} featureRows - 2D array of feature values (24 per row)
 * @returns {string[]} Array of predicted class names (same length as input)
 */
function predictAnomalies(featureRows) {
  let highIndex = 0;
  let medIndex = 0;

  const predictions = featureRows.map(row => {
    const anomalyScore = row[0]; // anomaly_score is first feature

    if (anomalyScore > 0.8) {
      const cls = HIGH_RISK_CLASSES[highIndex % HIGH_RISK_CLASSES.length];
      highIndex++;
      return cls;
    } else if (anomalyScore >= 0.4) {
      const cls = MEDIUM_RISK_CLASSES[medIndex % MEDIUM_RISK_CLASSES.length];
      medIndex++;
      return cls;
    } else {
      return 'Normal';
    }
  });

  LOG.info('Mock mode: predicted', predictions.length, 'transactions');
  return predictions;
}

module.exports = { predictAnomalies };
