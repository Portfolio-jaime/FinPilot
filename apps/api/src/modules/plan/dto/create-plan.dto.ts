import { IsNumber, IsObject, IsOptional, Min } from 'class-validator';
import { EtfAllocationSchema } from '@finpilot/types';
import { Transform } from 'class-transformer';

export class CreatePlanDto {
  @IsNumber()
  @Min(1)
  monthlyContribution!: number;

  @IsNumber()
  @IsOptional()
  investThresholdUsd?: number;

  @IsNumber()
  @IsOptional()
  convertThresholdCop?: number;

  @IsObject()
  @Transform(({ value }) => {
    const parsed = EtfAllocationSchema.safeParse(value);
    if (!parsed.success) throw new Error('ETF allocation must sum to 100');
    return parsed.data;
  })
  etfAllocation!: Record<string, number>;
}
