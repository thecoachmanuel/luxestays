"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { AppSettings } from "@/types"

const signinSchema = z.object({
  email: z.string().min(1, "Username/Email is required"),
  password: z.string().min(1, "Password is required"),
})

type SigninFormValues = z.infer<typeof signinSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "AccessDenied") {
      setError("You must be an administrator to access this area.")
    }
  }, [searchParams])

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error("Failed to load settings", err))
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<SigninFormValues>({
    resolver: zodResolver(signinSchema),
  })

  const onSubmit = async (data: SigninFormValues) => {
    setIsSubmitting(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      })

      if (result?.error) {
        setError("Invalid admin credentials")
      } else {
        const callbackUrl = searchParams.get("callbackUrl") || "/admin"
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-grid-[var(--foreground)]/[0.02] -z-10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--secondary)]/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--secondary)]/10 to-transparent" />
      
      <div className="w-full max-w-md space-y-8 bg-[var(--background)] p-8 rounded-2xl shadow-xl border border-[var(--secondary)]/10 relative z-10 backdrop-blur-sm">
        <div className="text-center flex flex-col items-center">
             {settings?.appLogo ? (
                <img src={settings.appLogo} alt={settings.appName || "Admin"} className="h-16 w-auto object-contain mb-6 drop-shadow-sm" />
             ) : (
                <span className="text-4xl font-extrabold text-[var(--brand)] mb-6 tracking-tight">
                  {settings?.appName || "LuxeStays"}
                </span>
             )}
          <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-[var(--secondary)] font-medium">
            Secure login for administrators
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--secondary)] uppercase tracking-wider mb-1.5 ml-1">Username or Email</label>
              <input
                {...register("email")}
                className="relative block w-full rounded-xl border border-[var(--secondary)]/20 bg-[var(--secondary)]/5 px-4 py-3.5 text-[var(--foreground)] placeholder-[var(--secondary)]/40 focus:z-10 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 sm:text-sm transition-all duration-200"
                placeholder="Enter your admin credentials"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500 ml-1">{errors.email.message}</p>}
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-[var(--secondary)] uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="relative block w-full rounded-xl border border-[var(--secondary)]/20 bg-[var(--secondary)]/5 px-4 py-3.5 text-[var(--foreground)] placeholder-[var(--secondary)]/40 focus:z-10 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 sm:text-sm transition-all duration-200 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--secondary)] hover:text-[var(--foreground)] focus:outline-none p-1 rounded-md hover:bg-[var(--secondary)]/10 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500 ml-1">{errors.password.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex w-full justify-center items-center gap-2 rounded-xl bg-[var(--brand)] py-4 text-sm font-bold text-[var(--background)] hover:opacity-90 hover:translate-y-[-1px] hover:shadow-lg hover:shadow-[var(--brand)]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-200"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Access Dashboard"
            )}
          </button>
        </form>
      </div>
      
      <div className="absolute bottom-6 text-xs text-[var(--secondary)]/50">
        &copy; {new Date().getFullYear()} {settings?.appName || "LuxeStays"}. All rights reserved.
      </div>
    </div>
  )
}
