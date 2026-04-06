'use client';
import { useWallets } from '@/hooks/useWallets';
import { Spinner } from '@/components/ui/Spinner';

function fmt(amount: number, currency: 'COP' | 'USD') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(amount);
}

export function WalletCards() {
  const { data, isLoading, error } = useWallets();

  if (isLoading) return <Spinner />;
  if (error) return <p className="text-red-500 text-sm">Error cargando billeteras</p>;
  if (!data?.length) return <p className="text-gray-400 text-sm">Sin billeteras aún</p>;

  return (
    <div className="grid grid-cols-2 gap-4">
      {data.map((w) => (
        <div key={w.id} className="bg-white rounded-xl border shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{w.currency}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(w.balance, w.currency)}</p>
        </div>
      ))}
    </div>
  );
}
