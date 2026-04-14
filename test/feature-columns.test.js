const { FEATURE_COLUMNS, CDS_FIELD_ORDER } = require('../srv/lib/feature-columns');

describe('FEATURE_COLUMNS constant', () => {
  test('has exactly 24 columns', () => {
    expect(FEATURE_COLUMNS).toHaveLength(24);
  });

  test('first column is anomaly_score', () => {
    expect(FEATURE_COLUMNS[0]).toBe('anomaly_score');
  });

  test('last column is is_high_frequency', () => {
    expect(FEATURE_COLUMNS[23]).toBe('is_high_frequency');
  });

  test('contains no duplicates', () => {
    const unique = new Set(FEATURE_COLUMNS);
    expect(unique.size).toBe(24);
  });

  test('all entries are non-empty strings', () => {
    FEATURE_COLUMNS.forEach(col => {
      expect(typeof col).toBe('string');
      expect(col.length).toBeGreaterThan(0);
    });
  });

  test('key indices match documented order', () => {
    expect(FEATURE_COLUMNS[8]).toBe('frequency_12m');
    expect(FEATURE_COLUMNS[11]).toBe('is_new_combination');
    expect(FEATURE_COLUMNS[21]).toBe('PostingDate_days');
  });

  test('index 12 is amount (BDC/Python name, maps to CDS field amountFeat)', () => {
    // CROSS-PLAN CONTRACT: FEATURE_COLUMNS uses 'amount' (the BDC/Python column name).
    // The CDS entity in db/schema.cds uses 'amountFeat' to avoid collision with the
    // GL business field 'Amount'. The feature extractor uses CDS_FIELD_ORDER for this mapping.
    expect(FEATURE_COLUMNS[12]).toBe('amount');
  });
});

describe('CDS_FIELD_ORDER constant', () => {
  test('has exactly 24 entries matching FEATURE_COLUMNS length', () => {
    expect(CDS_FIELD_ORDER).toHaveLength(FEATURE_COLUMNS.length);
  });

  test('contains no duplicates', () => {
    const unique = new Set(CDS_FIELD_ORDER);
    expect(unique.size).toBe(24);
  });

  test('all entries are camelCase (no underscores)', () => {
    CDS_FIELD_ORDER.forEach(col => {
      expect(col).not.toMatch(/_/);
    });
  });

  test('first entry maps to anomalyScore (CDS name for anomaly_score)', () => {
    expect(CDS_FIELD_ORDER[0]).toBe('anomalyScore');
  });

  test('index 12 maps to amountFeat (CDS name for amount)', () => {
    expect(CDS_FIELD_ORDER[12]).toBe('amountFeat');
  });

  test('last entry maps to isHighFrequency', () => {
    expect(CDS_FIELD_ORDER[23]).toBe('isHighFrequency');
  });
});
