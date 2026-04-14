namespace risk;

// MCP-grounded: CAP MCP confirmed Integer enums require explicit values
type Criticality : Integer enum {
  Neutral  = 0;
  Negative = 1;  // red
  Critical = 2;  // orange
  Positive = 3;  // green
};

type RiskClassification : String enum {
  Normal          = 'Normal';
  UnusualAmount   = 'Unusual Amount';
  HighAmountNew   = 'High Amount + New Pattern';
  HighAmountRare  = 'High Amount + Rare Pattern';
  NewPattern      = 'New Pattern';
  NewPatternWknd  = 'New Pattern + Weekend';
  NewPatternAH    = 'New Pattern + After Hours';
  RarePattern     = 'Rare Pattern';
  WeekendEntry    = 'Weekend Entry';
  BackdatedEntry  = 'Backdated Entry';
  MultipleFactors = 'Multiple Risk Factors';
  IncompleteData  = 'Incomplete Data';
  UnknownRisk     = 'Unknown Risk';
};

entity GLTransactions {
  key CompanyCode    : String(4);
  key FiscalYear     : String(4);
  key DocumentNumber : String(10);
  key LineItem       : String(6);

  // GL business fields
  GLAccount   : String(10);
  CostCenter  : String(10);
  PostingDate : Date;
  Amount      : Decimal(15,2);

  // 24 feature columns (camelCase per CDS convention; ML contract mapping in srv/lib/feature-columns.js)
  anomalyScore      : Decimal(5,4);
  amountZScore      : Decimal(10,4);
  rarityScore       : Decimal(5,4);
  temporalScore     : Decimal(5,4);
  peerAmountStddev  : Decimal(15,2);
  peerCount         : Integer;
  peerAvgAmount     : Decimal(15,2);
  peerCountMonth    : Integer;
  frequency12m      : Integer;
  isWeekend         : Integer;
  isAfterHours      : Integer;
  isNewCombination  : Integer;
  amountFeat        : Decimal(15,2);
  absAmount         : Decimal(15,2);
  amountLog         : Decimal(10,4);
  peerAmountRatio   : Decimal(10,4);
  isLargeAmount     : Integer;
  postingDelayDays  : Integer;
  dayOfWeek         : Integer;
  postingHour       : Integer;
  monthNumeric      : Integer;
  postingDateDays   : Integer;
  weekendAndLarge   : Integer;
  isHighFrequency   : Integer;

  // Virtual risk result fields (transient, not persisted)
  virtual riskClassification : RiskClassification;
  virtual riskExplanation    : String;
  virtual anomalyScoreResult : Decimal(5,4);
  virtual criticality        : Criticality;
}
