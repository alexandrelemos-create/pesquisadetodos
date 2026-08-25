"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  MessageSquareText,
  Star,
  CircleDot,
  ListChecks,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Question, QuestionType } from "@/lib/types"

const TYPE_ICON: Record<QuestionType, React.ComponentType<{ className?: string }>> = {
  rating: Star,
  open_text: MessageSquareText,
  single_choice: CircleDot,
  multiple_choice: ListChecks,
}

function SortableItem({
  question,
  index,
  selected,
  onSelect,
  onDelete,
}: {
  question: Question
  index: number
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  })
  const Icon = TYPE_ICON[question.type]

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-2 rounded-lg border bg-card px-2 py-2 text-sm",
        selected && "border-primary ring-1 ring-primary/30",
        isDragging && "opacity-60"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground cursor-grab touch-none active:cursor-grabbing"
        aria-label="Reordenar"
      >
        <GripVertical className="size-4" />
      </button>
      <button className="flex flex-1 items-center gap-2 overflow-hidden text-left" onClick={onSelect}>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{index + 1}.</span>
        <Icon className="text-muted-foreground size-3.5 shrink-0" />
        <span className="truncate">{question.title || "Pergunta sem título"}</span>
        {question.required && (
          <Badge variant="outline" className="shrink-0 text-[10px]">
            obrigatória
          </Badge>
        )}
      </button>
      <button
        onClick={onDelete}
        className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
        aria-label="Excluir pergunta"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

export function SortableQuestionList({
  questions,
  selectedId,
  onSelect,
  onReorder,
  onDelete,
}: {
  questions: Question[]
  selectedId: string | null
  onSelect: (id: string) => void
  onReorder: (ids: string[]) => void
  onDelete: (id: string) => void
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = questions.findIndex((q) => q.id === active.id)
    const newIndex = questions.findIndex((q) => q.id === over.id)
    const reordered = arrayMove(questions, oldIndex, newIndex)
    onReorder(reordered.map((q) => q.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1.5">
          {questions.map((q, i) => (
            <SortableItem
              key={q.id}
              question={q}
              index={i}
              selected={q.id === selectedId}
              onSelect={() => onSelect(q.id)}
              onDelete={() => onDelete(q.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
