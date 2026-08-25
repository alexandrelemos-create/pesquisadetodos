"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Question } from "@/lib/types"

interface AnalyticsData {
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
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function optionLabelMap(question: Question | undefined) {
  if (!question) return new Map<string, string>()
  const options =
    question.type === "single_choice" || question.type === "multiple_choice"
      ? (question.config as { options: { id: string; label: string }[] }).options
      : []
  return new Map(options.map((o) => [o.id, o.label]))
}

export function AnalyticsClient({
  data,
  questions,
}: {
  data: AnalyticsData
  questions: Question[]
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Impressões do widget" value={String(data.impressions)} />
        <StatCard label="Iniciaram a pesquisa" value={String(data.started)} sub={pct(data.responseRate) + " das impressões"} />
        <StatCard label="Concluíram" value={String(data.completed)} sub={pct(data.completionRate) + " de quem iniciou"} />
        <StatCard label="Em andamento" value={String(data.inProgress)} />
        <StatCard label="Abandonaram" value={String(data.abandoned)} />
      </div>

      <div className="flex flex-col gap-4">
        {data.perQuestion.map((q) => {
          const question = questions.find((qq) => qq.id === q.questionId)
          const labelMap = optionLabelMap(question)
          const chartData = Object.entries(q.distribution).map(([key, count]) => ({
            name: labelMap.get(key) ?? key,
            count,
          }))

          return (
            <Card key={q.questionId}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium">{q.title}</CardTitle>
                  <Badge variant="outline">{pct(q.responseRate)} responderam</Badge>
                </div>
                <CardDescription className="flex gap-4">
                  <span>{q.answeredCount} respostas</span>
                  {q.average != null && <span>Média: {q.average.toFixed(1)}</span>}
                  {q.npsScore != null && <span>NPS: {q.npsScore}</span>}
                </CardDescription>
              </CardHeader>
              {chartData.length > 0 && (
                <CardContent>
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" height={40} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
