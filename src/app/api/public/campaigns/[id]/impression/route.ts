import { NextResponse } from "next/server"
import { recordImpression } from "@/lib/repo"
import { jsonError, readJson } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/public/campaigns/[id]/impression">
) {
  const { id } = await ctx.params
  const body = await readJson<{ visitorId?: string }>(req)
  if (!body?.visitorId) return jsonError("visitorId é obrigatório")
  recordImpression(id, body.visitorId)
  return NextResponse.json({ ok: true })
}
