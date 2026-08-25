import { NextResponse } from "next/server"
import { listWebhookDeliveries } from "@/lib/repo"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/campaigns/[id]/webhook-deliveries">
) {
  const { id } = await ctx.params
  const deliveries = listWebhookDeliveries(id)
  return NextResponse.json({ deliveries })
}
