'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import InquiryForm from '@/components/InquiryForm';

export default function NewInquiryPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div>
        <Link href="/inquiries" className="text-sm text-slate-500 hover:text-indigo-600">
          ← Back to inquiries
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New inquiry</h1>
        <p className="text-sm text-slate-500">Record what the customer asked for.</p>
      </div>
      <InquiryForm onCreated={(id) => router.push(`/inquiries/${id}`)} />
    </div>
  );
}