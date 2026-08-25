import { notFound } from "next/navigation"
import { getCampaign } from "@/lib/repo"
import { TriggersClient } from "@/app/admin/campaigns/[id]/triggers/triggers-client"

export const dynamic = "force-dynamic"

export default async function TriggersPage({
  params,
}: PageProps<"/admin/campaigns/[id]/triggers">) {
  const { id } = await params
  const campaign = getCampaign(id)
  if (!campaign) notFound()
  return <TriggersClient campaign={campaign} />
}
