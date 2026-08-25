import { NextResponse } from "next/server"
import {
  finishSession,
  getCampaign,
  getQuestion,
  getSession,
  listAnswers,
  listQuestions,
  upsertAnswer,
} from "@/lib/repo"
import { resolveNext } from "@/lib/logic"
import { dispatchWebhook } from "@/lib/webhook"
import { jsonError, readJson } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

interface AnswerBody {
  questionId: string
  value: unknown
}

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/public/sessions/[id]/answers">
) {
  const { id } = await ctx.params
  const session = getSession(id)
  if (!session) return jsonError("Sessão não encontrada", 404)

  const body = await readJson<AnswerBody>(req)
  if (!body?.questionId) return jsonError("questionId é obrigatório")

  const question = getQuestion(body.questionId)
  if (!question) return jsonError("Pergunta não encontrada", 404)

  upsertAnswer(id, body.questionId, body.value)

  const questions = listQuestions(session.campaignId)
  const campaignForFallback = getCampaign(session.campaignId)
  const step = resolveNext(
    questions,
    question,
    body.value,
    campaignForFallback?.completionOutcome ?? { type: "end" }
  )

  if (step.kind === "outcome") {
    const finished = finishSession(id, step.outcome)
    const campaign = getCampaign(session.campaignId)
    if (campaign && finished) {
      dispatchWebhook({
        campaign,
        session: finished,
        answers: listAnswers(id),
        questions,
        event: "response_completed",
      }).catch(() => {})
    }
    return NextResponse.json({ next: { kind: "outcome", outcome: step.outcome } })
  }

  return NextResponse.json({ next: step })
}
