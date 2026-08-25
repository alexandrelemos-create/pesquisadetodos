import { randomUUID } from "node:crypto"
import { db } from "@/lib/db"
import type {
  Campaign,
  CampaignStatus,
  Question,
  ResponseSession,
  Answer,
  WebhookDeliveryLog,
  TriggerConfig,
  FrequencyRule,
  Outcome,
  WebhookEvent,
  QuestionConfig,
  SkipRule,
  SessionStatus,
} from "@/lib/types"

function nowIso() {
  return new Date().toISOString()
}

export function newId() {
  return randomUUID()
}

// ---------- Campaigns ----------

interface CampaignRow {
  id: string
  name: string
  status: string
  headline: string
  estimated_seconds: number
  triggers: string
  frequency_rule: string
  completion_outcome: string
  webhook_url: string | null
  webhook_enabled: number
  webhook_events: string
  primary_color: string
  created_at: string
  updated_at: string
}

function rowToCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    status: row.status as CampaignStatus,
    headline: row.headline,
    estimatedSeconds: row.estimated_seconds,
    triggers: JSON.parse(row.triggers) as TriggerConfig[],
    frequencyRule: JSON.parse(row.frequency_rule) as FrequencyRule,
    completionOutcome: JSON.parse(row.completion_outcome) as Outcome,
    webhookUrl: row.webhook_url,
    webhookEnabled: !!row.webhook_enabled,
    webhookEvents: JSON.parse(row.webhook_events) as WebhookEvent[],
    primaryColor: row.primary_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listCampaigns(): Campaign[] {
  const rows = db
    .prepare(`SELECT * FROM campaigns ORDER BY created_at DESC`)
    .all() as CampaignRow[]
  return rows.map(rowToCampaign)
}

export function getCampaign(id: string): Campaign | null {
  const row = db
    .prepare(`SELECT * FROM campaigns WHERE id = ?`)
    .get(id) as CampaignRow | undefined
  return row ? rowToCampaign(row) : null
}

export function createCampaign(input: Partial<Campaign>): Campaign {
  const id = newId()
  const ts = nowIso()
  const campaign: Campaign = {
    id,
    name: input.name?.trim() || "Nova campanha",
    status: input.status || "draft",
    headline: input.headline || "Sua opinião é muito importante!",
    estimatedSeconds: input.estimatedSeconds ?? 30,
    triggers: input.triggers ?? [
      { id: newId(), type: "time_on_page", value: 10 },
    ],
    frequencyRule: input.frequencyRule ?? { maxDisplays: 1, periodDays: 30 },
    completionOutcome:
      input.completionOutcome ?? {
        type: "message",
        message: "Obrigado pela sua resposta!",
      },
    webhookUrl: input.webhookUrl ?? null,
    webhookEnabled: input.webhookEnabled ?? false,
    webhookEvents: input.webhookEvents ?? ["response_completed"],
    primaryColor: input.primaryColor ?? "#171717",
    createdAt: ts,
    updatedAt: ts,
  }
  db.prepare(
    `INSERT INTO campaigns (id, name, status, headline, estimated_seconds, triggers, frequency_rule, completion_outcome, webhook_url, webhook_enabled, webhook_events, primary_color, created_at, updated_at)
     VALUES (@id, @name, @status, @headline, @estimated_seconds, @triggers, @frequency_rule, @completion_outcome, @webhook_url, @webhook_enabled, @webhook_events, @primary_color, @created_at, @updated_at)`
  ).run({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    headline: campaign.headline,
    estimated_seconds: campaign.estimatedSeconds,
    triggers: JSON.stringify(campaign.triggers),
    frequency_rule: JSON.stringify(campaign.frequencyRule),
    completion_outcome: JSON.stringify(campaign.completionOutcome),
    webhook_url: campaign.webhookUrl,
    webhook_enabled: campaign.webhookEnabled ? 1 : 0,
    webhook_events: JSON.stringify(campaign.webhookEvents),
    primary_color: campaign.primaryColor,
    created_at: campaign.createdAt,
    updated_at: campaign.updatedAt,
  })
  return campaign
}

