'use client';
import { useRecommendation } from '@/hooks/useInvestments';
import { Spinner } from '@/components/ui/Spinner';

const cfg = {
  high:   { bg: 'bg-green-50 border-green-200',  text: 'text-green-800',  badge: 'bg-green-100 text-green-700' },
  medium: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700' },
  low:    { bg: 'bg-blue-50 border-blue-200',     text: 'text-blue-800',   badge: 'bg-blue-100 text-blue-700' },
};

export function RecommendationBanner() {
  const { data, isLoading, error } = useRecommendation();

  if (isLoading) return <Spinner />;
  if (error) return null;
  if (!data) return null;

  const c = cfg[data.urgency];
  return (
    <div className={`rounded-xl border p-4 ${c.bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{data.action}</span>
      </div>
      <p className={`font-semibold ${c.text}`}>{data.message}</p>
      {data.details.monthsToThreshold && (
        <p className={`text-xs mt-1 opacity-70 ${c.text}`}>
          ~{data.details.monthsToThreshold} mes(es) para el umbral
        </p>
      )}
    </div>
  );
}
