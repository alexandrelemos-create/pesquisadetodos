"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type {
  MultipleChoiceConfig,
  OpenTextConfig,
  Question,
  RatingConfig,
  SingleChoiceConfig,
} from "@/lib/types"

const EMOJIS = ["😡", "😕", "😐", "🙂", "😍"]

interface QuestionRendererProps {
  question: Question
  value: unknown
  onChange: (value: unknown) => void
  accentColor?: string
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  accentColor = "#171717",
}: QuestionRendererProps) {
  if (question.type === "rating") {
    return (
      <RatingInput
        config={question.config as RatingConfig}
        value={value as number | undefined}
        onChange={onChange}
        accentColor={accentColor}
      />
    )
  }

  if (question.type === "open_text") {
    const config = question.config as OpenTextConfig
    const text = (value as string) ?? ""
    const Comp = config.multiline ? Textarea : Input
    return (
      <div className="flex flex-col gap-1.5">
        <Comp
          value={text}
          maxLength={config.maxLength}
          placeholder={config.placeholder ?? "Digite sua resposta..."}
          onChange={(e) => onChange(e.target.value)}
          rows={config.multiline ? 4 : undefined}
          autoFocus
        />
        {config.maxLength ? (
          <span className="text-muted-foreground self-end text-xs">
            {text.length}/{config.maxLength}
          </span>
        ) : null}
      </div>
    )
  }

  if (question.type === "single_choice") {
    const config = question.config as SingleChoiceConfig
    const current = value as { optionId?: string; otherText?: string } | undefined
    return (
      <div className="flex flex-col gap-2">
        {config.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange({ optionId: opt.id })}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
              current?.optionId === opt.id
                ? "border-transparent text-white"
                : "hover:bg-accent"
            )}
            style={
              current?.optionId === opt.id
                ? { backgroundColor: accentColor }
                : undefined
            }
          >
            {opt.label}
          </button>
        ))}
        {config.allowOther && (
          <button
            type="button"
            onClick={() => onChange({ optionId: "other", otherText: current?.otherText ?? "" })}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
              current?.optionId === "other"
                ? "border-transparent text-white"
                : "hover:bg-accent"
            )}
            style={
              current?.optionId === "other"
                ? { backgroundColor: accentColor }
                : undefined
            }
          >
            Outro (especifique)
          </button>
        )}
        {config.allowOther && current?.optionId === "other" && (
          <Input
            autoFocus
            placeholder="Especifique..."
            value={current?.otherText ?? ""}
            onChange={(e) => onChange({ optionId: "other", otherText: e.target.value })}
          />
        )}
      </div>
    )
  }

  if (question.type === "multiple_choice") {
    const config = question.config as MultipleChoiceConfig
    const selected = (value as string[]) ?? []
    const max = config.maxChoices
    return (
      <div className="flex flex-col gap-1">
        {config.options.map((opt) => {
          const checked = selected.includes(opt.id)
          const disableMore = !checked && max != null && selected.length >= max
          return (
            <Label
              key={opt.id}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-normal transition-colors",
                checked ? "border-primary/50 bg-accent" : "hover:bg-accent/60",
                disableMore && "cursor-not-allowed opacity-50"
              )}
            >
              <Checkbox
                checked={checked}
                disabled={disableMore}
                onCheckedChange={(c) => {
                  if (c) onChange([...selected, opt.id])
                  else onChange(selected.filter((s) => s !== opt.id))
                }}
              />
              {opt.label}
            </Label>
          )
        })}
        {(config.minChoices || config.maxChoices) && (
          <span className="text-muted-foreground mt-1 text-xs">
            {config.minChoices ? `Mínimo ${config.minChoices}` : ""}
            {config.minChoices && config.maxChoices ? " · " : ""}
            {config.maxChoices ? `Máximo ${config.maxChoices}` : ""}
          </span>
        )}
      </div>
    )
  }

  return null
}

function RatingInput({
  config,
  value,
  onChange,
  accentColor,
}: {
  config: RatingConfig
  value: number | undefined
  onChange: (value: number) => void
  accentColor: string
}) {
  if (config.subtype === "nps") {
    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-11 gap-1">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "flex h-8 items-center justify-center rounded-md border text-xs font-medium transition-colors",
                value === n ? "border-transparent text-white" : "hover:bg-accent"
              )}
              style={value === n ? { backgroundColor: accentColor } : undefined}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="text-muted-foreground flex justify-between text-[11px]">
          <span>{config.lowLabel ?? "Pouco provável"}</span>
          <span>{config.highLabel ?? "Muito provável"}</span>
        </div>
      </div>
    )
  }

  if (config.subtype === "csat") {
    return (
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
              value === n ? "border-transparent text-white" : "hover:bg-accent"
            )}
            style={value === n ? { backgroundColor: accentColor } : undefined}
          >
            {n}
          </button>
        ))}
      </div>
    )
  }

  if (config.subtype === "stars") {
    const max = config.scaleMax ?? 5
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-1"
            aria-label={`${n} estrela(s)`}
          >
            <Star
              className={cn(
                "size-7 transition-colors",
                value != null && n <= value
                  ? "fill-current text-amber-500"
                  : "text-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>
    )
  }

  // emoji
  return (
    <div className="flex items-center justify-between gap-1">
      {EMOJIS.map((emoji, i) => {
        const n = i + 1
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex-1 rounded-lg py-2 text-2xl transition-transform",
              value === n ? "scale-125" : "opacity-50 hover:opacity-100"
            )}
            aria-label={`nota ${n}`}
          >
            {emoji}
          </button>
        )
      })}
    </div>
  )
}
