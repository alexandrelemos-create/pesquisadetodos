import { listCampaigns } from "@/lib/repo"
import { DashboardClient } from "@/app/admin/dashboard-client"

export const dynamic = "force-dynamic"

export default function AdminDashboardPage() {
  const campaigns = listCampaigns()
  return <DashboardClient initialCampaigns={campaigns} />
}
