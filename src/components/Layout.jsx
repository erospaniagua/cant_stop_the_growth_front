import { Outlet } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"
import Topbar from "./Topbar"

export default function Layout({ role = "admin" }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar role={role} />
      <div className="flex-1 flex flex-col w-full">
        <Topbar />
        <main className="flex-1 w-full p-6">
          <Outlet /> {/* 👈 this renders the nested route */}
        </main>
      </div>
    </div>
  )
}
