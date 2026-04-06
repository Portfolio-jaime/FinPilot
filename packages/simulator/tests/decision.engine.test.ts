import { evaluateInvestment } from '../src/decision.engine';

describe('evaluateInvestment', () => {
  const base = { monthlyContribution: 100, investThresholdUsd: 400, convertThresholdCop: 150_000 };

  it('returns INVEST when USD balance meets threshold', () => {
    const r = evaluateInvestment({ ...base, usdBalance: 400, copBalance: 0 });
    expect(r.action).toBe('INVEST');
    expect(r.urgency).toBe('high');
  });

  it('returns INVEST when USD balance exceeds threshold', () => {
    expect(evaluateInvestment({ ...base, usdBalance: 500, copBalance: 0 }).action).toBe('INVEST');
  });

  it('returns CONVERT when COP meets threshold but USD does not', () => {
    const r = evaluateInvestment({ ...base, usdBalance: 200, copBalance: 150_000 });
    expect(r.action).toBe('CONVERT');
    expect(r.urgency).toBe('medium');
    expect(r.details.usdNeeded).toBe(200);
  });

  it('CONVERT includes monthsToThreshold estimate', () => {
    const r = evaluateInvestment({ usdBalance: 200, copBalance: 200_000, monthlyContribution: 420_000, investThresholdUsd: 400, convertThresholdCop: 150_000 });
    expect(r.action).toBe('CONVERT');
    expect(r.details.monthsToThreshold).toBe(2);
  });

  it('returns ACCUMULATE when both balances below threshold', () => {
    const r = evaluateInvestment({ ...base, usdBalance: 100, copBalance: 50_000 });
    expect(r.action).toBe('ACCUMULATE');
    expect(r.urgency).toBe('low');
    expect(r.details.usdNeeded).toBe(300);
  });

  it('uses default thresholds when not provided', () => {
    expect(evaluateInvestment({ usdBalance: 400, copBalance: 0, monthlyContribution: 100 }).action).toBe('INVEST');
  });

  it('INVEST takes priority over CONVERT even if COP threshold met', () => {
    expect(evaluateInvestment({ ...base, usdBalance: 400, copBalance: 200_000 }).action).toBe('INVEST');
  });

  it('message is a non-empty string for every action', () => {
    [
      evaluateInvestment({ ...base, usdBalance: 400, copBalance: 0 }),
      evaluateInvestment({ ...base, usdBalance: 0, copBalance: 150_000 }),
      evaluateInvestment({ ...base, usdBalance: 0, copBalance: 0 })
    ].forEach(r => expect(r.message.length).toBeGreaterThan(0));
  });
});
