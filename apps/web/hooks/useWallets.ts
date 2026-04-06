'use client';
import { useQuery } from '@tanstack/react-query';
import { walletsApi } from '@/lib/api';

export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: walletsApi.list,
  });
}
