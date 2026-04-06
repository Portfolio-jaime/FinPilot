export type TxType = 'DEPOSIT' | 'WITHDRAWAL' | 'CONVERT' | 'INVEST';

export interface TransactionDto {
  id: string;
  type: TxType;
  amount: number;
  currency: string;
  note?: string;
  exchangeRate?: number;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
