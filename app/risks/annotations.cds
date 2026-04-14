using RiskService from '../../srv/risk-service';

//
// Section A: Field labels (all fields with i18n titles)
//

// GL business fields (8 fields)
annotate RiskService.GLTransactions with {
  CompanyCode    @title: '{i18n>CompanyCode}';
  FiscalYear     @title: '{i18n>FiscalYear}';
  DocumentNumber @title: '{i18n>DocumentNumber}';
  LineItem       @title: '{i18n>LineItem}';
  GLAccount      @title: '{i18n>GLAccount}';
  CostCenter     @title: '{i18n>CostCenter}';
  PostingDate    @title: '{i18n>PostingDate}';
  Amount         @title: '{i18n>Amount}';
};

// Risk result fields (3 virtual fields)
annotate RiskService.GLTransactions with {
  riskClassification @title: '{i18n>RiskClassification}';
  riskExplanation    @title: '{i18n>RiskExplanation}';
  anomalyScoreResult @title: '{i18n>AnomalyScore}';
};

// Criticality field (hidden -- drives row coloring, not displayed as column)
annotate RiskService.GLTransactions with {
  criticality @UI.Hidden;
};

// 24 feature columns (hidden from filters, available via table personalization)
// MCP-grounded: Fiori MCP confirmed @UI.HiddenFilter excludes fields from filter bar
annotate RiskService.GLTransactions with {
  anomalyScore      @title: '{i18n>feat_anomalyScore}'       @UI.Importance: #Low  @UI.HiddenFilter;
  amountZScore      @title: '{i18n>feat_amountZScore}'       @UI.Importance: #Low  @UI.HiddenFilter;
  rarityScore       @title: '{i18n>feat_rarityScore}'        @UI.Importance: #Low  @UI.HiddenFilter;
  temporalScore     @title: '{i18n>feat_temporalScore}'      @UI.Importance: #Low  @UI.HiddenFilter;
  peerAmountStddev  @title: '{i18n>feat_peerAmountStddev}'   @UI.Importance: #Low  @UI.HiddenFilter;
  peerCount         @title: '{i18n>feat_peerCount}'          @UI.Importance: #Low  @UI.HiddenFilter;
  peerAvgAmount     @title: '{i18n>feat_peerAvgAmount}'      @UI.Importance: #Low  @UI.HiddenFilter;
  peerCountMonth    @title: '{i18n>feat_peerCountMonth}'     @UI.Importance: #Low  @UI.HiddenFilter;
  frequency12m      @title: '{i18n>feat_frequency12m}'       @UI.Importance: #Low  @UI.HiddenFilter;
  isWeekend         @title: '{i18n>feat_isWeekend}'          @UI.Importance: #Low  @UI.HiddenFilter;
  isAfterHours      @title: '{i18n>feat_isAfterHours}'       @UI.Importance: #Low  @UI.HiddenFilter;
  isNewCombination  @title: '{i18n>feat_isNewCombination}'   @UI.Importance: #Low  @UI.HiddenFilter;
  amountFeat        @title: '{i18n>feat_amountFeat}'         @UI.Importance: #Low  @UI.HiddenFilter;
  absAmount         @title: '{i18n>feat_absAmount}'          @UI.Importance: #Low  @UI.HiddenFilter;
  amountLog         @title: '{i18n>feat_amountLog}'          @UI.Importance: #Low  @UI.HiddenFilter;
  peerAmountRatio   @title: '{i18n>feat_peerAmountRatio}'    @UI.Importance: #Low  @UI.HiddenFilter;
  isLargeAmount     @title: '{i18n>feat_isLargeAmount}'      @UI.Importance: #Low  @UI.HiddenFilter;
  postingDelayDays  @title: '{i18n>feat_postingDelayDays}'   @UI.Importance: #Low  @UI.HiddenFilter;
  dayOfWeek         @title: '{i18n>feat_dayOfWeek}'          @UI.Importance: #Low  @UI.HiddenFilter;
  postingHour       @title: '{i18n>feat_postingHour}'        @UI.Importance: #Low  @UI.HiddenFilter;
  monthNumeric      @title: '{i18n>feat_monthNumeric}'       @UI.Importance: #Low  @UI.HiddenFilter;
  postingDateDays   @title: '{i18n>feat_postingDateDays}'    @UI.Importance: #Low  @UI.HiddenFilter;
  weekendAndLarge   @title: '{i18n>feat_weekendAndLarge}'    @UI.Importance: #Low  @UI.HiddenFilter;
  isHighFrequency   @title: '{i18n>feat_isHighFrequency}'    @UI.Importance: #Low  @UI.HiddenFilter;
};

//
// Section B-G: Entity-level annotations
//

annotate RiskService.GLTransactions with @(

  // Section B: Entity-level criticality for full-row coloring
  // Values: 3=green/Normal, 2=orange/medium, 1=red/high, 0=neutral/unanalyzed
  UI.Criticality: criticality,

  // Section C: HeaderInfo
  UI.HeaderInfo: {
    TypeName      : '{i18n>Transaction}',
    TypeNamePlural: '{i18n>Transactions}',
    Title         : { Value: DocumentNumber },
    Description   : { Value: CompanyCode }
  },

  // Section D: PresentationVariant -- default sort PostingDate descending
  UI.PresentationVariant: {
    SortOrder     : [{ Property: PostingDate, Descending: true }],
    Visualizations: ['@UI.LineItem']
  },

  // Section E: SelectionFields -- filter bar with date/amount range support
  // MCP-grounded: Fiori MCP confirmed FilterExpressionRestrictions with 'SingleRange'
  UI.SelectionFields: [
    riskClassification,
    CompanyCode,
    PostingDate,
    Amount
  ],

  // Section F: LineItem -- column order and visibility
  // Note: Analyze button is a custom action in manifest.json (NOT DataFieldForAction)
  // per proven pattern from prototype -- DataFieldForAction silently fails for unbound actions
  UI.LineItem: [
    // 8 GL business columns (default visible)
    { Value: CompanyCode,    @UI.Importance: #High },
    { Value: FiscalYear,     @UI.Importance: #High },
    { Value: DocumentNumber, @UI.Importance: #High },
    { Value: LineItem,       @UI.Importance: #High },
    { Value: GLAccount,      @UI.Importance: #High },
    { Value: CostCenter,     @UI.Importance: #High },
    { Value: PostingDate,    @UI.Importance: #High },
    { Value: Amount,         @UI.Importance: #High },
    // 3 risk result columns (default visible)
    { Value: riskClassification, Criticality: criticality, @UI.Importance: #High },
    { Value: riskExplanation,    @UI.Importance: #High },
    // Anomaly score as progress bar via DataFieldForAnnotation
    { $Type: 'UI.DataFieldForAnnotation', Target: '@UI.DataPoint#anomalyScore', Label: '{i18n>AnomalyScore}', @UI.Importance: #High }
  ],

  // Section G: DataPoint for anomaly score progress bar
  UI.DataPoint #anomalyScore: {
    Value        : anomalyScoreResult,
    TargetValue  : 1,
    Visualization: #Progress,
    Criticality  : criticality
  }
);

//
// Section H: Filter restrictions for date/amount range pickers
// MCP-grounded: Fiori MCP search_docs confirmed 'SingleRange' for date and amount filters
//
annotate RiskService.GLTransactions with @(
  Capabilities.FilterRestrictions: {
    FilterExpressionRestrictions: [
      { Property: PostingDate, AllowedExpressions: 'SingleRange' },
      { Property: Amount,      AllowedExpressions: 'SingleRange' }
    ]
  }
);
