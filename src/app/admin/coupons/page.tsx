"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Loader2, Trash2, Plus, Tag } from "lucide-react"
import { Coupon } from "@/types"

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Coupon>()

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/coupons')
      const data = await res.json()
      if (Array.isArray(data)) setCoupons(data)
    } catch (error) {
      console.error('Failed to fetch coupons', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: Coupon) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        reset()
        fetchCoupons()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create coupon')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (code: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    try {
      const res = await fetch(`/api/coupons/${code}`, { method: 'DELETE' })
      if (res.ok) {
        setCoupons(coupons.filter(c => c.code !== code))
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-2 text-[var(--foreground)]">
        <Tag className="h-6 w-6" />
        Coupon Management
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Create Coupon Form */}
        <div className="bg-[var(--background)] p-6 rounded-lg border border-[var(--secondary)]/20 shadow-sm h-fit">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[var(--foreground)]">
            <Plus className="h-4 w-4" />
            Create Coupon
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Coupon Code</label>
              <input
                {...register("code", { required: "Code is required", minLength: 3 })}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] uppercase bg-[var(--background)] text-[var(--foreground)]"
                placeholder="SUMMER2025"
              />
              {errors.code && <p className="text-[var(--accent)] text-xs mt-1">{errors.code.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Discount Type</label>
              <select
                {...register("discountType", { required: true })}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] bg-[var(--background)] text-[var(--foreground)]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₦)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Discount Value</label>
              <input
                type="number"
                {...register("discountValue", { required: true, min: 1, valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] bg-[var(--background)] text-[var(--foreground)]"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">Expiration Date</label>
              <input
                type="date"
                {...register("expirationDate", { required: true })}
                className="mt-1 block w-full rounded-md border border-[var(--secondary)]/20 px-3 py-2 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-[var(--brand)] bg-[var(--background)] text-[var(--foreground)]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--brand)] text-[var(--background)] px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 flex justify-center items-center gap-2 transition-opacity"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Coupon"}
            </button>
          </form>
        </div>

        {/* Coupon List */}
        <div className="md:col-span-2">
          <div className="bg-[var(--background)] rounded-lg border border-[var(--secondary)]/20 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[var(--secondary)]/20">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">Active Coupons</h2>
            </div>
            
            {loading ? (
                <div className="p-8 text-center text-[var(--secondary)]">Loading coupons...</div>
            ) : coupons.length === 0 ? (
                <div className="p-8 text-center text-[var(--secondary)]">No coupons created yet.</div>
            ) : (
                <table className="w-full text-sm text-left text-[var(--foreground)]">
                    <thead className="bg-[var(--secondary)]/5 text-[var(--secondary)] uppercase">
                        <tr>
                            <th className="px-6 py-3">Code</th>
                            <th className="px-6 py-3">Discount</th>
                            <th className="px-6 py-3">Expires</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {coupons.map((coupon) => (
                            <tr key={coupon.code} className="border-b border-[var(--secondary)]/10 hover:bg-[var(--secondary)]/5">
                                <td className="px-6 py-4 font-medium">{coupon.code}</td>
                                <td className="px-6 py-4">
                                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₦${coupon.discountValue}`}
                                </td>
                                <td className="px-6 py-4">
                                    {new Date(coupon.expirationDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleDelete(coupon.code)}
                                        className="text-[var(--accent)] hover:opacity-80"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
