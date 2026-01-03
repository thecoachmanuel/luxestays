import { getSettings } from "@/lib/db"
import Image from "next/image"

export default async function AboutPage() {
  const settings = await getSettings()
  const { aboutPage } = settings

  if (!aboutPage) return null

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full">
        <Image
          src={aboutPage.heroImage}
          alt={aboutPage.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{aboutPage.title}</h1>
          <p className="text-xl md:text-2xl font-light">{aboutPage.subtitle}</p>
        </div>
      </div>

      {/* Story Section */}
      <div className="container mx-auto px-4 xl:px-20 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-[var(--brand)]">{aboutPage.storyTitle}</h2>
            <div className="prose prose-lg text-[var(--secondary)] whitespace-pre-line leading-relaxed">
              {aboutPage.storyContent}
            </div>
          </div>
          <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={aboutPage.storyImage}
              alt="Our Story"
              fill
              className="object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </div>

      {/* Mission, Vision & Objectives */}
      <div className="bg-[var(--secondary)]/5 py-20">
        <div className="container mx-auto px-4 xl:px-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Mission */}
            <div className="bg-[var(--background)] p-8 rounded-xl shadow-sm border border-[var(--secondary)]/10 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-[var(--brand)]/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-[var(--foreground)]">{aboutPage.missionTitle || "Our Mission"}</h3>
              <p className="text-[var(--secondary)] leading-relaxed">
                {aboutPage.missionContent || "To provide exceptional hospitality..."}
              </p>
            </div>

            {/* Vision */}
            <div className="bg-[var(--background)] p-8 rounded-xl shadow-sm border border-[var(--secondary)]/10 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-[var(--brand)]/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-[var(--foreground)]">{aboutPage.visionTitle || "Our Vision"}</h3>
              <p className="text-[var(--secondary)] leading-relaxed">
                {aboutPage.visionContent || "To be the leading provider..."}
              </p>
            </div>

            {/* Objectives */}
            <div className="bg-[var(--background)] p-8 rounded-xl shadow-sm border border-[var(--secondary)]/10 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-[var(--brand)]/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--brand)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-[var(--foreground)]">{aboutPage.objectivesTitle || "Our Objectives"}</h3>
              <div className="text-[var(--secondary)] leading-relaxed whitespace-pre-line">
                {aboutPage.objectivesContent || "1. Customer satisfaction..."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 border-t border-[var(--secondary)]/10">
        <div className="container mx-auto px-4 xl:px-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {aboutPage.stats.map((stat, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-[var(--background)] shadow-sm border border-[var(--secondary)]/10">
                <div className="text-4xl md:text-5xl font-bold text-[var(--brand)] mb-2">{stat.value}</div>
                <div className="text-[var(--secondary)] font-medium uppercase tracking-wider text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
