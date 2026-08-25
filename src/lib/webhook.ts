import type { Campaign, Question, ResponseSession, Answer, WebhookEvent } from "@/lib/types"
import { logWebhookDelivery } from "@/lib/repo"

function buildAnswerPayload(answers: Answer[], questions: Question[]) {
  return answers.map((a) => {
    const q = questions.find((q) => q.id === a.questionId)
    return {
      questionId: a.questionId,
      questionTitle: q?.title ?? null,
      questionType: q?.type ?? null,
      value: a.value,
    }
  })
}

export async function dispatchWebhook(params: {
  campaign: Campaign
  session: ResponseSession
  answers: Answer[]
  questions: Question[]
  event: WebhookEvent
}) {
  const { campaign, session, answers, questions, event } = params
  if (!campaign.webhookEnabled || !campaign.webhookUrl) return null
  if (!campaign.webhookEvents.includes(event)) return null

  const payload = {
    event,
    campaignId: campaign.id,
    campaignName: campaign.name,
    sessionId: session.id,
    visitorId: session.visitorId,
    status: session.status,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    outcome: session.outcome,
    pageUrl: session.pageUrl,
    answers: buildAnswerPayload(answers, questions),
  }

  const body = JSON.stringify(payload, null, 2)
  let statusCode: number | null = null
  let success = false
  let responseBody: string | null = null

  try {
    const res = await fetch(campaign.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    })
    statusCode = res.status
    success = res.ok
    responseBody = (await res.text()).slice(0, 2000)
  } catch (err) {
    responseBody = err instanceof Error ? err.message : "Erro desconhecido"
  }

  return logWebhookDelivery({
    campaignId: campaign.id,
    sessionId: session.id,
    event,
    url: campaign.webhookUrl,
    statusCode,
    success,
    requestBody: body,
    responseBody,
  })
}

export function buildSlackPreview(campaign: Campaign, session: ResponseSession, answers: Answer[], questions: Question[]) {
  const lines = buildAnswerPayload(answers, questions).map(
    (a) => `• *${a.questionTitle ?? a.questionId}*: ${JSON.stringify(a.value)}`
  )
  return {
    text: `Nova resposta em *${campaign.name}*\n${lines.join("\n")}`,
  }
}
