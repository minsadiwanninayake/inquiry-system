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
      className: `w-full border rounded px-3 py-2 ${errors[name] ? 'border-red-500' : ''}`,
    };
    return (
      <div>
        <label htmlFor={name} className="block text-sm mb-1">{label}</label>
        {multiline ? <textarea rows={4} {...common} /> : <input {...common} />}
        {errors[name] && <p className="text-sm text-red-600 mt-1">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow max-w-xl" noValidate>
      {formError && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 p-2 rounded">{formError}</p>
      )}
      {field('customer_name', 'Customer name')}
      {field('contact', 'Contact (phone or email)')}
      {field('subject', 'Subject')}
      {field('description', 'Description', true)}
      <button type="submit" disabled={saving}
        className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save inquiry'}
      </button>
    </form>
  );
}