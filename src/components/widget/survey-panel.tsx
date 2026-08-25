"use client"

import * as React from "react"
import { CheckCircle2, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { QuestionRenderer } from "@/components/widget/question-renderer"
import { resolveNext } from "@/lib/logic"
import type { Outcome, Question } from "@/lib/types"

interface SurveyPanelProps {
  headline: string
  estimatedSeconds: number
  primaryColor: string
  questions: Question[]
  completionOutcome: Outcome
  onAnswer: (questionId: string, value: unknown) => void
  onFinish: (outcome: Outcome) => void
  onClose: () => void
  device?: "desktop" | "mobile"
}

function isAnswerValid(question: Question, value: unknown): boolean {
  if (!question.required) return true
  if (value == null) return false
  if (question.type === "open_text") return String(value).trim().length > 0
  if (question.type === "multiple_choice") return Array.isArray(value) && value.length > 0
  if (question.type === "single_choice") {
    const v = value as { optionId?: string; otherText?: string }
    if (!v?.optionId) return false
    if (v.optionId === "other") return !!v.otherText?.trim()
    return true
  }
  if (question.type === "rating") return typeof value === "number"
  return true
}

export function SurveyPanel({
  headline,
  estimatedSeconds,
  primaryColor,
  questions,
  completionOutcome,
  onAnswer,
  onFinish,
  onClose,
  device = "desktop",
}: SurveyPanelProps) {
  const [currentId, setCurrentId] = React.useState<string | null>(
    questions[0]?.id ?? null
  )
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({})
  const [answeredCount, setAnsweredCount] = React.useState(0)
  const [outcome, setOutcome] = React.useState<Outcome | null>(null)
  const [animKey, setAnimKey] = React.useState(0)
  const [advancing, setAdvancing] = React.useState(false)

  const current = questions.find((q) => q.id === currentId) ?? null
  const currentValue = current ? answers[current.id] : undefined
  const canAdvance = current ? isAnswerValid(current, currentValue) : false

  const progressPct = Math.min(
    100,
    Math.round((answeredCount / Math.max(questions.length, 1)) * 100)
  )

  function advance() {
    if (!current) return
    setAdvancing(true)
    const value = answers[current.id]
    onAnswer(current.id, value)
    setAnsweredCount((c) => c + 1)

    const step = resolveNext(questions, current, value, completionOutcome)
    window.setTimeout(() => {
      if (step.kind === "outcome") {
        setOutcome(step.outcome)
        onFinish(step.outcome)
      } else if (step.kind === "goto") {
        setCurrentId(step.questionId)
        setAnimKey((k) => k + 1)
      }
      setAdvancing(false)
    }, 180)
  }

  React.useEffect(() => {
    if (outcome?.type === "redirect" && outcome.redirectUrl) {
      const t = window.setTimeout(() => {
        window.location.href = outcome.redirectUrl!
      }, 1400)
      return () => window.clearTimeout(t)
    }
  }, [outcome])

  if (outcome) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <CheckCircle2 className="size-10" style={{ color: primaryColor }} />
        <p className="text-sm leading-relaxed">
          {outcome.type === "redirect"
            ? "Obrigado! Redirecionando..."
            : outcome.message || "Obrigado pela sua resposta!"}
        </p>
        <Button size="sm" variant="outline" onClick={onClose} className="mt-2">
          Fechar
        </Button>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <p className="text-sm">Esta pesquisa não tem perguntas configuradas.</p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col", device === "mobile" ? "w-full" : "w-full")}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
        <p className="text-muted-foreground text-xs font-medium">{headline}</p>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground rounded-sm p-0.5"
          aria-label="Fechar pesquisa"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="px-4 pt-2">
        <Progress value={progressPct} className="h-1" />
      </div>

      <div key={animKey} className="mp-step-enter flex flex-col gap-4 px-4 py-4">
        <div>
          <h3 className="text-[15px] leading-snug font-semibold">{current.title}</h3>
          {current.description && (
            <p className="text-muted-foreground mt-1 text-xs">{current.description}</p>
          )}
        </div>

        <QuestionRenderer
          question={current}
          value={currentValue}
          onChange={(v) => setAnswers((a) => ({ ...a, [current.id]: v }))}
          accentColor={primaryColor}
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-4 pb-4">
        <span className="text-muted-foreground text-[11px]">
          ~{estimatedSeconds}s para concluir
        </span>
        <Button
          size="sm"
          disabled={!canAdvance || advancing}
          onClick={advance}
          style={{ backgroundColor: primaryColor }}
          className="text-white hover:opacity-90"
        >
          {advancing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : !current.required && currentValue == null ? (
            "Pular"
          ) : (
            "Continuar"
          )}
        </Button>
      </div>
    </div>
  )
}
