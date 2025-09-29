import { AppSidebar } from "./AppSidebar";
import Topbar from "./Topbar"

export default function Layout({ children, role = "admin" }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar role={role} />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}