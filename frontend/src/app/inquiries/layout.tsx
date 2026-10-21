'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function InquiriesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function signOut() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow px-6 py-3 flex items-center justify-between">
        <Link href="/inquiries" className="font-semibold">Customer Inquiries</Link>
        <button onClick={signOut} className="text-sm text-gray-600 hover:underline">Sign out</button>
      </header>
      <div className="p-6 max-w-5xl mx-auto">{children}</div>
    </div>
  );
}