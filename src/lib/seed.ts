import { db } from "@/lib/db"
import {
  createCampaign,
  createQuestion,
  createSession,
  finishSession,
  listCampaigns,
  newId,
  recordImpression,
  updateCampaign,
  updateQuestion,
  upsertAnswer,
} from "@/lib/repo"
import type { Outcome } from "@/lib/types"

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export function seedIfEmpty() {
  const existing = listCampaigns()
  if (existing.length > 0) return { seeded: false }
  seedDemoCampaign()
  return { seeded: true }
}

export function seedDemoCampaign() {
  const campaign = createCampaign({
    name: "NPS Pós-atendimento",
    status: "active",
    headline: "Como foi sua experiência hoje?",
    estimatedSeconds: 25,
    triggers: [
      { id: newId(), type: "time_on_page", value: 8 },
      { id: newId(), type: "exit_intent" },
    ],
    frequencyRule: { maxDisplays: 1, periodDays: 30 },
    completionOutcome: {
      type: "message",
      message: "Muito obrigado pelo seu feedback! Ele nos ajuda a melhorar todos os dias.",
    },
    webhookUrl: "",
    webhookEnabled: false,
    webhookEvents: ["response_completed"],
    primaryColor: "#171717",
  })

  const qNps = createQuestion(campaign.id, {
    order: 0,
    type: "rating",
    title: "De 0 a 10, o quanto você recomendaria a MaisTODOS a um amigo ou colega?",
    required: true,
    config: { subtype: "nps", lowLabel: "Pouco provável", highLabel: "Muito provável" },
    skipRules: [
      { id: newId(), operator: "lte", value: 6, goToQuestionId: null },
      { id: newId(), operator: "gte", value: 9, goToQuestionId: null },
    ],
  })

  const qNegative = createQuestion(campaign.id, {
    order: 1,
    type: "open_text",
    title: "Sentimos muito. O que podemos melhorar?",
    description: "Sua resposta é anônima e vai direto para o time responsável.",
    required: true,
    config: { multiline: true, maxLength: 500, placeholder: "Conte pra gente o que aconteceu..." },
    skipRules: [],
    defaultOutcome: { type: "message", message: "Obrigado! Vamos revisar seu caso com atenção." },
  })

  const qReferral = createQuestion(campaign.id, {
    order: 2,
    type: "single_choice",
    title: "Que ótimo! O que mais te agradou no nosso atendimento?",
    required: false,
    config: {
      options: [
        { id: newId(), label: "Rapidez no atendimento" },
        { id: newId(), label: "Simpatia da equipe" },
        { id: newId(), label: "Resolução no primeiro contato" },
        { id: newId(), label: "Clareza das informações" },
      ],
      allowOther: true,
    },
    skipRules: [],
  })

  const qFeatures = createQuestion(campaign.id, {
    order: 3,
    type: "multiple_choice",
    title: "Quais recursos você mais usa na plataforma?",
    required: false,
    config: {
      options: [
        { id: newId(), label: "Emissão de boletos" },
        { id: newId(), label: "Conciliação financeira" },
        { id: newId(), label: "Antifraude" },
        { id: newId(), label: "Split de pagamentos" },
      ],
      minChoices: 0,
      maxChoices: 4,
    },
    skipRules: [],
  })

  const qCsat = createQuestion(campaign.id, {
    order: 4,
    type: "rating",
    title: "De forma geral, qual sua satisfação com o suporte recebido?",
    required: true,
    config: { subtype: "csat" },
    skipRules: [],
  })

  // liga a regra de skip da primeira pergunta às perguntas certas agora que
  // já temos os IDs gerados
  updateQuestion(qNps.id, {
    skipRules: [
      { id: newId(), operator: "lte", value: 6, goToQuestionId: qNegative.id },
      { id: newId(), operator: "gte", value: 9, goToQuestionId: qReferral.id },
    ],
  })
  updateQuestion(qReferral.id, {
    skipRules: [],
    defaultOutcome: null,
  })

  // --- respostas simuladas para o dashboard não nascer vazio ---
  const visitorIds = Array.from({ length: 42 }, () => newId())
  const outcomeThanks: Outcome = campaign.completionOutcome

  visitorIds.forEach((visitorId) => {
    const daysAgo = randomBetween(0, 29)
    recordImpression(campaign.id, visitorId)

    // ~70% dos que veem o card iniciam a pesquisa
    if (Math.random() > 0.7) return

    const session = createSession({
      campaignId: campaign.id,
      visitorId,
      pageUrl: "https://app.maistodos.com.br/checkout",
      referrer: "https://maistodos.com.br",
      userAgent: "Mozilla/5.0 (demo seed)",
    })

    const npsScore = randomBetween(0, 10)
    upsertAnswer(session.id, qNps.id, npsScore)

    // ~85% de quem inicia completa a pesquisa
    const completes = Math.random() < 0.85
    if (!completes) {
      return
    }

    if (npsScore <= 6) {
      upsertAnswer(
        session.id,
        qNegative.id,
        [
          "Demorou pra ser atendido",
          "Tive que repetir o problema várias vezes",
          "Faltou clareza na explicação",
        ][randomBetween(0, 2)]
      )
      finishSession(session.id, { type: "message", message: "Obrigado! Vamos revisar seu caso com atenção." })
    } else if (npsScore >= 9) {
      const options = (qReferral.config as { options: { id: string; label: string }[] }).options
      upsertAnswer(session.id, qReferral.id, { optionId: options[randomBetween(0, options.length - 1)].id })
      finishSession(session.id, outcomeThanks)
    } else {
      const featureOptions = (qFeatures.config as { options: { id: string; label: string }[] }).options
      const picked = featureOptions
        .filter(() => Math.random() > 0.4)
        .map((o) => o.id)
      upsertAnswer(session.id, qFeatures.id, picked)
      upsertAnswer(session.id, qCsat.id, randomBetween(2, 5))
      finishSession(session.id, outcomeThanks)
    }

    // sobrescreve started_at/completed_at para espalhar as respostas no
    // tempo (últimos 30 dias), mantendo a ordem cronológica entre os dois
    const startedIso = daysAgoIso(daysAgo)
    const completedIso = new Date(
      new Date(startedIso).getTime() + randomBetween(30, 240) * 1000
    ).toISOString()
    db.prepare(
      `UPDATE response_sessions SET started_at = ?, completed_at = CASE WHEN completed_at IS NOT NULL THEN ? ELSE NULL END WHERE id = ?`
    ).run(startedIso, completedIso, session.id)
  })

  updateCampaign(campaign.id, {})

  return campaign
}