export function updateCampaign(
  id: string,
  patch: Partial<Campaign>
): Campaign | null {
  const existing = getCampaign(id)
  if (!existing) return null
  const merged: Campaign = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: nowIso(),
  }
  db.prepare(
    `UPDATE campaigns SET name=@name, status=@status, headline=@headline, estimated_seconds=@estimated_seconds,
       triggers=@triggers, frequency_rule=@frequency_rule, completion_outcome=@completion_outcome,
       webhook_url=@webhook_url, webhook_enabled=@webhook_enabled, webhook_events=@webhook_events,
       primary_color=@primary_color, updated_at=@updated_at
     WHERE id=@id`
  ).run({
    id: merged.id,
    name: merged.name,
    status: merged.status,
    headline: merged.headline,
    estimated_seconds: merged.estimatedSeconds,
    triggers: JSON.stringify(merged.triggers),
    frequency_rule: JSON.stringify(merged.frequencyRule),
    completion_outcome: JSON.stringify(merged.completionOutcome),
    webhook_url: merged.webhookUrl,
    webhook_enabled: merged.webhookEnabled ? 1 : 0,
    webhook_events: JSON.stringify(merged.webhookEvents),
    primary_color: merged.primaryColor,
    updated_at: merged.updatedAt,
  })
  return merged
}

export function deleteCampaign(id: string) {
  db.prepare(`DELETE FROM campaigns WHERE id = ?`).run(id)
}

export function duplicateCampaign(id: string): Campaign | null {
  const source = getCampaign(id)
  if (!source) return null
  const clone = createCampaign({
    ...source,
    name: `${source.name} (cópia)`,
    status: "draft",
  })
  const questions = listQuestions(id)
  for (const q of questions) {
    createQuestion(clone.id, { ...q })
  }
  return clone
}

// ---------- Questions ----------

interface QuestionRow {
  id: string
  campaign_id: string
  order: number
  type: string
  title: string
  description: string | null
  required: number
  config: string
  skip_rules: string
  default_outcome: string | null
  created_at: string
  updated_at: string
}

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    order: row.order,
    type: row.type as Question["type"],
    title: row.title,
    description: row.description ?? undefined,
    required: !!row.required,
    config: JSON.parse(row.config) as QuestionConfig,
    skipRules: JSON.parse(row.skip_rules) as SkipRule[],
    defaultOutcome: row.default_outcome
      ? (JSON.parse(row.default_outcome) as Outcome)
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listQuestions(campaignId: string): Question[] {
  const rows = db
    .prepare(
      `SELECT * FROM questions WHERE campaign_id = ? ORDER BY "order" ASC`
    )
    .all(campaignId) as QuestionRow[]
  return rows.map(rowToQuestion)
}

export function getQuestion(id: string): Question | null {
  const row = db
    .prepare(`SELECT * FROM questions WHERE id = ?`)
    .get(id) as QuestionRow | undefined
  return row ? rowToQuestion(row) : null
}

export function createQuestion(
  campaignId: string,
  input: Partial<Question>
): Question {
  const id = newId()
  const ts = nowIso()
  const maxOrderRow = db
    .prepare(
      `SELECT COALESCE(MAX("order"), -1) as maxOrder FROM questions WHERE campaign_id = ?`
    )
    .get(campaignId) as { maxOrder: number }
  const question: Question = {
    id,
    campaignId,
    order: input.order ?? maxOrderRow.maxOrder + 1,
    type: input.type ?? "open_text",
    title: input.title ?? "Nova pergunta",
    description: input.description,
    required: input.required ?? true,
    config: input.config ?? { multiline: false, maxLength: 280 },
    skipRules: input.skipRules ?? [],
    defaultOutcome: input.defaultOutcome ?? null,
    createdAt: ts,
    updatedAt: ts,
  }
  db.prepare(
    `INSERT INTO questions (id, campaign_id, "order", type, title, description, required, config, skip_rules, default_outcome, created_at, updated_at)
     VALUES (@id, @campaign_id, @order, @type, @title, @description, @required, @config, @skip_rules, @default_outcome, @created_at, @updated_at)`
  ).run({
    id: question.id,
    campaign_id: question.campaignId,
    order: question.order,
    type: question.type,
    title: question.title,
    description: question.description ?? null,
    required: question.required ? 1 : 0,
    config: JSON.stringify(question.config),
    skip_rules: JSON.stringify(question.skipRules),
    default_outcome: question.defaultOutcome
      ? JSON.stringify(question.defaultOutcome)
      : null,
    created_at: question.createdAt,
    updated_at: question.updatedAt,
  })
  return question
}

