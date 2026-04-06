import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    const plan = await this.prisma.investmentPlan.findUnique({ where: { userId } });
    if (!plan) throw new NotFoundException('No investment plan found');
    return this.toDto(plan);
  }

  async create(userId: string, dto: CreatePlanDto) {
    const existing = await this.prisma.investmentPlan.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('Plan already exists. Use PUT to update.');
    const plan = await this.prisma.investmentPlan.create({
      data: {
        userId,
        monthlyContribution: new Decimal(dto.monthlyContribution),
        investThresholdUsd: new Decimal(dto.investThresholdUsd ?? 400),
        convertThresholdCop: new Decimal(dto.convertThresholdCop ?? 150_000),
        etfAllocation: dto.etfAllocation,
      },
    });
    return this.toDto(plan);
  }

  async update(userId: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.investmentPlan.update({
      where: { userId },
      data: {
        ...(dto.monthlyContribution !== undefined && { monthlyContribution: new Decimal(dto.monthlyContribution) }),
        ...(dto.investThresholdUsd !== undefined && { investThresholdUsd: new Decimal(dto.investThresholdUsd) }),
        ...(dto.convertThresholdCop !== undefined && { convertThresholdCop: new Decimal(dto.convertThresholdCop) }),
        ...(dto.etfAllocation !== undefined && { etfAllocation: dto.etfAllocation }),
      },
    });
    return this.toDto(plan);
  }

  private toDto(plan: any) {
    return {
      id: plan.id,
      monthlyContribution: Number(plan.monthlyContribution),
      investThresholdUsd: Number(plan.investThresholdUsd),
      convertThresholdCop: Number(plan.convertThresholdCop),
      etfAllocation: plan.etfAllocation,
    };
  }
}
