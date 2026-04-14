const cds = require('@sap/cds');
const LOG = cds.log('risk-labels');

/**
 * Static mapping of AI Core model output classes to business-language labels.
 * Keys match model output strings exactly.
 * Criticality codes: 3=Positive/green, 2=Critical/orange, 1=Negative/red (Fiori semantic colors)
 */
const RISK_LABELS = {
  'Normal': {
    display: 'Normal',
    explanation: 'No anomalies detected in this transaction.',
    criticality: 3
  },
  'High_Amount_Deviation': {
    display: 'Unusual Amount',
    explanation: 'This transaction amount is statistically unusual compared to similar entries.',
    criticality: 1
  },
  'High_Amount_New_Combination': {
    display: 'High Amount + New Pattern',
    explanation: 'Large amount on a GL/cost center combination that has never appeared before.',
    criticality: 1
  },
  'High_Amount_Rare_Combination': {
    display: 'High Amount + Rare Pattern',
    explanation: 'Large amount on a GL/cost center combination seen 5 or fewer times in 12 months.',
    criticality: 1
  },
  'New_Combination': {
    display: 'New Pattern',
    explanation: 'This GL/cost center/amount combination has not been seen before.',
    criticality: 2
  },
  'New_Combination_Weekend': {
    display: 'New Pattern + Weekend',
    explanation: 'Never-before-seen combination posted on a weekend.',
    criticality: 1
  },
  'New_Combination_After_Hours': {
    display: 'New Pattern + After Hours',
    explanation: 'Never-before-seen combination posted outside business hours.',
    criticality: 1
  },
  'Rare_Combination': {
    display: 'Rare Pattern',
    explanation: 'This GL/cost center combination has appeared 5 or fewer times in 12 months.',
    criticality: 2
  },
  'Weekend_Posting': {
    display: 'Weekend Entry',
    explanation: 'Transaction was posted on a Saturday or Sunday.',
    criticality: 2
  },
  'Backdated_Posting': {
    display: 'Backdated Entry',
    explanation: 'More than 10 days between the document date and posting date.',
    criticality: 2
  },
  'General_Anomaly': {
    display: 'Multiple Risk Factors',
    explanation: 'This transaction has a composite anomaly score above the risk threshold.',
    criticality: 1
  }
};

/** Fallback label for unknown model classes */
const UNKNOWN_FALLBACK = {
  display: 'Unknown Risk',
  explanation: 'The model returned an unrecognized risk classification.',
  criticality: 2
};

/**
 * Maps a model prediction class to a business-language label.
 * @param {string} modelClass - The raw model output class name
 * @returns {{ display: string, explanation: string, criticality: number }}
 */
function mapPrediction(modelClass) {
  const label = RISK_LABELS[modelClass];
  if (!label) {
    LOG.warn('Unknown model class encountered:', modelClass);
    return UNKNOWN_FALLBACK;
  }
  return label;
}

module.exports = { RISK_LABELS, mapPrediction };
