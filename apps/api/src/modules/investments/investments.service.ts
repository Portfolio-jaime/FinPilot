import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { evaluateInvestment, simulateETFGrowth, compareScenarios } from '@finpilot/simulator';

@Injectable()
export class InvestmentsService {
  constructor(private prisma: PrismaService) {}

  async getRecommendation(userId: string) {
    const [plan, copWallet, usdWallet] = await Promise.all([
      this.prisma.investmentPlan.findUnique({ where: { userId } }),
      this.prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: 'COP' } } }),
      this.prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: 'USD' } } }),
    ]);
    if (!plan) throw new NotFoundException('Create an investment plan first');
    return evaluateInvestment({
      usdBalance: Number(usdWallet?.balance ?? 0),
      copBalance: Number(copWallet?.balance ?? 0),
      monthlyContribution: Number(plan.monthlyContribution),
      investThresholdUsd: Number(plan.investThresholdUsd),
      convertThresholdCop: Number(plan.convertThresholdCop),
    });
  }

  async simulate(userId: string, months = 36) {
    const [plan, usdWallet] = await Promise.all([
      this.prisma.investmentPlan.findUnique({ where: { userId } }),
      this.prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: 'USD' } } }),
    ]);
    if (!plan) throw new NotFoundException('Create an investment plan first');
    return simulateETFGrowth({
      initialBalance: Number(usdWallet?.balance ?? 0),
      monthlyContribution: Number(plan.monthlyContribution) / 4200,
      annualReturn: 0.10,
      months,
    });
  }

  async scenarios(userId: string) {
    const [plan, usdWallet] = await Promise.all([
      this.prisma.investmentPlan.findUnique({ where: { userId } }),
      this.prisma.wallet.findUnique({ where: { userId_currency: { userId, currency: 'USD' } } }),
    ]);
    if (!plan) throw new NotFoundException('Create an investment plan first');
    const monthlyUsd = Number(plan.monthlyContribution) / 4200;
    const initial = Number(usdWallet?.balance ?? 0);
    return compareScenarios(initial, 36, [
      { label: 'Conservador (8.5% EA)', monthlyContribution: monthlyUsd, annualReturn: 0.085 },
      { label: 'Base S&P500 (10% EA)', monthlyContribution: monthlyUsd, annualReturn: 0.10 },
      { label: 'Agresivo QQQ (12% EA)', monthlyContribution: monthlyUsd, annualReturn: 0.12 },
    ]);
  }
}
