import { NextResponse } from "next/server"
import { createCampaign, listCampaigns } from "@/lib/repo"
import { readJson } from "@/lib/api-utils"
import type { Campaign } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET() {
  const campaigns = listCampaigns()
  return NextResponse.json({ campaigns })
}

export async function POST(req: Request) {
  const body = await readJson<Partial<Campaign>>(req)
  const campaign = createCampaign(body ?? {})
  return NextResponse.json({ campaign }, { status: 201 })
}
