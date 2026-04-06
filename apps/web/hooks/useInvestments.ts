'use client';
import { useQuery } from '@tanstack/react-query';
import { investmentsApi } from '@/lib/api';

export function useRecommendation() {
  return useQuery({
    queryKey: ['recommendation'],
    queryFn: investmentsApi.recommendation,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSimulation(months: number) {
  return useQuery({
    queryKey: ['simulation', months],
    queryFn: () => investmentsApi.simulate(months),
  });
}

export function useScenarios() {
  return useQuery({
    queryKey: ['scenarios'],
    queryFn: investmentsApi.scenarios,
    staleTime: 10 * 60 * 1000,
  });
}
