import { NextResponse } from "next/server"
import { deleteCampaign, getCampaign, updateCampaign } from "@/lib/repo"
import { jsonError, readJson } from "@/lib/api-utils"
import type { Campaign } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/campaigns/[id]">
) {
  const { id } = await ctx.params
  const campaign = getCampaign(id)
  if (!campaign) return jsonError("Campanha não encontrada", 404)
  return NextResponse.json({ campaign })
}

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/campaigns/[id]">
) {
  const { id } = await ctx.params
  const body = await readJson<Partial<Campaign>>(req)
  if (!body) return jsonError("Corpo inválido")
  const campaign = updateCampaign(id, body)
  if (!campaign) return jsonError("Campanha não encontrada", 404)
  return NextResponse.json({ campaign })
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/campaigns/[id]">
) {
  const { id } = await ctx.params
  deleteCampaign(id)
  return NextResponse.json({ ok: true })
}
