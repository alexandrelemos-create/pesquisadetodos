import { SurveyWidget } from "@/components/widget/survey-widget"
import { TransparentBody } from "@/app/embed/[id]/transparent-body"

// Página mínima para ser carregada dentro de um <iframe> injetado em
// qualquer site externo pelo script em /public/widget.js — renderiza só o
// widget da campanha, sem nenhum "chrome" da aplicação.
export default async function EmbedPage({
  params,
}: PageProps<"/embed/[id]">) {
  const { id } = await params
  return (
    <>
      <TransparentBody />
      <div className="inline-block">
        <SurveyWidget campaignId={id} mode="embed" />
      </div>
    </>
  )
}
