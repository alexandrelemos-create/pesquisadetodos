"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "questions", label: "Perguntas" },
  { href: "triggers", label: "Gatilhos & Frequência" },
  { href: "responses", label: "Respostas" },
  { href: "analytics", label: "Métricas" },
  { href: "webhooks", label: "Webhooks" },
  { href: "settings", label: "Configurações" },
]

export function CampaignTabs({ campaignId }: { campaignId: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto px-5">
      {TABS.map((tab) => {
        const href = `/admin/campaigns/${campaignId}/${tab.href}`
        const active = pathname?.startsWith(href)
        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "shrink-0 rounded-t-md border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
