import { WalletCards } from '@/components/dashboard/WalletCards';
import { RecommendationBanner } from '@/components/dashboard/RecommendationBanner';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Resumen</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tu estado financiero actual</p>
      </div>

      <RecommendationBanner />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Billeteras</h2>
          <Link href="/dashboard/wallets" className="text-xs text-indigo-600 hover:underline">Ver todo →</Link>
        </div>
        <WalletCards />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Simulación rápida</h2>
          <Link href="/dashboard/investments" className="text-xs text-indigo-600 hover:underline">Ver simulador →</Link>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5 text-sm text-gray-400">
          Ve a Inversiones para proyectar tu portafolio a 12, 24 o 36 meses.
        </div>
      </section>
    </div>
  );
}
