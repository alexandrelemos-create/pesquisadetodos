import { notFound } from "next/navigation"
import { getCampaign, listQuestions } from "@/lib/repo"
import { getCampaignAnalytics } from "@/lib/analytics"
import { AnalyticsClient } from "@/app/admin/campaigns/[id]/analytics/analytics-client"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage({
  params,
}: PageProps<"/admin/campaigns/[id]/analytics">) {
  const { id } = await params
  const campaign = getCampaign(id)
  if (!campaign) notFound()

  const data = getCampaignAnalytics(id)
  const questions = listQuestions(id)

  return <AnalyticsClient data={data} questions={questions} />
}
