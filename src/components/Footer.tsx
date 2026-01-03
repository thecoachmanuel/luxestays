import { getSettings } from "@/lib/db"
import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export async function Footer() {
  const settings = await getSettings()
  const footer = settings.footerSettings

  // Fallback for when footer settings haven't been configured yet
  if (!footer || (!footer.columns.length && !footer.description)) {
     return (
        <footer className="border-t border-[var(--secondary)]/20 bg-[var(--secondary)]/5 py-8 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-[var(--secondary)]">
            {footer?.copyrightText || `© ${new Date().getFullYear()} ${settings.appName}. All rights reserved.`}
          </div>
        </footer>
     )
  }

  return (
    <footer className="border-t border-[var(--secondary)]/20 bg-[var(--secondary)]/5 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4 xl:px-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-1">
                <h3 className="font-bold text-lg mb-4 text-[var(--foreground)]">{settings.appName}</h3>
                {footer.description && (
                    <p className="text-[var(--secondary)] text-sm mb-6 max-w-xs">{footer.description}</p>
                )}
                {settings.address && (
                    <div className="mb-6 text-sm text-[var(--secondary)]">
                        <p className="font-semibold mb-1 text-[var(--foreground)]">Address:</p>
                        <p className="whitespace-pre-line">{settings.address}</p>
                    </div>
                )}
                {footer.socialLinks && (
                    <div className="flex gap-4">
                        {footer.socialLinks.facebook && (
                            <a href={footer.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors">
                                <Facebook size={20} />
                            </a>
                        )}
                        {footer.socialLinks.twitter && (
                            <a href={footer.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors">
                                <Twitter size={20} />
                            </a>
                        )}
                        {footer.socialLinks.instagram && (
                            <a href={footer.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors">
                                <Instagram size={20} />
                            </a>
                        )}
                         {footer.socialLinks.linkedin && (
                            <a href={footer.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors">
                                <Linkedin size={20} />
                            </a>
                        )}
                    </div>
                )}
            </div>

            {/* Dynamic Columns */}
            {footer.columns.map((col, idx) => (
                <div key={idx}>
                    <h4 className="font-semibold mb-4 text-[var(--foreground)]">{col.title}</h4>
                    <ul className="space-y-3">
                        {col.links.map((link, linkIdx) => (
                            <li key={linkIdx}>
                                <Link href={link.url} className="text-[var(--secondary)] hover:text-[var(--foreground)] text-sm transition-colors">
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
        
        <div className="border-t border-[var(--secondary)]/20 pt-8 text-center text-sm text-[var(--secondary)]">
            <p className="mb-2">{footer.copyrightText || `© ${new Date().getFullYear()} ${settings.appName}. All rights reserved.`}</p>
            <p className="text-xs opacity-75">
                Website built by Manuel. Interested in purchasing? Contact <a href="tel:+2348168882014" className="hover:text-[var(--foreground)] transition-colors">+2348168882014</a>
            </p>
        </div>
      </div>
    </footer>
  )
}
