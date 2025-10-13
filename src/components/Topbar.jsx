import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ModeToggle"

export default function Topbar() {
  return (
    <header className="flex items-center justify-between border-b px-4 h-14 bg-[hsl(var(--topbar-background))]">
      {/* Left side: sidebar toggle */}
      <SidebarTrigger />

      {/* Center: breadcrumbs or page title */}
      <div className="text-sm text-muted-foreground">
        Dashboard
      </div>

      {/* Right side: controls */}
      <div className="flex items-center gap-2">
        <ModeToggle />
        {/* Later: avatar, notifications, search, etc. */}
      </div>
    </header>
  )
}