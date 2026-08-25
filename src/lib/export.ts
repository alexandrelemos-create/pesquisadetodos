import type { Question, ResponseSession, Answer } from "@/lib/types"
import { listAnswers } from "@/lib/repo"

function formatValue(value: unknown): string {
  if (value == null) return ""
  if (Array.isArray(value)) return value.join(" | ")
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function csvEscape(value: string): string {
  if (/[",\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildExportRows(
  sessions: ResponseSession[],
  questions: Question[]
) {
  return sessions.map((session) => {
    const answers = listAnswers(session.id)
    const answerMap = new Map(answers.map((a) => [a.questionId, a]))
    const row: Record<string, string> = {
      sessionId: session.id,
      visitorId: session.visitorId,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt ?? "",
      pageUrl: session.pageUrl ?? "",
    }
    for (const q of questions) {
      const a = answerMap.get(q.id)
      row[q.title] = a ? formatValue(a.value) : ""
    }
    return row
  })
}

export function toCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const lines = [headers.map(csvEscape).join(",")]
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h] ?? "")).join(","))
  }
  return lines.join("\n")
}

export function toJson(
  sessions: ResponseSession[],
  questions: Question[]
): string {
  const data = sessions.map((session) => {
    const answers: Answer[] = listAnswers(session.id)
    return {
      session,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        questionTitle: questions.find((q) => q.id === a.questionId)?.title,
        value: a.value,
        answeredAt: a.answeredAt,
      })),
    }
  })
  return JSON.stringify(data, null, 2)
}
