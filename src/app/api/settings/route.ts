import { NextResponse } from "next/server"
import { getSettings, updateSettings } from "@/lib/db"
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getSettings()
  return NextResponse.json(settings)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // In a real app, validate body
    await updateSettings(body)

    // Also update .env.local if paystack keys are present
    if (body.paystackPublicKey || body.paystackSecretKey) {
        try {
            const envPath = path.join(process.cwd(), '.env.local')
            let envContent = ''
            
            try {
                envContent = await fs.readFile(envPath, 'utf8')
            } catch (err) {
                // File might not exist, start empty
            }

            const envVars = envContent.split('\n').filter(Boolean)
            let newEnvContent = envVars.map(line => {
                if (line.startsWith('NEXT_PUBLIC_PAYSTACK_KEY=') && body.paystackPublicKey) {
                    return `NEXT_PUBLIC_PAYSTACK_KEY=${body.paystackPublicKey}`
                }
                if (line.startsWith('PAYSTACK_SECRET_KEY=') && body.paystackSecretKey) {
                    return `PAYSTACK_SECRET_KEY=${body.paystackSecretKey}`
                }
                return line
            })

            // Add if missing
            const hasPublicKey = newEnvContent.some(line => line.startsWith('NEXT_PUBLIC_PAYSTACK_KEY='))
            if (!hasPublicKey && body.paystackPublicKey) {
                newEnvContent.push(`NEXT_PUBLIC_PAYSTACK_KEY=${body.paystackPublicKey}`)
            }

            const hasSecretKey = newEnvContent.some(line => line.startsWith('PAYSTACK_SECRET_KEY='))
            if (!hasSecretKey && body.paystackSecretKey) {
                newEnvContent.push(`PAYSTACK_SECRET_KEY=${body.paystackSecretKey}`)
            }

            await fs.writeFile(envPath, newEnvContent.join('\n') + '\n')
        } catch (envError) {
            console.error("Failed to update .env.local:", envError)
            // Don't fail the request if env update fails, just log it
        }
    }

    return NextResponse.json({ message: "Settings updated successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
