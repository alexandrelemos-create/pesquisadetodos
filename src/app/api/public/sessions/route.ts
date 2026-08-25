import { NextResponse } from "next/server"
import { createSession, getCampaign } from "@/lib/repo"
import { dispatchWebhook } from "@/lib/webhook"
import { jsonError, readJson } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

interface CreateSessionBody {
  campaignId: string
  visitorId: string
  pageUrl?: string
  referrer?: string
}

export async function POST(req: Request) {
  const body = await readJson<CreateSessionBody>(req)
  if (!body?.campaignId || !body?.visitorId) {
    return jsonError("campaignId e visitorId são obrigatórios")
  }
  const campaign = getCampaign(body.campaignId)
  if (!campaign) return jsonError("Campanha não encontrada", 404)

  const session = createSession({
    campaignId: body.campaignId,
    visitorId: body.visitorId,
    pageUrl: body.pageUrl,
    referrer: body.referrer,
    userAgent: req.headers.get("user-agent"),
  })

  // dispara webhook de início (não bloqueia a resposta ao widget)
  dispatchWebhook({
    campaign,
    session,
    answers: [],
    questions: [],
    event: "response_started",
  }).catch(() => {})

  return NextResponse.json({ session }, { status: 201 })
}
