export type Currency = 'COP' | 'USD';

export interface WalletDto {
  id: string;
  currency: Currency;
  balance: number;
  userId: string;
}

export interface DepositDto {
  currency: Currency;
  amount: number;
}

export interface ConvertDto {
  amountCop: number;
  exchangeRate: number; // COP per 1 USD, e.g. 4200
}
