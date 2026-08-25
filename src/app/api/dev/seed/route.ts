import { NextResponse } from "next/server"
import { seedDemoCampaign } from "@/lib/seed"

export const dynamic = "force-dynamic"

export async function POST() {
  const campaign = seedDemoCampaign()
  return NextResponse.json({ campaign })
}
