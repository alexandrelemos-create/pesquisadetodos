"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RATING_SUBTYPE_LABEL } from "@/lib/question-meta"
import type {
  ChoiceOption,
  MultipleChoiceConfig,
  OpenTextConfig,
  QuestionConfig,
  QuestionType,
  RatingConfig,
} from "@/lib/types"

interface Props {
  type: QuestionType
  config: QuestionConfig
  onChange: (config: QuestionConfig) => void
}

export function QuestionConfigEditor({ type, config, onChange }: Props) {
  if (type === "rating") {
    const c = config as RatingConfig
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Tipo de escala</Label>
          <Select
            value={c.subtype}
            onValueChange={(v) => onChange({ ...c, subtype: v as RatingConfig["subtype"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RATING_SUBTYPE_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {c.subtype === "nps" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Rótulo esquerdo (0)</Label>
              <Input
                value={c.lowLabel ?? ""}
                placeholder="Pouco provável"
                onChange={(e) => onChange({ ...c, lowLabel: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Rótulo direito (10)</Label>
              <Input
                value={c.highLabel ?? ""}
                placeholder="Muito provável"
                onChange={(e) => onChange({ ...c, highLabel: e.target.value })}
              />
            </div>
          </div>
        )}
        {c.subtype === "stars" && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Quantidade de estrelas</Label>
            <Input
              type="number"
              min={3}
              max={10}
              value={c.scaleMax ?? 5}
              onChange={(e) => onChange({ ...c, scaleMax: Number(e.target.value) })}
            />
          </div>
        )}
      </div>
    )
  }

  if (type === "open_text") {
    const c = config as OpenTextConfig
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="multiline">Campo multilinha</Label>
          <Switch
            id="multiline"
            checked={c.multiline}
            onCheckedChange={(v) => onChange({ ...c, multiline: v })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Limite de caracteres</Label>
          <Input
            type="number"
            min={10}
            value={c.maxLength ?? 280}
            onChange={(e) => onChange({ ...c, maxLength: Number(e.target.value) })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Texto de placeholder</Label>
          <Input
            value={c.placeholder ?? ""}
            onChange={(e) => onChange({ ...c, placeholder: e.target.value })}
          />
        </div>
      </div>
    )
  }

  if (type === "single_choice" || type === "multiple_choice") {
    const c = config as MultipleChoiceConfig & { allowOther?: boolean }
    const options = c.options ?? []

    function updateOption(id: string, label: string) {
      onChange({ ...c, options: options.map((o) => (o.id === id ? { ...o, label } : o)) })
    }
    function addOption() {
      const newOption: ChoiceOption = { id: crypto.randomUUID(), label: `Opção ${options.length + 1}` }
      onChange({ ...c, options: [...options, newOption] })
    }
    function removeOption(id: string) {
      onChange({ ...c, options: options.filter((o) => o.id !== id) })
    }

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label className="text-xs">Opções</Label>
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-2">
              <Input
                value={opt.label}
                onChange={(e) => updateOption(opt.id, e.target.value)}
                placeholder={`Opção ${idx + 1}`}
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => removeOption(opt.id)}
                disabled={options.length <= 2}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addOption} className="self-start">
            <Plus className="size-3.5" /> Adicionar opção
          </Button>
        </div>

        {type === "single_choice" && (
          <div className="flex items-center justify-between">
            <Label htmlFor="allow-other">Ativar campo &quot;Outro (especifique)&quot;</Label>
            <Switch
              id="allow-other"
              checked={!!c.allowOther}
              onCheckedChange={(v) => onChange({ ...c, allowOther: v })}
            />
          </div>
        )}

        {type === "multiple_choice" && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Mínimo de escolhas</Label>
              <Input
                type="number"
                min={0}
                value={c.minChoices ?? 0}
                onChange={(e) => onChange({ ...c, minChoices: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Máximo de escolhas</Label>
              <Input
                type="number"
                min={1}
                value={c.maxChoices ?? options.length}
                onChange={(e) => onChange({ ...c, maxChoices: Number(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