export function updateQuestion(
  id: string,
  patch: Partial<Question>
): Question | null {
  const existing = getQuestion(id)
  if (!existing) return null
  const merged: Question = {
    ...existing,
    ...patch,
    id: existing.id,
    campaignId: existing.campaignId,
    updatedAt: nowIso(),
  }
  db.prepare(
    `UPDATE questions SET "order"=@order, type=@type, title=@title, description=@description, required=@required,
       config=@config, skip_rules=@skip_rules, default_outcome=@default_outcome, updated_at=@updated_at
     WHERE id=@id`
  ).run({
    id: merged.id,
    order: merged.order,
    type: merged.type,
    title: merged.title,
    description: merged.description ?? null,
    required: merged.required ? 1 : 0,
    config: JSON.stringify(merged.config),
    skip_rules: JSON.stringify(merged.skipRules),
    default_outcome: merged.defaultOutcome
      ? JSON.stringify(merged.defaultOutcome)
      : null,
    updated_at: merged.updatedAt,
  })
  return merged
}

export function deleteQuestion(id: string) {
  db.prepare(`DELETE FROM questions WHERE id = ?`).run(id)
}

export function reorderQuestions(campaignId: string, orderedIds: string[]) {
  const stmt = db.prepare(
    `UPDATE questions SET "order" = ? WHERE id = ? AND campaign_id = ?`
  )
  const tx = db.transaction((ids: string[]) => {
    ids.forEach((qid, index) => {
      stmt.run(index, qid, campaignId)
    })
  })
  tx(orderedIds)
}

// ---------- Response sessions & answers ----------

interface SessionRow {
  id: string
  campaign_id: string
  visitor_id: string
  status: string
  started_at: string
  completed_at: string | null
  outcome: string | null
  page_url: string | null
  referrer: string | null
  user_agent: string | null
}

function rowToSession(row: SessionRow): ResponseSession {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    visitorId: row.visitor_id,
    status: row.status as SessionStatus,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    outcome: row.outcome ? (JSON.parse(row.outcome) as Outcome) : null,
    pageUrl: row.page_url,
    referrer: row.referrer,
    userAgent: row.user_agent,
  }
}

export function createSession(input: {
  campaignId: string
  visitorId: string
  pageUrl?: string | null
  referrer?: string | null
  userAgent?: string | null
}): ResponseSession {
  const id = newId()
  const ts = nowIso()
  const session: ResponseSession = {
    id,
    campaignId: input.campaignId,
    visitorId: input.visitorId,
    status: "in_progress",
    startedAt: ts,
    completedAt: null,
    outcome: null,
    pageUrl: input.pageUrl ?? null,
    referrer: input.referrer ?? null,
    userAgent: input.userAgent ?? null,
  }
  db.prepare(
    `INSERT INTO response_sessions (id, campaign_id, visitor_id, status, started_at, completed_at, outcome, page_url, referrer, user_agent)
     VALUES (@id, @campaign_id, @visitor_id, @status, @started_at, @completed_at, @outcome, @page_url, @referrer, @user_agent)`
  ).run({
    id: session.id,
    campaign_id: session.campaignId,
    visitor_id: session.visitorId,
    status: session.status,
    started_at: session.startedAt,
    completed_at: session.completedAt,
    outcome: null,
    page_url: session.pageUrl,
    referrer: session.referrer,
    user_agent: session.userAgent,
  })
  return session
}

// Registrado quando o gatilho dispara e o card do widget é exibido ao
// visitante (independente de ele interagir ou não) — é o que alimenta a
// regra de frequência (frequency capping).
export function recordImpression(campaignId: string, visitorId: string) {
  db.prepare(
    `INSERT INTO visitor_impressions (id, campaign_id, visitor_id, shown_at) VALUES (?, ?, ?, ?)`
  ).run(newId(), campaignId, visitorId, nowIso())
}

export function getSession(id: string): ResponseSession | null {
  const row = db
    .prepare(`SELECT * FROM response_sessions WHERE id = ?`)
    .get(id) as SessionRow | undefined
  return row ? rowToSession(row) : null
}

