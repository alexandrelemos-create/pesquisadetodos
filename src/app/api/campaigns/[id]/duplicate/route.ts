import { NextResponse } from "next/server"
import { duplicateCampaign } from "@/lib/repo"
import { jsonError } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

export async function POST(
  _req: Request,
  ctx: RouteContext<"/api/campaigns/[id]/duplicate">
) {
  const { id } = await ctx.params
  const clone = duplicateCampaign(id)
  if (!clone) return jsonError("Campanha não encontrada", 404)
  return NextResponse.json({ campaign: clone }, { status: 201 })
}
