import { getSettings } from "@/lib/db";
import { ContactPageForm } from "@/components/admin/ContactPageForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Page Settings | Admin Dashboard",
};

export const dynamic = 'force-dynamic';

export default async function ContactPageSettings() {
  const settings = await getSettings();

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-[var(--foreground)]">Contact Page Settings</h1>
      <ContactPageForm initialSettings={settings} />
    </div>
  );
}
