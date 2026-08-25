"use client"

import type { Campaign, Question, WebhookDeliveryLog } from "@/lib/types"

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Erro na requisição (${res.status})`)
  }
  return res.json() as Promise<T>
}

export const api = {
  listCampaigns: () => request<{ campaigns: Campaign[] }>("/api/campaigns"),
  getCampaign: (id: string) => request<{ campaign: Campaign }>(`/api/campaigns/${id}`),
  createCampaign: (input: Partial<Campaign>) =>
    request<{ campaign: Campaign }>("/api/campaigns", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateCampaign: (id: string, patch: Partial<Campaign>) =>
    request<{ campaign: Campaign }>(`/api/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteCampaign: (id: string) =>
    request<{ ok: true }>(`/api/campaigns/${id}`, { method: "DELETE" }),
  duplicateCampaign: (id: string) =>
    request<{ campaign: Campaign }>(`/api/campaigns/${id}/duplicate`, { method: "POST" }),

  listQuestions: (campaignId: string) =>
    request<{ questions: Question[] }>(`/api/campaigns/${campaignId}/questions`),
  createQuestion: (campaignId: string, input: Partial<Question>) =>
    request<{ question: Question }>(`/api/campaigns/${campaignId}/questions`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateQuestion: (campaignId: string, questionId: string, patch: Partial<Question>) =>
    request<{ question: Question }>(`/api/campaigns/${campaignId}/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteQuestion: (campaignId: string, questionId: string) =>
    request<{ ok: true }>(`/api/campaigns/${campaignId}/questions/${questionId}`, {
      method: "DELETE",
    }),
  reorderQuestions: (campaignId: string, orderedIds: string[]) =>
    request<{ ok: true }>(`/api/campaigns/${campaignId}/questions/reorder`, {
      method: "POST",
      body: JSON.stringify({ orderedIds }),
    }),

  getResponses: (campaignId: string) =>
    request<{
      questions: Question[]
      sessions: { session: import("@/lib/types").ResponseSession; answers: import("@/lib/types").Answer[] }[]
    }>(`/api/campaigns/${campaignId}/responses`),

  getAnalytics: (campaignId: string) =>
    request<{
      impressions: number
      started: number
      completed: number
      abandoned: number
      inProgress: number
      responseRate: number
      completionRate: number
      perQuestion: {
        questionId: string
        title: string
        type: string
        answeredCount: number
        responseRate: number
        average: number | null
        npsScore: number | null
        distribution: Record<string, number>
      }[]
    }>(`/api/campaigns/${campaignId}/analytics`),

  testWebhook: (campaignId: string, url?: string) =>
    request<{ delivery: WebhookDeliveryLog }>(`/api/campaigns/${campaignId}/webhook-test`, {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  listWebhookDeliveries: (campaignId: string) =>
    request<{ deliveries: WebhookDeliveryLog[] }>(`/api/campaigns/${campaignId}/webhook-deliveries`),

  seedDemo: () => request<{ campaign: Campaign }>("/api/dev/seed", { method: "POST" }),
}
