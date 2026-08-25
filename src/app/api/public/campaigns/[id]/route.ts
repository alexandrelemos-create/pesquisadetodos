import { NextResponse } from "next/server"
import { canShowToVisitor, getCampaign, listQuestions } from "@/lib/repo"

export const dynamic = "force-dynamic"

// Endpoint público consumido pelo widget. Retorna a configuração da campanha
// (perguntas, triggers, tema) somente se ela estiver ativa; a elegibilidade de
// frequência (frequency capping) é informada em `eligible`.
export async function GET(
  req: Request,
  ctx: RouteContext<"/api/public/campaigns/[id]">
) {
  const { id } = await ctx.params
  const campaign = getCampaign(id)
  if (!campaign || campaign.status !== "active") {
    return NextResponse.json({ eligible: false, reason: "not_active" })
  }

  const url = new URL(req.url)
  const visitorId = url.searchParams.get("visitorId")
  let eligible = true
  if (visitorId) {
    eligible = canShowToVisitor(id, visitorId, campaign.frequencyRule)
  }

  const questions = listQuestions(id)

  return NextResponse.json({
    eligible,
    campaign: {
      id: campaign.id,
      headline: campaign.headline,
      estimatedSeconds: campaign.estimatedSeconds,
      primaryColor: campaign.primaryColor,
      triggers: campaign.triggers,
      frequencyRule: campaign.frequencyRule,
      completionOutcome: campaign.completionOutcome,
      questions,
    },
  })
}
