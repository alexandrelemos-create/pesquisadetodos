"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Copy,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api-client"
import type { Campaign, CampaignStatus } from "@/lib/types"

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Rascunho",
  active: "Ativa",
  paused: "Pausada",
  archived: "Arquivada",
}

const STATUS_VARIANT: Record<CampaignStatus, "secondary" | "success" | "warning" | "outline"> = {
  draft: "secondary",
  active: "success",
  paused: "warning",
  archived: "outline",
}

export function DashboardClient({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const router = useRouter()
  const [campaigns, setCampaigns] = React.useState(initialCampaigns)
  const [creating, setCreating] = React.useState(false)
  const [newName, setNewName] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Campaign | null>(null)
  const [seeding, setSeeding] = React.useState(false)

  async function refresh() {
    const data = await api.listCampaigns()
    setCampaigns(data.campaigns)
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const { campaign } = await api.createCampaign({ name: newName || "Nova campanha" })
      setDialogOpen(false)
      setNewName("")
      router.push(`/admin/campaigns/${campaign.id}/questions`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar campanha")
    } finally {
      setCreating(false)
    }
  }

  async function toggleStatus(c: Campaign) {
    const next: CampaignStatus = c.status === "active" ? "paused" : "active"
    await api.updateCampaign(c.id, { status: next })
    toast.success(next === "active" ? "Campanha ativada" : "Campanha pausada")
    refresh()
  }

  async function duplicate(c: Campaign) {
    await api.duplicateCampaign(c.id)
    toast.success("Campanha duplicada")
    refresh()
  }

  async function remove() {
    if (!deleteTarget) return
    await api.deleteCampaign(deleteTarget.id)
    toast.success("Campanha excluída")
    setDeleteTarget(null)
    refresh()
  }

  async function seedDemo() {
    setSeeding(true)
    try {
      await api.seedDemo()
      toast.success("Dados de demonstração carregados")
      refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar dados de demonstração")
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campanhas</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie suas micropesquisas, lógica condicional e resultados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {campaigns.length === 0 && (
            <Button variant="outline" onClick={seedDemo} disabled={seeding}>
              <Sparkles className="size-4" />
              {seeding ? "Carregando..." : "Carregar demonstração"}
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Nova campanha
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova campanha</DialogTitle>
                <DialogDescription>
                  Dê um nome interno para a campanha. Você poderá configurar as perguntas a
                  seguir.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Label htmlFor="campaign-name">Nome da campanha</Label>
                <Input
                  id="campaign-name"
                  placeholder="Ex: NPS pós-checkout"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? "Criando..." : "Criar e configurar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Nenhuma campanha ainda</CardTitle>
            <CardDescription>
              Crie sua primeira campanha ou carregue dados de demonstração para explorar o
              painel com respostas simuladas.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chamada</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer">
                    <TableCell
                      className="font-medium"
                      onClick={() => router.push(`/admin/campaigns/${c.id}/questions`)}
                    >
                      {c.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {c.headline}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/campaigns/${c.id}/questions`}>Editar</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(c)}>
                            {c.status === "active" ? (
                              <>
                                <Pause className="size-3.5" /> Pausar
                              </>
                            ) : (
                              <>
                                <Play className="size-3.5" /> Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicate(c)}>
                            <Copy className="size-3.5" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(c)}
                          >
                            <Trash2 className="size-3.5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todas as perguntas e respostas de{" "}
              <strong>{deleteTarget?.name}</strong> serão apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
