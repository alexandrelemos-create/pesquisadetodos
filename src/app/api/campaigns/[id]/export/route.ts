import { NextResponse } from "next/server"
import { listQuestions, listSessionsByCampaign } from "@/lib/repo"
import { buildExportRows, toCsv, toJson } from "@/lib/export"

export const dynamic = "force-dynamic"

export async function GET(
  req: Request,
  ctx: RouteContext<"/api/campaigns/[id]/export">
) {
  const { id } = await ctx.params
  const url = new URL(req.url)
  const format = url.searchParams.get("format") === "json" ? "json" : "csv"
  const questions = listQuestions(id)
  const sessions = listSessionsByCampaign(id)

  if (format === "json") {
    const json = toJson(sessions, questions)
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="respostas-${id}.json"`,
      },
    })
  }

  const rows = buildExportRows(sessions, questions)
  const csv = toCsv(rows)
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="respostas-${id}.csv"`,
    },
  })
}
