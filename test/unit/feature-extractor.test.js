const { extractFeatures } = require('../../srv/lib/feature-extractor');
const { CDS_FIELD_ORDER } = require('../../srv/lib/feature-columns');

/**
 * Helper: build a transaction object with all 24 features populated (camelCase CDS fields).
 * Uses index-based values so we can verify extraction order.
 */
function buildValidTransaction(docNum = 'DOC001') {
  const tx = { DocumentNumber: docNum };
  CDS_FIELD_ORDER.forEach((col, i) => {
    tx[col] = i + 0.5; // e.g., anomalyScore=0.5, amountZScore=1.5, ...
  });
  return tx;
}

describe('extractFeatures', () => {
  test('valid transaction produces array of exactly 24 values', () => {
    const tx = buildValidTransaction();
    const result = extractFeatures([tx]);
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0]).toHaveLength(24);
    expect(result.skippedTransactions).toHaveLength(0);
  });

  test('features are extracted in exact CDS_FIELD_ORDER order', () => {
    const tx = buildValidTransaction();
    const result = extractFeatures([tx]);
    const extracted = result.validRows[0];

    // Verify each feature position matches CDS_FIELD_ORDER order
    CDS_FIELD_ORDER.forEach((col, i) => {
      expect(extracted[i]).toBe(i + 0.5);
    });
  });

  test('validRows contains arrays of numbers, not objects', () => {
    const tx = buildValidTransaction();
    const result = extractFeatures([tx]);
    expect(Array.isArray(result.validRows[0])).toBe(true);
    result.validRows[0].forEach(val => {
      expect(typeof val).toBe('number');
    });
  });

  test('transaction with null feature is skipped', () => {
    const tx = buildValidTransaction('DOC_NULL');
    tx.anomalyScore = null;
    const result = extractFeatures([tx]);
    expect(result.validRows).toHaveLength(0);
    expect(result.skippedTransactions).toHaveLength(1);
    expect(result.skippedTransactions[0].DocumentNumber).toBe('DOC_NULL');
  });

  test('transaction with undefined feature is skipped', () => {
    const tx = buildValidTransaction('DOC_UNDEF');
    delete tx.amountFeat; // makes it undefined (CDS field for ML 'amount')
    const result = extractFeatures([tx]);
    expect(result.validRows).toHaveLength(0);
    expect(result.skippedTransactions).toHaveLength(1);
    expect(result.skippedTransactions[0].DocumentNumber).toBe('DOC_UNDEF');
  });

  test('mixed valid/null transactions produces correct split', () => {
    const valid1 = buildValidTransaction('DOC_V1');
    const invalid = buildValidTransaction('DOC_BAD');
    invalid.rarityScore = null;
    const valid2 = buildValidTransaction('DOC_V2');

    const result = extractFeatures([valid1, invalid, valid2]);
    expect(result.validRows).toHaveLength(2);
    expect(result.skippedTransactions).toHaveLength(1);
    expect(result.skippedTransactions[0].DocumentNumber).toBe('DOC_BAD');
  });

  test('skippedTransactions includes DocumentNumber and reason', () => {
    const tx = buildValidTransaction('DOC_SKIP');
    tx.peerCount = null;
    const result = extractFeatures([tx]);
    expect(result.skippedTransactions[0]).toHaveProperty('DocumentNumber', 'DOC_SKIP');
    expect(result.skippedTransactions[0]).toHaveProperty('reason');
    expect(typeof result.skippedTransactions[0].reason).toBe('string');
    expect(result.skippedTransactions[0].reason.length).toBeGreaterThan(0);
  });

  test('empty input returns empty arrays', () => {
    const result = extractFeatures([]);
    expect(result.validRows).toEqual([]);
    expect(result.skippedTransactions).toEqual([]);
  });

  test('feature order matches CDS_FIELD_ORDER exactly with distinct values', () => {
    // Build a transaction where each feature has a unique value based on index
    const tx = { DocumentNumber: 'DOC_ORDER' };
    const expectedValues = [];
    CDS_FIELD_ORDER.forEach((col, i) => {
      const val = (i + 1) * 10; // 10, 20, 30, ...
      tx[col] = val;
      expectedValues.push(val);
    });

    const result = extractFeatures([tx]);
    expect(result.validRows[0]).toEqual(expectedValues);
  });

  test('multiple valid transactions produce multiple rows', () => {
    const txs = [
      buildValidTransaction('DOC_A'),
      buildValidTransaction('DOC_B'),
      buildValidTransaction('DOC_C')
    ];
    const result = extractFeatures(txs);
    expect(result.validRows).toHaveLength(3);
    expect(result.skippedTransactions).toHaveLength(0);
  });
});
