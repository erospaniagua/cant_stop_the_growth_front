import Layout from "@/components/Layout"

export default function Dashboard() {
  return (
    <Layout role="admin">
      <h1 className="text-3xl font-bold mb-4">Welcome, Admin!</h1>
      <p className="text-muted-foreground">This is your dashboard overview.</p>
    </Layout>
  )
}