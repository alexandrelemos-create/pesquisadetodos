"use client"

import * as React from "react"
import { toast } from "sonner"
import { Clock, MousePointerClick, Plus, ScrollText, LogOut as ExitIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api-client"
import type { Campaign, TriggerConfig, TriggerType } from "@/lib/types"

const TRIGGER_LABEL: Record<TriggerType, string> = {
  time_on_page: "Tempo na página",
  scroll_depth: "% de rolagem (scroll depth)",
  element_click: "Clique em elemento",
  exit_intent: "Intenção de saída (exit intent)",
  immediate: "Imediato (ao carregar a página)",
}

const TRIGGER_ICON: Record<TriggerType, React.ComponentType<{ className?: string }>> = {
  time_on_page: Clock,
  scroll_depth: ScrollText,
  element_click: MousePointerClick,
  exit_intent: ExitIcon,
  immediate: Clock,
}

function defaultValueFor(type: TriggerType): Partial<TriggerConfig> {
  switch (type) {
    case "time_on_page":
      return { value: 10 }
    case "scroll_depth":
      return { value: 50 }
    case "element_click":
      return { selector: "#cta-button" }
    default:
      return {}
  }
}

export function TriggersClient({ campaign }: { campaign: Campaign }) {
  const [triggers, setTriggers] = React.useState<TriggerConfig[]>(campaign.triggers)
  const [frequency, setFrequency] = React.useState(campaign.frequencyRule)
  const [saving, setSaving] = React.useState(false)

  function addTrigger(type: TriggerType) {
    setTriggers((t) => [...t, { id: crypto.randomUUID(), type, ...defaultValueFor(type) }])
  }

  function updateTrigger(id: string, patch: Partial<TriggerConfig>) {
    setTriggers((t) => t.map((tr) => (tr.id === id ? { ...tr, ...patch } : tr)))
  }

  function removeTrigger(id: string) {
    setTriggers((t) => t.filter((tr) => tr.id !== id))
  }

  async function save() {
    setSaving(true)
    try {
      await api.updateCampaign(campaign.id, { triggers, frequencyRule: frequency })
      toast.success("Configurações salvas")
    } catch {
      toast.error("Falha ao salvar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Gatilhos de exibição</CardTitle>
          <CardDescription>
            Configure quando o widget deve aparecer para o visitante. Se houver mais de um
            gatilho, a pesquisa é exibida no primeiro que disparar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {triggers.map((trigger) => {
            const Icon = TRIGGER_ICON[trigger.type]
            return (
              <div key={trigger.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
                <Icon className="text-muted-foreground size-4 shrink-0" />
                <Select
                  value={trigger.type}
                  onValueChange={(type) =>
                    updateTrigger(trigger.id, { type: type as TriggerType, ...defaultValueFor(type as TriggerType) })
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {trigger.type === "time_on_page" && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      className="w-20"
                      min={0}
                      value={trigger.value ?? 10}
                      onChange={(e) => updateTrigger(trigger.id, { value: Number(e.target.value) })}
                    />
                    <span className="text-muted-foreground text-sm">segundos</span>
                  </div>
                )}

                {trigger.type === "scroll_depth" && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      className="w-20"
                      min={0}
                      max={100}
                      value={trigger.value ?? 50}
                      onChange={(e) => updateTrigger(trigger.id, { value: Number(e.target.value) })}
                    />
                    <span className="text-muted-foreground text-sm">% da página</span>
                  </div>
                )}

                {trigger.type === "element_click" && (
                  <Input
                    className="w-48"
                    placeholder="seletor CSS, ex: .btn-comprar"
                    value={trigger.selector ?? ""}
                    onChange={(e) => updateTrigger(trigger.id, { selector: e.target.value })}
                  />
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-8"
                  onClick={() => removeTrigger(trigger.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )
          })}

          {triggers.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Nenhum gatilho configurado — o widget não será exibido automaticamente.
            </p>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="self-start">
                <Plus className="size-3.5" /> Adicionar gatilho
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {Object.entries(TRIGGER_LABEL).map(([value, label]) => (
                <DropdownMenuItem key={value} onClick={() => addTrigger(value as TriggerType)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regra de frequência</CardTitle>
          <CardDescription>
            Evite fadiga do usuário limitando quantas vezes esta campanha pode ser exibida
            para o mesmo visitante em um período.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Máximo de exibições</Label>
            <Input
              type="number"
              min={1}
              className="w-28"
              value={frequency.maxDisplays}
              onChange={(e) => setFrequency((f) => ({ ...f, maxDisplays: Number(e.target.value) }))}
            />
          </div>
          <span className="text-muted-foreground pb-2 text-sm">a cada</span>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Período (dias)</Label>
            <Input
              type="number"
              min={1}
              className="w-28"
              value={frequency.periodDays}
              onChange={(e) => setFrequency((f) => ({ ...f, periodDays: Number(e.target.value) }))}
            />
          </div>
          <span className="text-muted-foreground pb-2 text-sm">por visitante</span>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </div>
  )
}
