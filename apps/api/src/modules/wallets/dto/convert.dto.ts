import { IsNumber, Min } from 'class-validator';

export class ConvertDto {
  @IsNumber()
  @Min(1)
  amountCop!: number;

  @IsNumber()
  @Min(100)
  exchangeRate!: number;
}
