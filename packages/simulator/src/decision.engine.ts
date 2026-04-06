import type { DecisionInput, DecisionOutput } from '@finpilot/types';

export function evaluateInvestment(input: DecisionInput): DecisionOutput {
  const { usdBalance, copBalance, monthlyContribution, investThresholdUsd = 400, convertThresholdCop = 150_000 } = input;

  // 1. Check if USD balance meets investment threshold (highest priority)
  if (usdBalance >= investThresholdUsd) {
    return {
      action: 'INVEST',
      message: `Tienes $${usdBalance} USD — compra ETFs ahora (VOO/QQQ).`,
      urgency: 'high',
      details: {}
    };
  }

  // 2. Check if COP balance meets conversion threshold (medium priority)
  const APPROX_RATE = 4200;
  if (copBalance >= convertThresholdCop) {
    const usdNeeded = investThresholdUsd - usdBalance;
    return {
      action: 'CONVERT',
      message: `Convierte COP a USD. Necesitas ~$${usdNeeded.toFixed(0)} USD más para invertir.`,
      urgency: 'medium',
      details: {
        usdNeeded: round2(usdNeeded),
        monthsToThreshold: Math.ceil(usdNeeded / (monthlyContribution / APPROX_RATE))
      }
    };
  }

  // 3. Both balances below threshold - accumulate (lowest priority)
  const usdNeeded = investThresholdUsd - usdBalance;
  return {
    action: 'ACCUMULATE',
    message: `Sigue ahorrando. ~${Math.ceil(usdNeeded / (monthlyContribution / APPROX_RATE))} mes(es) para alcanzar el umbral de inversión.`,
    urgency: 'low',
    details: {
      usdNeeded: round2(usdNeeded),
      monthsToThreshold: Math.ceil(usdNeeded / (monthlyContribution / APPROX_RATE))
    }
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
