import { getSettings } from "@/lib/db";
import { AdvertForm } from "@/components/admin/AdvertForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advert Settings | Admin Dashboard",
};

export const dynamic = 'force-dynamic';

export default async function AdvertSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-[var(--foreground)]">Sidebar Advert Settings</h1>
      <p className="mb-6 text-[var(--secondary)]">Manage the advertisement banner displayed in the sidebar.</p>
      <AdvertForm initialSettings={settings} />
    </div>
  );
}
