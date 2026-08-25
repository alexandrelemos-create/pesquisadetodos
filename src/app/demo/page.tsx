"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, LayoutDashboard, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SurveyWidget } from "@/components/widget/survey-widget"
import type { Campaign } from "@/lib/types"

export default function DemoPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [campaignId, setCampaignId] = React.useState<string | null>(null)
  const [forceOpen, setForceOpen] = React.useState(false)
  const [widgetKey, setWidgetKey] = React.useState(0)

  React.useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data: { campaigns: Campaign[] }) => {
        setCampaigns(data.campaigns)
        const active = data.campaigns.find((c) => c.status === "active")
        setCampaignId(active?.id ?? data.campaigns[0]?.id ?? null)
      })
  }, [])

  function resetWidget() {
    try {
      window.localStorage.removeItem("mp_visitor_id")
    } catch {}
    setWidgetKey((k) => k + 1)
  }

  const activeCampaigns = campaigns.filter((c) => c.status === "active")

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 flex flex-wrap items-center gap-3 border-b bg-background/95 px-4 py-2.5 backdrop-blur">
        <Badge variant="outline">Página de demonstração</Badge>
        <span className="text-muted-foreground text-xs">Simula o widget em um site real</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={campaignId ?? undefined} onValueChange={setCampaignId}>
            <SelectTrigger size="sm" className="w-[220px]">
              <SelectValue placeholder="Selecione a campanha" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.status !== "active" && `(${c.status})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant={forceOpen ? "default" : "outline"} onClick={() => setForceOpen((v) => !v)}>
            {forceOpen ? "Abrindo imediatamente" : "Respeitando gatilhos"}
          </Button>
          <Button size="sm" variant="outline" onClick={resetWidget}>
            <RefreshCcw className="size-3.5" /> Resetar visitante
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <Link href="/admin">
              <LayoutDashboard className="size-3.5" /> Painel admin
            </Link>
          </Button>
        </div>
      </div>

      {activeCampaigns.length === 0 && (
        <div className="mx-auto mt-6 max-w-lg rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Nenhuma campanha ativa encontrada. Vá até o{" "}
          <Link href="/admin" className="underline">
            painel admin
          </Link>{" "}
          para criar ou ativar uma campanha (ou carregue os dados de demonstração).
        </div>
      )}

      {/* conteúdo fake de um site para dar contexto ao widget */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Badge className="mb-4" variant="secondary">
          Novo · Checkout em 1 clique
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Pagamentos simples para o seu negócio crescer
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-balance">
          Emita cobranças, concilie recebíveis e proteja suas transações contra fraude —
          tudo em uma única plataforma.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button>
            Começar agora <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline">Falar com vendas</Button>
        </div>
      </section>

      <section className="border-t bg-muted/30 px-6 py-20">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
          {[
            { title: "Boletos & Pix", desc: "Emissão em segundos, com conciliação automática." },
            { title: "Antifraude", desc: "Motor de score em tempo real para reduzir chargebacks." },
            { title: "Split de pagamentos", desc: "Divida recebíveis entre marketplaces e parceiros." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <h3 className="font-medium">{f.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-2xl font-semibold">Por que empresas escolhem a MaisTODOS</h2>
        <div className="text-muted-foreground mt-4 space-y-4 text-sm leading-relaxed">
          <p>
            Role a página para baixo para simular o gatilho de &quot;% de rolagem&quot;. Continue
            navegando por alguns segundos para simular o gatilho de &quot;tempo na página&quot;, ou
            mova o mouse até a barra do navegador para simular a &quot;intenção de saída&quot;.
          </p>
          <p>
            Este texto existe apenas para dar altura de rolagem suficiente à página e assim
            testar os gatilhos de exibição configurados na campanha selecionada acima.
          </p>
          {Array.from({ length: 10 }).map((_, i) => (
            <p key={i}>
              Parágrafo de exemplo {i + 1}: conteúdo de demonstração para simular uma página
              real de produto, com informações sobre funcionalidades, planos e casos de uso
              da plataforma de pagamentos.
            </p>
          ))}
        </div>
      </section>

      <footer className="border-t px-6 py-10 text-center text-xs text-muted-foreground">
        Página de demonstração — Micropesquisa · MaisTODOS
      </footer>

      {campaignId && (
        <SurveyWidget key={`${campaignId}-${widgetKey}`} campaignId={campaignId} forceOpen={forceOpen} />
      )}
    </div>
  )
}
