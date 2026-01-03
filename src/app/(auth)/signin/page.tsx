"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Loader2, Eye, EyeOff } from "lucide-react"

const signinSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
})

type SigninFormValues = z.infer<typeof signinSchema>

export default function SigninPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

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
        setError("Invalid email or password")
      } else {
        const callbackUrl = searchParams.get("callbackUrl") || "/"
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-[var(--secondary)]">
            Login to your account to continue
          </p>
        </div>

        {registered && (
          <div className="rounded-xl bg-[var(--brand)]/10 p-4 text-sm text-[var(--brand)] border border-[var(--brand)]/20">
            Account created successfully! Please sign in.
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-xl bg-[var(--accent)]/10 p-4 text-sm text-[var(--accent)] border border-[var(--accent)]/20">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <input
                {...register("email")}
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex w-full justify-center rounded-xl bg-[var(--brand)] py-3.5 text-sm font-bold text-[var(--background)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Continue"
            )}
          </button>

          <div className="flex items-center justify-between text-sm">
            <div className="text-[var(--secondary)]/70">Don't have an account?</div>
            <Link 
              href={searchParams.get("callbackUrl") ? `/signup?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl")!)}` : "/signup"} 
              className="font-semibold text-[var(--brand)] hover:underline"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
