import { notFound } from "next/navigation"
import { getSettings } from "@/lib/db"
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function CustomPage({ params }: PageProps) {
  const { slug } = await params
  const settings = await getSettings()
  
  const page = settings.customPages?.find(p => p.slug === slug)

  if (!page) {
    notFound()
  }

  // Universal Page Layout
  // Supports optional Hero section and Markdown/HTML content
  const hasHero = page.data?.heroImage
  const isRawLayout = /<div|<section/i.test(page.content || '')

  return (
    <div className="w-full bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero Section */}
      {hasHero && (
        <div className="relative h-[60vh] w-full">
          <img src={page.data?.heroImage} alt="Hero" className="object-cover w-full h-full" />
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{page.title}</h1>
            {page.data?.subtitle && <p className="text-xl md:text-2xl font-light">{page.data.subtitle}</p>}
          </div>
        </div>
      )}

      {/* Content Section */}
      {isRawLayout ? (
        <div className="w-full">
          <ReactMarkdown 
            rehypePlugins={[rehypeRaw]}
            components={{
              div: ({node, ...props}) => <div {...props} />,
              section: ({node, ...props}) => <section {...props} />
            }}
          >
            {page.content}
          </ReactMarkdown>
        </div>
      ) : (
        <div className={`container mx-auto px-4 ${hasHero ? 'py-20' : 'py-12'} max-w-4xl`}>
          {!hasHero && <h1 className="text-3xl font-bold mb-6 text-[var(--foreground)]">{page.title}</h1>}
          <article className="prose lg:prose-xl max-w-none text-[var(--secondary)] leading-relaxed">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{page.content}</ReactMarkdown>
          </article>
        </div>
      )}
    </div>
  )
}
