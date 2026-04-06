'use client';
import { useState } from 'react';
import { useRecommendation, useSimulation, useScenarios } from '@/hooks/useInvestments';
import { RecommendationBanner } from '@/components/dashboard/RecommendationBanner';
import { PortfolioChart } from '@/components/dashboard/PortfolioChart';
import { Spinner } from '@/components/ui/Spinner';

const MONTH_OPTIONS = [12, 24, 36, 60];

export default function InvestmentsPage() {
  const { data: rec } = useRecommendation();
  const [months, setMonths] = useState(36);
  const { data: sim, isLoading: simLoading } = useSimulation(months);
  const { data: scenarios } = useScenarios();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Inversiones</h1>

      <RecommendationBanner />

      {rec?.details.usdNeeded && (
        <div className="bg-white rounded-xl border shadow-sm p-4 text-sm text-gray-600">
          Necesitas <strong>${rec.details.usdNeeded.toFixed(0)} USD</strong> más para alcanzar el umbral de inversión.
        </div>
      )}

      {/* Simulator */}
      <section className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Simulador de crecimiento</h2>
          <div className="flex gap-1">
            {MONTH_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${months === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {simLoading ? <Spinner /> : sim && (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Invertido</p>
                <p className="font-bold text-sm">${sim.totalInvested.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Valor final</p>
                <p className="font-bold text-sm text-indigo-600">${sim.totalValue.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Ganancia</p>
                <p className={`font-bold text-sm ${sim.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {sim.profitPercent}%
                </p>
              </div>
            </div>
            <PortfolioChart data={sim.monthlyBreakdown} />
          </>
        )}
      </section>

      {/* Scenarios */}
      {scenarios && scenarios.length > 0 && (
        <section className="bg-white rounded-xl border shadow-sm p-5 space-y-3">
          <h2 className="font-semibold">Comparación de escenarios (36 meses)</h2>
          <div className="grid grid-cols-3 gap-3">
            {scenarios.map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs font-medium text-gray-500 mb-1">{s.label}</p>
                <p className="font-bold text-sm">${s.totalValue.toLocaleString('es-CO')}</p>
                <p className="text-xs text-green-600">+{s.profitPercent}%</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
