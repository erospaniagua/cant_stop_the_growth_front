// src/pages/DashboardAdmin.jsx
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardAdmin() {
  const actions = ["Add Course", "Add Mentor", "Add Company", "Add Student", "Report Generation"]

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Welcome, Admin!</h1>
      <p className="text-muted-foreground mb-8">Quick actions to manage your platform:</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((title) => (
          <Card key={title} className="cursor-pointer hover:shadow-md transition">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </>
  )
}
