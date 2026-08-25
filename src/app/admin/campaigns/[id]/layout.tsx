import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { getCampaign } from "@/lib/repo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CampaignTabs } from "@/app/admin/campaigns/[id]/campaign-tabs"

export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativa",
  paused: "Pausada",
  archived: "Arquivada",
}

export default async function CampaignLayout({
  children,
  params,
}: LayoutProps<"/admin/campaigns/[id]">) {
  const { id } = await params
  const campaign = getCampaign(id)
  if (!campaign) notFound()

  return (
    <div className="flex flex-1 flex-col">
      <div className="bg-background border-b px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="icon" className="size-7" asChild>
            <Link href="/admin">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">{campaign.name}</h1>
          <Badge
            variant={
              campaign.status === "active"
                ? "success"
                : campaign.status === "paused"
                  ? "warning"
                  : "secondary"
            }
          >
            {STATUS_LABEL[campaign.status]}
          </Badge>
          <Button size="sm" variant="outline" className="ml-auto" asChild>
            <a href={`/embed/${campaign.id}`} target="_blank" rel="noreferrer">
              Pré-visualizar widget <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
        <CampaignTabs campaignId={campaign.id} />
      </div>
      <div className="flex-1 px-5 py-6">{children}</div>
    </div>
  )
}
