"use client"

import * as React from "react"
import { MessageCircleQuestion, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useVisitorId } from "@/hooks/use-visitor-id"
import { useSurveyTriggers } from "@/hooks/use-survey-triggers"
import { SurveyPanel } from "@/components/widget/survey-panel"
import type { Outcome, Question, TriggerConfig, FrequencyRule } from "@/lib/types"

interface PublicCampaignPayload {
  id: string
  headline: string
  estimatedSeconds: number
  primaryColor: string
  triggers: TriggerConfig[]
  frequencyRule: FrequencyRule
  completionOutcome: Outcome
  questions: Question[]
}

type WidgetState =
  | "loading"
  | "ineligible"
  | "waiting_trigger"
  | "collapsed"
  | "expanded"
  | "dismissed"

interface SurveyWidgetProps {
  campaignId: string
  apiBase?: string
  /** modo de demonstração: ignora gatilhos e frequência, abre imediatamente */
  forceOpen?: boolean
  device?: "desktop" | "mobile"
  /**
   * "fixed": o widget se posiciona sozinho no canto da tela (uso direto
   * dentro da própria página, como em /demo).
   * "embed": pensado para a página /embed/[id] carregada dentro de um
   * <iframe> em um site externo — não se auto-posiciona (isso é feito pelo
   * script injetado no site do cliente) e reporta seu tamanho real via
   * postMessage para que o iframe possa ser redimensionado dinamicamente.
   */
  mode?: "fixed" | "embed"
}

