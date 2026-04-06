import { z } from 'zod';

export const EtfAllocationSchema = z
  .record(z.string().min(1), z.number().min(1).max(100))
  .refine(
    (obj) => Object.values(obj).reduce((a, b) => a + b, 0) === 100,
    { message: 'ETF allocations must sum to 100' },
  );

export type EtfAllocation = z.infer<typeof EtfAllocationSchema>;

export type Action = 'INVEST' | 'ACCUMULATE' | 'CONVERT';

export interface DecisionInput {
  usdBalance: number;
  copBalance: number;
  monthlyContribution: number;
  investThresholdUsd?: number;
  convertThresholdCop?: number;
}

export interface DecisionOutput {
  action: Action;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  details: {
    usdNeeded?: number;
    monthsToThreshold?: number;
  };
}

export interface SimulationInput {
  initialBalance: number;
  monthlyContribution: number;
  annualReturn: number;
  months: number;
}

export interface MonthlySnapshot {
  month: number;
  contributed: number;
  totalInvested: number;
  totalValue: number;
  profit: number;
}

export interface SimulationResult {
  totalInvested: number;
  totalValue: number;
  profit: number;
  profitPercent: number;
  monthlyBreakdown: MonthlySnapshot[];
}

export interface PlanDto {
  id: string;
  monthlyContribution: number;
  investThresholdUsd: number;
  convertThresholdCop: number;
  etfAllocation: EtfAllocation;
}

export interface CreatePlanDto {
  monthlyContribution: number;
  investThresholdUsd?: number;
  convertThresholdCop?: number;
  etfAllocation: EtfAllocation;
}
