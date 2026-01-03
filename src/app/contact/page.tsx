import { Mail, Phone, MapPin } from "lucide-react"
import { getSettings } from "@/lib/db"
import { ContactForm } from "@/components/ContactForm"
import { Metadata } from "next"

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.contactPage?.title || "Get in Touch",
    description: settings.contactPage?.description || "Contact us for inquiries",
  }
}

export default async function ContactPage() {
  const settings = await getSettings();
  const contact = settings.contactPage || {
    title: "Get in Touch",
    description: "Have questions about our apartments? We're here to help you find the perfect place for your stay.",
    email: "hello@luxestays.com",
    supportEmail: "support@luxestays.com",
    phone1: "+234 800 123 4567",
    phone2: "+234 800 987 6543",
    addressLine1: "123 Victoria Island,",
    addressLine2: "Lagos, Nigeria"
  };

  return (
    <div className="container mx-auto py-12 px-4 xl:px-20">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
          {contact.title}
        </h1>
        <p className="mt-4 text-lg text-[var(--secondary)] max-w-2xl mx-auto">
          {contact.description}
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Contact Information */}
        <div className="space-y-8">
            <div className="rounded-2xl bg-[var(--secondary)]/5 p-8 border border-[var(--secondary)]/10">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">Contact Information</h2>
                <div className="space-y-8">
                    <div className="flex items-start gap-4">
                        <div className="rounded-full bg-[var(--background)] p-3 shadow-sm border border-[var(--secondary)]/10">
                            <Mail className="h-5 w-5 text-[var(--foreground)]" />
                        </div>
                        <div>
                            <p className="font-semibold text-[var(--foreground)]">Email Us</p>
                            <p className="text-[var(--secondary)] mt-1">{contact.email}</p>
                            <p className="text-[var(--secondary)]">{contact.supportEmail}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                         <div className="rounded-full bg-[var(--background)] p-3 shadow-sm border border-[var(--secondary)]/10">
                            <Phone className="h-5 w-5 text-[var(--foreground)]" />
                        </div>
                        <div>
                            <p className="font-semibold text-[var(--foreground)]">Call Us</p>
                            <p className="text-[var(--secondary)] mt-1">{contact.phone1}</p>
                            <p className="text-[var(--secondary)]">{contact.phone2}</p>
                        </div>
                    </div>

                     <div className="flex items-start gap-4">
                         <div className="rounded-full bg-[var(--background)] p-3 shadow-sm border border-[var(--secondary)]/10">
                            <MapPin className="h-5 w-5 text-[var(--foreground)]" />
                        </div>
                        <div>
                            <p className="font-semibold text-[var(--foreground)]">Visit Us</p>
                            <p className="text-[var(--secondary)] mt-1">{contact.addressLine1}</p>
                            <p className="text-[var(--secondary)]">{contact.addressLine2}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Contact Form */}
        <ContactForm />
      </div>
    </div>
  )
}
