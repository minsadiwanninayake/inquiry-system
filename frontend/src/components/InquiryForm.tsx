'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';

interface Props {
  onCreated: (id: number) => void;
}

const empty = { customer_name: '', contact: '', subject: '', description: '' };

export default function InquiryForm({ onCreated }: Props) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customer_name.trim()) e.customer_name = 'Customer name is required';
    if (form.contact.trim().length < 3) e.contact = 'Enter a phone number or email';
    if (!form.subject.trim()) e.subject = 'Subject is required';
    if (!form.description.trim()) e.description = 'Description is required';
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      const res = await api<{ inquiry: { id: number } }>('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onCreated(res.inquiry.id);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fields) setErrors(err.fields);
        setFormError(err.message);
      } else {
        setFormError('Something went wrong. Your text is kept, please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  function field(name: keyof typeof empty, label: string, multiline = false) {
    const common = {
      id: name,
      value: form[name],
      onChange: (ev: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) =>
        setForm({ ...form, [name]: ev.target.value }),
      className: `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:ring-4 ${
        errors[name]
          ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
          : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
      }`,
    };
    return (
      <div>
        <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
        {multiline ? <textarea rows={5} {...common} /> : <input {...common} />}
        {errors[name] && <p className="mt-1.5 text-sm text-red-600">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {formError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {field('customer_name', 'Customer name')}
        {field('contact', 'Contact (phone or email)')}
      </div>
      {field('subject', 'Subject')}
      {field('description', 'Description', true)}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save inquiry'}
        </button>
      </div>
    </form>
  );
}