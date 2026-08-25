import { NextResponse } from "next/server"
import { getCampaignAnalytics } from "@/lib/analytics"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/campaigns/[id]/analytics">
) {
  const { id } = await ctx.params
  const analytics = getCampaignAnalytics(id)
  return NextResponse.json(analytics)
}
