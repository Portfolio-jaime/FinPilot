import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = Cookies.get('accessToken');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `API error ${res.status}`);
  }
  const json = await res.json();
  return json.data ?? json;
}

// auth
export const authApi = {
  register: (body: { email: string; password: string; name: string }) =>
    apiFetch<{ accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    apiFetch<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
};

// wallets
export const walletsApi = {
  list: () => apiFetch<WalletDto[]>('/wallets'),
  deposit: (body: { currency: 'COP' | 'USD'; amount: number }) =>
    apiFetch<WalletDto>('/wallets/deposit', { method: 'POST', body: JSON.stringify(body) }),
  convert: (body: { amountCop: number; exchangeRate: number }) =>
    apiFetch<WalletDto>('/wallets/convert', { method: 'POST', body: JSON.stringify(body) }),
};

// investments
export const investmentsApi = {
  recommendation: () => apiFetch<RecommendationDto>('/investments/recommendation'),
  simulate: (months: number) =>
    apiFetch<SimulationResultDto>(`/investments/simulate?months=${months}`),
  scenarios: () => apiFetch<ScenarioResultDto[]>('/investments/scenarios'),
};

// plan
export const planApi = {
  get: () => apiFetch<PlanDto>('/plan'),
  create: (body: CreatePlanDto) =>
    apiFetch<PlanDto>('/plan', { method: 'POST', body: JSON.stringify(body) }),
  update: (body: Partial<CreatePlanDto>) =>
    apiFetch<PlanDto>('/plan', { method: 'PUT', body: JSON.stringify(body) }),
};

// transactions
export const transactionsApi = {
  list: (page = 1, limit = 20) =>
    apiFetch<PaginatedTransactionsDto>(`/transactions?page=${page}&limit=${limit}`),
};

// ── Inline types (avoid importing from packages to keep web self-contained) ──
export interface WalletDto {
  id: string;
  currency: 'COP' | 'USD';
  balance: number;
}

export interface RecommendationDto {
  action: 'INVEST' | 'ACCUMULATE' | 'CONVERT';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  details: { usdNeeded?: number; monthsToThreshold?: number };
}

export interface MonthlySnapshot {
  month: number;
  contributed: number;
  totalInvested: number;
  totalValue: number;
  profit: number;
}

export interface SimulationResultDto {
  totalInvested: number;
  totalValue: number;
  profit: number;
  profitPercent: number;
  monthlyBreakdown: MonthlySnapshot[];
}

export interface ScenarioResultDto extends SimulationResultDto {
  label: string;
}

export interface PlanDto {
  id: string;
  monthlyContribution: number;
  investThresholdUsd: number;
  convertThresholdCop: number;
  etfAllocation: Record<string, number>;
}

export interface CreatePlanDto {
  monthlyContribution: number;
  investThresholdUsd?: number;
  convertThresholdCop?: number;
  etfAllocation: Record<string, number>;
}

export interface TransactionDto {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'CONVERT' | 'INVEST';
  amount: number;
  currency: string;
  note?: string;
  createdAt: string;
}

export interface PaginatedTransactionsDto {
  data: TransactionDto[];
  total: number;
  page: number;
  limit: number;
}
