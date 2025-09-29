import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {

    const actions = [
    { title: "Add Course" },
    { title: "Add Mentor" },
    { title: "Add Company" },
    { title: "Add Student" },
    { title: "Report Generation" },
  ]
  return (
     <Layout role="admin">
      <h1 className="text-3xl font-bold mb-6">Welcome, Admin!</h1>
      <p className="text-muted-foreground mb-8">
        Quick actions to manage your platform:
      </p>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action) => (
          <Card
            key={action.title}
            className="cursor-pointer hover:shadow-md transition"
          >
            <CardHeader>
              <CardTitle>{action.title}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </Layout>
  )
}