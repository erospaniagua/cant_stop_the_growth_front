import { useUser } from "@/context/UserContext"
import Layout from "@/components/Layout"

export default function DashboardManager() {
  const { user } = useUser()

  return (
    
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Team Manager Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-medium">{user?.name}</span> 👋
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* 🧩 Placeholder cards — replace these with real widgets later */}
          <div className="border rounded-xl p-4 shadow-sm bg-card text-card-foreground">
            <h2 className="text-lg font-medium mb-2">My Team</h2>
            <p className="text-sm text-muted-foreground">
              View and manage your assigned team members.
            </p>
          </div>

          <div className="border rounded-xl p-4 shadow-sm bg-card text-card-foreground">
            <h2 className="text-lg font-medium mb-2">Company Tasks</h2>
            <p className="text-sm text-muted-foreground">
              Review open tasks and pending deliverables.
            </p>
          </div>

          <div className="border rounded-xl p-4 shadow-sm bg-card text-card-foreground">
            <h2 className="text-lg font-medium mb-2">Reports</h2>
            <p className="text-sm text-muted-foreground">
              Access team progress and performance analytics.
            </p>
          </div>
        </div>
      </div>
    
  )
}
