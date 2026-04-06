import { IsIn, IsNumber, Min } from 'class-validator';

export class DepositDto {
  @IsIn(['COP', 'USD'])
  currency!: 'COP' | 'USD';

  @IsNumber()
  @Min(1)
  amount!: number;
}
