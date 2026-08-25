import { NextResponse } from "next/server"
import { getSession } from "@/lib/repo"
import { finishSession } from "@/lib/repo"

export const dynamic = "force-dynamic"

export async function POST(
  _req: Request,
  ctx: RouteContext<"/api/public/sessions/[id]/abandon">
) {
  const { id } = await ctx.params
  const session = getSession(id)
  if (!session) return NextResponse.json({ ok: true })
  if (session.status === "in_progress") {
    finishSession(id, { type: "end" }, "abandoned")
  }
  return NextResponse.json({ ok: true })
}
