import { NextResponse } from "next/server"
import { reorderQuestions } from "@/lib/repo"
import { jsonError, readJson } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/campaigns/[id]/questions/reorder">
) {
  const { id } = await ctx.params
  const body = await readJson<{ orderedIds: string[] }>(req)
  if (!body?.orderedIds) return jsonError("orderedIds é obrigatório")
  reorderQuestions(id, body.orderedIds)
  return NextResponse.json({ ok: true })
}
