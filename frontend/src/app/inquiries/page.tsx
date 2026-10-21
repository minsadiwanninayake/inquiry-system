'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Inquiry } from '@/lib/types';
import { initials, timeAgo } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'New', value: 'New' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Resolved', value: 'Resolved' },
];

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inquiries</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'Loading...' : `${items.length} ${items.length === 1 ? 'inquiry' : 'inquiries'}`}
          </p>
        </div>
        <Link
          href="/inquiries/new"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          + New inquiry
        </Link>
      </div>

      <div className="space-y-3">
        <input
          aria-label="Search inquiries"
          placeholder="Search by name, contact or subject"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        />
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setStatus(f.value)}
              aria-pressed={status === f.value}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                status === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div aria-busy="true" className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-medium">{error}</p>
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-3 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="font-medium text-slate-800">
            {q || status ? 'No inquiries match your search.' : 'No inquiries yet. Create the first one.'}
          </p>
          {!q && !status && (
            <Link href="/inquiries/new" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
              Create an inquiry
            </Link>
          )}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id}>
              <Link
                href={`/inquiries/${i.id}`}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
                  {initials(i.customer_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.subject}</p>
                  <p className="truncate text-sm text-slate-500">
                    {i.customer_name} · {i.contact}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={i.status} />
                  <span className="text-xs text-slate-400">{timeAgo(i.updated_at)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}