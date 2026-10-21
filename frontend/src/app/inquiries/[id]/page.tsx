'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { Inquiry, NEXT_STATUSES, Status } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';

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

  if (loading) return <div aria-busy="true" className="h-40 bg-gray-200 rounded animate-pulse" />;

  if (notFound) {
    return (
      <div className="bg-white p-8 rounded text-center">
        <p className="font-medium mb-2">Inquiry not found, or you do not have access to it.</p>
        <Link href="/inquiries" className="text-blue-600 underline">Back to inquiries</Link>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div role="alert" className="bg-red-50 text-red-700 p-4 rounded">
        <p>{error || 'Something went wrong'}</p>
        <button onClick={load} className="mt-2 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Link href="/inquiries" className="text-sm text-blue-600 underline">Back to inquiries</Link>

      {stale && (
        <div role="alert" className="bg-yellow-50 text-yellow-800 p-3 rounded">
          This inquiry was changed in another tab or by someone else.{' '}
          <button onClick={load} className="underline font-medium">Reload</button>
        </div>
      )}
      {actionError && <p role="alert" className="bg-red-50 text-red-700 p-3 rounded">{actionError}</p>}

      <div className="bg-white p-6 rounded shadow space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{inquiry.subject}</h1>
          <StatusBadge status={inquiry.status} />
        </div>
        <p className="text-sm text-gray-600">{inquiry.customer_name} · {inquiry.contact}</p>
        <p className="whitespace-pre-wrap">{inquiry.description}</p>
        <p className="text-xs text-gray-500">
          Created {new Date(inquiry.created_at).toLocaleString()} · Updated {new Date(inquiry.updated_at).toLocaleString()}
        </p>
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-sm">Move to:</span>
        {NEXT_STATUSES[inquiry.status].map((s) => (
          <button key={s} onClick={() => changeStatus(s)} disabled={saving}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm disabled:opacity-50">
            {saving ? 'Saving...' : s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function InquiryDetailPage() {
  return (
    <Suspense fallback={<div aria-busy="true" className="h-40 bg-gray-200 rounded animate-pulse" />}>
      <InquiryDetail />
    </Suspense>
  );
}