"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, User, LogOut, LayoutDashboard, Search, Globe, Heart, MessageSquare } from 'lucide-react'
import { AppSettings } from '@/types'

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('query') || "")
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const customPages = settings?.customPages || []

  useEffect(() => {
    const query = searchParams?.get('query')
    if (query !== null && query !== undefined) {
      if (query !== searchQuery) {
        setSearchQuery(query)
      }
    } else if (pathname !== '/apartments' && searchQuery) {
      setSearchQuery("")
    }
  }, [searchParams, pathname])

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data)
      })
      .catch(err => console.error("Failed to load settings", err))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQuery = searchParams?.get('query') || ""
      if (searchQuery === currentQuery) return

      if (searchQuery.trim()) {
        const newPath = `/apartments?query=${encodeURIComponent(searchQuery)}`
        if (pathname === '/apartments') {
          router.replace(newPath)
        } else {
          router.push(newPath)
        }
      } else if (pathname === '/apartments' && currentQuery) {
        router.replace('/apartments')
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, pathname, router, searchParams])

  const toggleMenu = () => setIsOpen(!isOpen)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="sticky top-0 z-50 flex flex-col w-full">
        <nav className="border-b bg-[var(--background)] border-[var(--secondary)]/20">
          <div className="container mx-auto px-4 xl:px-20">
            <div className="flex h-20 items-center justify-between gap-4">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                 {settings?.appLogo ? (
                    <img src={settings.appLogo} alt={settings.appName || "LuxeStays"} className="h-8 w-auto object-contain" />
                 ) : (
                    <span className="text-2xl font-bold text-[var(--brand)]">
                      {settings?.appName || "LuxeStays"}
                    </span>
                 )}
              </Link>

              {/* Search Bar (Desktop) */}
              <form onSubmit={handleSearch} className="hidden md:flex items-center border border-[var(--secondary)]/20 rounded-full py-2 px-4 shadow-sm hover:shadow-md transition-shadow bg-[var(--background)] w-[300px] lg:w-[400px]">
                <input 
                  type="text" 
                  placeholder="Search apartment..." 
                  className="flex-grow bg-transparent border-none outline-none text-sm placeholder:text-[var(--secondary)] text-[var(--foreground)]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="bg-[var(--brand)] p-2 rounded-full text-[var(--background)] ml-2 hover:opacity-90 transition-opacity">
                  <Search size={14} strokeWidth={3} />
                </button>
              </form>

              {/* Right Section */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link 
                  href="/about" 
                  className="text-sm font-semibold hover:bg-[var(--secondary)]/10 px-4 py-2 rounded-full transition-colors hidden lg:block text-[var(--foreground)]"
                >
                  About Us
                </Link>
                <Link 
                  href="/apartments" 
                  className="text-sm font-semibold hover:bg-[var(--secondary)]/10 px-4 py-2 rounded-full transition-colors hidden lg:block text-[var(--foreground)]"
                >
                  Browse Apartments
                </Link>
                <button className="p-3 hover:bg-[var(--secondary)]/10 rounded-full transition-colors hidden sm:block text-[var(--foreground)]">
                  <Globe size={18} />
                </button>
                
                {/* User Menu Button */}
                <div className="relative">
                  <button 
                    onClick={toggleMenu}
                    className="flex items-center gap-2 border border-[var(--secondary)]/20 rounded-full p-1 pl-3 hover:shadow-md transition-shadow cursor-pointer ml-1 text-[var(--foreground)]"
                  >
                    <Menu size={18} />
                    {session?.user?.image ? (
                       <img 
                         src={session.user.image} 
                         alt={session.user.name || "User"} 
                         className="h-8 w-8 rounded-full object-cover border border-[var(--secondary)]/20"
                       />
                    ) : (
                      <div className="bg-[var(--secondary)] text-[var(--background)] rounded-full p-1">
                        <User size={18} className="fill-current" />
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-80 bg-[var(--background)] rounded-xl shadow-[0_6px_16px_rgba(0,0,0,0.12)] border border-[var(--secondary)]/20 py-2 z-50 overflow-y-auto max-h-[80vh]">
                      {session ? (
                        <>
                          <div className="px-4 py-3 border-b border-[var(--secondary)]/10">
                            <p className="text-sm font-semibold text-[var(--foreground)]">Signed in as</p>
                            <p className="text-sm text-[var(--secondary)] truncate">{session.user?.email}</p>
                          </div>
                          
                          {session.user?.role === 'admin' && (
                            <>
                              <Link 
                                href="/admin" 
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                                onClick={() => setIsOpen(false)}
                              >
                                <LayoutDashboard size={16} />
                                Admin Dashboard
                              </Link>
                              <Link 
                                href="/admin/chat" 
                                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                                onClick={() => setIsOpen(false)}
                              >
                                <MessageSquare size={16} />
                                Live Chat
                              </Link>
                            </>
                          )}
                          
                          <Link 
                            href="/profile" 
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <User size={16} />
                            My Profile
                          </Link>

                          <Link 
                            href="/favorites" 
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            <Heart size={16} />
                            My Favorites
                          </Link>

                          {session.user?.role !== 'admin' && (
                            <Link 
                              href="/bookings" 
                              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                              onClick={() => setIsOpen(false)}
                            >
                              <Globe size={16} />
                              My Bookings
                            </Link>
                          )}

                          <div className="border-t border-[var(--secondary)]/10 my-1"></div>

                          <button
                            onClick={() => {
                                signOut({ callbackUrl: '/' })
                                setIsOpen(false)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--secondary)]/10 transition-colors text-left"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link 
                            href="/signin" 
                            className="block px-4 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Sign In
                          </Link>
                          <Link 
                            href="/signup" 
                            className="block px-4 py-3 text-sm font-normal text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            Sign Up
                          </Link>
                        </>
                      )}

                      <div className="border-t border-[var(--secondary)]/10 my-1"></div>
                      
                      <Link 
                        href="/" 
                        className="block px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Home
                      </Link>
                      <Link 
                        href="/about" 
                        className="block px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        About Us
                      </Link>
                      <Link 
                        href="/apartments" 
                        className="block px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Apartments
                      </Link>
                      <Link 
                        href="/contact" 
                        className="block px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Contact
                      </Link>
                      
                      {customPages.map(page => (
                        <Link 
                          key={page.slug}
                          href={`/${page.slug}`} 
                          className="block px-4 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]/10 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          {page.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile Search Bar (Visible only on small screens) */}
            <div className="md:hidden pb-4">
                <form onSubmit={handleSearch} className="flex items-center border border-[var(--secondary)]/20 rounded-full py-3 px-4 shadow-sm bg-[var(--secondary)]/5">
                    <Search size={18} className="text-[var(--secondary)] mr-3" />
                    <input 
                        type="text" 
                        placeholder="Search apartment..." 
                        className="flex-grow bg-transparent border-none outline-none text-sm placeholder:text-[var(--secondary)] text-[var(--foreground)]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>
          </div>
        </nav>
        
        {/* Credit Bar */}
        <div className="bg-[var(--foreground)] text-[var(--background)] py-1.5 text-center text-xs font-medium">
             Website built by Manuel. Interested in purchasing? Contact <a href="tel:+2348168882014" className="underline hover:opacity-80 transition-opacity">+2348168882014</a>
        </div>
    </div>
  )
}
