import { notFound } from "next/navigation"
import { getCampaign } from "@/lib/repo"
import { SettingsClient } from "@/app/admin/campaigns/[id]/settings/settings-client"

export const dynamic = "force-dynamic"

export default async function SettingsPage({
  params,
}: PageProps<"/admin/campaigns/[id]/settings">) {
  const { id } = await params
  const campaign = getCampaign(id)
  if (!campaign) notFound()
  return <SettingsClient campaign={campaign} />
}
