import { simulateETFGrowth, compareScenarios, copToUsd } from '../src/investment.simulator';

describe('simulateETFGrowth', () => {
  it('returns correct structure', () => {
    const result = simulateETFGrowth({
      initialBalance: 0,
      monthlyContribution: 50,
      annualReturn: 0.10,
      months: 12,
    });
    expect(result).toHaveProperty('totalInvested');
    expect(result).toHaveProperty('totalValue');
    expect(result).toHaveProperty('profit');
    expect(result).toHaveProperty('profitPercent');
    expect(result.monthlyBreakdown).toHaveLength(12);
  });

  it('totalValue > totalInvested with positive return', () => {
    const result = simulateETFGrowth({
      initialBalance: 1000,
      monthlyContribution: 100,
      annualReturn: 0.10,
      months: 36,
    });
    expect(result.totalValue).toBeGreaterThan(result.totalInvested);
    expect(result.profit).toBeGreaterThan(0);
  });

  it('totalInvested equals initialBalance + (monthlyContribution * months)', () => {
    const result = simulateETFGrowth({
      initialBalance: 500,
      monthlyContribution: 100,
      annualReturn: 0.10,
      months: 12,
    });
    expect(result.totalInvested).toBe(1700); // 500 + 100*12
  });

  it('rounds all values to 2 decimal places', () => {
    const result = simulateETFGrowth({
      initialBalance: 1,
      monthlyContribution: 1,
      annualReturn: 0.10,
      months: 3,
    });
    const hasMax2Decimals = (n: number) => /^\d+(\.\d{1,2})?$/.test(String(n));
    expect(hasMax2Decimals(result.totalValue)).toBe(true);
    expect(hasMax2Decimals(result.profit)).toBe(true);
  });

  it('with 0% return totalValue equals totalInvested', () => {
    const result = simulateETFGrowth({
      initialBalance: 0,
      monthlyContribution: 100,
      annualReturn: 0,
      months: 12,
    });
    expect(result.totalValue).toBe(result.totalInvested);
    expect(result.profit).toBe(0);
  });

  it('handles negative annual return (bear market)', () => {
    const result = simulateETFGrowth({
      initialBalance: 1000,
      monthlyContribution: 100,
      annualReturn: -0.20,
      months: 12,
    });
    expect(result.totalValue).toBeLessThan(result.totalInvested);
    expect(result.profit).toBeLessThan(0);
    expect(result.profitPercent).toBeLessThan(0);
  });

  it('months: 0 returns empty breakdown and profit 0', () => {
    const result = simulateETFGrowth({
      initialBalance: 500,
      monthlyContribution: 100,
      annualReturn: 0.10,
      months: 0,
    });
    expect(result.monthlyBreakdown).toHaveLength(0);
    expect(result.totalInvested).toBe(500);
    expect(result.totalValue).toBe(500);
    expect(result.profit).toBe(0);
  });
});

describe('compareScenarios', () => {
  it('returns one result per scenario', () => {
    const results = compareScenarios(0, 12, [
      { label: 'A', monthlyContribution: 50, annualReturn: 0.08 },
      { label: 'B', monthlyContribution: 100, annualReturn: 0.10 },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0].label).toBe('A');
    expect(results[1].label).toBe('B');
  });

  it('higher return produces higher totalValue', () => {
    const [low, high] = compareScenarios(0, 36, [
      { label: 'Low', monthlyContribution: 100, annualReturn: 0.05 },
      { label: 'High', monthlyContribution: 100, annualReturn: 0.15 },
    ]);
    expect(high.totalValue).toBeGreaterThan(low.totalValue);
  });
});

describe('copToUsd', () => {
  it('converts COP to USD with default cost', () => {
    const result = copToUsd({ amountCop: 420_000, exchangeRate: 4200 });
    expect(result.grossUsd).toBe(100);
    expect(result.netUsd).toBeLessThan(100);
    expect(result.costUsd).toBeGreaterThan(0);
  });

  it('applies custom conversion cost', () => {
    const result = copToUsd({ amountCop: 420_000, exchangeRate: 4200, conversionCostPercent: 0.01 });
    expect(result.netUsd).toBe(99);
    expect(result.costUsd).toBe(1);
  });
});
