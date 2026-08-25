// Motor de lógica condicional (skip logic) — função pura, usada no servidor
// (para decidir o próximo passo) e no admin (para simular o fluxo no preview).

import type { Outcome, Question, SkipRule } from "@/lib/types"

export type NextStep =
  | { kind: "goto"; questionId: string }
  | { kind: "outcome"; outcome: Outcome }
  | { kind: "next" } // segue a ordem natural

function toComparable(answerValue: unknown): number | string | string[] | null {
  if (answerValue == null) return null
  if (typeof answerValue === "number") return answerValue
  if (typeof answerValue === "string") return answerValue
  if (Array.isArray(answerValue)) return answerValue as string[]
  if (
    typeof answerValue === "object" &&
    answerValue !== null &&
    "optionId" in (answerValue as Record<string, unknown>)
  ) {
    return String((answerValue as Record<string, unknown>).optionId)
  }
  return null
}

function ruleMatches(rule: SkipRule, answerValue: unknown): boolean {
  const comparable = toComparable(answerValue)
  if (comparable === null) return false

  switch (rule.operator) {
    case "lt":
      return typeof comparable === "number" && comparable < Number(rule.value)
    case "lte":
      return typeof comparable === "number" && comparable <= Number(rule.value)
    case "gt":
      return typeof comparable === "number" && comparable > Number(rule.value)
    case "gte":
      return typeof comparable === "number" && comparable >= Number(rule.value)
    case "eq":
      if (Array.isArray(comparable)) return comparable.includes(String(rule.value))
      return String(comparable) === String(rule.value)
    case "neq":
      if (Array.isArray(comparable)) return !comparable.includes(String(rule.value))
      return String(comparable) !== String(rule.value)
    case "in": {
      const values = Array.isArray(rule.value) ? rule.value : [String(rule.value)]
      if (Array.isArray(comparable)) {
        return comparable.some((c) => values.includes(c))
      }
      return values.includes(String(comparable))
    }
    case "contains": {
      if (Array.isArray(comparable)) {
        return comparable.includes(String(rule.value))
      }
      return String(comparable).includes(String(rule.value))
    }
    default:
      return false
  }
}

export function evaluateNextStep(
  question: Question,
  answerValue: unknown
): NextStep {
  for (const rule of question.skipRules) {
    if (ruleMatches(rule, answerValue)) {
      if (rule.outcome) {
        return { kind: "outcome", outcome: rule.outcome }
      }
      if (rule.goToQuestionId) {
        return { kind: "goto", questionId: rule.goToQuestionId }
      }
      return { kind: "next" }
    }
  }
  if (question.defaultOutcome) {
    return { kind: "outcome", outcome: question.defaultOutcome }
  }
  return { kind: "next" }
}

// Resolve a próxima pergunta (ou finalização) a partir de uma lista ordenada
export function resolveNext(
  questions: Question[],
  currentQuestion: Question,
  answerValue: unknown,
  fallbackOutcome: Outcome = { type: "end" }
): NextStep {
  const step = evaluateNextStep(currentQuestion, answerValue)
  if (step.kind !== "next") return step

  const idx = questions.findIndex((q) => q.id === currentQuestion.id)
  const nextQuestion = questions[idx + 1]
  if (!nextQuestion) {
    return { kind: "outcome", outcome: fallbackOutcome }
  }
  return { kind: "goto", questionId: nextQuestion.id }
}

export const OPERATOR_LABELS: Record<SkipRule["operator"], string> = {
  lt: "menor que",
  lte: "menor ou igual a",
  gt: "maior que",
  gte: "maior ou igual a",
  eq: "igual a",
  neq: "diferente de",
  in: "está em",
  contains: "contém",
}
