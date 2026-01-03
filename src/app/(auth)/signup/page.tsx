"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Loader2, Eye, EyeOff } from "lucide-react"

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: data.name,
            email: data.email,
            password: data.password
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to create account")
      }

      const callbackUrl = searchParams.get("callbackUrl")
      const redirectUrl = callbackUrl 
        ? `/signin?registered=true&callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/signin?registered=true"
      
      router.push(redirectUrl)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-[var(--secondary)]">
            Join us to start booking unique homes
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-xl bg-[var(--accent)]/10 p-4 text-sm text-[var(--accent)] border border-[var(--accent)]/20">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <input
                {...register("name")}
                className="relative block w-full rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--secondary)]/50 focus:z-10 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] sm:text-sm transition-colors"
                placeholder="Full Name"
              />
              {errors.name && <p className="mt-1 text-sm text-[var(--accent)]">{errors.name.message}</p>}
            </div>

            <div>
              <input
                {...register("email")}
                type="email"
                className="relative block w-full rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--secondary)]/50 focus:z-10 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] sm:text-sm transition-colors"
                placeholder="Email address"
              />
              {errors.email && <p className="mt-1 text-sm text-[var(--accent)]">{errors.email.message}</p>}
            </div>

            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                className="relative block w-full rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--secondary)]/50 focus:z-10 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] sm:text-sm transition-colors pr-10"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--secondary)] hover:text-[var(--foreground)] focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
              {errors.password && <p className="mt-1 text-sm text-[var(--accent)]">{errors.password.message}</p>}
            </div>

            <div className="relative">
              <input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                className="relative block w-full rounded-xl border border-[var(--secondary)]/20 bg-[var(--background)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--secondary)]/50 focus:z-10 focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] sm:text-sm transition-colors pr-10"
                placeholder="Confirm Password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--secondary)] hover:text-[var(--foreground)] focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
              {errors.confirmPassword && <p className="mt-1 text-sm text-[var(--accent)]">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex w-full justify-center rounded-xl bg-[var(--brand)] py-3.5 text-sm font-bold text-[var(--background)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Agree and Continue"
            )}
          </button>

          <div className="flex items-center justify-between text-sm">
            <div className="text-[var(--secondary)]/70">Already have an account?</div>
            <Link 
              href={searchParams.get("callbackUrl") ? `/signin?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl")!)}` : "/signin"} 
              className="font-semibold text-[var(--brand)] hover:underline"
            >
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
