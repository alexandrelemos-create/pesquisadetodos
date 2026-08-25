"use client"

import * as React from "react"
import { toast } from "sonner"
import { CircleDot, ListChecks, MessageSquareText, Plus, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SortableQuestionList } from "@/components/admin/sortable-question-list"
import { QuestionConfigEditor } from "@/components/admin/question-config-editor"
import { SkipLogicEditor } from "@/components/admin/skip-logic-editor"
import { LivePreview } from "@/components/admin/live-preview"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { api } from "@/lib/api-client"
import { defaultConfigFor, QUESTION_TYPE_LABEL } from "@/lib/question-meta"
import type { Campaign, Outcome, Question, QuestionType, SkipRule } from "@/lib/types"

const TYPE_OPTIONS: { type: QuestionType; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "rating", icon: Star },
  { type: "open_text", icon: MessageSquareText },
  { type: "single_choice", icon: CircleDot },
  { type: "multiple_choice", icon: ListChecks },
]

export function QuestionsEditorClient({
  campaign,
  initialQuestions,
}: {
  campaign: Campaign
  initialQuestions: Question[]
}) {
  const [questions, setQuestions] = React.useState(initialQuestions)
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialQuestions[0]?.id ?? null
  )
  const selected = questions.find((q) => q.id === selectedId) ?? null

  const debouncedSave = useDebouncedCallback(
    (id: string, patch: Partial<Question>) => {
      api.updateQuestion(campaign.id, id, patch).catch(() => {
        toast.error("Falha ao salvar a pergunta")
      })
    },
    450
  )

  function patchQuestion(id: string, patch: Partial<Question>, immediate = false) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)))
    if (immediate) {
      api.updateQuestion(campaign.id, id, patch).catch(() => toast.error("Falha ao salvar"))
    } else {
      debouncedSave(id, patch)
    }
  }

  async function addQuestion(type: QuestionType) {
    try {
      const { question } = await api.createQuestion(campaign.id, {
        type,
        title:
          type === "rating"
            ? "De 0 a 10, qual a chance de você nos recomendar?"
            : "Nova pergunta",
        required: true,
        config: defaultConfigFor(type),
        skipRules: [],
      })
      setQuestions((qs) => [...qs, question])
      setSelectedId(question.id)
    } catch {
      toast.error("Falha ao criar pergunta")
    }
  }

  async function deleteQuestion(id: string) {
    try {
      await api.deleteQuestion(campaign.id, id)
      setQuestions((qs) => {
        const next = qs.filter((q) => q.id !== id)
        if (selectedId === id) setSelectedId(next[0]?.id ?? null)
        return next
      })
    } catch {
      toast.error("Falha ao excluir pergunta")
    }
  }

  function reorder(ids: string[]) {
    setQuestions((qs) => {
      const byId = new Map(qs.map((q) => [q.id, q]))
      return ids.map((id, index) => ({ ...byId.get(id)!, order: index }))
    })
    api.reorderQuestions(campaign.id, ids).catch(() => toast.error("Falha ao reordenar"))
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr_360px]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Perguntas ({questions.length})</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="size-3.5" /> Adicionar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TYPE_OPTIONS.map(({ type, icon: Icon }) => (
                <DropdownMenuItem key={type} onClick={() => addQuestion(type)}>
                  <Icon className="size-3.5" /> {QUESTION_TYPE_LABEL[type]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {questions.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma pergunta ainda. Use &quot;Adicionar&quot; para começar.
          </p>
        ) : (
          <SortableQuestionList
            questions={questions}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={reorder}
            onDelete={deleteQuestion}
          />
        )}
      </div>

      <div>
        {selected ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{QUESTION_TYPE_LABEL[selected.type]}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Pergunta</Label>
                <Textarea
                  value={selected.title}
                  onChange={(e) => patchQuestion(selected.id, { title: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Texto de apoio (opcional)</Label>
                <Input
                  value={selected.description ?? ""}
                  onChange={(e) => patchQuestion(selected.id, { description: e.target.value })}
                  placeholder="Ex: Sua resposta é anônima"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="required-switch">Resposta obrigatória</Label>
                <Switch
                  id="required-switch"
                  checked={selected.required}
                  onCheckedChange={(v) => patchQuestion(selected.id, { required: v }, true)}
                />
              </div>

              <Separator />

              <div>
                <Label className="mb-2 block text-sm">Configuração da pergunta</Label>
                <QuestionConfigEditor
                  type={selected.type}
                  config={selected.config}
                  onChange={(config) => patchQuestion(selected.id, { config })}
                />
              </div>

              <Separator />

              <SkipLogicEditor
                question={selected}
                allQuestions={questions}
                onChangeRules={(skipRules: SkipRule[]) =>
                  patchQuestion(selected.id, { skipRules }, true)
                }
                defaultOutcome={selected.defaultOutcome ?? null}
                onChangeDefaultOutcome={(outcome: Outcome | null) =>
                  patchQuestion(selected.id, { defaultOutcome: outcome }, true)
                }
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-muted-foreground py-10 text-center text-sm">
              Selecione ou adicione uma pergunta para editar.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <LivePreview campaign={campaign} questions={questions} />
      </div>
    </div>
  )
}
