import { NextResponse } from "next/server"
import { getCampaign, listQuestions, logWebhookDelivery, newId } from "@/lib/repo"
import { jsonError, readJson } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/campaigns/[id]/webhook-test">
) {
  const { id } = await ctx.params
  const campaign = getCampaign(id)
  if (!campaign) return jsonError("Campanha não encontrada", 404)

  const body = await readJson<{ url?: string }>(req)
  const targetUrl = body?.url || campaign.webhookUrl
  if (!targetUrl) return jsonError("Informe uma URL de webhook")

  const questions = listQuestions(id)
  const samplePayload = {
    event: "response_completed",
    test: true,
    campaignId: campaign.id,
    campaignName: campaign.name,
    sessionId: `test-${newId()}`,
    visitorId: `visitor-teste`,
    status: "completed",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    outcome: campaign.completionOutcome,
    answers: questions.slice(0, 3).map((q) => ({
      questionId: q.id,
      questionTitle: q.title,
      questionType: q.type,
      value: q.type === "rating" ? 9 : q.type === "open_text" ? "Ótima experiência!" : "opcao-exemplo",
    })),
  }

  const requestBody = JSON.stringify(samplePayload, null, 2)
  let statusCode: number | null = null
  let success = false
  let responseBody: string | null = null

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    })
    statusCode = res.status
    success = res.ok
    responseBody = (await res.text()).slice(0, 2000)
  } catch (err) {
    responseBody = err instanceof Error ? err.message : "Erro desconhecido ao chamar o webhook"
  }

  const log = logWebhookDelivery({
    campaignId: campaign.id,
    sessionId: samplePayload.sessionId,
    event: "response_completed",
    url: targetUrl,
    statusCode,
    success,
    requestBody,
    responseBody,
  })

  return NextResponse.json({ delivery: log })
}
