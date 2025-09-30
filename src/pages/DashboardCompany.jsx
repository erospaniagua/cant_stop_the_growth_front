// src/pages/DashboardCompany.jsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { permissions } from "@/config/permissions"
import { useUser } from "@/context/UserContext"

export default function DashboardCompany() {
  const { user } = useUser()
  const canEdit = permissions[user.role]?.can?.editCourse

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
      <p className="text-muted-foreground">
        Here’s an overview of available courses.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Courses Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your company can view all courses. Editing is restricted.
          </p>
          <Button disabled={!canEdit}>Edit Course</Button>
        </CardContent>
      </Card>
    </div>
  )
}
