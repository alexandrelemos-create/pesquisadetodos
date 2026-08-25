import { NextResponse } from "next/server"
import { listAnswers, listQuestions, listSessionsByCampaign } from "@/lib/repo"

export const dynamic = "force-dynamic"

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/campaigns/[id]/responses">
) {
  const { id } = await ctx.params
  const sessions = listSessionsByCampaign(id)
  const questions = listQuestions(id)
  const detailed = sessions.map((session) => ({
    session,
    answers: listAnswers(session.id),
  }))
  const url = new URL(req.url)
  if (url.searchParams.get("onlyCompleted") === "true") {
    return NextResponse.json({
      questions,
      sessions: detailed.filter((d) => d.session.status === "completed"),
    })
  }
  return NextResponse.json({ questions, sessions: detailed })
}
