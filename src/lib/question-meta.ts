import type {
  MultipleChoiceConfig,
  OpenTextConfig,
  QuestionType,
  RatingConfig,
  RatingSubtype,
  SingleChoiceConfig,
  SkipOperator,
} from "@/lib/types"

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  rating: "Avaliação (rating)",
  open_text: "Pergunta aberta",
  single_choice: "Escolha única",
  multiple_choice: "Múltipla escolha",
}

export const RATING_SUBTYPE_LABEL: Record<RatingSubtype, string> = {
  nps: "NPS (0-10)",
  csat: "CSAT (1-5)",
  stars: "Estrelas",
  emoji: "Emojis de sentimento",
}

export function defaultConfigFor(type: QuestionType) {
  switch (type) {
    case "rating":
      return { subtype: "nps" } satisfies RatingConfig
    case "open_text":
      return { multiline: false, maxLength: 280 } satisfies OpenTextConfig
    case "single_choice":
      return {
        options: [
          { id: crypto.randomUUID(), label: "Opção 1" },
          { id: crypto.randomUUID(), label: "Opção 2" },
        ],
        allowOther: false,
      } satisfies SingleChoiceConfig
    case "multiple_choice":
      return {
        options: [
          { id: crypto.randomUUID(), label: "Opção 1" },
          { id: crypto.randomUUID(), label: "Opção 2" },
        ],
      } satisfies MultipleChoiceConfig
  }
}

export function operatorsForType(type: QuestionType): SkipOperator[] {
  switch (type) {
    case "rating":
      return ["lt", "lte", "gt", "gte", "eq", "neq"]
    case "single_choice":
      return ["eq", "neq", "in"]
    case "multiple_choice":
      return ["contains", "in"]
    case "open_text":
      return ["contains", "eq"]
  }
}

export const OPERATOR_LABEL: Record<SkipOperator, string> = {
  lt: "menor que",
  lte: "menor ou igual a",
  gt: "maior que",
  gte: "maior ou igual a",
  eq: "é igual a",
  neq: "é diferente de",
  in: "está entre",
  contains: "contém",
}
