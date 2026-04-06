'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallets } from '@/hooks/useWallets';
import { walletsApi } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';

function fmt(amount: number, currency: 'COP' | 'USD') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency,
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(amount);
}

export default function WalletsPage() {
  const { data, isLoading } = useWallets();
  const qc = useQueryClient();
  const [depositForm, setDepositForm] = useState({ currency: 'COP' as 'COP' | 'USD', amount: '' });
  const [convertForm, setConvertForm] = useState({ amountCop: '', exchangeRate: '' });
  const [msg, setMsg] = useState('');

  const deposit = useMutation({
    mutationFn: walletsApi.deposit,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); setMsg('Depósito exitoso'); setDepositForm({ currency: 'COP', amount: '' }); },
  });

  const convert = useMutation({
    mutationFn: walletsApi.convert,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); setMsg('Conversión exitosa'); setConvertForm({ amountCop: '', exchangeRate: '' }); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Billeteras</h1>

      {isLoading ? <Spinner /> : (
        <div className="grid grid-cols-2 gap-4">
          {data?.map((w) => (
            <div key={w.id} className="bg-white rounded-xl border shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{w.currency}</p>
              <p className="text-2xl font-bold mt-1">{fmt(w.balance, w.currency)}</p>
            </div>
          ))}
        </div>
      )}

      {msg && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">{msg}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-sm">Depositar</h2>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={depositForm.currency}
            onChange={(e) => setDepositForm({ ...depositForm, currency: e.target.value as 'COP' | 'USD' })}
          >
            <option value="COP">COP</option>
            <option value="USD">USD</option>
          </select>
          <input
            type="number" min="1" placeholder="Monto"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={depositForm.amount}
            onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
          />
          <button
            onClick={() => deposit.mutate({ currency: depositForm.currency, amount: Number(depositForm.amount) })}
            disabled={!depositForm.amount || deposit.isPending}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {deposit.isPending ? 'Procesando...' : 'Depositar'}
          </button>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-sm">Convertir COP → USD</h2>
          <input
            type="number" min="1" placeholder="Monto COP"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={convertForm.amountCop}
            onChange={(e) => setConvertForm({ ...convertForm, amountCop: e.target.value })}
          />
          <input
            type="number" min="1" placeholder="TRM (ej: 4200)"
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={convertForm.exchangeRate}
            onChange={(e) => setConvertForm({ ...convertForm, exchangeRate: e.target.value })}
          />
          <button
            onClick={() => convert.mutate({ amountCop: Number(convertForm.amountCop), exchangeRate: Number(convertForm.exchangeRate) })}
            disabled={!convertForm.amountCop || !convertForm.exchangeRate || convert.isPending}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {convert.isPending ? 'Procesando...' : 'Convertir'}
          </button>
        </div>
      </div>
    </div>
  );
}
