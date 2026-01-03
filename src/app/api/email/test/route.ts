import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { EmailSettings } from "@/types"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { emailSettings, to } = body as { emailSettings: EmailSettings, to: string }

    if (!emailSettings) {
      return NextResponse.json({ error: "Missing email settings" }, { status: 400 })
    }

    if (!to) {
      return NextResponse.json({ error: "Missing recipient email" }, { status: 400 })
    }

    console.log("[Email Test] Testing configuration...", emailSettings.provider)

    if (emailSettings.provider === 'mock') {
        return NextResponse.json({ message: "Mock email 'sent' successfully (check console logs)" })
    }

    if (emailSettings.provider === 'smtp') {
        // Auto-detect secure if not explicitly set
        let isSecure = emailSettings.secure;
        
        // Fix common misconfiguration for Port 465 (SMTPS)
        if (emailSettings.port === 465 && isSecure === false) {
            isSecure = true;
        }
        // Default to false if undefined
        if (isSecure === undefined) {
             isSecure = emailSettings.port === 465;
        }

        const transporter = nodemailer.createTransport({
            host: emailSettings.host,
            port: emailSettings.port,
            secure: isSecure,
            auth: {
                user: emailSettings.user,
                pass: emailSettings.password,
            },
            // Debug options for testing
            debug: true,
            logger: true 
        })

        // Verify connection first
        await transporter.verify()
        console.log("[Email Test] SMTP Connection verified")

        // Send test email
        const info = await transporter.sendMail({
            from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
            to: to,
            subject: "Test Email - Apartment Booking App",
            text: "This is a test email to verify your SMTP settings.",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #333;">SMTP Configuration Test</h2>
                    <p>If you are reading this, your email settings are configured correctly!</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #888;">Sent from Apartment Booking App Admin Panel</p>
                </div>
            `
        })

        return NextResponse.json({ 
            message: "Test email sent successfully!", 
            messageId: info.messageId 
        })
    }

    if (emailSettings.provider === 'resend') {
         if (!emailSettings.apiKey) {
            return NextResponse.json({ error: "Missing Resend API Key" }, { status: 400 })
         }

         const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${emailSettings.apiKey}`
              },
              body: JSON.stringify({
                  from: `"${emailSettings.fromName}" <${emailSettings.fromEmail}>`,
                  to: to,
                  subject: "Test Email - Apartment Booking App",
                  html: "<p>This is a test email to verify your Resend API settings.</p>"
              })
          });
          
          if (!res.ok) {
              const err = await res.json();
              throw new Error(err.message || "Failed to send via Resend");
          }

          return NextResponse.json({ message: "Test email sent successfully via Resend!" })
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 })

  } catch (error: any) {
    console.error("[Email Test] Error:", error)
    return NextResponse.json({ 
        error: error.message || "Failed to send test email",
        details: error
    }, { status: 500 })
  }
}
