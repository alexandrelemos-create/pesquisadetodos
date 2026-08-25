import { NextResponse } from "next/server"
import { deleteQuestion, updateQuestion } from "@/lib/repo"
import { jsonError, readJson } from "@/lib/api-utils"
import type { Question } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/campaigns/[id]/questions/[questionId]">
) {
  const { questionId } = await ctx.params
  const body = await readJson<Partial<Question>>(req)
  if (!body) return jsonError("Corpo inválido")
  const question = updateQuestion(questionId, body)
  if (!question) return jsonError("Pergunta não encontrada", 404)
  return NextResponse.json({ question })
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/campaigns/[id]/questions/[questionId]">
) {
  const { questionId } = await ctx.params
  deleteQuestion(questionId)
  return NextResponse.json({ ok: true })
}
