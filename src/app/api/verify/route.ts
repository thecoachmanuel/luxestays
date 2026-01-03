import { NextResponse } from "next/server"
import { getSettings } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { reference } = body

    if (!reference) {
        return NextResponse.json({ status: "error", message: "No reference provided" }, { status: 400 })
    }

    const settings = await getSettings()
    const secretKey = settings.paystackSecretKey
    if (!secretKey) {
        console.warn("PAYSTACK_SECRET_KEY is not set. Skipping verification.")
        // Fallback for dev/demo if no key set, or return error? 
        // Better to return error if user expects keys to work.
        // But for safety let's return success if no key to avoid breaking app if they forget?
        // No, user specifically asked for keys to reflect.
        return NextResponse.json({ status: "error", message: "Server configuration error: Missing Secret Key" }, { status: 500 })
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` }
    })
    
    if (!verifyRes.ok) {
        throw new Error(`Paystack API error: ${verifyRes.statusText}`)
    }

    const verifyData = await verifyRes.json()

    if (verifyData.data.status !== 'success') {
         return NextResponse.json({ status: "error", message: "Payment verification failed" }, { status: 400 })
    }
    
    return NextResponse.json({ status: "success", message: "Payment verified", data: verifyData.data })
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ status: "error", message: "Verification failed" }, { status: 500 })
  }
}
