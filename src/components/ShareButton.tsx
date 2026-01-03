"use client"

import { useState, useEffect } from "react"
import { Share, X, Copy, Facebook, Twitter, Linkedin, Mail, MessageCircle } from "lucide-react"

interface ShareButtonProps {
  title: string
  description: string
  image: string
}

export function ShareButton({ title, description, image }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.href)
    }
  }, [])

  const shareLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: "bg-[#1877F2]",
      textColor: "text-white"
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: "bg-[#1DA1F2]",
      textColor: "text-white"
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`,
      color: "bg-[#25D366]",
      textColor: "text-white"
    },
    {
      name: "Pinterest",
      icon: null, // Will render custom P
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(image)}&description=${encodeURIComponent(title)}`,
      color: "bg-[#BD081C]",
      textColor: "text-white"
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent("Check out this apartment: " + url)}`,
      color: "bg-gray-600",
      textColor: "text-white"
    }
  ]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      // Simple feedback
      const btn = document.getElementById("copy-btn")
      if (btn) {
        const originalText = btn.innerText
        btn.innerText = "Copied!"
        setTimeout(() => {
          btn.innerText = originalText
        }, 2000)
      }
    } catch (err) {
      console.error("Failed to copy", err)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--secondary)]/10 rounded-md transition-colors font-medium underline text-[var(--foreground)]"
      >
        <Share className="h-4 w-4" />
        Share
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-[var(--background)] rounded-xl shadow-xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-2 hover:bg-[var(--secondary)]/10 rounded-full text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-xl font-semibold mb-6 text-[var(--foreground)]">Share this apartment</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {shareLinks.map((link) => (
                    <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-[var(--secondary)]/5 transition-colors border border-[var(--secondary)]/10 group"
                    >
                        <div className={`p-3 rounded-full ${link.textColor} ${link.color} transition-transform group-hover:scale-110`}>
                            {link.icon ? (
                                <link.icon className="h-6 w-6" />
                            ) : (
                                <span className="font-bold text-lg w-6 h-6 flex items-center justify-center">P</span>
                            )}
                        </div>
                        <span className="text-sm font-medium text-[var(--foreground)]">{link.name}</span>
                    </a>
                ))}
            </div>

            <div className="flex items-center gap-2 p-3 bg-[var(--secondary)]/5 rounded-lg border border-[var(--secondary)]/10">
                <Copy className="h-5 w-5 text-[var(--secondary)]" />
                <input 
                    type="text" 
                    value={url} 
                    readOnly 
                    className="flex-1 bg-transparent border-none text-sm text-[var(--secondary)] focus:ring-0 outline-none w-full"
                />
                <button 
                    id="copy-btn"
                    onClick={handleCopy}
                    className="text-sm font-semibold text-[var(--foreground)] hover:underline whitespace-nowrap px-2"
                >
                    Copy Link
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
