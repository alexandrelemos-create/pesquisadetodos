import { NextResponse } from "next/server"
import { createQuestion, listQuestions } from "@/lib/repo"
import { readJson } from "@/lib/api-utils"
import type { Question } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/campaigns/[id]/questions">
) {
  const { id } = await ctx.params
  const questions = listQuestions(id)
  return NextResponse.json({ questions })
}

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/campaigns/[id]/questions">
) {
  const { id } = await ctx.params
  const body = await readJson<Partial<Question>>(req)
  const question = createQuestion(id, body ?? {})
  return NextResponse.json({ question }, { status: 201 })
}
