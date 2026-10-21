'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Inquiry, NEXT_STATUSES, Status } from '@/lib/types';
import { initials } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';

const STEPS: Status[] = ['New', 'In Progress', 'Resolved'];

function InquiryDetail() {
  const params = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [stale, setStale] = useState(false);
  const [actionError, setActionError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    setStale(false);
    setActionError('');
    try {
      const res = await api<{ inquiry: Inquiry }>(`/api/inquiries/${params.id}`);
      setInquiry(res.inquiry);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 400)) setNotFound(true);
      else setError(err instanceof ApiError ? err.message : 'Failed to load inquiry');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function changeStatus(next: Status) {
    if (!inquiry) return;
    setSaving(true);
    setActionError('');
    try {
      const res = await api<{ inquiry: Inquiry }>(`/api/inquiries/${inquiry.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next, version: inquiry.version }),
      });
      setInquiry(res.inquiry);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'STALE_VERSION') setStale(true);
      else setActionError(err instanceof ApiError ? err.message : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div aria-busy="true" className="h-64 animate-pulse rounded-2xl bg-slate-200" />;

  if (notFound) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <p className="mb-3 font-medium">Inquiry not found, or you do not have access to it.</p>
        <Link href="/inquiries" className="text-sm font-medium text-indigo-600 hover:underline">
          Back to inquiries
        </Link>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        <p className="font-medium">{error || 'Something went wrong'}</p>
        <button onClick={load} className="mt-3 text-sm underline">Retry</button>
      </div>
    );
  }

  const currentStep = STEPS.indexOf(inquiry.status);

  return (
    <div className="space-y-6">
      <Link href="/inquiries" className="text-sm text-slate-500 hover:text-indigo-600">
        ← Back to inquiries
      </Link>

      {stale && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This inquiry was changed in another tab or by someone else.{' '}
          <button onClick={load} className="font-semibold underline">Reload</button>
        </div>
      )}
      {actionError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">{inquiry.subject}</h1>
            <StatusBadge status={inquiry.status} />
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
              {initials(inquiry.customer_name)}
            </span>
            <div>
              <p className="text-sm font-medium">{inquiry.customer_name}</p>
              <p className="text-sm text-slate-500">{inquiry.contact}</p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{inquiry.description}</p>
          </div>
          <p className="text-xs text-slate-400">
            Created {new Date(inquiry.created_at).toLocaleString()} · Updated{' '}
            {new Date(inquiry.updated_at).toLocaleString()}
          </p>
        </div>

        <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Progress</h2>
          <ol className="space-y-3">
            {STEPS.map((s, idx) => (
              <li key={s} className="flex items-center gap-3">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                    idx <= currentStep ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {idx < currentStep ? '✓' : idx + 1}
                </span>
                <span className={`text-sm ${idx === currentStep ? 'font-semibold' : 'text-slate-500'}`}>{s}</span>
              </li>
            ))}
          </ol>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-sm text-slate-500">Move to:</p>
            <div className="flex flex-wrap gap-2">
              {NEXT_STATUSES[inquiry.status].map((s) => (
                <button
                  key={s}
                  onClick={() => changeStatus(s)}
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : s}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function InquiryDetailPage() {
  return (
    <Suspense fallback={<div aria-busy="true" className="h-64 animate-pulse rounded-2xl bg-slate-200" />}>
      <InquiryDetail />
    </Suspense>
  );
}