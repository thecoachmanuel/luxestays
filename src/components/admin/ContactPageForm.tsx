'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSettings } from '@/types';

interface ContactPageFormProps {
  initialSettings: AppSettings;
}

export function ContactPageForm({ initialSettings }: ContactPageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialSettings.contactPage?.title || "Get in Touch",
    description: initialSettings.contactPage?.description || "Have questions about our apartments? We're here to help you find the perfect place for your stay.",
    email: initialSettings.contactPage?.email || "hello@luxestays.com",
    supportEmail: initialSettings.contactPage?.supportEmail || "support@luxestays.com",
    phone1: initialSettings.contactPage?.phone1 || "+234 800 123 4567",
    phone2: initialSettings.contactPage?.phone2 || "+234 800 987 6543",
    addressLine1: initialSettings.contactPage?.addressLine1 || "123 Victoria Island,",
    addressLine2: initialSettings.contactPage?.addressLine2 || "Lagos, Nigeria",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactPage: formData,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update settings');
      }

      router.refresh();
      alert('Contact page settings updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--background)] p-6 rounded-lg shadow border border-[var(--secondary)]/20">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Page Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Primary Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Support Email</label>
          <input
            type="email"
            name="supportEmail"
            value={formData.supportEmail}
            onChange={handleChange}
            className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Phone 1</label>
          <input
            type="text"
            name="phone1"
            value={formData.phone1}
            onChange={handleChange}
            className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Phone 2</label>
          <input
            type="text"
            name="phone2"
            value={formData.phone2}
            onChange={handleChange}
            className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Address Line 1</label>
          <input
            type="text"
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleChange}
            className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Address Line 2</label>
          <input
            type="text"
            name="addressLine2"
            value={formData.addressLine2}
            onChange={handleChange}
            className="w-full border border-[var(--secondary)]/20 rounded p-2 bg-[var(--background)] text-[var(--foreground)]"
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[var(--brand)] text-white px-6 py-2 rounded hover:bg-[var(--brand)]/90 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
