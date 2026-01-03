import { getWhyChooseUs } from "@/lib/db";
import { WhyChooseUsForm } from "@/components/admin/WhyChooseUsForm";

export default async function WhyChooseUsPage() {
  const items = await getWhyChooseUs();
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Edit "Why Choose Us"</h1>
      <WhyChooseUsForm initialItems={items} />
    </div>
  );
}
