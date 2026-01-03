import { NextResponse } from "next/server"
import { getUsers, getSubscribers, addEmailCampaign, getEmailCampaigns } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { EmailCampaign, EmailRecipientStatus } from "@/types"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const campaigns = await getEmailCampaigns();
    // Sort by newest first
    campaigns.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { subject, message, recipients, individualEmail } = body // recipients: 'all', 'newsletter', 'individual'

    let targetEmails: string[] = [];

    if (recipients === 'all') {
      const users = await getUsers();
      targetEmails = users.map(u => u.email);
    } else if (recipients === 'newsletter') {
      const subscribers = await getSubscribers();
      targetEmails = subscribers.map(s => s.email);
    } else if (recipients === 'individual' && individualEmail) {
      targetEmails = [individualEmail];
    }

    if (targetEmails.length === 0) {
        return NextResponse.json({ error: "No recipients found" }, { status: 400 })
    }

    console.log("--- Sending Bulk Email ---")
    console.log(`Subject: ${subject}`)
    console.log(`Target Count: ${targetEmails.length}`)

    const campaignId = Date.now().toString();
    const recipientStatuses: EmailRecipientStatus[] = [];
    const origin = new URL(request.url).origin;

    // Send emails
    const results = await Promise.allSettled(
        targetEmails.map(async (email) => {
            const trackingId = Math.random().toString(36).substring(2) + Date.now().toString(36);
            const pixelUrl = `${origin}/api/email/track/${trackingId}`;
            console.log(`[Email] Generated tracking pixel: ${pixelUrl}`);
            // Use a 1x1 transparent gif
            const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
            // Append pixel to message
            // Note: message is plain text or HTML. If plain text, this might look weird if not handled as HTML.
            // Assuming sendEmail handles HTML.
            const messageWithPixel = `${message}<br/><br/>${trackingPixel}`;

            try {
                await sendEmail(email, subject, messageWithPixel);
                recipientStatuses.push({
                    email,
                    trackingId,
                    status: 'sent',
                    sentAt: new Date().toISOString()
                });
                return true;
            } catch (error) {
                console.error(`Failed to send to ${email}`, error);
                throw error;
            }
        })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    // Save Campaign if at least one sent
    if (successCount > 0) {
        const campaign: EmailCampaign = {
            id: campaignId,
            subject,
            message,
            sentAt: new Date().toISOString(),
            recipients: recipientStatuses,
            totalSent: successCount,
            totalOpened: 0
        };
        await addEmailCampaign(campaign);
    }

    console.log(`Sent: ${successCount}, Failed: ${failCount}`)
    console.log("--------------------------")

    return NextResponse.json({ 
        message: "Emails processed",
        count: targetEmails.length,
        success: successCount,
        failed: failCount
    })
  } catch (error) {
    console.error("Bulk email error:", error);
    return NextResponse.json({ error: "Failed to send emails" }, { status: 500 })
  }
}
