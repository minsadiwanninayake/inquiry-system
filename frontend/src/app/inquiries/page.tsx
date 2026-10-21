'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Inquiry } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';

export default function InquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    api<{ inquiries: Inquiry[] }>(`/api/inquiries?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setItems(res.inquiries);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load inquiries');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, q, reloadKey]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Inquiries</h1>
        <Link href="/inquiries/new" className="bg-blue-600 text-white rounded px-4 py-2 text-sm">
          New inquiry
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          aria-label="Search inquiries"
          placeholder="Search name, contact or subject"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 min-w-[200px]"
        />
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2">
          <option value="">All statuses</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {loading && (
        <div aria-busy="true" className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-14 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="bg-red-50 text-red-700 p-4 rounded">
          <p>{error}</p>
          <button onClick={() => setReloadKey((k) => k + 1)} className="mt-2 underline">Retry</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="bg-white p-8 rounded text-center text-gray-600">
          {q || status ? 'No inquiries match your search.' : 'No inquiries yet. Create the first one.'}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="bg-white rounded shadow divide-y">
          {items.map((i) => (
            <li key={i.id}>
              <Link href={`/inquiries/${i.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div>
                  <p className="font-medium">{i.subject}</p>
                  <p className="text-sm text-gray-600">{i.customer_name} · {i.contact}</p>
                </div>
                <StatusBadge status={i.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}