import { notFound } from "next/navigation"
import { getCampaign, listAnswers, listQuestions, listSessionsByCampaign } from "@/lib/repo"
import { ResponsesClient } from "@/app/admin/campaigns/[id]/responses/responses-client"

export const dynamic = "force-dynamic"

export default async function ResponsesPage({
  params,
}: PageProps<"/admin/campaigns/[id]/responses">) {
  const { id } = await params
  const campaign = getCampaign(id)
  if (!campaign) notFound()

  const questions = listQuestions(id)
  const sessions = listSessionsByCampaign(id).map((session) => ({
    session,
    answers: listAnswers(session.id),
  }))

  return <ResponsesClient campaignId={id} questions={questions} sessions={sessions} />
}
