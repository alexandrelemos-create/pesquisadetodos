// Tipos centrais da plataforma de micropesquisas

export type QuestionType =
  | "rating"
  | "open_text"
  | "single_choice"
  | "multiple_choice"

export type RatingSubtype = "nps" | "csat" | "stars" | "emoji"

export interface RatingConfig {
  subtype: RatingSubtype
  // nps: 0-10 fixo | csat: 1-5 fixo | stars: 1-5 (ou custom max) | emoji: 1-5
  scaleMax?: number
  lowLabel?: string
  highLabel?: string
}

export interface OpenTextConfig {
  multiline: boolean
  maxLength?: number
  placeholder?: string
}

export interface ChoiceOption {
  id: string
  label: string
}

export interface SingleChoiceConfig {
  options: ChoiceOption[]
  allowOther: boolean
}

export interface MultipleChoiceConfig {
  options: ChoiceOption[]
  minChoices?: number
  maxChoices?: number
}

export type QuestionConfig =
  | RatingConfig
  | OpenTextConfig
  | SingleChoiceConfig
  | MultipleChoiceConfig

export type SkipOperator =
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "eq"
  | "neq"
  | "in"
  | "contains"

export type OutcomeType = "end" | "redirect" | "message" | "next"

export interface Outcome {
  type: OutcomeType
  message?: string
  redirectUrl?: string
}

export interface SkipRule {
  id: string
  operator: SkipOperator
  value: string | number | string[]
  // destino: id de outra pergunta, ou um outcome direto
  goToQuestionId?: string | null
  outcome?: Outcome | null
}

export interface Question {
  id: string
  campaignId: string
  order: number
  type: QuestionType
  title: string
  description?: string
  required: boolean
  config: QuestionConfig
  skipRules: SkipRule[]
  defaultOutcome?: Outcome | null // usado quando nenhuma regra bate (senão segue ordem)
  createdAt: string
  updatedAt: string
}

export type TriggerType =
  | "time_on_page"
  | "scroll_depth"
  | "element_click"
  | "exit_intent"
  | "immediate"

export interface TriggerConfig {
  id: string
  type: TriggerType
  // time_on_page: segundos | scroll_depth: percentual (0-100) | element_click: selector
  value?: number
  selector?: string
}

export interface FrequencyRule {
  maxDisplays: number
  periodDays: number
}

export type CampaignStatus = "draft" | "active" | "paused" | "archived"

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  headline: string
  estimatedSeconds: number
  triggers: TriggerConfig[]
  frequencyRule: FrequencyRule
  completionOutcome: Outcome
  webhookUrl?: string | null
  webhookEnabled: boolean
  webhookEvents: WebhookEvent[]
  primaryColor: string
  createdAt: string
  updatedAt: string
}

export type WebhookEvent = "response_started" | "response_completed"

export type SessionStatus = "in_progress" | "completed" | "abandoned"

export interface ResponseSession {
  id: string
  campaignId: string
  visitorId: string
  status: SessionStatus
  startedAt: string
  completedAt?: string | null
  outcome?: Outcome | null
  pageUrl?: string | null
  referrer?: string | null
  userAgent?: string | null
}

export interface Answer {
  id: string
  sessionId: string
  questionId: string
  value: unknown
  answeredAt: string
}

export interface WebhookDeliveryLog {
  id: string
  campaignId: string
  sessionId: string
  event: WebhookEvent
  url: string
  statusCode: number | null
  success: boolean
  requestBody: string
  responseBody: string | null
  createdAt: string
}

// --- payloads públicos usados pelo widget ---

export interface PublicQuestion {
  id: string
  order: number
  type: QuestionType
  title: string
  description?: string
  required: boolean
  config: QuestionConfig
}

export interface PublicCampaign {
  id: string
  headline: string
  estimatedSeconds: number
  primaryColor: string
  questions: PublicQuestion[]
}
