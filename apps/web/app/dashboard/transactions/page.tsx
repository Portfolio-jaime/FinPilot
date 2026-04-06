'use client';
import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { Spinner } from '@/components/ui/Spinner';

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Depósito',
  WITHDRAWAL: 'Retiro',
  CONVERT: 'Conversión',
  INVEST: 'Inversión',
};

const TYPE_COLORS: Record<string, string> = {
  DEPOSIT: 'bg-green-100 text-green-700',
  WITHDRAWAL: 'bg-red-100 text-red-700',
  CONVERT: 'bg-yellow-100 text-yellow-700',
  INVEST: 'bg-indigo-100 text-indigo-700',
};

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTransactions(page);

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Transacciones</h1>

      {isLoading ? <Spinner /> : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {!data?.data.length ? (
            <p className="text-gray-400 text-sm p-6">Sin transacciones aún.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-right px-4 py-3">Monto</th>
                  <th className="text-left px-4 py-3">Moneda</th>
                  <th className="text-left px-4 py-3">Nota</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.data.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[tx.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[tx.type] ?? tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{tx.amount.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3 text-gray-500">{tx.currency}</td>
                    <td className="px-4 py-3 text-gray-400">{tx.note ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg border disabled:opacity-40 hover:bg-gray-100">← Anterior</button>
          <span className="text-gray-500">Página {page} de {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg border disabled:opacity-40 hover:bg-gray-100">Siguiente →</button>
        </div>
      )}
    </div>
  );
}
