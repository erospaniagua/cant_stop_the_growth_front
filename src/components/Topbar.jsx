import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ModeToggle"
import { useUser } from "@/context/UserContext"

export default function Topbar() {
  const { user } = useUser()

  // Determine company display name
  let companyName = ""

  if (user) {
    if (["admin", "coach"].includes(user.role)) {
      companyName = "Cant Stop the Growth"
    } else if (user.companyId?.name) {
      companyName = user.companyId.name
    }
  }

  return (
    <header className="flex items-center justify-between border-b px-4 h-14 bg-[hsl(var(--topbar-background))]">
      {/* Left side: sidebar toggle */}
      <SidebarTrigger />

      {/* Center: Company name */}
      <div className="text-sm font-medium text-muted-foreground">
        {companyName || "Dashboard"}
      </div>

      {/* Right side: controls */}
      <div className="flex items-center gap-2">
        <ModeToggle />
      </div>
    </header>
  )
}
