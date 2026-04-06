import type { SimulationInput, SimulationResult, MonthlySnapshot } from '@finpilot/types';

export function simulateETFGrowth(input: SimulationInput): SimulationResult {
  const { initialBalance, monthlyContribution, annualReturn, months } = input;
  const monthlyRate = annualReturn / 12;

  const breakdown: MonthlySnapshot[] = [];
  let totalValue = initialBalance;
  let totalInvested = initialBalance;

  for (let month = 1; month <= months; month++) {
    totalValue = (totalValue + monthlyContribution) * (1 + monthlyRate);
    totalInvested += monthlyContribution;
    breakdown.push({
      month,
      contributed: monthlyContribution,
      totalInvested: round2(totalInvested),
      totalValue: round2(totalValue),
      profit: round2(totalValue - totalInvested),
    });
  }

  const finalInvested = round2(totalInvested);
  const finalValue = round2(totalValue);
  const profit = round2(finalValue - finalInvested);

  return {
    totalInvested: finalInvested,
    totalValue: finalValue,
    profit,
    profitPercent: finalInvested === 0 ? 0 : round2((profit / finalInvested) * 100),
    monthlyBreakdown: breakdown,
  };
}

export interface Scenario {
  label: string;
  monthlyContribution: number;
  annualReturn: number;
}

export function compareScenarios(
  initialBalance: number,
  months: number,
  scenarios: Scenario[],
): Array<SimulationResult & { label: string }> {
  return scenarios.map((s) => ({
    label: s.label,
    ...simulateETFGrowth({
      initialBalance,
      monthlyContribution: s.monthlyContribution,
      annualReturn: s.annualReturn,
      months,
    }),
  }));
}

export interface ConversionInput {
  amountCop: number;
  exchangeRate: number;
  conversionCostPercent?: number;
}

export function copToUsd(input: ConversionInput): {
  grossUsd: number;
  netUsd: number;
  costUsd: number;
} {
  const { amountCop, exchangeRate, conversionCostPercent = 0.005 } = input;
  const grossUsd = amountCop / exchangeRate;
  const costUsd = round2(grossUsd * conversionCostPercent);
  return {
    grossUsd: round2(grossUsd),
    netUsd: round2(grossUsd - costUsd),
    costUsd,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
