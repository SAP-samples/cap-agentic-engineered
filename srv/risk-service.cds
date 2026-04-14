using { risk } from '../db/schema';

// MCP-grounded: CAP MCP confirmed @requires on service + action level
service RiskService @(requires: 'authenticated-user') {
  @readonly
  entity GLTransactions as projection on risk.GLTransactions;

  // Unbound action: triggers AI Core inference on all transactions
  // POST /odata/v4/risk/analyzeRisks()
  @(requires: 'RiskAnalyst')
  action analyzeRisks() returns array of GLTransactions;
}
