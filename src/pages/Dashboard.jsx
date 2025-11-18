import { useUser } from "@/context/UserContext"
import DashboardAdmin from "./DashboardAdmin"
import DashboardCoach from "./DashboardCoach"
import DashboardStudent from "./DashboardStudent"
import DashboardCompany from "./DashboardCompany"
import DashboardManager from "./DashboardManager"

export default function Dashboard() {
  const { user, loading } = useUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-muted-foreground text-sm">Loading dashboard...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to view your dashboard.</p>
      </div>
    )
  }

  const dashboards = {
    "admin": <DashboardAdmin />,
    "coach": <DashboardCoach />,
    "student": <DashboardStudent />,
    "company": <DashboardCompany />,
    "team-manager": <DashboardManager />,
  }

  const CurrentDashboard =
    dashboards[user.role] || (
      <div className="p-6 text-muted-foreground">
        No dashboard available for this role.
      </div>
    )

  return CurrentDashboard  // ✅ removed <Layout>
}
