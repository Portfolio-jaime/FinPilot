'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

const nav = [
  { href: '/dashboard', label: 'Resumen' },
  { href: '/dashboard/wallets', label: 'Billeteras' },
  { href: '/dashboard/investments', label: 'Inversiones' },
  { href: '/dashboard/transactions', label: 'Transacciones' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    clear();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-indigo-600 text-lg">FinPilot</span>
          <nav className="flex gap-1">
            {nav.map(({ href, label }) => (
              <Link
                key={href} href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Salir
        </button>
      </header>
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  );
}
