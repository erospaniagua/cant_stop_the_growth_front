import { AppSidebar } from "./AppSidebar"

export default function Layout({ children, role = "admin" }) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar role={role} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}