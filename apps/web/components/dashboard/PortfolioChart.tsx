'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { MonthlySnapshot } from '@/lib/api';

export function PortfolioChart({ data }: { data: MonthlySnapshot[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis dataKey="month" tickFormatter={(v) => `M${v}`} tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={52} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => [`$${Number(v).toLocaleString('es-CO')}`, '']} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line dataKey="totalValue" name="Valor total" stroke="#6366f1" strokeWidth={2} dot={false} />
        <Line dataKey="totalInvested" name="Invertido" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  );
}
