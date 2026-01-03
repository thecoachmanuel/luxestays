import { NextRequest, NextResponse } from "next/server"
import { updateCampaignRecipientStatus } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const trackingId = id
  console.log(`[Tracking] Received request for ID: ${trackingId}`)
  
  if (trackingId) {
    // Fire and forget update to avoid delaying the image load
    updateCampaignRecipientStatus(trackingId)
      .then(updated => {
          if (updated) console.log(`[Tracking] Successfully tracked open for ID: ${trackingId}`)
          else console.log(`[Tracking] ID not found or already opened: ${trackingId}`)
      })
      .catch(err => 
        console.error(`[Tracking] Failed to track email open for ID ${trackingId}:`, err)
      )
  }

  // Return a 1x1 transparent GIF
  const transparentGif = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  )

  return new NextResponse(transparentGif, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  })
}