export function SurveyWidget({
  campaignId,
  apiBase = "",
  forceOpen = false,
  device = "desktop",
  mode = "fixed",
}: SurveyWidgetProps) {
  const visitorId = useVisitorId()
  const [state, setState] = React.useState<WidgetState>("loading")
  const [campaign, setCampaign] = React.useState<PublicCampaignPayload | null>(null)
  const [sessionId, setSessionId] = React.useState<string | null>(null)
  const impressionRecorded = React.useRef(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!visitorId) return
    let cancelled = false
    fetch(
      `${apiBase}/api/public/campaigns/${campaignId}?visitorId=${encodeURIComponent(visitorId)}`
    )
      .then((r) => r.json())
      .then((data: { eligible: boolean; campaign?: PublicCampaignPayload }) => {
        if (cancelled) return
        if (!data.campaign) {
          setState("ineligible")
          return
        }
        setCampaign(data.campaign)
        if (!data.eligible && !forceOpen) {
          setState("ineligible")
          return
        }
        setState("waiting_trigger")
      })
      .catch(() => setState("ineligible"))
    return () => {
      cancelled = true
    }
  }, [campaignId, apiBase, visitorId, forceOpen])

  const showWidget = React.useCallback(() => {
    setState("collapsed")
  }, [])

  useSurveyTriggers(
    campaign?.triggers ?? [],
    showWidget,
    state === "waiting_trigger" && !forceOpen
  )

  // Em modo de demonstração (forceOpen), o widget deve abrir direto no
  // painel de perguntas — calculado na renderização em vez de sincronizado
  // via efeito, já que é apenas uma função do estado atual + da prop.
  const displayState: WidgetState = forceOpen && campaign ? "expanded" : state

  React.useEffect(() => {
    if (displayState === "collapsed" && !impressionRecorded.current && visitorId) {
      impressionRecorded.current = true
      fetch(`${apiBase}/api/public/campaigns/${campaignId}/impression`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      }).catch(() => {})
    }
  }, [displayState, apiBase, campaignId, visitorId])

  async function ensureSession(): Promise<string | null> {
    if (sessionId) return sessionId
    if (!visitorId) return null
    try {
      const res = await fetch(`${apiBase}/api/public/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          visitorId,
          pageUrl: window.location.href,
          referrer: document.referrer,
        }),
      })
      const data = await res.json()
      setSessionId(data.session.id)
      return data.session.id as string
    } catch {
      return null
    }
  }

  function handleOpen() {
    setState("expanded")
    ensureSession()
  }

  function handleAnswer(questionId: string, value: unknown) {
    // submissão assíncrona por resposta: garante retenção mesmo se a pessoa
    // fechar a pesquisa pela metade.
    ensureSession().then((sid) => {
      if (!sid) return
      fetch(`${apiBase}/api/public/sessions/${sid}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ questionId, value }),
      }).catch(() => {})
    })
  }

  function handleClose() {
    if (sessionId) {
      navigator.sendBeacon?.(
        `${apiBase}/api/public/sessions/${sessionId}/abandon`,
        new Blob([JSON.stringify({})], { type: "application/json" })
      )
    }
    setState("dismissed")
  }

  function handleFinish() {
    // outcome já processado no servidor via answers; nada extra a fazer aqui.
  }

  const hidden =
    displayState === "loading" ||
    displayState === "ineligible" ||
    displayState === "waiting_trigger" ||
    displayState === "dismissed" ||
    !campaign

  // Modo embed: reporta o tamanho real renderizado para a página pai (via
  // postMessage) sempre que ele mudar, para que o <iframe> criado pelo
  // script de instalação no site do cliente possa ser redimensionado — sem
  // isso, o iframe ficaria com um tamanho fixo que ou corta o widget
  // expandido, ou bloqueia cliques numa área maior do que o necessário.
  React.useEffect(() => {
    if (mode !== "embed") return
    if (typeof window === "undefined" || window.self === window.top) return

    function report() {
      const rect = containerRef.current?.getBoundingClientRect()
      window.parent.postMessage(
        {
          source: "micropesquisa-widget",
          campaignId,
          width: hidden ? 0 : Math.ceil(rect?.width ?? 0),
          height: hidden ? 0 : Math.ceil(rect?.height ?? 0),
        },
        "*"
      )
    }

    report()
    if (hidden || !containerRef.current) return
    const observer = new ResizeObserver(report)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [mode, campaignId, hidden, displayState])

  if (hidden) {
    return mode === "embed" ? <div ref={containerRef} /> : null
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        mode === "fixed"
          ? "fixed z-[999] flex flex-col items-end"
          : "inline-flex flex-col items-end",
        mode === "fixed" && (device === "mobile" ? "right-3 bottom-3" : "right-5 bottom-5")
      )}
    >
      {displayState === "collapsed" && (
        <button
          onClick={handleOpen}
          className={cn(
            "mp-card-in bg-card text-card-foreground relative flex items-center gap-3 rounded-xl border p-3.5 text-left shadow-lg transition-transform hover:-translate-y-0.5",
            device === "mobile" ? "w-[280px]" : "w-[300px]"
          )}
        >
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: campaign.primaryColor }}
          >
            <MessageCircleQuestion className="size-4.5" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm leading-snug font-medium">{campaign.headline}</span>
            <span className="text-muted-foreground text-xs">
              Leva menos de {Math.max(1, Math.round(campaign.estimatedSeconds / 10) * 10)}s
            </span>
          </span>
          <span
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
            className="text-muted-foreground hover:text-foreground absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full border bg-background"
            aria-label="Fechar"
          >
            <X className="size-3" />
          </span>
        </button>
      )}

      {displayState === "expanded" && (
        <div
          className={cn(
            "mp-pop-in bg-card text-card-foreground overflow-hidden rounded-xl border shadow-2xl",
            device === "mobile" ? "w-[300px]" : "w-[340px]"
          )}
        >
          <SurveyPanel
            headline={campaign.headline}
            estimatedSeconds={campaign.estimatedSeconds}
            primaryColor={campaign.primaryColor}
            questions={campaign.questions}
            completionOutcome={campaign.completionOutcome}
            onAnswer={handleAnswer}
            onFinish={handleFinish}
            onClose={handleClose}
            device={device}
          />
        </div>
      )}
    </div>
  )
}
