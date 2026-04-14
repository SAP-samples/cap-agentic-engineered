// Feature column names in exact order for AI Core inference
// These 24 columns must match the BDC/Python model contract (snake_case).
//
// CDS entity fields use camelCase per SAP convention.
// CDS_FIELD_ORDER maps camelCase CDS field names in FEATURE_COLUMNS order,
// allowing the feature extractor to read from CDS objects and send to ML in the right order.
//
// CROSS-PLAN NOTE: FEATURE_COLUMNS[12] is 'amount' (BDC/Python name) but the CDS
// entity uses 'amountFeat' to avoid collision with GL business field 'Amount'.

const FEATURE_COLUMNS = [
  'anomaly_score', 'amount_z_score', 'rarity_score', 'temporal_score',
  'peer_amount_stddev', 'peer_count', 'peer_avg_amount', 'peer_count_month',
  'frequency_12m',
  'is_weekend', 'is_after_hours', 'is_new_combination',
  'amount', 'abs_amount', 'amount_log', 'peer_amount_ratio', 'is_large_amount',
  'posting_delay_days', 'day_of_week', 'posting_hour', 'month_numeric',
  'PostingDate_days',
  'weekend_and_large', 'is_high_frequency'
];

// CDS camelCase field names in same order as FEATURE_COLUMNS.
// Used by feature extractor to read values from CDS entity objects.
const CDS_FIELD_ORDER = [
  'anomalyScore', 'amountZScore', 'rarityScore', 'temporalScore',
  'peerAmountStddev', 'peerCount', 'peerAvgAmount', 'peerCountMonth',
  'frequency12m',
  'isWeekend', 'isAfterHours', 'isNewCombination',
  'amountFeat', 'absAmount', 'amountLog', 'peerAmountRatio', 'isLargeAmount',
  'postingDelayDays', 'dayOfWeek', 'postingHour', 'monthNumeric',
  'postingDateDays',
  'weekendAndLarge', 'isHighFrequency'
];

module.exports = { FEATURE_COLUMNS, CDS_FIELD_ORDER };
