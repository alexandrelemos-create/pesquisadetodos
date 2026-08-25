import { notFound } from "next/navigation"
import { getCampaign, listQuestions } from "@/lib/repo"
import { QuestionsEditorClient } from "@/app/admin/campaigns/[id]/questions/questions-editor-client"

export const dynamic = "force-dynamic"

export default async function QuestionsPage({
  params,
}: PageProps<"/admin/campaigns/[id]/questions">) {
  const { id } = await params
  const campaign = getCampaign(id)
  if (!campaign) notFound()
  const questions = listQuestions(id)

  return <QuestionsEditorClient campaign={campaign} initialQuestions={questions} />
}
