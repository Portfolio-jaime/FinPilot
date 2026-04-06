'use client';
import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '@/lib/api';

export function useTransactions(page = 1) {
  return useQuery({
    queryKey: ['transactions', page],
    queryFn: () => transactionsApi.list(page),
  });
}
