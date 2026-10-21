'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { initials } from '@/lib/format';

export default function InquiriesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [name, setName] = useState('');

  useEffect(() => {
    api<{ user: { name: string } }>('/api/auth/me')
      .then((res) => setName(res.user.name))
      .catch(() => {});
  }, []);

  async function signOut() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/inquiries" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-xs text-white">CI</span>
            Customer Inquiries
          </Link>
          <div className="flex items-center gap-3">
            {name && (
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                  {initials(name)}
                </span>
                <span className="hidden text-sm text-slate-700 sm:inline">{name}</span>
              </div>
            )}
            <button
              onClick={signOut}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}