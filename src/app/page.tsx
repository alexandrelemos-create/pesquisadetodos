import Link from "next/link"
import { ArrowRight, LayoutDashboard, MonitorSmartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          Micropesquisa · MVP
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">
          Plataforma de micro pesquisas
        </h1>
        <p className="text-muted-foreground mt-3 text-balance">
          Widget leve e não intrusivo para o visitante, e um painel de gestão completo
          para criar campanhas, configurar lógica condicional e acompanhar resultados.
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <MonitorSmartphone className="text-muted-foreground size-5" />
            <CardTitle className="mt-2">Ver o widget em ação</CardTitle>
            <CardDescription>
              Simule o widget em uma página real, com gatilhos de exibição e o fluxo
              completo de perguntas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/demo">
                Abrir demonstração <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <LayoutDashboard className="text-muted-foreground size-5" />
            <CardTitle className="mt-2">Painel de gestão</CardTitle>
            <CardDescription>
              Crie campanhas, edite perguntas, configure lógica condicional e acompanhe
              métricas e respostas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/admin">
                Acessar painel admin <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
