import { countImpressions, listAnswers, listQuestions, listSessionsByCampaign } from "@/lib/repo"
import type { RatingConfig } from "@/lib/types"

export function getCampaignAnalytics(campaignId: string) {
  const sessions = listSessionsByCampaign(campaignId)
  const questions = listQuestions(campaignId)
  const impressions = countImpressions(campaignId)

  const started = sessions.length
  const completed = sessions.filter((s) => s.status === "completed").length
  const abandoned = sessions.filter((s) => s.status === "abandoned").length
  const inProgress = sessions.filter((s) => s.status === "in_progress").length

  const responseRate = impressions > 0 ? started / impressions : 0
  const completionRate = started > 0 ? completed / started : 0

  const perQuestion = questions.map((q) => {
    let answeredCount = 0
    const distribution: Record<string, number> = {}
    let sum = 0
    let numericCount = 0

    for (const session of sessions) {
      const answers = listAnswers(session.id)
      const answer = answers.find((a) => a.questionId === q.id)
      if (!answer) continue
      answeredCount++
      const value = answer.value
      if (q.type === "rating" && typeof value === "number") {
        sum += value
        numericCount++
        distribution[String(value)] = (distribution[String(value)] ?? 0) + 1
      } else if (q.type === "single_choice") {
        const key =
          typeof value === "object" && value !== null && "optionId" in (value as object)
            ? String((value as { optionId: string }).optionId)
            : String(value)
        distribution[key] = (distribution[key] ?? 0) + 1
      } else if (q.type === "multiple_choice" && Array.isArray(value)) {
        for (const v of value) {
          distribution[String(v)] = (distribution[String(v)] ?? 0) + 1
        }
      }
    }

    const avg = numericCount > 0 ? sum / numericCount : null
    let npsScore: number | null = null
    if (q.type === "rating" && (q.config as RatingConfig).subtype === "nps" && numericCount > 0) {
      let promoters = 0
      let detractors = 0
      for (const [k, v] of Object.entries(distribution)) {
        const score = Number(k)
        if (score >= 9) promoters += v
        if (score <= 6) detractors += v
      }
      npsScore = Math.round(((promoters - detractors) / numericCount) * 100)
    }

    return {
      questionId: q.id,
      title: q.title,
      type: q.type,
      answeredCount,
      responseRate: started > 0 ? answeredCount / started : 0,
      average: avg,
      npsScore,
      distribution,
    }
  })

  return {
    impressions,
    started,
    completed,
    abandoned,
    inProgress,
    responseRate,
    completionRate,
    perQuestion,
  }
}
