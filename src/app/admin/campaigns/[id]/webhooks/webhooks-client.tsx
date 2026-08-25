"use client"

import * as React from "react"
import { toast } from "sonner"
import { CheckCircle2, Send, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api-client"
import type { Campaign, WebhookDeliveryLog, WebhookEvent } from "@/lib/types"

const EVENT_LABEL: Record<WebhookEvent, string> = {
  response_started: "Resposta iniciada",
  response_completed: "Resposta concluída",
}

export function WebhooksClient({
  campaign,
  initialDeliveries,
}: {
  campaign: Campaign
  initialDeliveries: WebhookDeliveryLog[]
}) {
  const [url, setUrl] = React.useState(campaign.webhookUrl ?? "")
  const [enabled, setEnabled] = React.useState(campaign.webhookEnabled)
  const [events, setEvents] = React.useState<WebhookEvent[]>(campaign.webhookEvents)
  const [saving, setSaving] = React.useState(false)
  const [testing, setTesting] = React.useState(false)
  const [deliveries, setDeliveries] = React.useState(initialDeliveries)

  function toggleEvent(event: WebhookEvent) {
    setEvents((e) => (e.includes(event) ? e.filter((x) => x !== event) : [...e, event]))
  }

  async function save() {
    setSaving(true)
    try {
      await api.updateCampaign(campaign.id, {
        webhookUrl: url,
        webhookEnabled: enabled,
        webhookEvents: events,
      })
      toast.success("Configuração de webhook salva")
    } catch {
      toast.error("Falha ao salvar")
    } finally {
      setSaving(false)
    }
  }

  async function test() {
    if (!url) {
      toast.error("Informe uma URL de webhook antes de testar")
      return
    }
    setTesting(true)
    try {
      const { delivery } = await api.testWebhook(campaign.id, url)
      setDeliveries((d) => [delivery, ...d])
      if (delivery.success) toast.success(`Webhook respondeu ${delivery.statusCode}`)
      else toast.error("O webhook não respondeu com sucesso — veja o log abaixo")
    } catch {
      toast.error("Falha ao testar webhook")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Integração via webhook</CardTitle>
          <CardDescription>
            Envie os dados de cada resposta para um CRM, planilha ou canal do Slack via
            requisição HTTP POST.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>URL do webhook</Label>
            <Input
              placeholder="https://hooks.slack.com/services/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="webhook-enabled">Habilitar envio automático</Label>
            <Switch id="webhook-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm">Disparar em:</Label>
            {(["response_started", "response_completed"] as WebhookEvent[]).map((event) => (
              <label key={event} className="flex items-center gap-2 text-sm">
                <Checkbox checked={events.includes(event)} onCheckedChange={() => toggleEvent(event)} />
                {EVENT_LABEL[event]}
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "Salvando..." : "Salvar configuração"}
            </Button>
            <Button variant="outline" onClick={test} disabled={testing}>
              <Send className="size-3.5" /> {testing ? "Enviando..." : "Enviar teste"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de envios</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {deliveries.length === 0 ? (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">
              Nenhum envio registrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Evento</TableHead>
                  <TableHead>Status HTTP</TableHead>
                  <TableHead>Quando</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {d.success ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : (
                        <XCircle className="text-destructive size-4" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{EVENT_LABEL[d.event] ?? d.event}</Badge>
                    </TableCell>
                    <TableCell>{d.statusCode ?? "sem resposta"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(d.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
