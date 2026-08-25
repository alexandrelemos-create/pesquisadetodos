"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api-client"
import type { Campaign, CampaignStatus, Outcome } from "@/lib/types"

const STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativa" },
  { value: "paused", label: "Pausada" },
  { value: "archived", label: "Arquivada" },
]

export function SettingsClient({ campaign }: { campaign: Campaign }) {
  const router = useRouter()
  const [form, setForm] = React.useState(campaign)
  const [saving, setSaving] = React.useState(false)

  async function save() {
    setSaving(true)
    try {
      await api.updateCampaign(campaign.id, form)
      toast.success("Campanha atualizada")
      router.refresh()
    } catch {
      toast.error("Falha ao salvar")
    } finally {
      setSaving(false)
    }
  }

  function setOutcome(patch: Partial<Outcome>) {
    setForm((f) => ({ ...f, completionOutcome: { ...f.completionOutcome, ...patch } }))
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações gerais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nome interno da campanha</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v as CampaignStatus }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Título / chamada exibida no widget</Label>
            <Textarea
              rows={2}
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Tempo estimado (segundos)</Label>
              <Input
                type="number"
                min={5}
                value={form.estimatedSeconds}
                onChange={(e) => setForm((f) => ({ ...f, estimatedSeconds: Number(e.target.value) }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cor primária do widget</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="size-9 rounded-md border"
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Desfecho padrão</CardTitle>
          <CardDescription>
            O que acontece quando o visitante conclui a pesquisa sem cair em nenhuma regra de
            lógica condicional.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Select
            value={form.completionOutcome.type}
            onValueChange={(type) =>
              setOutcome({ type: type as Outcome["type"] } as Outcome)
            }
          >
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="message">Mostrar mensagem de agradecimento</SelectItem>
              <SelectItem value="redirect">Redirecionar para URL externa</SelectItem>
              <SelectItem value="end">Apenas encerrar (sem mensagem)</SelectItem>
            </SelectContent>
          </Select>
          {form.completionOutcome.type === "message" && (
            <Textarea
              value={form.completionOutcome.message ?? ""}
              onChange={(e) => setOutcome({ message: e.target.value })}
              placeholder="Obrigado pela sua resposta!"
            />
          )}
          {form.completionOutcome.type === "redirect" && (
            <Input
              value={form.completionOutcome.redirectUrl ?? ""}
              onChange={(e) => setOutcome({ redirectUrl: e.target.value })}
              placeholder="https://exemplo.com/obrigado"
            />
          )}
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
