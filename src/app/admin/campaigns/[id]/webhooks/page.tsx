import { notFound } from "next/navigation"
import { getCampaign, listWebhookDeliveries } from "@/lib/repo"
import { WebhooksClient } from "@/app/admin/campaigns/[id]/webhooks/webhooks-client"

export const dynamic = "force-dynamic"

export default async function WebhooksPage({
  params,
}: PageProps<"/admin/campaigns/[id]/webhooks">) {
  const { id } = await params
  const campaign = getCampaign(id)
  if (!campaign) notFound()
  const deliveries = listWebhookDeliveries(id)
  return <WebhooksClient campaign={campaign} initialDeliveries={deliveries} />
}
