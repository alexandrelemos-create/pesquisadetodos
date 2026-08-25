"use client"

import * as React from "react"
import { Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Answer, Question, ResponseSession, SessionStatus } from "@/lib/types"

const STATUS_LABEL: Record<SessionStatus, string> = {
  in_progress: "Em andamento",
  completed: "Concluída",
  abandoned: "Abandonada",
}

const STATUS_VARIANT: Record<SessionStatus, "secondary" | "success" | "outline"> = {
  in_progress: "secondary",
  completed: "success",
  abandoned: "outline",
}

function formatAnswerValue(value: unknown, question: Question | undefined): string {
  if (value == null) return "—"
  if (Array.isArray(value)) {
    if (question?.type === "multiple_choice") {
      const options = (question.config as { options: { id: string; label: string }[] }).options
      return value.map((v) => options.find((o) => o.id === v)?.label ?? String(v)).join(", ")
    }
    return value.join(", ")
  }
  if (typeof value === "object") {
    const v = value as { optionId?: string; otherText?: string }
    if (v.optionId === "other") return `Outro: ${v.otherText ?? ""}`
    if (v.optionId && question?.type === "single_choice") {
      const options = (question.config as { options: { id: string; label: string }[] }).options
      return options.find((o) => o.id === v.optionId)?.label ?? v.optionId
    }
    return JSON.stringify(value)
  }
  return String(value)
}

export function ResponsesClient({
  campaignId,
  questions,
  sessions,
}: {
  campaignId: string
  questions: Question[]
  sessions: { session: ResponseSession; answers: Answer[] }[]
}) {
  const [detail, setDetail] = React.useState<{ session: ResponseSession; answers: Answer[] } | null>(
    null
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{sessions.length} submissões</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/campaigns/${campaignId}/export?format=csv`}>
              <Download className="size-3.5" /> Exportar CSV
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/campaigns/${campaignId}/export?format=json`}>
              <Download className="size-3.5" /> Exportar JSON
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="px-0">
          {sessions.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">
              Ainda não há respostas para esta campanha.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Respostas</TableHead>
                  <TableHead>Iniciada em</TableHead>
                  <TableHead>Concluída em</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map(({ session, answers }) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-xs">
                      {session.visitorId.slice(0, 12)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[session.status]}>
                        {STATUS_LABEL[session.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{answers.length}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(session.startedAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {session.completedAt
                        ? new Date(session.completedAt).toLocaleString("pt-BR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setDetail({ session, answers })}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da submissão</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="flex flex-col gap-3">
              <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
                <span>Visitante: {detail.session.visitorId}</span>
                <span>Status: {STATUS_LABEL[detail.session.status]}</span>
                <span>URL: {detail.session.pageUrl ?? "—"}</span>
              </div>
              <div className="flex flex-col gap-3">
                {questions.map((q) => {
                  const answer = detail.answers.find((a) => a.questionId === q.id)
                  return (
                    <div key={q.id} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{q.title}</p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {answer ? formatAnswerValue(answer.value, q) : "Não respondida"}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
