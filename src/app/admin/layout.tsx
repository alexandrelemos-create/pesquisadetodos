import Link from "next/link"
import { ClipboardList, MonitorSmartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="bg-muted/20 flex min-h-screen flex-1 flex-col">
      <header className="bg-background sticky top-0 z-40 flex items-center gap-3 border-b px-5 py-3">
        <Link href="/admin" className="flex items-center gap-2 font-medium">
          <ClipboardList className="size-4.5" />
          Micropesquisa <span className="text-muted-foreground font-normal">· Admin</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" asChild>
            <Link href="/demo">
              <MonitorSmartphone className="size-3.5" /> Ver widget
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  )
}
