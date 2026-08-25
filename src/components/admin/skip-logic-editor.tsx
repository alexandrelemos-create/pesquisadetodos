"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OPERATOR_LABEL, operatorsForType } from "@/lib/question-meta"
import type {
  MultipleChoiceConfig,
  Outcome,
  Question,
  SingleChoiceConfig,
  SkipOperator,
  SkipRule,
} from "@/lib/types"

const NEXT = "__next__"
const END = "__end__"
const MESSAGE = "__message__"
const REDIRECT = "__redirect__"

function destinationValue(rule: Pick<SkipRule, "goToQuestionId" | "outcome">) {
  if (rule.outcome?.type === "end") return END
  if (rule.outcome?.type === "message") return MESSAGE
  if (rule.outcome?.type === "redirect") return REDIRECT
  if (rule.goToQuestionId) return `goto:${rule.goToQuestionId}`
  return NEXT
}

function ValueInput({
  question,
  operator,
  value,
  onChange,
}: {
  question: Question
  operator: SkipOperator
  value: SkipRule["value"]
  onChange: (value: SkipRule["value"]) => void
}) {
  if (question.type === "rating") {
    return (
      <Input
        type="number"
        className="w-20"
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    )
  }

  if (question.type === "single_choice" || question.type === "multiple_choice") {
    const options = (question.config as SingleChoiceConfig | MultipleChoiceConfig).options
    if (operator === "in") {
      const selected = Array.isArray(value) ? (value as string[]) : []
      return (
        <div className="flex flex-wrap gap-1">
          {options.map((opt) => {
            const active = selected.includes(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  onChange(
                    active ? selected.filter((s) => s !== opt.id) : [...selected, opt.id]
                  )
                }
                className={`rounded-md border px-2 py-1 text-xs ${
                  active ? "border-primary bg-primary text-primary-foreground" : ""
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )
    }
    return (
      <Select value={String(value ?? "")} onValueChange={onChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Selecione a opção" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <Input
      className="w-44"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function OutcomeExtraFields({
  outcome,
  onChange,
}: {
  outcome: Outcome
  onChange: (outcome: Outcome) => void
}) {
  if (outcome.type === "message") {
    return (
      <Textarea
        className="mt-2"
        placeholder="Mensagem de agradecimento personalizada..."
        value={outcome.message ?? ""}
        onChange={(e) => onChange({ ...outcome, message: e.target.value })}
      />
    )
  }
  if (outcome.type === "redirect") {
    return (
      <Input
        className="mt-2"
        placeholder="https://exemplo.com/obrigado"
        value={outcome.redirectUrl ?? ""}
        onChange={(e) => onChange({ ...outcome, redirectUrl: e.target.value })}
      />
    )
  }
  return null
}

interface RuleRowProps {
  question: Question
  otherQuestions: Question[]
  rule: SkipRule
  onChange: (rule: SkipRule) => void
  onRemove: () => void
}

function RuleRow({ question, otherQuestions, rule, onChange, onRemove }: RuleRowProps) {
  const operators = operatorsForType(question.type)
  const destination = destinationValue(rule)

  function setDestination(dest: string) {
    if (dest === NEXT) {
      onChange({ ...rule, goToQuestionId: null, outcome: null })
    } else if (dest === END) {
      onChange({ ...rule, goToQuestionId: null, outcome: { type: "end" } })
    } else if (dest === MESSAGE) {
      onChange({ ...rule, goToQuestionId: null, outcome: { type: "message", message: "" } })
    } else if (dest === REDIRECT) {
      onChange({ ...rule, goToQuestionId: null, outcome: { type: "redirect", redirectUrl: "" } })
    } else if (dest.startsWith("goto:")) {
      onChange({ ...rule, goToQuestionId: dest.slice(5), outcome: null })
    }
  }

  return (
    <div className="bg-muted/40 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Se a resposta</span>
        <Select
          value={rule.operator}
          onValueChange={(op) => onChange({ ...rule, operator: op as SkipOperator })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op} value={op}>
                {OPERATOR_LABEL[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ValueInput
          question={question}
          operator={rule.operator}
          value={rule.value}
          onChange={(v) => onChange({ ...rule, value: v })}
        />
        <span className="text-muted-foreground">então</span>
        <Select value={destination} onValueChange={setDestination}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NEXT}>Ir para a próxima pergunta</SelectItem>
            {otherQuestions.map((q) => (
              <SelectItem key={q.id} value={`goto:${q.id}`}>
                Ir para: {q.title.slice(0, 40)}
              </SelectItem>
            ))}
            <SelectItem value={END}>Encerrar pesquisa</SelectItem>
            <SelectItem value={MESSAGE}>Mostrar mensagem e encerrar</SelectItem>
            <SelectItem value={REDIRECT}>Redirecionar para URL</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="ml-auto size-8" onClick={onRemove}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
      {rule.outcome && (
        <OutcomeExtraFields
          outcome={rule.outcome}
          onChange={(outcome) => onChange({ ...rule, outcome })}
        />
      )}
    </div>
  )
}

interface SkipLogicEditorProps {
  question: Question
  allQuestions: Question[]
  onChangeRules: (rules: SkipRule[]) => void
  defaultOutcome: Outcome | null
  onChangeDefaultOutcome: (outcome: Outcome | null) => void
}

export function SkipLogicEditor({
  question,
  allQuestions,
  onChangeRules,
  defaultOutcome,
  onChangeDefaultOutcome,
}: SkipLogicEditorProps) {
  const otherQuestions = allQuestions.filter((q) => q.id !== question.id)
  const rules = question.skipRules

  function addRule() {
    const operators = operatorsForType(question.type)
    onChangeRules([
      ...rules,
      { id: crypto.randomUUID(), operator: operators[0], value: "", goToQuestionId: null, outcome: null },
    ])
  }

  const defaultDestination = defaultOutcome
    ? destinationValue({ goToQuestionId: null, outcome: defaultOutcome })
    : NEXT

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Ramificação por resposta (skip logic)</Label>
          <Button variant="outline" size="sm" onClick={addRule}>
            <Plus className="size-3.5" /> Adicionar regra
          </Button>
        </div>
        {rules.length === 0 && (
          <p className="text-muted-foreground text-xs">
            Nenhuma regra configurada — a pesquisa segue o fluxo padrão (próxima pergunta na
            ordem da lista).
          </p>
        )}
        <div className="flex flex-col gap-2">
          {rules.map((rule) => (
            <RuleRow
              key={rule.id}
              question={question}
              otherQuestions={otherQuestions}
              rule={rule}
              onChange={(updated) =>
                onChangeRules(rules.map((r) => (r.id === rule.id ? updated : r)))
              }
              onRemove={() => onChangeRules(rules.filter((r) => r.id !== rule.id))}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t pt-3">
        <Label className="text-sm">Ação padrão (quando nenhuma regra acima se aplica)</Label>
        <Select
          value={defaultDestination}
          onValueChange={(dest) => {
            if (dest === NEXT) onChangeDefaultOutcome(null)
            else if (dest === END) onChangeDefaultOutcome({ type: "end" })
            else if (dest === MESSAGE) onChangeDefaultOutcome({ type: "message", message: "" })
            else if (dest === REDIRECT) onChangeDefaultOutcome({ type: "redirect", redirectUrl: "" })
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NEXT}>Seguir fluxo normal (próxima pergunta)</SelectItem>
            <SelectItem value={END}>Sempre encerrar após esta pergunta</SelectItem>
            <SelectItem value={MESSAGE}>Encerrar com mensagem personalizada</SelectItem>
            <SelectItem value={REDIRECT}>Encerrar e redirecionar para URL</SelectItem>
          </SelectContent>
        </Select>
        {defaultOutcome && (
          <OutcomeExtraFields
            outcome={defaultOutcome}
            onChange={(o) => onChangeDefaultOutcome(o)}
          />
        )}
      </div>
    </div>
  )
}
