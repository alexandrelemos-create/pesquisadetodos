"use client"

import * as React from "react"
import { Monitor, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SurveyPanel } from "@/components/widget/survey-panel"
import type { Campaign, Question } from "@/lib/types"

export function LivePreview({
  campaign,
  questions,
}: {
  campaign: Campaign
  questions: Question[]
}) {
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop")
  const [resetKey, setResetKey] = React.useState(0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Preview em tempo real</p>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant={device === "desktop" ? "secondary" : "ghost"}
            className="size-7"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant={device === "mobile" ? "secondary" : "ghost"}
            className="size-7"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="size-3.5" />
          </Button>
          <Button size="sm" variant="outline" className="ml-1" onClick={() => setResetKey((k) => k + 1)}>
            Reiniciar
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "bg-muted/40 flex items-end justify-center rounded-xl border p-4",
          device === "desktop" ? "h-[420px]" : "h-[520px]"
        )}
      >
        <div
          className={cn(
            "bg-card overflow-hidden rounded-xl border shadow-lg",
            device === "desktop" ? "w-[320px]" : "w-[280px]"
          )}
        >
          <SurveyPanel
            key={resetKey}
            headline={campaign.headline}
            estimatedSeconds={campaign.estimatedSeconds}
            primaryColor={campaign.primaryColor}
            questions={questions}
            completionOutcome={campaign.completionOutcome}
            onAnswer={() => {}}
            onFinish={() => {}}
            onClose={() => setResetKey((k) => k + 1)}
            device={device}
          />
        </div>
      </div>
    </div>
  )
}
