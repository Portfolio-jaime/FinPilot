import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsIn(['DEPOSIT', 'WITHDRAWAL', 'CONVERT', 'INVEST'])
  type!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsIn(['COP', 'USD'])
  currency!: string;

  @IsString()
  @IsOptional()
  note?: string;
}
