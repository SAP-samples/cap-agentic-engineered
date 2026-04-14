const { RISK_LABELS, mapPrediction } = require('../../srv/lib/risk-labels');

describe('RISK_LABELS constant', () => {
  test('has exactly 11 entries', () => {
    expect(Object.keys(RISK_LABELS)).toHaveLength(11);
  });

  test('contains all expected model class keys', () => {
    const expectedKeys = [
      'Normal',
      'High_Amount_Deviation',
      'High_Amount_New_Combination',
      'High_Amount_Rare_Combination',
      'New_Combination',
      'New_Combination_Weekend',
      'New_Combination_After_Hours',
      'Rare_Combination',
      'Weekend_Posting',
      'Backdated_Posting',
      'General_Anomaly'
    ];
    expect(Object.keys(RISK_LABELS).sort()).toEqual(expectedKeys.sort());
  });

  test('every label has display, explanation, and criticality', () => {
    for (const [key, label] of Object.entries(RISK_LABELS)) {
      expect(label).toHaveProperty('display');
      expect(label).toHaveProperty('explanation');
      expect(label).toHaveProperty('criticality');
      expect(typeof label.display).toBe('string');
      expect(typeof label.explanation).toBe('string');
      expect(typeof label.criticality).toBe('number');
    }
  });

  test('all criticality values are 1, 2, or 3', () => {
    for (const [key, label] of Object.entries(RISK_LABELS)) {
      expect([1, 2, 3]).toContain(label.criticality);
    }
  });

  test('Normal is the only class with criticality 3 (green)', () => {
    const greenClasses = Object.entries(RISK_LABELS)
      .filter(([, label]) => label.criticality === 3)
      .map(([key]) => key);
    expect(greenClasses).toEqual(['Normal']);
  });

  test('high-risk classes have criticality 1 (red)', () => {
    const highRiskKeys = [
      'High_Amount_Deviation',
      'High_Amount_New_Combination',
      'High_Amount_Rare_Combination',
      'New_Combination_Weekend',
      'New_Combination_After_Hours',
      'General_Anomaly'
    ];
    for (const key of highRiskKeys) {
      expect(RISK_LABELS[key].criticality).toBe(1);
    }
  });

  test('medium-risk classes have criticality 2 (orange)', () => {
    const mediumRiskKeys = [
      'New_Combination',
      'Rare_Combination',
      'Weekend_Posting',
      'Backdated_Posting'
    ];
    for (const key of mediumRiskKeys) {
      expect(RISK_LABELS[key].criticality).toBe(2);
    }
  });
});

describe('mapPrediction', () => {
  test('returns correct label for Normal', () => {
    const result = mapPrediction('Normal');
    expect(result.display).toBe('Normal');
    expect(result.explanation).toContain('No anomalies');
    expect(result.criticality).toBe(3);
  });

  test('returns correct label for High_Amount_Deviation', () => {
    const result = mapPrediction('High_Amount_Deviation');
    expect(result.display).toBe('Unusual Amount');
    expect(result.criticality).toBe(1);
  });

  test('returns correct label for each of the 11 classes', () => {
    for (const [key, expected] of Object.entries(RISK_LABELS)) {
      const result = mapPrediction(key);
      expect(result).toEqual(expected);
    }
  });

  test('returns "Unknown Risk" fallback for unknown model class', () => {
    const result = mapPrediction('UnknownClass');
    expect(result.display).toBe('Unknown Risk');
    expect(result.criticality).toBe(2);
  });

  test('returns fallback for empty string', () => {
    const result = mapPrediction('');
    expect(result.display).toBe('Unknown Risk');
    expect(result.criticality).toBe(2);
  });

  test('returns fallback for undefined', () => {
    const result = mapPrediction(undefined);
    expect(result.display).toBe('Unknown Risk');
    expect(result.criticality).toBe(2);
  });

  test('returns fallback for null', () => {
    const result = mapPrediction(null);
    expect(result.display).toBe('Unknown Risk');
    expect(result.criticality).toBe(2);
  });
});