export function upsertAnswer(
  sessionId: string,
  questionId: string,
  value: unknown
): Answer {
  const existing = db
    .prepare(
      `SELECT id FROM answers WHERE session_id = ? AND question_id = ?`
    )
    .get(sessionId, questionId) as { id: string } | undefined
  const ts = nowIso()
  if (existing) {
    db.prepare(`UPDATE answers SET value = ?, answered_at = ? WHERE id = ?`).run(
      JSON.stringify(value),
      ts,
      existing.id
    )
    return { id: existing.id, sessionId, questionId, value, answeredAt: ts }
  }
  const id = newId()
  db.prepare(
    `INSERT INTO answers (id, session_id, question_id, value, answered_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, sessionId, questionId, JSON.stringify(value), ts)
  return { id, sessionId, questionId, value, answeredAt: ts }
}

export function listAnswers(sessionId: string): Answer[] {
  const rows = db
    .prepare(`SELECT * FROM answers WHERE session_id = ? ORDER BY answered_at ASC`)
    .all(sessionId) as {
    id: string
    session_id: string
    question_id: string
    value: string
    answered_at: string
  }[]
  return rows.map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    questionId: r.question_id,
    value: JSON.parse(r.value),
    answeredAt: r.answered_at,
  }))
}

export function finishSession(
  id: string,
  outcome: Outcome,
  status: SessionStatus = "completed"
): ResponseSession | null {
  const existing = getSession(id)
  if (!existing) return null
  const ts = nowIso()
  db.prepare(
    `UPDATE response_sessions SET status = ?, completed_at = ?, outcome = ? WHERE id = ?`
  ).run(status, ts, JSON.stringify(outcome), id)
  return { ...existing, status, completedAt: ts, outcome }
}

export function listSessionsByCampaign(
  campaignId: string
): ResponseSession[] {
  const rows = db
    .prepare(
      `SELECT * FROM response_sessions WHERE campaign_id = ? ORDER BY started_at DESC`
    )
    .all(campaignId) as SessionRow[]
  return rows.map(rowToSession)
}

export function countImpressions(campaignId: string): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM visitor_impressions WHERE campaign_id = ?`
    )
    .get(campaignId) as { c: number }
  return row.c
}

// frequency capping: retorna true se pode exibir a pesquisa para este visitante
export function canShowToVisitor(
  campaignId: string,
  visitorId: string,
  rule: FrequencyRule
): boolean {
  const cutoff = new Date(
    Date.now() - rule.periodDays * 24 * 60 * 60 * 1000
  ).toISOString()
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM visitor_impressions WHERE campaign_id = ? AND visitor_id = ? AND shown_at >= ?`
    )
    .get(campaignId, visitorId, cutoff) as { c: number }
  return row.c < rule.maxDisplays
}

// ---------- Webhook deliveries ----------

export function logWebhookDelivery(entry: {
  campaignId: string
  sessionId: string
  event: WebhookEvent
  url: string
  statusCode: number | null
  success: boolean
  requestBody: string
  responseBody: string | null
}): WebhookDeliveryLog {
  const id = newId()
  const ts = nowIso()
  db.prepare(
    `INSERT INTO webhook_deliveries (id, campaign_id, session_id, event, url, status_code, success, request_body, response_body, created_at)
     VALUES (@id, @campaign_id, @session_id, @event, @url, @status_code, @success, @request_body, @response_body, @created_at)`
  ).run({
    id,
    campaign_id: entry.campaignId,
    session_id: entry.sessionId,
    event: entry.event,
    url: entry.url,
    status_code: entry.statusCode,
    success: entry.success ? 1 : 0,
    request_body: entry.requestBody,
    response_body: entry.responseBody,
    created_at: ts,
  })
  return {
    id,
    campaignId: entry.campaignId,
    sessionId: entry.sessionId,
    event: entry.event,
    url: entry.url,
    statusCode: entry.statusCode,
    success: entry.success,
    requestBody: entry.requestBody,
    responseBody: entry.responseBody,
    createdAt: ts,
  }
}

export function listWebhookDeliveries(
  campaignId: string,
  limit = 50
): WebhookDeliveryLog[] {
  const rows = db
    .prepare(
      `SELECT * FROM webhook_deliveries WHERE campaign_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .all(campaignId, limit) as {
    id: string
    campaign_id: string
    session_id: string
    event: string
    url: string
    status_code: number | null
    success: number
    request_body: string
    response_body: string | null
    created_at: string
  }[]
  return rows.map((r) => ({
    id: r.id,
    campaignId: r.campaign_id,
    sessionId: r.session_id,
    event: r.event as WebhookEvent,
    url: r.url,
    statusCode: r.status_code,
    success: !!r.success,
    requestBody: r.request_body,
    responseBody: r.response_body,
    createdAt: r.created_at,
  }))
}
