'use client';

import { useRouter } from 'next/navigation';
import InquiryForm from '@/components/InquiryForm';

export default function NewInquiryPage() {
  const router = useRouter();
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">New inquiry</h1>
      <InquiryForm onCreated={(id) => router.push(`/inquiries/${id}`)} />
    </div>
  );
}